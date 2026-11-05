import { describe, expect, it } from 'vitest';
import { RangedWeaponId } from '@graveshift/shared/config';
import { GameEventType } from '@graveshift/shared/protocol';
import { GRAVEYARD_LEVEL } from '@graveshift/shared/world';
import type { ShotFiredEvent } from '@graveshift/shared/protocol';
import { ClientEventType } from '../game/events/ClientEvent.ts';
import { ClientEventBus } from '../game/events/ClientEventBus.ts';
import { GameAudio } from './GameAudio.ts';
import type { SoundId } from './SoundId.ts';
import type { SoundPlacement } from './SoundPlacement.ts';
import type { SoundPlayer } from './SoundPlayer.ts';

const LOCAL_ID = 1;
const BOT_ID = 9;

interface PlayedSound {
  readonly id: SoundId;
  readonly gain: number;
}

class RecordingPlayer implements SoundPlayer {
  readonly played: PlayedSound[] = [];

  play(id: SoundId, placement?: SoundPlacement): void {
    this.played.push({ id, gain: placement === undefined ? 1 : placement.gain });
  }
}

function shot(shooterId: number, x: number): ShotFiredEvent {
  return {
    type: GameEventType.ShotFired,
    shooterId,
    weapon: RangedWeaponId.Pistol,
    fromX: x,
    fromY: 0,
    toX: x + 5,
    toY: 0,
    hit: false,
  };
}

function setUp(): RecordingPlayer {
  const player = new RecordingPlayer();
  const bus = new ClientEventBus();
  const audio = new GameAudio(player, bus);
  bus.emit({ type: ClientEventType.MatchStarted, localPlayerId: LOCAL_ID, level: GRAVEYARD_LEVEL });
  audio.setListener(0, 0);
  bus.emit(shot(LOCAL_ID, 0));
  bus.emit(shot(BOT_ID, 2));
  bus.emit(shot(BOT_ID, 7));
  bus.emit(shot(BOT_ID, 14));
  return player;
}

describe('GameAudio', () => {
  it('locates cell sounds using the selected level dimensions', () => {
    const player = new RecordingPlayer();
    const bus = new ClientEventBus();
    const audio = new GameAudio(player, bus);
    const level = {
      ...GRAVEYARD_LEVEL,
      id: 'small',
      width: 8,
      height: 8,
      rows: [
        '########',
        '#P....S#',
        '#......#',
        '#......#',
        '#......#',
        '#......#',
        '#......#',
        '########',
      ],
    };
    bus.emit({ type: ClientEventType.MatchStarted, localPlayerId: LOCAL_ID, level });
    audio.setListener(1.5, 1.5);
    bus.emit({ type: GameEventType.ObstacleWrecked, cell: 9, attackerId: LOCAL_ID });
    expect(player.played[0]).toMatchObject({ gain: 1 });
  });
  it('plays shots loud nearby, quieter toward the screen edge and not at all off screen', () => {
    const gains = setUp().played.map((sound) => sound.gain);
    expect(gains[0]).toBe(1);
    expect(gains[1]).toBe(1);
    expect(gains[2]).toBeGreaterThan(0);
    expect(gains[2]).toBeLessThan(0.5);
    expect(gains[3]).toBe(0);
  });
});
