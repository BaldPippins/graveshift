import type { JSX } from 'preact';
import {
  HEROES,
  SHOP_RULES,
  UPGRADE_STATS,
  UPGRADES,
  WEAPON_IDS,
  WEAPONS,
} from '@graveshift/shared/config';
import type { HeroId, UpgradeStat, WeaponId } from '@graveshift/shared/config';
import { MatchPhase } from '@graveshift/shared/model';
import type { LoadoutState } from '@graveshift/shared/model';
import {
  ownsWeapon,
  PurchaseRejection,
  quotePurchase,
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
  const level = upgradeLevelOf(props.context.loadout, props.weapon, props.stat);
  const maxLevel = UPGRADES[props.stat].maxLevel;
  const maxed = quotePurchase(offer, props.context).rejection === PurchaseRejection.MaxLevel;
  return (
    <div class="upgrade-row">
      <span>
        {UPGRADE_ICONS[props.stat]} {messages.upgrades[props.stat]}
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

interface WeaponCardProps {
  readonly weapon: WeaponId;
  readonly hero: HeroId;
  readonly context: PurchaseContext;
}

function WeaponCard(props: WeaponCardProps): JSX.Element {
  const messages = useMessages();
  const owned = ownsWeapon(props.context.loadout, props.weapon);
  const texts = messages.weapons[props.weapon];
  const stats = resolveWeaponStats(
    WEAPONS[props.weapon],
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
      {owned ? (
        UPGRADE_STATS.map((stat) => (
          <UpgradeRow key={stat} weapon={props.weapon} stat={stat} context={props.context} />
        ))
      ) : (
        <OfferButton
          offer={{ kind: ShopOfferKind.UnlockWeapon, weapon: props.weapon }}
          context={props.context}
          label={messages.shop.buy}
        />
      )}
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
        <div class="shop__grid">
          {WEAPON_IDS.map((weapon) => (
            <WeaponCard key={weapon} weapon={weapon} hero={props.hero} context={context} />
          ))}
        </div>
      </div>
    </div>
  );
}
