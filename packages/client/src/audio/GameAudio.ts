import { clamp } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import { cellCenter, parseTileMap } from '@graveshift/shared/world';
import type { TileMap } from '@graveshift/shared/world';
import type { MeleeSwungEvent } from '@graveshift/shared/protocol';
import { PICKUP_SOUNDS, SHOT_SOUNDS } from '../content/soundContent.ts';
import { ClientEventType } from '../game/events/ClientEvent.ts';
import type { ClientEvent } from '../game/events/ClientEvent.ts';
import type { ClientEventBus } from '../game/events/ClientEventBus.ts';
import { CENTERED } from './AudioEngine.ts';
import { SoundId } from './SoundId.ts';
import type { SoundPlacement } from './SoundPlacement.ts';
import type { SoundPlayer } from './SoundPlayer.ts';

const FULL_VOLUME_RADIUS = 3;
const HEARING_RADIUS = 11;
const PAN_SPREAD = 12;
const MAX_PAN = 0.7;
const TEAMMATE_GAIN = 0.5;
const TEAMMATE: SoundPlacement = { gain: TEAMMATE_GAIN, pan: 0 };

export class GameAudio {
  private readonly engine: SoundPlayer;
  private localPlayerId: number | null = null;
  private map: TileMap | null = null;
  private hasListener = false;
  private listenerX = 0;
  private listenerY = 0;

  constructor(engine: SoundPlayer, bus: ClientEventBus) {
    this.engine = engine;
    bus.onAny((event) => {
      this.handle(event);
    });
  }

  setListener(x: number, y: number): void {
    this.hasListener = true;
    this.listenerX = x;
    this.listenerY = y;
  }

  cue(id: SoundId): void {
    this.engine.play(id);
  }

  private handle(event: ClientEvent): void {
    switch (event.type) {
      case GameEventType.ShotFired:
        this.engine.play(
          SHOT_SOUNDS[event.weapon],
          this.placeActor(event.shooterId, event.fromX, event.fromY),
        );
        return;
      case GameEventType.MeleeSwung:
        this.meleeSwung(event);
        return;
      case GameEventType.EnemyDamaged:
        this.engine.play(SoundId.EnemyHit, this.placeAt(event.x, event.y));
        return;
      case GameEventType.EnemyKilled:
        this.engine.play(SoundId.EnemyKilled, this.placeAt(event.x, event.y));
        return;
      case GameEventType.PlayerDamaged:
        this.forLocal(event.playerId, SoundId.PlayerHurt);
        return;
      case GameEventType.PlayerDowned:
      case GameEventType.PlayerDied:
        this.engine.play(SoundId.PlayerDowned, this.placeTeam(event.playerId));
        return;
      case GameEventType.PlayerRevived:
      case GameEventType.PlayerRespawned:
        this.forLocal(event.playerId, SoundId.PlayerRevived);
        return;
      case GameEventType.PickupCollected:
        this.forLocal(event.playerId, PICKUP_SOUNDS[event.kind]);
        return;
      case GameEventType.PlayerHealed:
        this.forLocal(event.playerId, SoundId.HealthPicked);
        return;
      case GameEventType.WeaponUnlocked:
        this.forLocal(event.playerId, SoundId.WeaponBought);
        return;
      case GameEventType.WeaponUpgraded:
        this.forLocal(event.playerId, SoundId.WeaponUpgraded);
        return;
      case GameEventType.FuryUnleashed:
        this.forLocal(event.playerId, SoundId.FuryUnleashed);
        return;
      case GameEventType.WaveStarted:
        this.engine.play(SoundId.WaveStarted);
        return;
      case GameEventType.WaveCleared:
        this.engine.play(SoundId.WaveCleared);
        return;
      case GameEventType.MerchantKilled:
        this.engine.play(SoundId.MerchantKilled);
        return;
      case GameEventType.MerchantReturned:
        this.engine.play(SoundId.MerchantReturned);
        return;
      case GameEventType.KegExploded:
        this.engine.play(SoundId.KegExploded, this.placeCell(event.cell));
        return;
      case GameEventType.ObstacleWrecked:
        this.engine.play(SoundId.ObstacleWrecked, this.placeCell(event.cell));
        return;
      case GameEventType.TrapArmed:
        this.forLocal(event.playerId, SoundId.TrapArmed);
        return;
      case GameEventType.TrapSprung:
        this.engine.play(SoundId.TrapSnapped, this.placeCell(event.cell));
        return;
      case ClientEventType.AchievementUnlocked:
        this.engine.play(SoundId.AchievementUnlocked);
        return;
      case ClientEventType.MatchStarted:
        this.localPlayerId = event.localPlayerId;
        this.map = parseTileMap(event.level);
        return;
      case ClientEventType.MatchFinished:
      case ClientEventType.MatchLeft:
        this.localPlayerId = null;
        this.hasListener = false;
        return;
      default:
        return;
    }
  }

  private meleeSwung(event: MeleeSwungEvent): void {
    const placement = this.placeActor(event.attackerId, event.x, event.y);
    this.engine.play(SoundId.MeleeSwing, placement);
    if (event.hits > 0) {
      this.engine.play(SoundId.MeleeHit, placement);
    }
    if (event.critical) {
      this.engine.play(SoundId.MeleeCritical, placement);
    }
  }

  private forLocal(playerId: number, id: SoundId): void {
    if (playerId === this.localPlayerId) {
      this.engine.play(id);
    }
  }

  private placeTeam(playerId: number): SoundPlacement {
    return playerId === this.localPlayerId ? CENTERED : TEAMMATE;
  }

  private placeActor(actorId: number, x: number, y: number): SoundPlacement {
    return actorId === this.localPlayerId ? CENTERED : this.placeAt(x, y);
  }

  private placeCell(cell: number): SoundPlacement {
    if (this.map === null) {
      return CENTERED;
    }
    const center = cellCenter(this.map.cellOfIndex(cell));
    return this.placeAt(center.x, center.y);
  }

  private placeAt(x: number, y: number): SoundPlacement {
    if (!this.hasListener) {
      return CENTERED;
    }
    const dx = x - this.listenerX;
    const distance = Math.hypot(dx, y - this.listenerY);
    const falloff = clamp(
      (HEARING_RADIUS - distance) / (HEARING_RADIUS - FULL_VOLUME_RADIUS),
      0,
      1,
    );
    return { gain: falloff * falloff, pan: clamp(dx / PAN_SPREAD, -MAX_PAN, MAX_PAN) };
  }
}
