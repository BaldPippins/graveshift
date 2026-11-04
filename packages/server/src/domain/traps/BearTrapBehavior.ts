import { BEAR_TRAP_RULES, SIMULATION } from '@graveshift/shared/config';
import { distanceSquared } from '@graveshift/shared/core';
import type { ReadonlyVec2, Vec2 } from '@graveshift/shared/core';
import { TrapState } from '@graveshift/shared/model';
import { GameEventType } from '@graveshift/shared/protocol';
import type { EnemyEntity } from '../entities/EnemyEntity.ts';
import type { PlayerEntity } from '../entities/PlayerEntity.ts';
import type { TrapEntity } from '../entities/TrapEntity.ts';
import type { TrapBehavior } from './TrapBehavior.ts';
import type { TrapHost } from './TrapHost.ts';

const GROUNDED_HEIGHT = 0.05;
const HOLD_TICKS = Math.round(BEAR_TRAP_RULES.holdSeconds * SIMULATION.tickRate);
const TRIGGER_RADIUS_SQUARED = BEAR_TRAP_RULES.triggerRadius ** 2;

export class BearTrapBehavior implements TrapBehavior {
  private readonly host: TrapHost;
  private heldEnemy: EnemyEntity | null = null;
  private heldPlayer: PlayerEntity | null = null;
  private holdTicksLeft = 0;

  constructor(host: TrapHost) {
    this.host = host;
  }

  get state(): TrapState {
    return this.isHolding ? TrapState.Holding : TrapState.Armed;
  }

  private get isHolding(): boolean {
    return this.heldEnemy !== null || this.heldPlayer !== null;
  }

  struck(): void {
    return;
  }

  update(trap: TrapEntity): void {
    if (this.isHolding) {
      this.hold(trap);
      return;
    }
    const enemy = this.enemyOn(trap);
    if (enemy !== null) {
      this.snareEnemy(trap, enemy);
      return;
    }
    const player = this.playerOn(trap);
    if (player !== null) {
      this.snarePlayer(trap, player);
    }
  }

  private hold(trap: TrapEntity): void {
    this.holdTicksLeft -= 1;
    if (this.holdTicksLeft > 0 && this.victimStillCaught()) {
      return;
    }
    if (this.heldEnemy !== null) {
      this.heldEnemy.snared = false;
    }
    if (this.heldPlayer !== null) {
      this.heldPlayer.snared = false;
    }
    this.heldEnemy = null;
    this.heldPlayer = null;
    this.host.spend(trap);
  }

  private victimStillCaught(): boolean {
    const world = this.host.world;
    if (this.heldEnemy !== null) {
      return !this.heldEnemy.isDead && world.enemies.has(this.heldEnemy.id);
    }
    return (
      this.heldPlayer !== null &&
      this.heldPlayer.isAlive &&
      world.players.get(this.heldPlayer.id) === this.heldPlayer
    );
  }

  private enemyOn(trap: TrapEntity): EnemyEntity | null {
    for (const enemy of this.host.world.enemies.values()) {
      const grounded = !enemy.definition.airborne && !enemy.definition.phasesThroughWalls;
      if (grounded && !enemy.snared && this.isOver(trap, enemy.position)) {
        return enemy;
      }
    }
    return null;
  }

  private playerOn(trap: TrapEntity): PlayerEntity | null {
    for (const player of this.host.world.players.values()) {
      const grounded = player.height <= GROUNDED_HEIGHT;
      if (player.isAlive && grounded && !player.snared && this.isOver(trap, player.position)) {
        return player;
      }
    }
    return null;
  }

  private isOver(trap: TrapEntity, position: ReadonlyVec2): boolean {
    return distanceSquared(trap.position, position) <= TRIGGER_RADIUS_SQUARED;
  }

  private snareEnemy(trap: TrapEntity, enemy: EnemyEntity): void {
    this.heldEnemy = enemy;
    this.clamp(trap, enemy.position);
    enemy.snared = true;
    this.spring(trap, null);
    this.host.woundEnemy(trap, enemy, this.biteOf(trap, enemy.maxHealth));
  }

  private snarePlayer(trap: TrapEntity, player: PlayerEntity): void {
    this.heldPlayer = player;
    this.clamp(trap, player.position);
    player.snared = true;
    this.spring(trap, player.id);
    this.host.woundPlayer(player, this.biteOf(trap, player.maxHealth));
  }

  private clamp(trap: TrapEntity, position: Vec2): void {
    position.x = trap.position.x;
    position.y = trap.position.y;
    this.holdTicksLeft = HOLD_TICKS;
  }

  private biteOf(trap: TrapEntity, maxHealth: number): number {
    return maxHealth * BEAR_TRAP_RULES.damageFraction * trap.power;
  }

  private spring(trap: TrapEntity, playerId: number | null): void {
    this.host.world.events.emit({
      type: GameEventType.TrapSprung,
      cell: trap.spot.index,
      playerId,
    });
  }
}
