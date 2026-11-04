import type { JSX } from 'preact';
import type { HeroId, WeaponId } from '@graveshift/shared/config';
import { ownsWeapon, quotePurchase, ShopOfferKind } from '@graveshift/shared/rules';
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

function WeaponStatus(props: WeaponListItemProps): JSX.Element {
  const text = useMessages().shop;
  if (props.inHand) {
    return <span class="badge badge--gold">{text.equipped}</span>;
  }
  if (ownsWeapon(props.context.loadout, props.weapon)) {
    return <span class="shop-item__owned">✓ {text.owned}</span>;
  }
  const quote = quotePurchase(
    { kind: ShopOfferKind.UnlockWeapon, weapon: props.weapon },
    props.context,
  );
  const affordable = quote.price <= props.context.coins;
  return (
    <span class={affordable ? 'shop-item__price' : 'shop-item__price is-short'}>
      💰{quote.price}
    </span>
  );
}

function WeaponListItem(props: WeaponListItemProps): JSX.Element {
  const messages = useMessages();
  const levels = props.context.loadout.upgrades[props.weapon];
  const label = weaponLabel(props.weapon, levels, props.hero, messages);
  return (
    <button
      type="button"
      class={props.selected ? 'shop-item is-selected' : 'shop-item'}
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
