import { ENEMY_KINDS } from '../../config/enemies.ts';
import { HERO_IDS } from '../../config/heroes.ts';
import { PICKUP_KINDS } from '../../config/pickups.ts';
import { ROOM_RULES } from '../../config/simulation.ts';
import { UPGRADE_STATS } from '../../config/upgrades.ts';
import type { UpgradeLevels, UpgradeStat } from '../../config/upgrades.ts';
import { MELEE_WEAPON_IDS, RANGED_WEAPON_IDS, WEAPON_IDS } from '../../config/weapons.ts';
import type { WeaponId } from '../../config/weapons.ts';
import { assertNever } from '../../core/assertNever.ts';
import { ENEMY_ACTIONS } from '../../model/EnemyAction.ts';
import { LIFE_STATES } from '../../model/LifeState.ts';
import type { LoadoutState } from '../../model/LoadoutState.ts';
import type { PlayerMatchStats } from '../../model/PlayerMatchStats.ts';
import { SHOP_OFFER_KINDS, ShopOfferKind } from '../../rules/ShopOffer.ts';
import type { ShopOffer } from '../../rules/ShopOffer.ts';
import type {
  EnemySnapshot,
  MerchantSnapshot,
  PickupSnapshot,
  PlayerSnapshot,
} from '../EntitySnapshots.ts';
import type { PayloadCodec } from '../PayloadCodec.ts';
import {
  dequantizeAngle,
  dequantizeRatio,
  quantizeAngle,
  quantizeMilliseconds,
  quantizeRatio,
} from '../quantization.ts';
import type { RoomMemberInfo } from '../ServerMessage.ts';

export const shopOfferCodec: PayloadCodec<ShopOffer> = {
  write(writer, offer) {
    writer.u8(offer.kind);
    switch (offer.kind) {
      case ShopOfferKind.UnlockWeapon:
        writer.u8(offer.weapon);
        return;
      case ShopOfferKind.UpgradeWeapon:
        writer.u8(offer.weapon).u8(offer.stat);
        return;
      case ShopOfferKind.Heal:
      case ShopOfferKind.ReviveMerchant:
        return;
      default:
        assertNever(offer);
    }
  },
  read(reader) {
    const kind = reader.oneOf(SHOP_OFFER_KINDS);
    switch (kind) {
      case ShopOfferKind.UnlockWeapon:
        return { kind, weapon: reader.oneOf(WEAPON_IDS) };
      case ShopOfferKind.UpgradeWeapon:
        return { kind, weapon: reader.oneOf(WEAPON_IDS), stat: reader.oneOf(UPGRADE_STATS) };
      case ShopOfferKind.Heal:
      case ShopOfferKind.ReviveMerchant:
        return { kind };
      default:
        return assertNever(kind);
    }
  },
};

export const loadoutCodec: PayloadCodec<LoadoutState> = {
  write(writer, loadout) {
    writer.list(loadout.ownedWeapons, (w, weapon) => w.u8(weapon));
    for (const weapon of WEAPON_IDS) {
      for (const stat of UPGRADE_STATS) {
        writer.u8(loadout.upgrades[weapon][stat]);
      }
    }
  },
  read(reader) {
    const ownedWeapons = reader.list((r) => r.oneOf(WEAPON_IDS), WEAPON_IDS.length);
    const entries = WEAPON_IDS.map((weapon): [WeaponId, UpgradeLevels] => [
      weapon,
      Object.fromEntries(UPGRADE_STATS.map((stat) => [stat, reader.u8()])) as Record<
        UpgradeStat,
        number
      >,
    ]);
    return {
      ownedWeapons,
      upgrades: Object.fromEntries(entries) as Record<WeaponId, UpgradeLevels>,
    };
  },
};

export const playerStatsCodec: PayloadCodec<PlayerMatchStats> = {
  write(writer, stats) {
    writer
      .u16(stats.playerId)
      .string(stats.nickname)
      .u8(stats.hero)
      .u16(stats.kills)
      .u16(stats.bossKills)
      .u32(Math.round(stats.damageDealt))
      .u32(Math.round(stats.damageTaken))
      .u32(stats.shotsFired)
      .u32(stats.shotsHit)
      .u16(stats.revives)
      .u16(stats.downs)
      .u16(stats.deaths)
      .u32(stats.coinsEarned);
  },
  read(reader) {
    return {
      playerId: reader.u16(),
      nickname: reader.string(),
      hero: reader.oneOf(HERO_IDS),
      kills: reader.u16(),
      bossKills: reader.u16(),
      damageDealt: reader.u32(),
      damageTaken: reader.u32(),
      shotsFired: reader.u32(),
      shotsHit: reader.u32(),
      revives: reader.u16(),
      downs: reader.u16(),
      deaths: reader.u16(),
      coinsEarned: reader.u32(),
    };
  },
};

export const roomMemberCodec: PayloadCodec<RoomMemberInfo> = {
  write(writer, member) {
    writer
      .u16(member.clientId)
      .string(member.nickname)
      .u8(member.hero)
      .bool(member.ready)
      .bool(member.isBot);
  },
  read(reader) {
    return {
      clientId: reader.u16(),
      nickname: reader.string(),
      hero: reader.oneOf(HERO_IDS),
      ready: reader.bool(),
      isBot: reader.bool(),
    };
  },
};

export const playerSnapshotCodec: PayloadCodec<PlayerSnapshot> = {
  write(writer, player) {
    writer
      .u16(player.id)
      .u8(player.hero)
      .f32(player.x)
      .f32(player.y)
      .f32(player.height)
      .f32(player.verticalSpeed)
      .u16(quantizeAngle(player.aim))
      .u16(Math.ceil(player.health))
      .u16(player.maxHealth)
      .u8(player.life)
      .u8(player.weapon)
      .u8(player.ammo)
      .u8(player.melee)
      .u8(player.meleeCharge)
      .u8(quantizeRatio(player.furyProgress))
      .u8(player.flags)
      .u8(quantizeRatio(player.reviveProgress))
      .u8(quantizeRatio(player.bleedoutProgress))
      .u32(player.coins)
      .u16(quantizeMilliseconds(player.pingMilliseconds))
      .u32(player.lastInputSequence);
  },
  read(reader) {
    return {
      id: reader.u16(),
      hero: reader.oneOf(HERO_IDS),
      x: reader.f32(),
      y: reader.f32(),
      height: reader.f32(),
      verticalSpeed: reader.f32(),
      aim: dequantizeAngle(reader.u16()),
      health: reader.u16(),
      maxHealth: reader.u16(),
      life: reader.oneOf(LIFE_STATES),
      weapon: reader.oneOf(RANGED_WEAPON_IDS),
      ammo: reader.u8(),
      melee: reader.oneOf(MELEE_WEAPON_IDS),
      meleeCharge: reader.u8(),
      furyProgress: dequantizeRatio(reader.u8()),
      flags: reader.u8(),
      reviveProgress: dequantizeRatio(reader.u8()),
      bleedoutProgress: dequantizeRatio(reader.u8()),
      coins: reader.u32(),
      pingMilliseconds: reader.u16(),
      lastInputSequence: reader.u32(),
    };
  },
};

export const enemySnapshotCodec: PayloadCodec<EnemySnapshot> = {
  write(writer, enemy) {
    writer
      .u16(enemy.id)
      .u8(enemy.kind)
      .f32(enemy.x)
      .f32(enemy.y)
      .u16(quantizeAngle(enemy.facing))
      .u8(quantizeRatio(enemy.healthFraction))
      .u8(enemy.action);
  },
  read(reader) {
    return {
      id: reader.u16(),
      kind: reader.oneOf(ENEMY_KINDS),
      x: reader.f32(),
      y: reader.f32(),
      facing: dequantizeAngle(reader.u16()),
      healthFraction: dequantizeRatio(reader.u8()),
      action: reader.oneOf(ENEMY_ACTIONS),
    };
  },
};

export const pickupSnapshotCodec: PayloadCodec<PickupSnapshot> = {
  write(writer, pickup) {
    writer.u16(pickup.id).u8(pickup.kind).f32(pickup.x).f32(pickup.y);
  },
  read(reader) {
    return {
      id: reader.u16(),
      kind: reader.oneOf(PICKUP_KINDS),
      x: reader.f32(),
      y: reader.f32(),
    };
  },
};

export const merchantSnapshotCodec: PayloadCodec<MerchantSnapshot> = {
  write(writer, merchant) {
    writer.u8(quantizeRatio(merchant.healthFraction)).u8(merchant.wavesUntilReturn);
  },
  read(reader) {
    return { healthFraction: dequantizeRatio(reader.u8()), wavesUntilReturn: reader.u8() };
  },
};

export const LIST_LIMITS = {
  players: ROOM_RULES.maxPlayers,
  enemies: 512,
  pickups: 512,
  events: 2048,
} as const;
