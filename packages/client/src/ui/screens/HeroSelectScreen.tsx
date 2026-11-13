import type { JSX } from 'preact';
import { useCallback, useLayoutEffect } from 'preact/hooks';
import { HERO_IDS, HEROES } from '@graveshift/shared/config';
import { ErrorCode } from '@graveshift/shared/protocol';
import { AppScreen } from '../../app/AppScreen.ts';
import { isLevelHeroAllowed } from '@graveshift/shared/rules';
import { HERO_CONTENT } from '../../content/heroContent.ts';
import { Button } from '../components/Button.tsx';
import { Meter } from '../components/Meter.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

const MAX_HEALTH = Math.max(...HERO_IDS.map((id) => HEROES[id].maxHealth));
const MAX_SPEED = Math.max(...HERO_IDS.map((id) => HEROES[id].moveSpeed));

export function HeroSelectScreen(): JSX.Element {
  const { ui, commands } = useServices();
  const messages = useMessages();
  const text = messages.heroSelect;
  const heroId = ui.previewHero.value;
  const definition = HEROES[heroId];
  const content = HERO_CONTENT[heroId];
  const heroTexts = messages.heroes[heroId];
  const step = useCallback(
    (direction: number): void => {
      const index = HERO_IDS.indexOf(ui.previewHero.value);
      const next = HERO_IDS[(index + direction + HERO_IDS.length) % HERO_IDS.length];
      if (next !== undefined) {
        commands.previewHero(next);
      }
    },
    [commands, ui],
  );
  const members = ui.room.value === null ? [] : ui.room.value.members;
  const room = ui.room.value;
  const level =
    room === null ? undefined : ui.levels.value.find((item) => item.id === room.levelId);
  const canPreview = room === null || level !== undefined;
  useLayoutEffect(() => {
    if (!canPreview) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        ui.reconnectAttempt.value !== null
      ) {
        return;
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [canPreview, step, ui]);
  if (room !== null && level === undefined) {
    const title =
      ui.levels.value.length === 0
        ? messages.errors[ErrorCode.NoAvailableLevels]
        : messages.common.connecting;
    return (
      <ScreenFrame
        title={title}
        onBack={() => {
          commands.navigate(AppScreen.Lobby);
        }}
      >
        {null}
      </ScreenFrame>
    );
  }
  const allowed = room === null || (level !== undefined && isLevelHeroAllowed(level.team, heroId));
  const takenBy = members.filter(
    (member) =>
      member.hero === heroId && !member.isBot && member.clientId !== ui.localClientId.value,
  );
  return (
    <section class="screen screen--bottom hero-select">
      <div class="hero-select__nav">
        <Button
          variant="ghost"
          onClick={() => {
            step(-1);
          }}
        >
          ◀
        </Button>
        <div class="hero-select__name" style={{ '--hero-color': content.color }}>
          <h1>{heroTexts.name}</h1>
          <span>{heroTexts.title}</span>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            step(1);
          }}
        >
          ▶
        </Button>
      </div>
      <div class="panel hero-select__card">
        <p class="hero-select__story">«{heroTexts.story}»</p>
        <div class="stat-line">
          <span>{text.health}</span>
          <Meter
            value={definition.maxHealth / MAX_HEALTH}
            tone="health"
            label={String(definition.maxHealth)}
          />
        </div>
        <div class="stat-line">
          <span>{text.speed}</span>
          <Meter value={definition.moveSpeed / MAX_SPEED} label={definition.moveSpeed.toFixed(1)} />
        </div>
        <p class="hero-select__perk">✨ {heroTexts.perk(definition.modifiers)}</p>
        {takenBy.length > 0 ? (
          <p class="hint">{text.takenBy(takenBy.map((member) => member.nickname).join(', '))}</p>
        ) : null}
        {allowed ? null : <p class="loading__error">{messages.lobby.incompatibleHero}</p>}
        <Button
          variant="primary"
          wide
          disabled={!allowed}
          onClick={() => {
            commands.confirmHero(heroId);
          }}
        >
          {messages.common.choose}
        </Button>
      </div>
    </section>
  );
}
