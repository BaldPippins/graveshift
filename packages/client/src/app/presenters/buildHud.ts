import {
  HEROES,
  isRangedWeapon,
  RANGED_WEAPONS,
  SIMULATION,
  STARTING_RANGED_WEAPON,
} from '@graveshift/shared/config';
import type { RangedWeaponId } from '@graveshift/shared/config';
import { fractionOf, hasFlag } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { PlayerFlag } from '@graveshift/shared/model';
import type { LoadoutState } from '@graveshift/shared/model';
import type { PlayerSnapshot, SnapshotMessage } from '@graveshift/shared/protocol';
import { isMerchantPresent, merchantAccessFor, resolveWeaponStats } from '@graveshift/shared/rules';
import type { HudState, TeammateHud } from '../state/HudState.ts';
import { playerStatusIcon } from '../../content/playerStatusContent.ts';

function magazineSizeOf(player: PlayerSnapshot, loadout: LoadoutState | null): number {
  const weapon = RANGED_WEAPONS[player.weapon];
  if (loadout === null) {
    return weapon.stats.magazineSize;
  }
  return resolveWeaponStats(weapon, loadout.upgrades[player.weapon], HEROES[player.hero].modifiers)
    .magazineSize;
}

function ownedGuns(loadout: LoadoutState | null): readonly RangedWeaponId[] {
  return loadout === null ? [STARTING_RANGED_WEAPON] : loadout.ownedWeapons.filter(isRangedWeapon);
}

function reportedPing(player: PlayerSnapshot): number | null {
  const online = !hasFlag(player.flags, PlayerFlag.Disconnected);
  return online && player.pingMilliseconds > 0 ? player.pingMilliseconds : null;
}

function teammateOf(
  player: PlayerSnapshot,
  localPlayerId: number,
  nicknames: ReadonlyMap<number, string>,
): TeammateHud {
  return {
    id: player.id,
    nickname: nicknames.get(player.id) ?? `#${player.id}`,
    hero: player.hero,
    healthFraction: fractionOf(player.health, player.maxHealth),
    life: player.life,
    statusIcon: playerStatusIcon(player.life, player.flags),
    isLocal: player.id === localPlayerId,
    coins: player.coins,
    pingMilliseconds: reportedPing(player),
  };
}

export function buildHud(
  snapshot: SnapshotMessage,
  localPlayerId: number,
  nicknames: ReadonlyMap<number, string>,
  loadout: LoadoutState | null,
  merchant: ReadonlyVec2 | null,
): HudState | null {
  const local = snapshot.players.find((player) => player.id === localPlayerId);
  if (local === undefined) {
    return null;
  }
  return {
    health: local.health,
    maxHealth: local.maxHealth,
    healthFraction: fractionOf(local.health, local.maxHealth),
    ownedWeapons: ownedGuns(loadout),
    ammo: local.ammo,
    magazineSize: magazineSizeOf(local, loadout),
    weapon: local.weapon,
    melee: local.melee,
    meleeCharge: local.meleeCharge,
    furyProgress: local.furyProgress,
    reloading: hasFlag(local.flags, PlayerFlag.Reloading),
    coins: local.coins,
    wave: snapshot.wave,
    phase: snapshot.phase,
    phaseSecondsLeft: Math.ceil(snapshot.phaseTicksLeft / SIMULATION.tickRate),
    enemiesRemaining: snapshot.enemiesRemaining,
    life: local.life,
    bleedoutProgress: local.bleedoutProgress,
    reviveProgress: local.reviveProgress,
    merchantAccess: merchantAccessFor(local, merchant, isMerchantPresent(snapshot.merchant)),
    merchantWavesAway: snapshot.merchant === null ? 0 : snapshot.merchant.wavesUntilReturn,
    teammates: snapshot.players.map((player) => teammateOf(player, localPlayerId, nicknames)),
  };
}
