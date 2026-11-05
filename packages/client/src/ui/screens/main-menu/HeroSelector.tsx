import type { JSX } from 'preact';
import { AppScreen } from '../../../app/AppScreen.ts';
import { HERO_CONTENT } from '../../../content/heroContent.ts';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';

export function HeroSelector(): JSX.Element {
  const { commands, settings } = useServices();
  const messages = useMessages();
  const text = messages.menu;
  const current = settings.current.value;
  const hero = HERO_CONTENT[current.preferredHero];
  const heroTexts = messages.heroes[current.preferredHero];
  return (
    <button
      type="button"
      class="hero-chip"
      style={{ '--hero-color': hero.color }}
      onClick={() => {
        commands.navigate(AppScreen.HeroSelect);
      }}
    >
      <span class="hero-chip__name">{heroTexts.name}</span>
      <span class="hero-chip__title">{text.changeHero(heroTexts.title)}</span>
    </button>
  );
}
