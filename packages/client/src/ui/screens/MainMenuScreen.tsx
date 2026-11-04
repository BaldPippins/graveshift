import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { ROOM_RULES } from '@graveshift/shared/config';
import { AppScreen } from '../../app/AppScreen.ts';
import { HERO_CONTENT } from '../../content/heroContent.ts';
import { STUDIO_GITHUB_URL } from '../../content/projectLinks.ts';
import { Button } from '../components/Button.tsx';
import { LanguageSwitch } from '../components/LanguageSwitch.tsx';
import { SoundToggle } from '../components/SoundToggle.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

export function MainMenuScreen(): JSX.Element {
  const { ui, commands, settings } = useServices();
  const messages = useMessages();
  const text = messages.menu;
  const [code, setCode] = useState('');
  const current = settings.current.value;
  const busy = ui.busy.value;
  const hero = HERO_CONTENT[current.preferredHero];
  const heroTexts = messages.heroes[current.preferredHero];
  return (
    <section class="screen screen--left main-menu">
      <div class="logo logo--menu">
        <span class="logo__title">GRAVESHIFT</span>
        <span class="logo__subtitle">{text.tagline}</span>
      </div>
      <div class="main-menu__toolbar">
        <LanguageSwitch />
        <SoundToggle />
      </div>
      <div class="panel main-menu__panel">
        <label class="field">
          <span>{text.nickname}</span>
          <input
            value={current.nickname}
            maxLength={ROOM_RULES.maxNicknameLength}
            placeholder={text.nicknamePlaceholder}
            onInput={(event) => {
              commands.updateSettings({ nickname: event.currentTarget.value });
            }}
          />
        </label>
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
        <Button
          variant="primary"
          wide
          disabled={busy}
          onClick={() => {
            void commands.createRoom();
          }}
        >
          {busy ? messages.common.connecting : text.createRoom}
        </Button>
        <div class="join-row">
          <input
            class="join-row__code"
            value={code}
            maxLength={ROOM_RULES.codeLength}
            placeholder={text.codePlaceholder}
            onInput={(event) => {
              setCode(event.currentTarget.value.toUpperCase());
            }}
          />
          <Button
            disabled={busy || code.length !== ROOM_RULES.codeLength}
            onClick={() => {
              void commands.joinRoom(code);
            }}
          >
            {text.join}
          </Button>
        </div>
        <nav class="menu-grid">
          <Button
            onClick={() => {
              commands.navigate(AppScreen.Achievements);
            }}
          >
            {text.achievements}
          </Button>
          <Button
            onClick={() => {
              commands.navigate(AppScreen.Stats);
            }}
          >
            {text.stats}
          </Button>
          <Button
            onClick={() => {
              commands.navigate(AppScreen.HowToPlay);
            }}
          >
            {text.howToPlay}
          </Button>
          <Button
            onClick={() => {
              commands.navigate(AppScreen.Settings);
            }}
          >
            {text.settings}
          </Button>
        </nav>
        <a class="main-menu__source" href={STUDIO_GITHUB_URL} target="_blank" rel="noreferrer">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
              d={
                'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59 ' +
                '.4.07.55-.17.55-.38v-1.49c-2.23.48-2.69-1.08-2.69-1.08 ' +
                '-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49 ' +
                '.8.06 1.22.82 1.22.82.71 1.21 1.87.86 2.33.66 ' +
                '.07-.52.28-.86.51-1.06-1.78-.2-3.64-.89-3.64-3.95 ' +
                '0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 ' +
                '0 0 .67-.21 2.2.82A7.65 7.65 0 0 1 8 4.73c.68 0 1.36.09 2 .27 ' +
                '1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12 ' +
                '.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95 ' +
                '.29.25.54.73.54 1.48v2.33c0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8 ' +
                'c0-4.42-3.58-8-8-8Z'
              }
            />
          </svg>
          {text.studioLink}
        </a>
      </div>
    </section>
  );
}
