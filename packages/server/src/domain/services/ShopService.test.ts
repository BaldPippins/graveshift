import { describe, expect, it } from 'vitest';
import { HEROES, HeroId, MERCHANT_RULES, UpgradeStat, WeaponId } from '@graveshift/shared/config';
import { SeededRandom } from '@graveshift/shared/core';
import { GameEventType } from '@graveshift/shared/protocol';
import type { GameEvent } from '@graveshift/shared/protocol';
import { PurchaseRejection, ShopOfferKind } from '@graveshift/shared/rules';
import { MAP_DEFINITIONS, MapId, parseTileMap } from '@graveshift/shared/world';
import { PlayerEntity } from '../entities/PlayerEntity.ts';
import { MatchEventBus } from '../match/MatchEventBus.ts';
import { MatchWorld } from '../match/MatchWorld.ts';
import { EconomyService } from './EconomyService.ts';
import { MerchantService } from './MerchantService.ts';
import { PlayerLifecycle } from './PlayerLifecycle.ts';
import { ShopService } from './ShopService.ts';

const REVIVE = { kind: ShopOfferKind.ReviveMerchant } as const;

describe('ShopService', () => {
  it('rejects direct forbidden weapon requests and permits the first allowed gun', () => {
    const events = new MatchEventBus();
    const world = new MatchWorld(
      parseTileMap(MAP_DEFINITIONS[MapId.Graveyard]),
      new SeededRandom(3),
      events,
    );
    const merchant = world.merchant;
    if (merchant === null) {
      throw new Error('Graveyard must have a merchant');
    }
    const merchants = new MerchantService(world);
    const shop = new ShopService(
      events,
      new EconomyService(events),
      new PlayerLifecycle(events),
      merchants,
    );
    const player = new PlayerEntity(
      4,
      'Tester',
      HEROES[HeroId.Agatha],
      false,
      { x: merchant.position.x - 1, y: merchant.position.y },
      [WeaponId.Shovel],
      [WeaponId.Shovel, WeaponId.Rifle],
    );
    player.coins = 2000;
    expect(
      shop.purchase(player, { kind: ShopOfferKind.UnlockWeapon, weapon: WeaponId.Pistol }),
    ).toBe(PurchaseRejection.WeaponForbidden);
    expect(
      shop.purchase(player, {
        kind: ShopOfferKind.UpgradeWeapon,
        weapon: WeaponId.Pistol,
        stat: UpgradeStat.Damage,
      }),
    ).toBe(PurchaseRejection.WeaponForbidden);
    expect(player.arsenal.current).toBeNull();
    expect(
      shop.purchase(player, { kind: ShopOfferKind.UnlockWeapon, weapon: WeaponId.Rifle }),
    ).toBeNull();
    expect(player.arsenal.current).toBe(WeaponId.Rifle);
    expect(player.arsenal.switchTo(WeaponId.Pistol)).toBe(false);
  });
  it('lets a player pay at the grave to bring the merchant back at once', () => {
    const events = new MatchEventBus();
    const emitted: GameEvent[] = [];
    events.onAny((event) => {
      emitted.push(event);
    });
    const world = new MatchWorld(
      parseTileMap(MAP_DEFINITIONS[MapId.Graveyard]),
      new SeededRandom(3),
      events,
    );
    const merchant = world.merchant;
    if (merchant === null) {
      throw new Error('Graveyard must have a merchant');
    }
    const merchants = new MerchantService(world);
    const shop = new ShopService(
      events,
      new EconomyService(events),
      new PlayerLifecycle(events),
      merchants,
    );
    const player = new PlayerEntity(4, 'Tester', HEROES[HeroId.Agatha], false, {
      x: merchant.position.x - 1,
      y: merchant.position.y,
    });
    player.coins = MERCHANT_RULES.revivePrice + 40;

    expect(shop.purchase(player, REVIVE)).toBe(PurchaseRejection.MerchantAlive);
    merchants.damage(MERCHANT_RULES.maxHealth, 9);
    expect(shop.purchase(player, { kind: ShopOfferKind.Heal })).toBe(
      PurchaseRejection.MerchantGone,
    );
    expect(shop.purchase(player, REVIVE)).toBeNull();

    expect(merchant.isAlive).toBe(true);
    expect(merchant.wavesUntilReturn).toBe(0);
    expect(player.coins).toBe(40);
    expect(emitted).toContainEqual({ type: GameEventType.MerchantReturned, reviverId: 4 });
  });
});
