import type { JSX } from 'preact';
import { UPGRADES, WEAPONS } from '@graveshift/shared/config';
import type { HeroId, UpgradeStat, WeaponId } from '@graveshift/shared/config';
import { isUpgradeMaxed, ShopOfferKind, upgradeLevelOf } from '@graveshift/shared/rules';
import type { PurchaseContext } from '@graveshift/shared/rules';
import { UPGRADE_ICONS } from '../../../content/weaponContent.ts';
import { useMessages } from '../../useMessages.ts';
import { OfferButton } from './OfferButton.tsx';
import { upgradeStatValue } from './weaponStatsView.ts';

export interface UpgradeRowProps {
  readonly weapon: WeaponId;
  readonly stat: UpgradeStat;
  readonly hero: HeroId;
  readonly context: PurchaseContext;
}

export function UpgradeRow(props: UpgradeRowProps): JSX.Element {
  const messages = useMessages();
  const text = messages.shop;
  const weaponClass = WEAPONS[props.weapon].weaponClass;
  const levels = props.context.loadout.upgrades[props.weapon];
  const level = upgradeLevelOf(props.context.loadout, props.weapon, props.stat);
  const maxed = isUpgradeMaxed(props.stat, level);
  const current = upgradeStatValue(props.weapon, props.stat, levels, props.hero, text);
  const next = maxed
    ? current
    : upgradeStatValue(
        props.weapon,
        props.stat,
        { ...levels, [props.stat]: level + 1 },
        props.hero,
        text,
      );
  return (
    <div class="upgrade-row">
      <span class="upgrade-row__name">
        {UPGRADE_ICONS[weaponClass][props.stat]} {messages.upgrades[weaponClass][props.stat]}
      </span>
      <span class="pips">
        {Array.from({ length: UPGRADES[props.stat].maxLevel }, (_, pip) => (
          <i key={pip} class={pip < level ? 'pip is-on' : 'pip'} />
        ))}
      </span>
      <span class="upgrade-row__preview">
        {current}
        {maxed ? null : (
          <>
            {' → '}
            <b>{next}</b>
          </>
        )}
      </span>
      <span class="upgrade-row__action">
        {maxed ? (
          <span class="badge badge--gold">{text.max}</span>
        ) : (
          <OfferButton
            offer={{ kind: ShopOfferKind.UpgradeWeapon, weapon: props.weapon, stat: props.stat }}
            context={props.context}
            label={text.upgrade}
          />
        )}
      </span>
    </div>
  );
}
