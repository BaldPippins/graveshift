import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { ROOM_RULES } from '@graveshift/shared/config';
import { AppScreen } from '../../app/AppScreen.ts';
import { HERO_CONTENT } from '../../content/heroContent.ts';
import { Button } from '../components/Button.tsx';
import { LanguageSwitch } from '../components/LanguageSwitch.tsx';
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
      <div class="main-menu__language">
        <LanguageSwitch />
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
      </div>
    </section>
  );
}
