import type { JSX } from 'preact';
import { MERCHANT_RULES } from '@graveshift/shared/config';
import { MatchPhase } from '@graveshift/shared/model';
import { MerchantAccess, ShopOfferKind } from '@graveshift/shared/rules';
import type { HudState } from '../../app/state/HudState.ts';
import type { HudTexts } from '../../i18n/Messages.ts';
import { Button } from '../components/Button.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

export interface TopBarProps {
  readonly hud: HudState;
}

function phaseLabel(hud: HudState, text: HudTexts, totalWaves: number): string {
  switch (hud.phase) {
    case MatchPhase.Countdown:
      return text.countdown(hud.phaseSecondsLeft);
    case MatchPhase.Combat:
      return text.combat(hud.wave, totalWaves, hud.enemiesRemaining);
    case MatchPhase.Intermission:
      return text.intermission(hud.phaseSecondsLeft);
    case MatchPhase.Victory:
      return text.victory;
    case MatchPhase.Defeat:
      return text.defeat;
  }
}

export function TopBar(props: TopBarProps): JSX.Element {
  const { ui, commands, settings } = useServices();
  const showStats = settings.current.value.showFps;
  const text = useMessages().hud;
  return (
    <div class="hud-top">
      <div class="hud-chip">{phaseLabel(props.hud, text, ui.matchSettings.value.totalWaves)}</div>
      <div class="hud-chip hud-chip--gold">💰 {props.hud.coins}</div>
      {showStats ? (
        <div class="hud-chip hud-chip--muted">
          {ui.fps.value} fps · {ui.pingMilliseconds.value ?? '—'} ms
        </div>
      ) : null}
      <div class="hud-top__actions">
        {props.hud.merchantAccess === MerchantAccess.Grave ? (
          <Button
            variant="primary"
            onClick={() => {
              commands.purchase({ kind: ShopOfferKind.ReviveMerchant });
            }}
          >
            {text.reviveMerchant(MERCHANT_RULES.revivePrice)}
          </Button>
        ) : null}
        {props.hud.merchantAccess === MerchantAccess.Serving ? (
          <Button
            variant="primary"
            onClick={() => {
              commands.setShopVisible(true);
            }}
          >
            {text.shop}
          </Button>
        ) : null}
        {props.hud.phase === MatchPhase.Intermission ? (
          <Button
            variant="secondary"
            onClick={() => {
              commands.voteSkipIntermission();
            }}
          >
            {text.readyForWave}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          onClick={() => {
            commands.setPaused(true);
          }}
          title={text.pause}
        >
          ⏸
        </Button>
      </div>
    </div>
  );
}
