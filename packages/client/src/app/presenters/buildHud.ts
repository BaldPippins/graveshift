import { HEROES, SIMULATION, STARTING_WEAPON, WEAPONS } from '@graveshift/shared/config';
import { fractionOf, hasBit } from '@graveshift/shared/core';
import type { ReadonlyVec2 } from '@graveshift/shared/core';
import { PlayerFlag } from '@graveshift/shared/model';
import type { LoadoutState } from '@graveshift/shared/model';
import type { PlayerSnapshot, SnapshotMessage } from '@graveshift/shared/protocol';
import { isMerchantPresent, merchantAccessFor, resolveWeaponStats } from '@graveshift/shared/rules';
import type { HudState, TeammateHud } from '../state/HudState.ts';
import { playerStatusIcon } from '../../content/playerStatusContent.ts';

function magazineSizeOf(player: PlayerSnapshot, loadout: LoadoutState | null): number {
  const weapon = WEAPONS[player.weapon];
  if (loadout === null) {
    return weapon.stats.magazineSize;
  }
  return resolveWeaponStats(weapon, loadout.upgrades[player.weapon], HEROES[player.hero].modifiers)
    .magazineSize;
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
    ownedWeapons: loadout === null ? [STARTING_WEAPON] : loadout.ownedWeapons,
    ammo: local.ammo,
    magazineSize: magazineSizeOf(local, loadout),
    weapon: local.weapon,
    reloading: hasBit(local.flags, PlayerFlag.Reloading),
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
