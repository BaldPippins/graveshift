import { Group, Plane, Raycaster, Vector2, Vector3 } from 'three';
import type { HeroId } from '@graveshift/shared/config';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import type { GameEvent } from '@graveshift/shared/protocol';
import { merchantSpot } from '@graveshift/shared/rules';
import type { CellCoord, TileMap } from '@graveshift/shared/world';
import type { AssetLibrary } from '../assets/AssetLibrary.ts';
import type { MerchantSignTexts } from '../i18n/Messages.ts';
import type { EnemyFrame, PickupFrame, PlayerFrame, WorldFrame } from '../game/view/WorldFrame.ts';
import type { AimResolver } from '../input/AimResolver.ts';
import { CameraMode } from './camera/CameraMode.ts';
import { CameraRig } from './camera/CameraRig.ts';
import { EffectsLayer } from './effects/EffectsLayer.ts';
import { WorldEnvironment } from './environment/WorldEnvironment.ts';
import type { GameRenderer } from './GameRenderer.ts';
import { MapView } from './map/MapView.ts';
import type { GraphicsQuality } from '../meta/settings/Settings.ts';
import { MenuAmbience } from './stage/MenuAmbience.ts';
import { MerchantView } from './stage/MerchantView.ts';
import { ShowcaseStage } from './stage/ShowcaseStage.ts';
import { ViewMode } from './ViewMode.ts';
import { AimGuideMode } from './views/AimGuideMode.ts';
import { AimGuideView } from './views/AimGuideView.ts';
import { EnemyView } from './views/EnemyView.ts';
import { EntityViewRegistry } from './views/EntityViewRegistry.ts';
import { PickupView } from './views/PickupView.ts';
import { PlayerView } from './views/PlayerView.ts';

const GROUND = new Plane(new Vector3(0, 1, 0), 0);
const DAMAGE_SHAKE = 0.25;
const SHOWCASE_SCREEN_SHIFT = 1.5;

function centerOf(cells: readonly CellCoord[]): ReadonlyVec2 {
  const sum = cells.reduce(
    (total, cell) => ({ x: total.x + cell.cx + 0.5, y: total.y + cell.cy + 0.5 }),
    {
      x: 0,
      y: 0,
    },
  );
  return { x: sum.x / Math.max(1, cells.length), y: sum.y / Math.max(1, cells.length) };
}

export class WorldRenderer implements AimResolver {
  private readonly renderer: GameRenderer;
  private readonly environment: WorldEnvironment;
  private readonly mapView: MapView;
  private readonly effects: EffectsLayer;
  private readonly camera: CameraRig;
  private readonly showcase: ShowcaseStage;
  private readonly ambience: MenuAmbience;
  private readonly merchant: MerchantView | null;
  private readonly entities = new Group();
  private readonly aimGuide: AimGuideView;
  private readonly players: EntityViewRegistry<PlayerFrame, PlayerView>;
  private readonly enemies: EntityViewRegistry<EnemyFrame, EnemyView>;
  private readonly pickups: EntityViewRegistry<PickupFrame, PickupView>;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly hit = new Vector3();
  private readonly mapCenter: ReadonlyVec2;
  private mode: ViewMode = ViewMode.Menu;
  private screenShake = true;
  private localPlayerId: number | null = null;
  private aimGuideMode: AimGuideMode = AimGuideMode.Hidden;

  constructor(
    renderer: GameRenderer,
    assets: AssetLibrary,
    map: TileMap,
    merchantSign: () => MerchantSignTexts,
  ) {
    this.renderer = renderer;
    const scene = renderer.scene;
    this.environment = new WorldEnvironment(scene, map);
    this.mapView = new MapView(scene, map, assets, true);
    this.effects = new EffectsLayer(scene);
    this.camera = new CameraRig(renderer.camera);
    this.mapCenter = centerOf(map.playerSpawns);
    this.showcase = new ShowcaseStage(assets, this.mapCenter.x, this.mapCenter.y);
    this.ambience = new MenuAmbience(assets, map);
    const merchantPosition = merchantSpot(map);
    this.merchant =
      merchantPosition === null
        ? null
        : new MerchantView(scene, assets, merchantPosition, this.mapCenter, merchantSign);
    this.aimGuide = new AimGuideView(map);
    this.entities.add(this.aimGuide.root);
    scene.add(this.entities, this.showcase.root, this.ambience.root);
    this.players = new EntityViewRegistry(this.entities, (frame) => new PlayerView(frame, assets));
    this.enemies = new EntityViewRegistry(this.entities, (frame) => new EnemyView(frame, assets));
    this.pickups = new EntityViewRegistry(this.entities, (frame) => new PickupView(frame, assets));
    this.camera.setFocus(this.mapCenter.x, this.mapCenter.y);
    this.camera.snapToFocus();
  }

  setMode(mode: ViewMode): void {
    if (mode === this.mode) {
      return;
    }
    this.mode = mode;
    const inGame = mode === ViewMode.Game;
    this.showcase.root.visible = mode === ViewMode.Showcase;
    this.ambience.root.visible = mode === ViewMode.Menu;
    this.entities.visible = inGame;
    this.camera.setMode(this.cameraModeFor(mode));
    const shift =
      mode === ViewMode.Showcase && this.renderer.aspect > 1 ? SHOWCASE_SCREEN_SHIFT : 0;
    this.camera.setFocus(this.mapCenter.x - shift, this.mapCenter.y);
    if (!inGame) {
      this.clearEntities();
    }
  }

  setLineup(heroes: readonly HeroId[]): void {
    this.showcase.setLineup(heroes);
  }

  setLocalPlayer(playerId: number | null): void {
    this.localPlayerId = playerId;
  }

  setAimGuide(mode: AimGuideMode): void {
    this.aimGuideMode = mode;
  }

  setScreenShake(enabled: boolean): void {
    this.screenShake = enabled;
  }

  applyQuality(level: GraphicsQuality): void {
    this.renderer.applyQuality(level);
    this.environment.setShadows(this.renderer.quality.shadows);
    this.mapView.setPointLightsEnabled(this.renderer.quality.pointLights);
  }

  handleEvent(event: GameEvent): void {
    this.effects.handle(event);
    switch (event.type) {
      case GameEventType.EnemyDamaged:
        this.flashEnemy(event.enemyId);
        return;
      case GameEventType.PlayerDamaged:
        if (this.screenShake && event.playerId === this.localPlayerId) {
          this.camera.addShake(DAMAGE_SHAKE);
        }
        return;
      case GameEventType.MerchantKilled:
        if (this.merchant !== null) {
          this.effects.merchantFall(this.merchant.position.x, this.merchant.position.y);
        }
        return;
      case GameEventType.PickupCollected: {
        const collector = this.players.find(event.playerId);
        if (collector !== undefined) {
          const position = collector.object.position;
          this.effects.pickupSparkle(position.x, position.z, event.kind);
        }
        return;
      }
      default:
        return;
    }
  }

  private flashEnemy(enemyId: number): void {
    const enemy = this.enemies.find(enemyId);
    if (enemy !== undefined) {
      enemy.flash();
    }
  }

  render(world: WorldFrame | null, deltaSeconds: number, nearMerchant: boolean): void {
    if (this.mode === ViewMode.Game && world !== null) {
      this.players.sync(world.players, deltaSeconds);
      this.enemies.sync(world.enemies, deltaSeconds);
      this.pickups.sync(world.pickups, deltaSeconds);
      this.followLocalPlayer(world);
    }
    this.aimGuide.update(
      this.mode === ViewMode.Game ? this.aimGuideMode : AimGuideMode.Hidden,
      world === null ? [] : world.players,
      world === null ? [] : world.enemies,
    );
    this.showcase.update(deltaSeconds);
    this.ambience.update(deltaSeconds);
    if (this.merchant !== null) {
      this.merchant.setVisible(this.mode === ViewMode.Game);
      this.merchant.sync(world === null ? null : world.merchant, nearMerchant);
      this.merchant.update(deltaSeconds);
    }
    this.effects.update(deltaSeconds);
    this.camera.update(deltaSeconds);
    this.renderer.render();
  }

  screenToWorld(clientX: number, clientY: number): ReadonlyVec2 | null {
    const bounds = this.renderer.canvas.getBoundingClientRect();
    this.pointer.set(
      ((clientX - bounds.left) / bounds.width) * 2 - 1,
      -((clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.renderer.camera);
    const point = this.raycaster.ray.intersectPlane(GROUND, this.hit);
    return point === null ? null : { x: point.x, y: point.z };
  }

  clearEntities(): void {
    this.players.clear();
    this.enemies.clear();
    this.pickups.clear();
  }

  private followLocalPlayer(world: WorldFrame): void {
    const local = world.players.find((player) => player.isLocal);
    if (local === undefined) {
      return;
    }
    this.camera.setFocus(local.x, local.y, Math.cos(local.aim), Math.sin(local.aim));
  }

  private cameraModeFor(mode: ViewMode): CameraMode {
    switch (mode) {
      case ViewMode.Menu:
        return CameraMode.Orbit;
      case ViewMode.Showcase:
        return CameraMode.Showcase;
      case ViewMode.Game:
        return CameraMode.Follow;
    }
  }
}
