import type { JSX } from 'preact';
import { SHOP_RULES, WeaponClass } from '@graveshift/shared/config';
import { MatchPhase } from '@graveshift/shared/model';
import { ShopOfferKind } from '@graveshift/shared/rules';
import type { PurchaseContext } from '@graveshift/shared/rules';
import type { HudState } from '../../../app/state/HudState.ts';
import { Button } from '../../components/Button.tsx';
import { TabBar } from '../../components/TabBar.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';
import { OfferButton } from './OfferButton.tsx';

export interface ShopHeaderProps {
  readonly hud: HudState;
  readonly context: PurchaseContext;
  readonly tab: WeaponClass;
  readonly onSelect: (weaponClass: WeaponClass) => void;
  readonly classes: readonly WeaponClass[];
}

export function ShopHeader(props: ShopHeaderProps): JSX.Element {
  const { commands } = useServices();
  const text = useMessages().shop;
  return (
    <header class="shop__top">
      <div class="shop__heading">
        <h1 class="panel__title">{text.title}</h1>
        <p class="panel__subtitle">
          {props.hud.phase === MatchPhase.Intermission
            ? text.untilWave(props.hud.phaseSecondsLeft)
            : text.combatWarning}
        </p>
      </div>
      <div class="shop__tabs">
        <TabBar
          tabs={[
            { id: WeaponClass.Ranged, label: text.rangedSection },
            { id: WeaponClass.Melee, label: text.meleeSection },
          ].filter((tab) => props.classes.includes(tab.id))}
          active={props.tab}
          onSelect={props.onSelect}
        />
      </div>
      <div class="shop__heal">
        <OfferButton
          offer={{ kind: ShopOfferKind.Heal }}
          context={props.context}
          label={text.heal(Math.round(SHOP_RULES.healFraction * 100))}
        />
      </div>
      <span class="shop__coins">💰 {props.hud.coins}</span>
      <div class="shop__close">
        <Button
          variant="secondary"
          onClick={() => {
            commands.setShopVisible(false);
          }}
        >
          ✕ {text.close}
        </Button>
      </div>
    </header>
  );
}
