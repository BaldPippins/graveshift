import { PLAYER_RULES, SIMULATION } from '@graveshift/shared/config';
import type { HeroDefinition } from '@graveshift/shared/config';
import type { Vec2 } from '@graveshift/shared/core';
import { LifeState } from '@graveshift/shared/model';
import type { PlayerInputMessage } from '@graveshift/shared/protocol';
import type { Body } from './Body.ts';
import { PlayerArsenal } from './PlayerArsenal.ts';

export class PlayerEntity implements Body {
  readonly id: number;
  readonly nickname: string;
  readonly hero: HeroDefinition;
  readonly isBot: boolean;
  readonly position: Vec2;
  readonly arsenal: PlayerArsenal;
  aim = 0;
  health: number;
  life: LifeState = LifeState.Alive;
  paused = false;
  connected = true;
  disconnectedSeconds = 0;
  triggerHeld = false;
  viewTick = 0;
  reviveProgress = 0;
  bleedoutRemainingSeconds = 0;
  coins = 0;
  lastInputSequence = 0;
  private readonly pendingInputs: PlayerInputMessage[] = [];

  constructor(id: number, nickname: string, hero: HeroDefinition, isBot: boolean, position: Vec2) {
    this.id = id;
    this.nickname = nickname;
    this.hero = hero;
    this.isBot = isBot;
    this.position = position;
    this.health = hero.maxHealth;
    this.arsenal = new PlayerArsenal(hero.modifiers);
  }

  get radius(): number {
    return PLAYER_RULES.radius;
  }

  get maxHealth(): number {
    return this.hero.maxHealth;
  }

  get isAlive(): boolean {
    return this.life === LifeState.Alive;
  }

  get isIdle(): boolean {
    return this.paused || !this.connected;
  }

  setConnected(connected: boolean): void {
    this.connected = connected;
    this.paused = false;
    this.disconnectedSeconds = 0;
    this.triggerHeld = false;
    this.lastInputSequence = 0;
    this.pendingInputs.length = 0;
  }

  enqueueInput(input: PlayerInputMessage): void {
    const newest = this.pendingInputs.at(-1);
    const newestQueued = newest === undefined ? this.lastInputSequence : newest.sequence;
    if (input.sequence <= newestQueued) {
      return;
    }
    this.pendingInputs.push(input);
    if (this.pendingInputs.length > SIMULATION.maxQueuedInputs) {
      this.pendingInputs.splice(0, this.pendingInputs.length - SIMULATION.maxQueuedInputs);
    }
  }

  takeInputs(limit: number): PlayerInputMessage[] {
    return this.pendingInputs.splice(0, limit);
  }
}
