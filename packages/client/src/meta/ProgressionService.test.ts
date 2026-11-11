import { describe, expect, it } from 'vitest';
import { ENEMY_KINDS, EnemyKind, UpgradeStat, WeaponId } from '@graveshift/shared/config';
import { MatchOutcome } from '@graveshift/shared/model';
import { GameEventType } from '@graveshift/shared/protocol';
import { GRAVEYARD_LEVEL } from '@graveshift/shared/world';
import { ClientEventType } from '../game/events/ClientEvent.ts';
import type { ClientEvent } from '../game/events/ClientEvent.ts';
import { ClientEventBus } from '../game/events/ClientEventBus.ts';
import { achievementTarget } from './achievements/achievementCatalog.ts';
import { AchievementId } from './achievements/AchievementId.ts';
import { CounterId, killCounterOf } from './counters/CounterId.ts';
import { ProgressionService } from './ProgressionService.ts';
import { MemoryKeyValueStore } from './storage/MemoryKeyValueStore.ts';

const LOCAL = 7;
const OTHER = 9;

interface ManualClock {
  now: number;
}

interface Harness {
  readonly bus: ClientEventBus;
  readonly progression: ProgressionService;
  readonly unlocked: string[];
  readonly clock: ManualClock;
}

function setup(): Harness {
  const bus = new ClientEventBus();
  const clock: ManualClock = { now: 0 };
  const progression = new ProgressionService(bus, new MemoryKeyValueStore(), () => clock.now);
  const unlocked: string[] = [];
  bus.on(ClientEventType.AchievementUnlocked, (event) => unlocked.push(event.achievementId));
  bus.emit({ type: ClientEventType.MatchStarted, localPlayerId: LOCAL, level: GRAVEYARD_LEVEL });
  return { bus, progression, unlocked, clock };
}

function kill(
  killerId: number,
  kind: EnemyKind = EnemyKind.Zombie,
  weapon: WeaponId = WeaponId.Pistol,
): ClientEvent {
  return { type: GameEventType.EnemyKilled, enemyId: 1, kind, killerId, weapon, x: 0, y: 0 };
}

function finished(outcome: MatchOutcome, wave: number): ClientEvent {
  return {
    type: ClientEventType.MatchFinished,
    localPlayerId: LOCAL,
    outcome,
    wave,
    durationTicks: 0,
    stats: [],
  };
}

function shot(shooterId: number, hit: boolean): ClientEvent {
  return {
    type: GameEventType.ShotFired,
    shooterId,
    weapon: WeaponId.Pistol,
    fromX: 0,
    fromY: 0,
    toX: 1,
    toY: 0,
    hit,
  };
}

describe('ProgressionService', () => {
  it('records nothing on custom maps or modified copies of an official map', () => {
    const { bus, progression, unlocked, clock } = setup();
    bus.emit({ type: ClientEventType.MatchLeft });
    const matches = progression.counters.valueOf(CounterId.MatchesPlayed);
    for (const level of [
      { ...GRAVEYARD_LEVEL, id: 'custom' },
      { ...GRAVEYARD_LEVEL, waves: { ...GRAVEYARD_LEVEL.waves, baseBudget: 1 } },
    ]) {
      bus.emit({ type: ClientEventType.MatchStarted, localPlayerId: LOCAL, level });
      bus.emit({
        type: ClientEventType.LoadoutUpdated,
        ownedWeapons: [
          WeaponId.Pistol,
          WeaponId.Smg,
          WeaponId.Shotgun,
          WeaponId.Rifle,
          WeaponId.Gatling,
        ],
      });
      bus.emit(kill(LOCAL));
      clock.now += 10_000;
      bus.emit(finished(MatchOutcome.Victory, 1));
    }
    expect(progression.counters.valueOf(CounterId.MatchesPlayed)).toBe(matches);
    expect(progression.counters.valueOf(CounterId.Kills)).toBe(0);
    expect(progression.counters.valueOf(CounterId.Wins)).toBe(0);
    expect(progression.counters.valueOf(CounterId.ArsenalComplete)).toBe(0);
    expect(progression.counters.valueOf(CounterId.SecondsPlayed)).toBe(0);
    expect(unlocked).toEqual([]);
  });

  it('continues progress after reconnect without counting a second match', () => {
    const { bus, progression, clock } = setup();
    clock.now = 10_000;
    bus.emit({ type: ClientEventType.MatchLeft });
    clock.now = 20_000;
    bus.emit({
      type: ClientEventType.MatchStarted,
      localPlayerId: LOCAL,
      level: structuredClone(GRAVEYARD_LEVEL),
      resumed: true,
    });
    bus.emit(kill(LOCAL));
    clock.now = 25_000;
    bus.emit(finished(MatchOutcome.Victory, 10));
    expect(progression.counters.valueOf(CounterId.MatchesPlayed)).toBe(1);
    expect(progression.counters.valueOf(CounterId.SecondsPlayed)).toBe(15);
    expect(progression.counters.valueOf(CounterId.Kills)).toBe(1);
    expect(progression.counters.valueOf(CounterId.Wins)).toBe(1);
  });

  it('keeps the weapon collection across a reconnect to the same match', () => {
    const { bus, progression } = setup();
    for (const weapon of [WeaponId.Smg, WeaponId.Shotgun]) {
      bus.emit({ type: GameEventType.WeaponUnlocked, playerId: LOCAL, weapon });
    }
    bus.emit({ type: ClientEventType.MatchLeft });
    bus.emit({
      type: ClientEventType.MatchStarted,
      localPlayerId: LOCAL,
      level: GRAVEYARD_LEVEL,
      resumed: true,
    });
    for (const weapon of [WeaponId.Rifle, WeaponId.Gatling]) {
      bus.emit({ type: GameEventType.WeaponUnlocked, playerId: LOCAL, weapon });
    }
    expect(progression.counters.valueOf(CounterId.ArsenalComplete)).toBe(1);
  });

  it('restores the weapon collection from the server after a page reload', () => {
    const bus = new ClientEventBus();
    const progression = new ProgressionService(bus, new MemoryKeyValueStore(), () => 0);
    bus.emit({
      type: ClientEventType.MatchStarted,
      localPlayerId: LOCAL,
      level: GRAVEYARD_LEVEL,
      resumed: true,
    });
    bus.emit({
      type: ClientEventType.LoadoutUpdated,
      ownedWeapons: [WeaponId.Pistol, WeaponId.Smg, WeaponId.Shotgun, WeaponId.Rifle],
    });
    bus.emit({ type: GameEventType.WeaponUnlocked, playerId: LOCAL, weapon: WeaponId.Gatling });
    expect(progression.counters.valueOf(CounterId.ArsenalComplete)).toBe(1);
  });

  it('recognizes a complete collection restored after reconnect', () => {
    const { bus, progression } = setup();
    bus.emit({ type: ClientEventType.MatchLeft });
    bus.emit({
      type: ClientEventType.MatchStarted,
      localPlayerId: LOCAL,
      level: GRAVEYARD_LEVEL,
      resumed: true,
    });
    bus.emit({
      type: ClientEventType.LoadoutUpdated,
      ownedWeapons: [
        WeaponId.Pistol,
        WeaponId.Smg,
        WeaponId.Shotgun,
        WeaponId.Rifle,
        WeaponId.Gatling,
      ],
    });
    expect(progression.counters.valueOf(CounterId.ArsenalComplete)).toBe(1);
  });

  it('keeps a separate kill tally for every enemy kind, bats included', () => {
    const { bus, progression } = setup();
    for (const kind of ENEMY_KINDS) {
      bus.emit(kill(LOCAL, kind));
    }
    const counters = progression.counters.values.value;
    expect(counters[CounterId.Kills]).toBe(ENEMY_KINDS.length);
    expect(new Set(ENEMY_KINDS.map((kind) => killCounterOf(kind))).size).toBe(ENEMY_KINDS.length);
    for (const kind of ENEMY_KINDS) {
      expect(counters[killCounterOf(kind)]).toBe(1);
    }
  });

  it('awards the bat swatter after enough bats are shot down', () => {
    const { bus, unlocked } = setup();
    for (let index = 0; index < achievementTarget(AchievementId.BatSwatter); index += 1) {
      bus.emit(kill(LOCAL, EnemyKind.Bat));
    }
    expect(unlocked).toContain(AchievementId.BatSwatter);
  });

  it('counts only the local player kills and unlocks first blood once', () => {
    const { bus, progression, unlocked } = setup();
    bus.emit(kill(OTHER));
    expect(progression.counters.valueOf(CounterId.Kills)).toBe(0);
    bus.emit(kill(LOCAL, EnemyKind.Ghost));
    bus.emit(kill(LOCAL));
    expect(progression.counters.valueOf(CounterId.Kills)).toBe(2);
    expect(progression.counters.valueOf(killCounterOf(EnemyKind.Ghost))).toBe(1);
    expect(unlocked.filter((id) => id === AchievementId.FirstBlood)).toHaveLength(1);
  });

  it('tracks melee kills, fury, the melee armoury and merchant revivals', () => {
    const { bus, progression, unlocked } = setup();
    bus.emit(kill(LOCAL, EnemyKind.Zombie, WeaponId.Sword));
    bus.emit(kill(LOCAL, EnemyKind.Zombie, WeaponId.Pistol));
    bus.emit(kill(OTHER, EnemyKind.Zombie, WeaponId.Axe));
    expect(progression.counters.valueOf(CounterId.MeleeKills)).toBe(1);
    bus.emit({ type: GameEventType.FuryUnleashed, playerId: LOCAL });
    for (const weapon of [WeaponId.Sword, WeaponId.Spear, WeaponId.Axe, WeaponId.Warhammer]) {
      bus.emit({ type: GameEventType.WeaponUnlocked, playerId: LOCAL, weapon });
    }
    bus.emit({ type: GameEventType.MerchantReturned, reviverId: OTHER });
    expect(unlocked).not.toContain(AchievementId.Necromancer);
    bus.emit({ type: GameEventType.MerchantReturned, reviverId: LOCAL });
    expect(unlocked).toEqual(
      expect.arrayContaining([
        AchievementId.Berserk,
        AchievementId.Bladesmith,
        AchievementId.Necromancer,
      ]),
    );
    expect(unlocked).not.toContain(AchievementId.Arsenal);
  });

  it('detects multikills inside the time window', () => {
    const { bus, progression, unlocked, clock } = setup();
    for (let index = 0; index < 5; index += 1) {
      clock.now = index * 300;
      bus.emit(kill(LOCAL));
    }
    expect(progression.counters.valueOf(CounterId.BestMultikill)).toBe(5);
    expect(unlocked).toContain(AchievementId.MeatGrinder);
  });

  it('awards a flawless wave only without local damage', () => {
    const { bus, progression } = setup();
    bus.emit({ type: GameEventType.WaveStarted, wave: 1 });
    bus.emit({ type: GameEventType.PlayerDamaged, playerId: OTHER, amount: 5, attackerId: null });
    bus.emit({ type: GameEventType.WaveCleared, wave: 1 });
    bus.emit({ type: GameEventType.WaveStarted, wave: 2 });
    bus.emit({ type: GameEventType.PlayerDamaged, playerId: LOCAL, amount: 5, attackerId: null });
    bus.emit({ type: GameEventType.WaveCleared, wave: 2 });
    expect(progression.counters.valueOf(CounterId.FlawlessWaves)).toBe(1);
  });

  it('does not count a partially observed wave as flawless after reconnect', () => {
    const { bus, progression } = setup();
    bus.emit({ type: GameEventType.WaveStarted, wave: 1 });
    bus.emit({ type: ClientEventType.MatchLeft });
    bus.emit({
      type: ClientEventType.MatchStarted,
      localPlayerId: LOCAL,
      level: GRAVEYARD_LEVEL,
      resumed: true,
    });
    bus.emit({ type: GameEventType.WaveCleared, wave: 1 });
    expect(progression.counters.valueOf(CounterId.FlawlessWaves)).toBe(0);
    bus.emit({ type: GameEventType.WaveStarted, wave: 2 });
    bus.emit({ type: GameEventType.WaveCleared, wave: 2 });
    expect(progression.counters.valueOf(CounterId.FlawlessWaves)).toBe(1);
  });

  it('ignores self revives and counts real ones', () => {
    const { bus, progression, unlocked } = setup();
    bus.emit({ type: GameEventType.PlayerRevived, playerId: LOCAL, reviverId: LOCAL });
    bus.emit({ type: GameEventType.PlayerRevived, playerId: OTHER, reviverId: LOCAL });
    expect(progression.counters.valueOf(CounterId.Revives)).toBe(1);
    expect(unlocked).toContain(AchievementId.NoOneLeftBehind);
  });

  it('tracks maxed upgrades, victories and play time', () => {
    const { bus, progression, unlocked, clock } = setup();
    bus.emit({
      type: GameEventType.WeaponUpgraded,
      playerId: LOCAL,
      weapon: WeaponId.Pistol,
      stat: UpgradeStat.Damage,
      level: 3,
    });
    bus.emit({ type: GameEventType.WaveCleared, wave: 10 });
    clock.now = 100_000;
    bus.emit(finished(MatchOutcome.Victory, 10));
    expect(unlocked).toEqual(
      expect.arrayContaining([AchievementId.MaxedOut, AchievementId.Dawn, AchievementId.Survivor]),
    );
    expect(progression.counters.valueOf(CounterId.SecondsPlayed)).toBe(100);
  });

  it('counts every match, including ones left early, and sums play time', () => {
    const { bus, progression, clock } = setup();
    clock.now = 60_000;
    bus.emit({ type: ClientEventType.MatchLeft });
    clock.now = 70_000;
    bus.emit({ type: ClientEventType.MatchStarted, localPlayerId: LOCAL, level: GRAVEYARD_LEVEL });
    bus.emit({ type: GameEventType.WaveCleared, wave: 3 });
    clock.now = 100_000;
    bus.emit(finished(MatchOutcome.Defeat, 4));
    clock.now = 500_000;
    bus.emit({ type: ClientEventType.MatchLeft });
    expect(progression.counters.valueOf(CounterId.MatchesPlayed)).toBe(2);
    expect(progression.counters.valueOf(CounterId.SecondsPlayed)).toBe(90);
    expect(progression.counters.valueOf(CounterId.BestWave)).toBe(3);
    expect(progression.counters.valueOf(CounterId.Wins)).toBe(0);
  });

  it('counts own shots, hits and damage as they happen', () => {
    const { bus, progression } = setup();
    bus.emit(shot(LOCAL, true));
    bus.emit(shot(LOCAL, false));
    bus.emit(shot(OTHER, true));
    bus.emit({
      type: GameEventType.EnemyDamaged,
      enemyId: 1,
      attackerId: LOCAL,
      amount: 25,
      x: 0,
      y: 0,
    });
    expect(progression.counters.valueOf(CounterId.ShotsFired)).toBe(2);
    expect(progression.counters.valueOf(CounterId.ShotsHit)).toBe(1);
    expect(progression.counters.valueOf(CounterId.DamageDealt)).toBe(25);
  });

  it('keeps progress written by another tab', () => {
    const storage = new MemoryKeyValueStore();
    const firstBus = new ClientEventBus();
    const secondBus = new ClientEventBus();
    const first = new ProgressionService(firstBus, storage, () => 0);
    const second = new ProgressionService(secondBus, storage, () => 0);
    firstBus.emit({
      type: ClientEventType.MatchStarted,
      localPlayerId: LOCAL,
      level: GRAVEYARD_LEVEL,
    });
    secondBus.emit({
      type: ClientEventType.MatchStarted,
      localPlayerId: OTHER,
      level: GRAVEYARD_LEVEL,
    });
    firstBus.emit(kill(LOCAL));
    secondBus.emit(kill(OTHER));
    expect(second.counters.valueOf(CounterId.Kills)).toBe(2);
    expect(second.counters.valueOf(CounterId.MatchesPlayed)).toBe(2);
    expect(first.counters.valueOf(CounterId.Kills)).toBe(1);
  });

  it('persists unlocks across sessions', () => {
    const storage = new MemoryKeyValueStore();
    const firstBus = new ClientEventBus();
    new ProgressionService(firstBus, storage, () => 0);
    firstBus.emit({
      type: ClientEventType.MatchStarted,
      localPlayerId: LOCAL,
      level: GRAVEYARD_LEVEL,
    });
    firstBus.emit(kill(LOCAL));
    const restored = new ProgressionService(new ClientEventBus(), storage, () => 0);
    expect(restored.counters.valueOf(CounterId.Kills)).toBe(1);
    expect(restored.achievements.unlocked.value[AchievementId.FirstBlood]).toBeTypeOf('number');
  });
});
