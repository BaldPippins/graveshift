import { DoubleSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry, RingGeometry } from 'three';
import { ENEMIES, PLAYER_RULES, WEAPONS } from '@graveshift/shared/config';
import { directionFromAngle, vec2 } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { LifeState } from '@graveshift/shared/model';
import { castRayAgainstMap, CollisionLayer, rayCircleIntersection } from '@graveshift/shared/world';
import type { TileMap } from '@graveshift/shared/world';
import { PALETTE } from '../../content/palette.ts';
import type { EnemyFrame, PlayerFrame } from '../../game/view/WorldFrame.ts';
import { AimGuideMode } from './AimGuideMode.ts';

const LINE_WIDTH = 0.08;
const LINE_START = 0.45;
const LINE_HEIGHT = 0.05;
const MAX_LENGTH = 9;
const MARKER_INNER_RADIUS = 0.16;
const MARKER_OUTER_RADIUS = 0.24;
const MARKER_SEGMENTS = 24;
const AIMING_OPACITY = 0.35;
const FIRING_OPACITY = 0.8;

export class AimGuideView {
  readonly root = new Group();
  private readonly map: TileMap;
  private readonly line: Mesh<PlaneGeometry, MeshBasicMaterial>;
  private readonly marker: Mesh<RingGeometry, MeshBasicMaterial>;
  private readonly origin = vec2();
  private readonly direction = vec2();

  constructor(map: TileMap) {
    this.map = map;
    const lineGeometry = new PlaneGeometry(1, LINE_WIDTH)
      .rotateX(-Math.PI / 2)
      .translate(0.5, 0, 0);
    this.line = new Mesh(lineGeometry, this.material());
    this.marker = new Mesh(
      new RingGeometry(MARKER_INNER_RADIUS, MARKER_OUTER_RADIUS, MARKER_SEGMENTS).rotateX(
        -Math.PI / 2,
      ),
      this.material(),
    );
    this.root.add(this.line, this.marker);
    this.root.position.y = LINE_HEIGHT;
    this.root.visible = false;
  }

  update(
    mode: AimGuideMode,
    players: readonly PlayerFrame[],
    enemies: readonly EnemyFrame[],
  ): void {
    const player = players.find((candidate) => candidate.isLocal);
    this.root.visible =
      mode !== AimGuideMode.Hidden && player !== undefined && player.life === LifeState.Alive;
    if (!this.root.visible || player === undefined) {
      return;
    }
    const firing = mode === AimGuideMode.Firing;
    const length = this.shotLength(player, players, enemies);
    this.line.position.set(
      player.x + this.direction.x * LINE_START,
      0,
      player.y + this.direction.y * LINE_START,
    );
    this.line.rotation.y = -player.aim;
    this.line.scale.x = Math.max(0, length - LINE_START);
    this.marker.position.set(
      player.x + this.direction.x * length,
      0,
      player.y + this.direction.y * length,
    );
    this.paint(firing ? PALETTE.gold : PALETTE.aimGuide, firing ? FIRING_OPACITY : AIMING_OPACITY);
  }

  dispose(): void {
    this.line.geometry.dispose();
    this.line.material.dispose();
    this.marker.geometry.dispose();
    this.marker.material.dispose();
  }

  private shotLength(
    player: PlayerFrame,
    players: readonly PlayerFrame[],
    enemies: readonly EnemyFrame[],
  ): number {
    this.origin.x = player.x;
    this.origin.y = player.y;
    directionFromAngle(player.aim, this.direction);
    const reach = Math.min(MAX_LENGTH, WEAPONS[player.weapon].stats.range);
    let length = castRayAgainstMap(
      this.map,
      this.origin,
      this.direction,
      reach,
      CollisionLayer.Projectiles,
    );
    for (const enemy of enemies) {
      length = this.nearerHit(length, enemy, ENEMIES[enemy.kind].radius);
    }
    for (const ally of players) {
      if (!ally.isLocal && ally.life === LifeState.Alive) {
        length = this.nearerHit(length, ally, PLAYER_RULES.radius);
      }
    }
    return length;
  }

  private nearerHit(length: number, center: ReadonlyVec2, radius: number): number {
    const hit = rayCircleIntersection(this.origin, this.direction, center, radius);
    return hit !== null && hit < length ? hit : length;
  }

  private paint(color: number, opacity: number): void {
    for (const material of [this.line.material, this.marker.material]) {
      material.color.setHex(color);
      material.opacity = opacity;
    }
  }

  private material(): MeshBasicMaterial {
    return new MeshBasicMaterial({
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
    });
  }
}
