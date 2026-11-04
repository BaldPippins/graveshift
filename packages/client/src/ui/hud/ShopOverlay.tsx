import type { JSX } from 'preact';
import {
  HEROES,
  MELEE_WEAPON_IDS,
  MELEE_WEAPONS,
  RANGED_WEAPON_IDS,
  RANGED_WEAPONS,
  SHOP_RULES,
  UPGRADE_STATS,
  UPGRADES,
  WEAPONS,
} from '@graveshift/shared/config';
import type {
  HeroId,
  MeleeWeaponId,
  RangedWeaponId,
  UpgradeStat,
  WeaponId,
} from '@graveshift/shared/config';
import { MatchPhase } from '@graveshift/shared/model';
import type { LoadoutState } from '@graveshift/shared/model';
import {
  ownsWeapon,
  PurchaseRejection,
  quotePurchase,
  resolveMeleeStats,
  resolveWeaponStats,
  ShopOfferKind,
  upgradeLevelOf,
} from '@graveshift/shared/rules';
import type { PurchaseContext, ShopOffer } from '@graveshift/shared/rules';
import type { HudState } from '../../app/state/HudState.ts';
import { UPGRADE_ICONS } from '../../content/weaponContent.ts';
import { Button } from '../components/Button.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

export interface ShopOverlayProps {
  readonly hud: HudState;
  readonly loadout: LoadoutState;
  readonly hero: HeroId;
}

interface OfferButtonProps {
  readonly offer: ShopOffer;
  readonly context: PurchaseContext;
  readonly label: string;
}

function OfferButton(props: OfferButtonProps): JSX.Element {
  const { commands } = useServices();
  const messages = useMessages();
  const quote = quotePurchase(props.offer, props.context);
  return (
    <Button
      variant={quote.rejection === null ? 'primary' : 'ghost'}
      disabled={quote.rejection !== null}
      title={quote.rejection === null ? '' : messages.purchaseRejections[quote.rejection]}
      onClick={() => {
        commands.purchase(props.offer);
      }}
    >
      {props.label} · 💰{quote.price}
    </Button>
  );
}

interface UpgradeRowProps {
  readonly weapon: WeaponId;
  readonly stat: UpgradeStat;
  readonly context: PurchaseContext;
}

function UpgradeRow(props: UpgradeRowProps): JSX.Element {
  const messages = useMessages();
  const offer: ShopOffer = {
    kind: ShopOfferKind.UpgradeWeapon,
    weapon: props.weapon,
    stat: props.stat,
  };
  const weaponClass = WEAPONS[props.weapon].weaponClass;
  const level = upgradeLevelOf(props.context.loadout, props.weapon, props.stat);
  const maxLevel = UPGRADES[props.stat].maxLevel;
  const maxed = quotePurchase(offer, props.context).rejection === PurchaseRejection.MaxLevel;
  return (
    <div class="upgrade-row">
      <span>
        {UPGRADE_ICONS[weaponClass][props.stat]} {messages.upgrades[weaponClass][props.stat]}
      </span>
      <span class="pips">
        {Array.from({ length: maxLevel }, (_, pip) => (
          <i key={pip} class={pip < level ? 'pip is-on' : 'pip'} />
        ))}
      </span>
      {maxed ? (
        <span class="badge badge--gold">{messages.shop.max}</span>
      ) : (
        <OfferButton offer={offer} context={props.context} label="+" />
      )}
    </div>
  );
}

interface OwnershipProps {
  readonly weapon: WeaponId;
  readonly context: PurchaseContext;
}

function UpgradesOrPurchase(props: OwnershipProps): JSX.Element {
  const messages = useMessages();
  if (!ownsWeapon(props.context.loadout, props.weapon)) {
    return (
      <OfferButton
        offer={{ kind: ShopOfferKind.UnlockWeapon, weapon: props.weapon }}
        context={props.context}
        label={messages.shop.buy}
      />
    );
  }
  return (
    <>
      {UPGRADE_STATS.map((stat) => (
        <UpgradeRow key={stat} weapon={props.weapon} stat={stat} context={props.context} />
      ))}
    </>
  );
}

interface RangedCardProps {
  readonly weapon: RangedWeaponId;
  readonly hero: HeroId;
  readonly context: PurchaseContext;
}

function RangedCard(props: RangedCardProps): JSX.Element {
  const messages = useMessages();
  const owned = ownsWeapon(props.context.loadout, props.weapon);
  const texts = messages.weapons[props.weapon];
  const stats = resolveWeaponStats(
    RANGED_WEAPONS[props.weapon],
    props.context.loadout.upgrades[props.weapon],
    HEROES[props.hero].modifiers,
  );
  const damagePerSecond = (stats.damage * stats.pellets) / stats.fireIntervalSeconds;
  return (
    <article class={owned ? 'weapon-card is-owned' : 'weapon-card'}>
      <header>
        <strong>{texts.name}</strong>
        <small>{texts.description(stats)}</small>
      </header>
      <div class="weapon-card__stats">
        <span>
          💥 {Math.round(stats.damage)}
          {stats.pellets > 1 ? `×${stats.pellets}` : ''}
        </span>
        <span>
          ⚡ {Math.round(damagePerSecond)}
          {messages.shop.perSecond}
        </span>
        <span>📦 {stats.magazineSize}</span>
        {stats.pierce > 0 ? <span>🗡 {messages.shop.pierce(stats.pierce + 1)}</span> : null}
      </div>
      <UpgradesOrPurchase weapon={props.weapon} context={props.context} />
    </article>
  );
}

interface MeleeCardProps {
  readonly weapon: MeleeWeaponId;
  readonly hero: HeroId;
  readonly equipped: MeleeWeaponId;
  readonly context: PurchaseContext;
}

function MeleeCard(props: MeleeCardProps): JSX.Element {
  const { commands } = useServices();
  const messages = useMessages();
  const owned = ownsWeapon(props.context.loadout, props.weapon);
  const texts = messages.meleeWeapons[props.weapon];
  const stats = resolveMeleeStats(
    MELEE_WEAPONS[props.weapon],
    props.context.loadout.upgrades[props.weapon],
    HEROES[props.hero].modifiers,
  );
  const inHand = props.weapon === props.equipped;
  return (
    <article class={owned ? 'weapon-card is-owned' : 'weapon-card'}>
      <header>
        <strong>{texts.name}</strong>
        <small>{texts.description(stats)}</small>
      </header>
      <div class="weapon-card__stats">
        <span>💥 {Math.round(stats.damage)}</span>
        <span>
          ⚡ {Math.round(stats.damage / stats.swingSeconds)}
          {messages.shop.perSecond}
        </span>
        <span>📏 {messages.shop.reach(stats.reach)}</span>
        <span>◔ {messages.shop.arc((stats.arcRadians * 180) / Math.PI)}</span>
        {stats.critChance > 0 ? <span>🎯 {messages.shop.crit(stats.critChance)}</span> : null}
      </div>
      {owned && inHand ? <span class="badge badge--gold">{messages.shop.equipped}</span> : null}
      {owned && !inHand ? (
        <Button
          variant="secondary"
          onClick={() => {
            commands.selectWeapon(props.weapon);
          }}
        >
          {messages.shop.equip}
        </Button>
      ) : null}
      <UpgradesOrPurchase weapon={props.weapon} context={props.context} />
    </article>
  );
}

export function ShopOverlay(props: ShopOverlayProps): JSX.Element {
  const { commands } = useServices();
  const text = useMessages().shop;
  const context: PurchaseContext = {
    loadout: props.loadout,
    coins: props.hud.coins,
    health: props.hud.health,
    maxHealth: props.hud.maxHealth,
    lifeState: props.hud.life,
    merchantAccess: props.hud.merchantAccess,
  };
  return (
    <div class="overlay">
      <div class="panel shop">
        <header class="shop__header">
          <div>
            <h1 class="panel__title">{text.title}</h1>
            <p class="panel__subtitle">
              💰 {props.hud.coins} ·{' '}
              {props.hud.phase === MatchPhase.Intermission
                ? text.untilWave(props.hud.phaseSecondsLeft)
                : text.combatWarning}
            </p>
          </div>
          <div class="shop__actions">
            <OfferButton
              offer={{ kind: ShopOfferKind.Heal }}
              context={context}
              label={`❤ +${Math.round(SHOP_RULES.healFraction * 100)}%`}
            />
            <Button
              variant="ghost"
              onClick={() => {
                commands.setShopVisible(false);
              }}
            >
              ✕
            </Button>
          </div>
        </header>
        <h2 class="shop__section">{text.rangedSection}</h2>
        <div class="shop__grid">
          {RANGED_WEAPON_IDS.map((weapon) => (
            <RangedCard key={weapon} weapon={weapon} hero={props.hero} context={context} />
          ))}
        </div>
        <h2 class="shop__section">{text.meleeSection}</h2>
        <div class="shop__grid">
          {MELEE_WEAPON_IDS.map((weapon) => (
            <MeleeCard
              key={weapon}
              weapon={weapon}
              hero={props.hero}
              equipped={props.hud.melee}
              context={context}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
