import type { JSX } from 'preact';
import { UPGRADE_STATS } from '@graveshift/shared/config';
import type { HeroId, WeaponId } from '@graveshift/shared/config';
import { ownsWeapon, ShopOfferKind } from '@graveshift/shared/rules';
import type { PurchaseContext } from '@graveshift/shared/rules';
import { Button } from '../../components/Button.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';
import { OfferButton } from './OfferButton.tsx';
import { UpgradeRow } from './UpgradeRow.tsx';
import { weaponChips, weaponLabel } from './weaponStatsView.ts';

export interface WeaponDetailProps {
  readonly weapon: WeaponId;
  readonly inHand: boolean;
  readonly hero: HeroId;
  readonly context: PurchaseContext;
}

function OwnershipAction(props: WeaponDetailProps): JSX.Element {
  const { commands } = useServices();
  const text = useMessages().shop;
  if (!ownsWeapon(props.context.loadout, props.weapon)) {
    return (
      <OfferButton
        offer={{ kind: ShopOfferKind.UnlockWeapon, weapon: props.weapon }}
        context={props.context}
        label={text.buy}
      />
    );
  }
  if (props.inHand) {
    return <span class="badge badge--gold">{text.equipped}</span>;
  }
  return (
    <Button
      variant="secondary"
      onClick={() => {
        commands.selectWeapon(props.weapon);
      }}
    >
      {text.equip}
    </Button>
  );
}

export function WeaponDetail(props: WeaponDetailProps): JSX.Element {
  const messages = useMessages();
  const text = messages.shop;
  const levels = props.context.loadout.upgrades[props.weapon];
  const label = weaponLabel(props.weapon, levels, props.hero, messages);
  const owned = ownsWeapon(props.context.loadout, props.weapon);
  return (
    <section class="shop__detail">
      <header class="weapon-detail__head">
        <div>
          <h2 class="weapon-detail__name">{label.name}</h2>
          <p class="weapon-detail__description">{label.description}</p>
        </div>
        <OwnershipAction {...props} />
      </header>
      <div class="stat-chips">
        {weaponChips(props.weapon, levels, props.hero, text).map((chip) => (
          <span key={chip.label} class="stat-chip">
            <b>{chip.value}</b>
            <small>{chip.label}</small>
          </span>
        ))}
      </div>
      <h3 class="weapon-detail__subtitle">{text.upgradesTitle}</h3>
      {owned ? (
        <div class="upgrade-list">
          {UPGRADE_STATS.map((stat) => (
            <UpgradeRow
              key={stat}
              weapon={props.weapon}
              stat={stat}
              hero={props.hero}
              context={props.context}
            />
          ))}
        </div>
      ) : (
        <p class="weapon-detail__locked">🔒 {text.upgradesLocked}</p>
      )}
    </section>
  );
}
