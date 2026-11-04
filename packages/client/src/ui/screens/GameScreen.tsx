import type { JSX } from 'preact';
import { DownedOverlay } from '../hud/DownedOverlay.tsx';
import { PauseOverlay } from '../hud/PauseOverlay.tsx';
import { Scoreboard } from '../hud/Scoreboard.tsx';
import { ShopOverlay } from '../hud/shop/ShopOverlay.tsx';
import { TeamPanel } from '../hud/TeamPanel.tsx';
import { TopBar } from '../hud/TopBar.tsx';
import { TouchControls } from '../hud/TouchControls.tsx';
import { VitalsPanel } from '../hud/VitalsPanel.tsx';
import { WaveBanner } from '../hud/WaveBanner.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

export function GameScreen(): JSX.Element {
  const { ui } = useServices();
  const text = useMessages().hud;
  const hud = ui.hud.value;
  const loadout = ui.loadout.value;
  const touch = ui.activeTouch.value;
  const local = hud === null ? undefined : hud.teammates.find((teammate) => teammate.isLocal);
  const localHero = local === undefined ? undefined : local.hero;
  const overlayOpen = ui.paused.value || ui.shopVisible.value;
  return (
    <section class="game-screen">
      <WaveBanner />
      {hud === null ? (
        <div class="hud-chip hud-wait">{text.syncing}</div>
      ) : (
        <>
          <TopBar hud={hud} />
          <TeamPanel teammates={hud.teammates} />
          <VitalsPanel hud={hud} />
          <DownedOverlay hud={hud} />
          {ui.scoreboardVisible.value ? <Scoreboard teammates={hud.teammates} /> : null}
          {ui.shopVisible.value && loadout !== null && localHero !== undefined ? (
            <ShopOverlay hud={hud} loadout={loadout} hero={localHero} />
          ) : null}
        </>
      )}
      {ui.touchControls.value && touch !== null && !overlayOpen ? (
        <TouchControls touch={touch} />
      ) : null}
      {ui.paused.value ? <PauseOverlay /> : null}
    </section>
  );
}
