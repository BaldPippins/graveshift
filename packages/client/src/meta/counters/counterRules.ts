import {
  EnemyKind,
  isMeleeWeapon,
  MELEE_WEAPON_IDS,
  PickupEffect,
  PICKUPS,
  RANGED_WEAPON_IDS,
} from '@graveshift/shared/config';
import { isUpgradeMaxed } from '@graveshift/shared/rules';
import { MatchOutcome } from '@graveshift/shared/model';
import { GameEventType } from '@graveshift/shared/protocol';
import { ClientEventType } from '../../game/events/ClientEvent.ts';
import { CounterId } from './CounterId.ts';
import { ArsenalRule } from './rules/ArsenalRule.ts';
import type { CounterRule } from './rules/CounterRule.ts';
import { EventCounterRule } from './rules/EventCounterRule.ts';
import { CounterOperation } from './rules/CounterOperation.ts';
import { FlawlessWaveRule } from './rules/FlawlessWaveRule.ts';
import { MultiKillRule } from './rules/MultiKillRule.ts';
import { PlayTimeRule } from './rules/PlayTimeRule.ts';

export const MULTIKILL_WINDOW_MILLISECONDS = 2000;

export const KILL_COUNTERS: Readonly<Record<EnemyKind, CounterId>> = {
  [EnemyKind.Zombie]: CounterId.KillsZombie,
  [EnemyKind.Skeleton]: CounterId.KillsSkeleton,
  [EnemyKind.Ghost]: CounterId.KillsGhost,
  [EnemyKind.Brute]: CounterId.KillsBrute,
  [EnemyKind.Vampire]: CounterId.KillsVampire,
};

function one(condition: boolean): number {
  return condition ? 1 : 0;
}

export function createCounterRules(): CounterRule[] {
  return [
    new EventCounterRule(GameEventType.EnemyKilled, CounterId.Kills, (event, local) =>
      one(local.isLocal(event.killerId)),
    ),
    ...Object.values(EnemyKind).map(
      (kind) =>
        new EventCounterRule(GameEventType.EnemyKilled, KILL_COUNTERS[kind], (event, local) =>
          one(event.kind === kind && local.isLocal(event.killerId)),
        ),
    ),
    new EventCounterRule(GameEventType.EnemyKilled, CounterId.MeleeKills, (event, local) =>
      one(isMeleeWeapon(event.weapon) && local.isLocal(event.killerId)),
    ),
    new EventCounterRule(GameEventType.FuryUnleashed, CounterId.Furies, (event, local) =>
      one(local.isLocal(event.playerId)),
    ),
    new EventCounterRule(
      GameEventType.MerchantReturned,
      CounterId.MerchantRevives,
      (event, local) => one(event.reviverId !== null && local.isLocal(event.reviverId)),
    ),
    new EventCounterRule(GameEventType.PlayerRevived, CounterId.Revives, (event, local) =>
      one(event.reviverId !== event.playerId && local.isLocal(event.reviverId)),
    ),
    new EventCounterRule(GameEventType.PlayerDowned, CounterId.Downs, (event, local) =>
      one(local.isLocal(event.playerId)),
    ),
    new EventCounterRule(GameEventType.WaveCleared, CounterId.WavesCleared, () => 1),
    new EventCounterRule(GameEventType.CoinsEarned, CounterId.CoinsEarned, (event, local) =>
      local.isLocal(event.playerId) ? event.amount : 0,
    ),
    new EventCounterRule(GameEventType.CoinsSpent, CounterId.CoinsSpent, (event, local) =>
      local.isLocal(event.playerId) ? event.amount : 0,
    ),
    new EventCounterRule(GameEventType.WeaponUpgraded, CounterId.MaxedUpgrades, (event, local) =>
      one(local.isLocal(event.playerId) && isUpgradeMaxed(event.stat, event.level)),
    ),
    new EventCounterRule(GameEventType.PickupCollected, CounterId.HealsCollected, (event, local) =>
      one(PICKUPS[event.kind].effect === PickupEffect.Heal && local.isLocal(event.playerId)),
    ),
    new EventCounterRule(ClientEventType.MatchStarted, CounterId.MatchesPlayed, () => 1),
    new EventCounterRule(ClientEventType.MatchFinished, CounterId.Wins, (event) =>
      one(event.outcome === MatchOutcome.Victory),
    ),
    new EventCounterRule(
      GameEventType.WaveCleared,
      CounterId.BestWave,
      (event) => event.wave,
      CounterOperation.Raise,
    ),
    new EventCounterRule(GameEventType.ShotFired, CounterId.ShotsFired, (event, local) =>
      one(local.isLocal(event.shooterId)),
    ),
    new EventCounterRule(GameEventType.ShotFired, CounterId.ShotsHit, (event, local) =>
      one(event.hit && local.isLocal(event.shooterId)),
    ),
    new EventCounterRule(GameEventType.EnemyDamaged, CounterId.DamageDealt, (event, local) =>
      local.isLocal(event.attackerId) ? event.amount : 0,
    ),
    new PlayTimeRule(),
    new MultiKillRule(MULTIKILL_WINDOW_MILLISECONDS),
    new FlawlessWaveRule(),
    new ArsenalRule(RANGED_WEAPON_IDS, CounterId.ArsenalComplete),
    new ArsenalRule(MELEE_WEAPON_IDS, CounterId.MeleeArsenalComplete),
  ];
}
