import { describe, expect, it } from 'vitest';
import {
  BEAR_TRAP_RULES,
  BLAST_SURVIVOR_HEALTH,
  POWDER_KEG_BLAST,
  ENEMIES,
  EnemyKind,
  HEROES,
  HeroId,
  SIMULATION,
  TRAP_RULES,
  TRAPS,
  TrapKind,
  WeaponId,
} from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { LifeState } from '@graveshift/shared/model';
import { GameEventType } from '@graveshift/shared/protocol';
import type { GameEvent } from '@graveshift/shared/protocol';
import { PurchaseRejection, trapPower, trapPrice } from '@graveshift/shared/rules';
import { CollisionLayer, MapId, parseTileMap } from '@graveshift/shared/world';
import { EnemyEntity } from '../entities/EnemyEntity.ts';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { MatchEventBus } from '../match/MatchEventBus.ts';
import { MatchWorld } from '../match/MatchWorld.ts';
import { createCombat } from '../testing/createCombat.ts';
import type { CombatRig } from '../testing/createCombat.ts';

const YARD = [
  '###########',
  '#S........#',
  '#..k.gk...#',
  '#.........#',
  '#..n....P.#',
  '###########',
];
const TOUGH = 10_000;

interface Yard {
  readonly world: MatchWorld;
  readonly combat: CombatRig;
  readonly player: PlayerEntity;
  readonly emitted: GameEvent[];
}

function yard(): Yard {
  const events = new MatchEventBus();
  const emitted: GameEvent[] = [];
  events.onAny((event) => {
    emitted.push(event);
  });
  const world = new MatchWorld(
    parseTileMap({ id: MapId.Graveyard, rows: YARD }),
    new SeededRandom(4),
    events,
  );
  const player = new PlayerEntity(1, 'Tester', HEROES[HeroId.Pippin], false, { x: 3.5, y: 3.5 });
  player.coins = 1000;
  world.players.set(player.id, player);
  return { world, combat: createCombat(world, true), player, emitted };
}

function moveTo(player: PlayerEntity, x: number, y: number): void {
  player.position.x = x;
  player.position.y = y;
}

function zombieAt(world: MatchWorld, id: number, x: number, y: number): EnemyEntity {
  const zombie = new EnemyEntity(id, ENEMIES[EnemyKind.Zombie], { x, y }, TOUGH);
  world.enemies.set(zombie.id, zombie);
  return zombie;
}

describe('TrapService', () => {
  it('sells a keg only at its spot, once, and makes the spot solid', () => {
    const { world, combat, player } = yard();
    moveTo(player, 8.5, 4.5);
    expect(combat.traps.arm(player)).toBe(PurchaseRejection.TrapTooFar);
    moveTo(player, 3.5, 3.3);
    expect(world.map.isBlocked(3, 2, CollisionLayer.Movement)).toBe(false);
    expect(combat.traps.arm(player)).toBeNull();
    expect(player.coins).toBe(1000 - TRAPS[TrapKind.PowderKeg].price);
    expect(world.map.isBlocked(3, 2, CollisionLayer.Movement)).toBe(true);
    expect(combat.traps.arm(player)).toBe(PurchaseRejection.TrapArmed);
    player.coins = 0;
    moveTo(player, 6.5, 3.3);
    expect(combat.traps.arm(player)).toBe(PurchaseRejection.NotEnoughCoins);
  });

  it('keeps armed and spent traps as they are across waves', () => {
    const { world, combat, player } = yard();
    combat.traps.armEverySpot();
    moveTo(player, 3.4, 4.4);
    for (let tick = 0; tick <= BEAR_TRAP_RULES.holdSeconds * SIMULATION.tickRate; tick += 1) {
      combat.traps.update();
    }
    const before = combat.traps.armedTraps.map((trap) => trap.spot.index);
    const spentBefore = combat.traps.spentSpots;
    world.events.emit({ type: GameEventType.WaveCleared, wave: 1 });
    world.events.emit({ type: GameEventType.WaveStarted, wave: 2 });
    combat.traps.update();
    expect(spentBefore).toEqual([47]);
    expect(combat.traps.armedTraps.map((trap) => trap.spot.index)).toEqual(before);
    expect(combat.traps.spentSpots).toEqual(spentBefore);
  });

  it('raises trap prices every few waves', () => {
    const { world, combat, player } = yard();
    world.events.emit({ type: GameEventType.WaveStarted, wave: TRAP_RULES.priceStepWaves + 1 });
    moveTo(player, 3.5, 3.3);
    expect(combat.traps.arm(player)).toBeNull();
    const raised = TRAPS[TrapKind.PowderKeg].price * (1 + TRAP_RULES.priceStepFraction);
    expect(player.coins).toBe(1000 - raised);
    expect(combat.traps.armedTraps.find((trap) => trap.spot.index === 25)!.power).toBe(
      trapPower(TRAP_RULES.priceStepWaves + 1),
    );
    expect(trapPrice(TrapKind.BearTrap, 1)).toBe(TRAPS[TrapKind.BearTrap].price);
    expect(trapPrice(TrapKind.BearTrap, TRAP_RULES.priceStepWaves)).toBe(
      TRAPS[TrapKind.BearTrap].price,
    );
  });

  it('blows a struck keg up, chains the next keg and wrecks graves around', () => {
    const { world, combat, player, emitted } = yard();
    moveTo(player, 3.5, 3.3);
    combat.traps.arm(player);
    moveTo(player, 6.5, 3.3);
    combat.traps.arm(player);
    moveTo(player, 9.5, 1.5);
    const zombie = zombieAt(world, 7, 2.5, 1.5);
    const [firstKeg] = combat.traps.shootableTraps;
    combat.traps.strike(firstKeg!, player, WeaponId.Pistol);
    const blasts = emitted.filter((event) => event.type === GameEventType.KegExploded);
    expect(blasts).toHaveLength(2);
    expect(combat.traps.armedTraps).toHaveLength(0);
    expect(zombie.health).toBeLessThan(TOUGH);
    expect(combat.wreckage.intactAt(world.map.indexOf(5, 2))).toBeNull();
    expect(world.map.isBlocked(3, 2, CollisionLayer.Movement)).toBe(false);
  });

  it('holds an enemy in a bear trap for the whole hold time', () => {
    const { world, combat, player, emitted } = yard();
    moveTo(player, 3.5, 3.6);
    combat.traps.arm(player);
    moveTo(player, 9.5, 1.5);
    const zombie = zombieAt(world, 8, 3.6, 4.4);
    combat.traps.update();
    expect(zombie.snared).toBe(true);
    expect(zombie.position).toEqual({ x: 3.5, y: 4.5 });
    expect(emitted).toContainEqual({ type: GameEventType.TrapSprung, cell: 47, playerId: null });
    const holdTicks = BEAR_TRAP_RULES.holdSeconds * SIMULATION.tickRate;
    for (let tick = 1; tick < holdTicks; tick += 1) {
      combat.traps.update();
    }
    expect(zombie.snared).toBe(true);
    combat.traps.update();
    expect(zombie.snared).toBe(false);
    expect(zombie.health).toBe(TOUGH * (1 - BEAR_TRAP_RULES.damageFraction));
    expect(combat.traps.armedTraps).toHaveLength(0);
    expect(combat.traps.spentSpots).toEqual([47]);
    moveTo(player, 3.5, 3.6);
    expect(combat.traps.arm(player)).toBeNull();
    expect(combat.traps.spentSpots).toEqual([]);
  });

  it('snaps on a player who walks into it', () => {
    const { combat, player } = yard();
    moveTo(player, 3.5, 3.6);
    combat.traps.arm(player);
    moveTo(player, 3.4, 4.4);
    combat.traps.update();
    expect(player.snared).toBe(true);
    expect(player.health).toBeLessThan(player.maxHealth);
  });

  it('finishes off an enemy weaker than the bite, even without an owner', () => {
    const { world, combat, emitted } = yard();
    combat.traps.armEverySpot();
    const zombie = new EnemyEntity(9, ENEMIES[EnemyKind.Zombie], { x: 3.5, y: 4.5 }, 100);
    zombie.health = 5;
    world.enemies.set(zombie.id, zombie);
    combat.traps.update();
    expect(world.enemies.has(zombie.id)).toBe(false);
    expect(emitted).toContainEqual(
      expect.objectContaining({ type: GameEventType.EnemyKilled, killerId: null, weapon: null }),
    );
  });

  it('lets one of several players caught in a lethal blast pull through', () => {
    const { world, combat, player } = yard();
    combat.traps.armEverySpot();
    const friend = new PlayerEntity(2, 'Friend', HEROES[HeroId.Watchman], false, {
      x: 3.5,
      y: 1.5,
    });
    world.players.set(friend.id, friend);
    moveTo(player, 4.2, 2.5);
    player.health = POWDER_KEG_BLAST.playerDamage / 2;
    friend.health = POWDER_KEG_BLAST.playerDamage / 2;
    const [keg] = combat.traps.shootableTraps;
    combat.traps.strike(keg!, player, WeaponId.Pistol);
    const standing = [player, friend].filter((caught) => caught.life === LifeState.Alive);
    expect(standing).toHaveLength(1);
    const fraction = standing[0]!.health / standing[0]!.maxHealth;
    expect(fraction).toBeGreaterThanOrEqual(BLAST_SURVIVOR_HEALTH.minFraction - 0.005);
    expect(fraction).toBeLessThanOrEqual(BLAST_SURVIVOR_HEALTH.maxFraction + 0.005);
  });

  it('keeps the spared player alive through a chain of kegs', () => {
    const { world, combat, player } = yard();
    combat.traps.armEverySpot();
    const friend = new PlayerEntity(2, 'Friend', HEROES[HeroId.Watchman], false, {
      x: 5,
      y: 3.5,
    });
    world.players.set(friend.id, friend);
    moveTo(player, 4.5, 1.5);
    player.health = POWDER_KEG_BLAST.playerDamage / 2;
    friend.health = POWDER_KEG_BLAST.playerDamage / 2;
    const [keg] = combat.traps.shootableTraps;
    combat.traps.strike(keg!, player, WeaponId.Pistol);
    expect(combat.traps.shootableTraps).toHaveLength(0);
    const standing = [player, friend].filter((caught) => caught.life === LifeState.Alive);
    expect(standing).toHaveLength(1);
  });

  it('spares nobody when a lone player stands by the keg', () => {
    const { combat, player } = yard();
    combat.traps.armEverySpot();
    moveTo(player, 4.2, 2.5);
    player.health = 1;
    const [keg] = combat.traps.shootableTraps;
    combat.traps.strike(keg!, player, WeaponId.Pistol);
    expect(player.life).not.toBe(LifeState.Alive);
  });
});
