import { POWDER_KEG_BLAST } from '@graveshift/shared/config';
import type { WeaponId } from '@graveshift/shared/config';
import { distanceSquared } from '@graveshift/shared/core';
import type { Unsubscribe } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import {
  strongerBlast,
  trapArmingRejection,
  trapPower,
  trapPrice,
  trapSpotNear,
  trapSpotsOf,
  TrapSpotBlocker,
} from '@graveshift/shared/rules';
import type { PurchaseRejection, TrapSpot } from '@graveshift/shared/rules';
import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { TrapEntity } from '../entities/TrapEntity.ts';
import type { MatchWorld } from '../match/MatchWorld.ts';
import { TrapFactory } from '../traps/TrapFactory.ts';
import type { TrapHost } from '../traps/TrapHost.ts';
import type { EconomyService } from './EconomyService.ts';
import type { EnemyDamageService } from './EnemyDamageService.ts';
import type { BlastChain } from './BlastChain.ts';
import type { ExplosionService } from './ExplosionService.ts';
import type { PlayerLifecycle } from './PlayerLifecycle.ts';

export class TrapService implements TrapHost {
  readonly world: MatchWorld;
  readonly spots: readonly TrapSpot[];
  private readonly economy: EconomyService;
  private readonly explosions: ExplosionService;
  private readonly enemyDamage: EnemyDamageService;
  private readonly lifecycle: PlayerLifecycle;
  private readonly blocker: TrapSpotBlocker;
  private readonly factory: TrapFactory;
  private readonly armed = new Map<number, TrapEntity>();
  private readonly spent = new Set<number>();
  private readonly unsubscribe: Unsubscribe;
  private wave = 1;
  private chain: BlastChain | null = null;

  constructor(
    world: MatchWorld,
    economy: EconomyService,
    explosions: ExplosionService,
    enemyDamage: EnemyDamageService,
    lifecycle: PlayerLifecycle,
  ) {
    this.world = world;
    this.economy = economy;
    this.explosions = explosions;
    this.enemyDamage = enemyDamage;
    this.lifecycle = lifecycle;
    this.spots = trapSpotsOf(world.map);
    this.blocker = new TrapSpotBlocker(world.map, this.spots);
    this.factory = new TrapFactory(this);
    this.unsubscribe = world.events.on(GameEventType.WaveStarted, (event) => {
      this.wave = event.wave;
    });
  }

  get armedTraps(): readonly TrapEntity[] {
    return [...this.armed.values()];
  }

  get spentSpots(): readonly number[] {
    return [...this.spent];
  }

  get shootableTraps(): readonly TrapEntity[] {
    return this.armedTraps.filter((trap) => trap.definition.shootable);
  }

  arm(player: PlayerEntity): PurchaseRejection | null {
    const spot = trapSpotNear(player.position, this.spots);
    const rejection = trapArmingRejection({
      spot,
      armed: spot !== null && this.armed.has(spot.index),
      coins: player.coins,
      lifeState: player.life,
      wave: this.wave,
    });
    if (rejection !== null || spot === null) {
      return rejection;
    }
    this.economy.spend(player, trapPrice(spot.kind, this.wave));
    this.place(spot, player.id);
    this.world.events.emit({
      type: GameEventType.TrapArmed,
      cell: spot.index,
      playerId: player.id,
    });
    return null;
  }

  armEverySpot(): void {
    for (const spot of this.spots) {
      if (!this.armed.has(spot.index)) {
        this.place(spot, null);
      }
    }
  }

  strike(trap: TrapEntity, attacker: PlayerEntity, weapon: WeaponId): void {
    trap.behavior.struck(trap, attacker, weapon);
  }

  update(): void {
    for (const trap of this.armedTraps) {
      trap.behavior.update(trap);
    }
  }

  detonate(trap: TrapEntity, attacker: PlayerEntity, weapon: WeaponId): void {
    if (this.armed.get(trap.spot.index) !== trap) {
      return;
    }
    this.disarm(trap);
    this.world.events.emit({
      type: GameEventType.KegExploded,
      cell: trap.spot.index,
      attackerId: attacker.id,
    });
    const outermost = this.chain === null;
    const chain = this.chain ?? { survivor: null };
    this.chain = chain;
    this.explosions.blast(
      trap.position,
      strongerBlast(POWDER_KEG_BLAST, trap.power),
      attacker,
      weapon,
      chain,
    );
    const reach = (POWDER_KEG_BLAST.radius + trap.radius) ** 2;
    for (const neighbour of this.shootableTraps) {
      if (distanceSquared(neighbour.position, trap.position) <= reach) {
        this.strike(neighbour, attacker, weapon);
      }
    }
    if (outermost) {
      this.chain = null;
    }
  }

  woundEnemy(trap: TrapEntity, enemy: EnemyEntity, amount: number): void {
    const owner = trap.ownerId === null ? undefined : this.world.players.get(trap.ownerId);
    if (owner === undefined) {
      this.enemyDamage.damage(enemy, amount, null, null);
      return;
    }
    this.enemyDamage.damage(enemy, amount, owner, owner.arsenal.current);
  }

  woundPlayer(player: PlayerEntity, amount: number): void {
    this.lifecycle.damage(player, amount, null);
  }

  disarm(trap: TrapEntity): void {
    if (this.armed.get(trap.spot.index) !== trap) {
      return;
    }
    this.armed.delete(trap.spot.index);
    this.blocker.setArmed(trap.spot, false);
  }

  spend(trap: TrapEntity): void {
    this.disarm(trap);
    this.spent.add(trap.spot.index);
  }

  dispose(): void {
    this.unsubscribe();
  }

  private place(spot: TrapSpot, ownerId: number | null): void {
    this.spent.delete(spot.index);
    this.armed.set(spot.index, this.factory.create(spot, ownerId, trapPower(this.wave)));
    this.blocker.setArmed(spot, true);
  }
}
