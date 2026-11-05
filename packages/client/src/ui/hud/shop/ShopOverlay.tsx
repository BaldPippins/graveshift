import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import {
  MELEE_WEAPON_IDS,
  RANGED_WEAPON_IDS,
  WeaponClass,
  WEAPONS,
} from '@graveshift/shared/config';
import type { HeroId, WeaponId } from '@graveshift/shared/config';
import type { LoadoutState } from '@graveshift/shared/model';
import type { PurchaseContext } from '@graveshift/shared/rules';
import type { HudState } from '../../../app/state/HudState.ts';
import type { LevelDefinition } from '@graveshift/shared/world';
import { ShopHeader } from './ShopHeader.tsx';
import { WeaponDetail } from './WeaponDetail.tsx';
import { WeaponList } from './WeaponList.tsx';

export interface ShopOverlayProps {
  readonly hud: HudState;
  readonly loadout: LoadoutState;
  readonly hero: HeroId;
  readonly level: LevelDefinition;
}

const WEAPONS_BY_CLASS: Readonly<Record<WeaponClass, readonly WeaponId[]>> = {
  [WeaponClass.Ranged]: RANGED_WEAPON_IDS,
  [WeaponClass.Melee]: MELEE_WEAPON_IDS,
};

function inHandOf(weaponClass: WeaponClass, hud: HudState): WeaponId | null {
  return weaponClass === WeaponClass.Melee ? hud.melee : hud.weapon;
}

export function ShopOverlay(props: ShopOverlayProps): JSX.Element {
  const [selected, setSelected] = useState<WeaponId | null>(
    props.hud.weapon ?? props.hud.melee ?? props.level.weapons.allowed[0] ?? null,
  );
  if (selected === null) {
    return <></>;
  }
  const tab = WEAPONS[selected].weaponClass;
  const inHand = inHandOf(tab, props.hud);
  const allowed = props.level.weapons.allowed;
  const classes = [WeaponClass.Ranged, WeaponClass.Melee].filter((weaponClass) =>
    WEAPONS_BY_CLASS[weaponClass].some((weapon) => allowed.includes(weapon)),
  );
  const context: PurchaseContext = {
    loadout: props.loadout,
    coins: props.hud.coins,
    health: props.hud.health,
    maxHealth: props.hud.maxHealth,
    lifeState: props.hud.life,
    merchantAccess: props.hud.merchantAccess,
    allowedWeapons: allowed,
  };
  return (
    <div class="overlay overlay--shop">
      <div class="panel shop">
        <ShopHeader
          hud={props.hud}
          context={context}
          tab={tab}
          classes={classes}
          onSelect={(weaponClass) => {
            const weapon =
              inHandOf(weaponClass, props.hud) ??
              WEAPONS_BY_CLASS[weaponClass].find((id) => allowed.includes(id));
            if (weapon !== undefined) {
              setSelected(weapon);
            }
          }}
        />
        <div class="shop__body">
          <WeaponList
            weapons={WEAPONS_BY_CLASS[tab].filter((weapon) => allowed.includes(weapon))}
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
