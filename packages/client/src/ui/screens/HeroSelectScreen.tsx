import type { JSX } from 'preact';
import { HERO_IDS, HEROES } from '@graveshift/shared/config';
import { HERO_CONTENT } from '../../content/heroContent.ts';
import { Button } from '../components/Button.tsx';
import { Meter } from '../components/Meter.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

const MAX_HEALTH = Math.max(...HERO_IDS.map((id) => HEROES[id].maxHealth));
const MAX_SPEED = Math.max(...HERO_IDS.map((id) => HEROES[id].moveSpeed));

export function HeroSelectScreen(): JSX.Element {
  const { ui, commands } = useServices();
  const messages = useMessages();
  const text = messages.heroSelect;
  const heroId = ui.previewHero.value;
  const index = HERO_IDS.indexOf(heroId);
  const definition = HEROES[heroId];
  const content = HERO_CONTENT[heroId];
  const heroTexts = messages.heroes[heroId];
  const step = (direction: number): void => {
    const next = HERO_IDS[(index + direction + HERO_IDS.length) % HERO_IDS.length];
    if (next !== undefined) {
      commands.previewHero(next);
    }
  };
  const members = ui.room.value === null ? [] : ui.room.value.members;
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
        <Button
          variant="primary"
          wide
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
