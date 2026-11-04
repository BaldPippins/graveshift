import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import {
  MELEE_WEAPON_IDS,
  RANGED_WEAPON_IDS,
  SHOP_RULES,
  WeaponClass,
  WEAPONS,
} from '@graveshift/shared/config';
import type { HeroId, WeaponId } from '@graveshift/shared/config';
import { MatchPhase } from '@graveshift/shared/model';
import type { LoadoutState } from '@graveshift/shared/model';
import { ShopOfferKind } from '@graveshift/shared/rules';
import type { PurchaseContext } from '@graveshift/shared/rules';
import type { HudState } from '../../../app/state/HudState.ts';
import { Button } from '../../components/Button.tsx';
import { TabBar } from '../../components/TabBar.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';
import { OfferButton } from './OfferButton.tsx';
import { WeaponDetail } from './WeaponDetail.tsx';
import { WeaponList } from './WeaponList.tsx';

export interface ShopOverlayProps {
  readonly hud: HudState;
  readonly loadout: LoadoutState;
  readonly hero: HeroId;
}

const WEAPONS_BY_CLASS: Readonly<Record<WeaponClass, readonly WeaponId[]>> = {
  [WeaponClass.Ranged]: RANGED_WEAPON_IDS,
  [WeaponClass.Melee]: MELEE_WEAPON_IDS,
};

function inHandOf(weaponClass: WeaponClass, hud: HudState): WeaponId {
  return weaponClass === WeaponClass.Melee ? hud.melee : hud.weapon;
}

export function ShopOverlay(props: ShopOverlayProps): JSX.Element {
  const { commands } = useServices();
  const text = useMessages().shop;
  const [selected, setSelected] = useState<WeaponId>(props.hud.weapon);
  const tab = WEAPONS[selected].weaponClass;
  const inHand = inHandOf(tab, props.hud);
  const context: PurchaseContext = {
    loadout: props.loadout,
    coins: props.hud.coins,
    health: props.hud.health,
    maxHealth: props.hud.maxHealth,
    lifeState: props.hud.life,
    merchantAccess: props.hud.merchantAccess,
  };
  return (
    <div class="overlay overlay--shop">
      <div class="panel shop">
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
              ]}
              active={tab}
              onSelect={(weaponClass) => {
                setSelected(inHandOf(weaponClass, props.hud));
              }}
            />
          </div>
          <div class="shop__heal">
            <OfferButton
              offer={{ kind: ShopOfferKind.Heal }}
              context={context}
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
        <div class="shop__body">
          <WeaponList
            weapons={WEAPONS_BY_CLASS[tab]}
            selected={selected}
            inHand={inHand}
            hero={props.hero}
            context={context}
            onSelect={setSelected}
          />
          <WeaponDetail
            weapon={selected}
            inHand={selected === inHand}
            hero={props.hero}
            context={context}
          />
        </div>
      </div>
    </div>
  );
}
