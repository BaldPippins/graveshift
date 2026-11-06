import { SIMULATION, WAVE_RULES } from '@graveshift/shared/config';
import type { EnemyKind, WaveRules } from '@graveshift/shared/config';
import { LifeState, MatchPhase } from '@graveshift/shared/model';
import { GameEventType } from '@graveshift/shared/protocol';
import { isFinalWave, spawnIntervalSeconds } from '@graveshift/shared/rules';
import type { LevelEnemy } from '@graveshift/shared/world';
import type { MatchWorld } from '../match/MatchWorld.ts';
import type { PlayerLifecycle } from '../services/PlayerLifecycle.ts';
import type { EnemySpawner } from './EnemySpawner.ts';
import { planWaveSpawns } from './planWaveSpawns.ts';

const RESULT_LINGER_SECONDS = 4;

function secondsToTicks(seconds: number): number {
  return Math.round(seconds * SIMULATION.tickRate);
}

export class WaveDirector {
  private readonly world: MatchWorld;
  private readonly lifecycle: PlayerLifecycle;
  private readonly spawner: EnemySpawner;
  private readonly totalWaves: number;
  private readonly rules: WaveRules;
  private readonly enemies: readonly LevelEnemy[] | undefined;
  private readonly skipVotes = new Set<number>();
  private spawnQueue: EnemyKind[] = [];
  private spawnCooldownSeconds = 0;
  private currentPhase: MatchPhase = MatchPhase.Countdown;
  private currentWave = 0;
  private ticksLeft: number;

  constructor(
    world: MatchWorld,
    lifecycle: PlayerLifecycle,
    spawner: EnemySpawner,
    totalWaves: number,
    rules: WaveRules = WAVE_RULES,
    enemies?: readonly LevelEnemy[],
  ) {
    this.world = world;
    this.lifecycle = lifecycle;
    this.spawner = spawner;
    this.totalWaves = totalWaves;
    this.rules = rules;
    this.enemies = enemies;
    this.ticksLeft = secondsToTicks(rules.countdownSeconds);
  }

  get phase(): MatchPhase {
    return this.currentPhase;
  }

  get wave(): number {
    return this.currentWave;
  }

  get phaseTicksLeft(): number {
    return this.ticksLeft;
  }

  get enemiesRemaining(): number {
    return this.spawnQueue.length + this.world.enemies.size;
  }

  get isIntermission(): boolean {
    return this.currentPhase === MatchPhase.Intermission;
  }

  get isOver(): boolean {
    const terminal =
      this.currentPhase === MatchPhase.Victory || this.currentPhase === MatchPhase.Defeat;
    return terminal && this.ticksLeft <= 0;
  }

  voteSkip(playerId: number): void {
    if (this.isIntermission) {
      this.skipVotes.add(playerId);
    }
  }

  update(): void {
    switch (this.currentPhase) {
      case MatchPhase.Countdown:
        this.countDown(() => {
          this.startWave(this.currentWave + 1);
        });
        return;
      case MatchPhase.Combat:
        this.updateCombat();
        return;
      case MatchPhase.Intermission:
        if (this.everyoneVotedSkip()) {
          this.startWave(this.currentWave + 1);
          return;
        }
        this.countDown(() => {
          this.startWave(this.currentWave + 1);
        });
        return;
      case MatchPhase.Victory:
      case MatchPhase.Defeat:
        this.ticksLeft = Math.max(0, this.ticksLeft - 1);
        return;
    }
  }

  private countDown(onElapsed: () => void): void {
    this.ticksLeft -= 1;
    if (this.ticksLeft <= 0) {
      onElapsed();
    }
  }

  private updateCombat(): void {
    if (this.world.alivePlayers().length === 0) {
      this.enter(MatchPhase.Defeat, RESULT_LINGER_SECONDS);
      return;
    }
    this.spawnCooldownSeconds -= SIMULATION.tickSeconds;
    if (
      this.spawnCooldownSeconds <= 0 &&
      this.spawnQueue.length > 0 &&
      this.world.enemies.size < SIMULATION.maxEnemiesAlive
    ) {
      const kind = this.spawnQueue.shift();
      if (kind !== undefined) {
        this.spawner.spawn(kind, this.currentWave);
      }
      this.spawnCooldownSeconds = spawnIntervalSeconds(this.currentWave, this.rules);
    }
    if (this.spawnQueue.length === 0 && this.world.enemies.size === 0) {
      this.clearWave();
    }
  }

  private startWave(wave: number): void {
    this.currentWave = wave;
    this.spawnQueue = planWaveSpawns(
      wave,
      this.world.players.size,
      this.world.random,
      this.rules,
      this.enemies,
    );
    this.spawnCooldownSeconds = 0;
    this.enter(MatchPhase.Combat, 0);
    this.world.events.emit({ type: GameEventType.WaveStarted, wave });
  }

  private clearWave(): void {
    this.world.events.emit({ type: GameEventType.WaveCleared, wave: this.currentWave });
    if (isFinalWave(this.currentWave, this.totalWaves)) {
      this.enter(MatchPhase.Victory, RESULT_LINGER_SECONDS);
      return;
    }
    this.restoreParty();
    this.skipVotes.clear();
    this.enter(MatchPhase.Intermission, this.rules.intermissionSeconds);
  }

  private restoreParty(): void {
    let spawnIndex = 0;
    for (const player of this.world.players.values()) {
      if (player.life === LifeState.Downed) {
        this.lifecycle.revive(player, player.id);
      } else if (player.life === LifeState.Dead) {
        const spawn = this.world.map.playerSpawnPoint(spawnIndex);
        spawnIndex += 1;
        this.lifecycle.respawn(player, spawn.x, spawn.y);
      }
      player.arsenal.refillAll();
    }
  }

  private everyoneVotedSkip(): boolean {
    const voters = [...this.world.players.values()].filter((player) => !player.isIdle);
    return voters.length > 0 && voters.every((player) => this.skipVotes.has(player.id));
  }

  private enter(phase: MatchPhase, seconds: number): void {
    this.currentPhase = phase;
    this.ticksLeft = secondsToTicks(seconds);
  }
}
