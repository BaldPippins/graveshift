import { DEFAULT_MATCH_SETTINGS, HEROES, SIMULATION } from '@graveshift/shared/config';
import type { MatchSettings, WeaponId } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { MatchOutcome, MatchPhase } from '@graveshift/shared/model';
import type { PlayerInputMessage, ScoreboardEntry } from '@graveshift/shared/protocol';
import { matchScore } from '@graveshift/shared/rules';
import type { PurchaseRejection, ShopOffer } from '@graveshift/shared/rules';
import { GRAVEYARD_LEVEL, parseTileMap, tileMapOf } from '@graveshift/shared/world';
import type { LevelDefinition, MapId } from '@graveshift/shared/world';
import { BotControlSystem } from '../bots/BotControlSystem.ts';
import { CombatTargets } from '../combat/CombatTargets.ts';
import { HitApplier } from '../combat/HitApplier.ts';
import { HitscanResolver } from '../combat/HitscanResolver.ts';
import { MeleeResolver } from '../combat/MeleeResolver.ts';
import { PositionHistory } from '../combat/PositionHistory.ts';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { EconomyService } from '../services/EconomyService.ts';
import { EnemyDamageService } from '../services/EnemyDamageService.ts';
import { ExplosionService } from '../services/ExplosionService.ts';
import { TrapService } from '../services/TrapService.ts';
import { WreckageService } from '../services/WreckageService.ts';
import { PumpkinPatchSystem } from '../pumpkins/PumpkinPatchSystem.ts';
import { PickupSpawner } from '../services/PickupSpawner.ts';
import { PlayerLifecycle } from '../services/PlayerLifecycle.ts';
import { MerchantService } from '../services/MerchantService.ts';
import { ShopService } from '../services/ShopService.ts';
import { AbsentPlayerSystem } from '../systems/AbsentPlayerSystem.ts';
import { EnemyBrainSystem } from '../systems/EnemyBrainSystem.ts';
import { PickupSystem } from '../systems/PickupSystem.ts';
import { PlayerControlSystem } from '../systems/PlayerControlSystem.ts';
import { PlayerVitalsSystem } from '../systems/PlayerVitalsSystem.ts';
import { MeleeSystem } from '../systems/MeleeSystem.ts';
import { WeaponSystem } from '../systems/WeaponSystem.ts';
import { EnemySpawner } from '../waves/EnemySpawner.ts';
import { WaveDirector } from '../waves/WaveDirector.ts';
import { buildSnapshot } from './buildSnapshot.ts';
import { EventOutbox } from './EventOutbox.ts';
import { MatchEventBus } from './MatchEventBus.ts';
import type { MatchParticipant } from './MatchParticipant.ts';
import { MatchStatsTracker } from './MatchStatsTracker.ts';
import type { LoadoutChange, MatchStepResult } from './MatchStepResult.ts';
import type { MatchSummary } from '@graveshift/shared/model';
import { MatchWorld } from './MatchWorld.ts';
import { EnemyFactory } from '../entities/EnemyFactory.ts';

export class Match {
  readonly mapId: MapId;
  readonly settings: MatchSettings;
  readonly level: LevelDefinition;
  private readonly world: MatchWorld;
  private readonly outbox: EventOutbox;
  private readonly stats: MatchStatsTracker;
  private readonly history = new PositionHistory(SIMULATION.maxRewindTicks + 2);
  private readonly merchants: MerchantService;
  private readonly wreckage: WreckageService;
  private readonly traps: TrapService;
  private readonly shop: ShopService;
  private readonly director: WaveDirector;
  private readonly bots: BotControlSystem;
  private readonly control: PlayerControlSystem;
  private readonly weapons: WeaponSystem;
  private readonly melee: MeleeSystem;
  private readonly enemyBrains: EnemyBrainSystem;
  private readonly vitals: PlayerVitalsSystem;
  private readonly pickups: PickupSystem;
  private readonly pumpkins: PumpkinPatchSystem;
  private readonly absentees: AbsentPlayerSystem;
  private readonly dirtyLoadouts = new Set<number>();
  private readonly publishedScores = new Map<number, ScoreboardEntry>();
  private abandoned = false;

  constructor(
    participants: readonly MatchParticipant[],
    mapId: MapId,
    seed: number,
    settings: MatchSettings = DEFAULT_MATCH_SETTINGS,
    level?: LevelDefinition,
  ) {
    this.mapId = mapId;
    this.settings = { ...settings };
    this.level = level ?? GRAVEYARD_LEVEL;
    const events = new MatchEventBus();
    const map =
      level === undefined ? tileMapOf(mapId) : parseTileMap({ id: mapId, rows: level.rows });
    const waveRules = level === undefined ? undefined : level.waves;
    this.world = new MatchWorld(map, new SeededRandom(seed), events);
    this.outbox = new EventOutbox(events);
    this.stats = new MatchStatsTracker(participants, events);

    const economy = new EconomyService(events);
    const lifecycle = new PlayerLifecycle(events);
    const pickupSpawner = new PickupSpawner(this.world);
    const enemyDamage = new EnemyDamageService(this.world, economy, pickupSpawner);
    this.merchants = new MerchantService(this.world);
    this.shop = new ShopService(events, economy, lifecycle, this.merchants);
    this.wreckage = new WreckageService(this.world);
    const friendlyFire = this.settings.friendlyFire;
    this.traps = new TrapService(
      this.world,
      economy,
      new ExplosionService(this.world, enemyDamage, lifecycle, this.wreckage, friendlyFire),
      enemyDamage,
      lifecycle,
    );
    this.traps.armEverySpot();
    const targets = new CombatTargets(this.world, this.merchants, this.traps, this.wreckage);
    const hits = new HitApplier(
      enemyDamage,
      lifecycle,
      this.merchants,
      this.wreckage,
      this.traps,
      friendlyFire,
    );
    this.director = new WaveDirector(
      this.world,
      lifecycle,
      new EnemySpawner(this.world, new EnemyFactory(this.world, waveRules), waveRules),
      this.settings.totalWaves,
      waveRules,
      waveRules === undefined ? undefined : waveRules.enemies,
    );
    this.bots = new BotControlSystem(
      this.world,
      this.shop,
      this.director,
      this.merchants,
      this.traps,
    );
    this.control = new PlayerControlSystem(this.world);
    this.weapons = new WeaponSystem(
      this.world,
      new HitscanResolver(this.history),
      targets,
      hits,
      friendlyFire,
    );
    this.melee = new MeleeSystem(
      this.world,
      new MeleeResolver(this.history, this.world.map),
      targets,
      hits,
      friendlyFire,
    );
    this.enemyBrains = new EnemyBrainSystem(this.world, lifecycle, this.merchants);
    this.vitals = new PlayerVitalsSystem(this.world, lifecycle);
    this.pickups = new PickupSystem(this.world, economy, lifecycle);
    this.pumpkins = new PumpkinPatchSystem(this.world, pickupSpawner);
    this.absentees = new AbsentPlayerSystem(this.world);

    this.spawnParticipants(participants);
    for (const entry of this.scoreboard()) {
      this.publishedScores.set(entry.playerId, entry);
    }
  }

  get tick(): number {
    return this.world.tick;
  }

  loadoutOf(playerId: number): LoadoutChange | undefined {
    const player = this.world.players.get(playerId);
    return player === undefined ? undefined : { playerId, loadout: player.arsenal.loadout };
  }

  scoreboard(): ScoreboardEntry[] {
    return [...this.world.players.keys()].flatMap((playerId) => {
      const stats = this.stats.statsOf(playerId);
      if (stats === undefined) {
        return [];
      }
      return [
        {
          playerId,
          score: matchScore(stats),
          kills: Math.min(stats.kills, 0xffff),
          deaths: Math.min(stats.deaths, 0xffff),
          revives: Math.min(stats.revives, 0xffff),
        },
      ];
    });
  }

  enqueueInput(playerId: number, input: PlayerInputMessage): void {
    this.withPlayer(playerId, (player) => {
      player.enqueueInput(input);
    });
  }

  switchWeapon(playerId: number, weapon: WeaponId): void {
    this.withPlayer(playerId, (player) => {
      player.arsenal.switchTo(weapon);
    });
  }

  setConnected(playerId: number, connected: boolean): void {
    this.withPlayer(playerId, (player) => {
      player.setConnected(connected);
    });
  }

  hasPlayer(playerId: number): boolean {
    return this.world.players.has(playerId);
  }

  setPaused(playerId: number, paused: boolean): void {
    const player = this.world.players.get(playerId);
    if (player !== undefined) {
      player.paused = paused;
    }
  }

  reportPing(playerId: number, pingMilliseconds: number): void {
    this.withPlayer(playerId, (player) => {
      player.pingMilliseconds = pingMilliseconds;
    });
  }

  voteSkipIntermission(playerId: number): void {
    this.director.voteSkip(playerId);
  }

  purchase(playerId: number, offer: ShopOffer): PurchaseRejection | null {
    const player = this.world.players.get(playerId);
    if (player === undefined) {
      return null;
    }
    const rejection = this.shop.purchase(player, offer);
    if (rejection === null) {
      this.dirtyLoadouts.add(playerId);
    }
    return rejection;
  }

  armTrap(playerId: number, cell: number): PurchaseRejection | null {
    const player = this.world.players.get(playerId);
    return player === undefined ? null : this.traps.arm(player, cell);
  }

  removePlayer(playerId: number): void {
    this.world.players.delete(playerId);
    this.publishedScores.delete(playerId);
    if (![...this.world.players.values()].some((player) => !player.isBot)) {
      this.abandoned = true;
    }
  }

  step(): MatchStepResult {
    this.world.tick += 1;
    this.bots.update();
    this.control.update();
    this.weapons.update();
    this.melee.update();
    this.enemyBrains.update();
    this.merchants.update();
    this.traps.update();
    this.vitals.update();
    this.pickups.update();
    this.pumpkins.update();
    this.director.update();
    this.history.record(this.world.tick, [
      this.world.enemies.values(),
      this.world.players.values(),
      this.world.merchant === null ? [] : [this.world.merchant],
    ]);
    const droppedPlayerIds = this.absentees.collectExpired();
    droppedPlayerIds.forEach((playerId) => {
      this.removePlayer(playerId);
    });

    this.wreckage.update();
    const snapshot = buildSnapshot(
      this.world,
      this.director,
      {
        obstacles: this.wreckage.damaged,
        traps: this.traps.armedTraps,
        spentTraps: this.traps.spentSpots,
      },
      this.outbox.drain(),
    );
    return {
      snapshot,
      loadoutChanges: this.drainLoadoutChanges(),
      scoreboardChanges: this.drainScoreboardChanges(),
      droppedPlayerIds,
      summary: this.summaryIfFinished(),
    };
  }

  dispose(): void {
    this.merchants.dispose();
    this.wreckage.dispose();
    this.traps.dispose();
    this.outbox.dispose();
    this.stats.dispose();
    this.world.events.clear();
  }

  private withPlayer(playerId: number, action: (player: PlayerEntity) => void): void {
    const player = this.world.players.get(playerId);
    if (player !== undefined) {
      action(player);
    }
  }

  private spawnParticipants(participants: readonly MatchParticipant[]): void {
    participants.forEach((participant, index) => {
      const position = this.world.map.playerSpawnPoint(index);
      const player = new PlayerEntity(
        participant.id,
        participant.nickname,
        HEROES[participant.hero],
        participant.isBot,
        position,
      );
      this.world.players.set(player.id, player);
    });
  }

  private drainScoreboardChanges(): ScoreboardEntry[] {
    const changes: ScoreboardEntry[] = [];
    for (const entry of this.scoreboard()) {
      const previous = this.publishedScores.get(entry.playerId);
      if (
        previous === undefined ||
        previous.score !== entry.score ||
        previous.kills !== entry.kills ||
        previous.deaths !== entry.deaths ||
        previous.revives !== entry.revives
      ) {
        changes.push(entry);
        this.publishedScores.set(entry.playerId, entry);
      }
    }
    return changes;
  }

  private drainLoadoutChanges(): LoadoutChange[] {
    const changes = [...this.dirtyLoadouts].flatMap((playerId) => this.loadoutOf(playerId) ?? []);
    this.dirtyLoadouts.clear();
    return changes;
  }

  private summaryIfFinished(): MatchSummary | null {
    if (!this.abandoned && !this.director.isOver) {
      return null;
    }
    return {
      outcome: this.resolveOutcome(),
      wave: this.director.wave,
      durationTicks: this.world.tick,
      stats: this.stats.snapshot(),
    };
  }

  private resolveOutcome(): MatchOutcome {
    if (this.abandoned) {
      return MatchOutcome.Abandoned;
    }
    return this.director.phase === MatchPhase.Victory ? MatchOutcome.Victory : MatchOutcome.Defeat;
  }
}
