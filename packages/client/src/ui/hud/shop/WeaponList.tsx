import type { JSX } from 'preact';
import { UPGRADE_STATS } from '@graveshift/shared/config';
import type { HeroId, WeaponId } from '@graveshift/shared/config';
import {
  isUpgradeMaxed,
  ownsWeapon,
  quotePurchase,
  ShopOfferKind,
  upgradeLevelOf,
} from '@graveshift/shared/rules';
import type { PurchaseContext } from '@graveshift/shared/rules';
import { WEAPON_CONTENT } from '../../../content/weaponContent.ts';
import { useMessages } from '../../useMessages.ts';
import { weaponLabel } from './weaponStatsView.ts';

export interface WeaponListProps {
  readonly weapons: readonly WeaponId[];
  readonly selected: WeaponId;
  readonly inHand: WeaponId;
  readonly hero: HeroId;
  readonly context: PurchaseContext;
  readonly onSelect: (weapon: WeaponId) => void;
}

interface WeaponListItemProps {
  readonly weapon: WeaponId;
  readonly selected: boolean;
  readonly inHand: boolean;
  readonly hero: HeroId;
  readonly context: PurchaseContext;
  readonly onSelect: (weapon: WeaponId) => void;
}

function hexColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

interface PriceTagProps {
  readonly price: number;
  readonly coins: number;
  readonly prefix: string;
}

function cheapestUpgradePrice(weapon: WeaponId, context: PurchaseContext): number | null {
  let cheapest: number | null = null;
  for (const stat of UPGRADE_STATS) {
    if (isUpgradeMaxed(stat, upgradeLevelOf(context.loadout, weapon, stat))) {
      continue;
    }
    const price = quotePurchase({ kind: ShopOfferKind.UpgradeWeapon, weapon, stat }, context).price;
    cheapest = cheapest === null ? price : Math.min(cheapest, price);
  }
  return cheapest;
}

function unlockPrice(weapon: WeaponId, context: PurchaseContext): number {
  return quotePurchase({ kind: ShopOfferKind.UnlockWeapon, weapon }, context).price;
}

function PriceTag(props: PriceTagProps): JSX.Element {
  const short = props.price > props.coins;
  return (
    <span class={short ? 'shop-item__price is-short' : 'shop-item__price'}>
      {props.prefix}💰{props.price}
    </span>
  );
}

function OwnedStatus(props: WeaponListItemProps): JSX.Element {
  const text = useMessages().shop;
  const upgrade = cheapestUpgradePrice(props.weapon, props.context);
  return (
    <span class="shop-item__status">
      {props.inHand ? (
        <span class="badge badge--gold">{text.equipped}</span>
      ) : (
        <span class="shop-item__owned">✓ {text.owned}</span>
      )}
      {upgrade === null ? null : (
        <PriceTag price={upgrade} coins={props.context.coins} prefix="⬆" />
      )}
    </span>
  );
}

function WeaponStatus(props: WeaponListItemProps): JSX.Element {
  if (props.inHand || ownsWeapon(props.context.loadout, props.weapon)) {
    return <OwnedStatus {...props} />;
  }
  return (
    <PriceTag
      price={unlockPrice(props.weapon, props.context)}
      coins={props.context.coins}
      prefix=""
    />
  );
}

function itemClass(props: WeaponListItemProps): string {
  const owned = props.inHand || ownsWeapon(props.context.loadout, props.weapon);
  const locked = !owned && unlockPrice(props.weapon, props.context) > props.context.coins;
  const classes = ['shop-item'];
  if (props.selected) {
    classes.push('is-selected');
  }
  if (locked) {
    classes.push('is-short');
  }
  return classes.join(' ');
}

function WeaponListItem(props: WeaponListItemProps): JSX.Element {
  const messages = useMessages();
  const levels = props.context.loadout.upgrades[props.weapon];
  const label = weaponLabel(props.weapon, levels, props.hero, messages);
  return (
    <button
      type="button"
      class={itemClass(props)}
      aria-pressed={props.selected}
      style={{ '--weapon-color': hexColor(WEAPON_CONTENT[props.weapon].color) }}
      onClick={() => {
        props.onSelect(props.weapon);
      }}
    >
      <span class="shop-item__name">{label.name}</span>
      <WeaponStatus {...props} />
    </button>
  );
}

export function WeaponList(props: WeaponListProps): JSX.Element {
  return (
    <div class="shop__list" role="listbox">
      {props.weapons.map((weapon) => (
        <WeaponListItem
          key={weapon}
          weapon={weapon}
          selected={weapon === props.selected}
          inHand={weapon === props.inHand}
          hero={props.hero}
          context={props.context}
          onSelect={props.onSelect}
        />
      ))}
    </div>
  );
}
