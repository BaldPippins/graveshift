import type { JSX } from 'preact';
import { STUDIO_GITHUB_URL } from '../../content/projectLinks.ts';
import { Button } from '../components/Button.tsx';
import { LanguageSwitch } from '../components/LanguageSwitch.tsx';
import { SoundToggle } from '../components/SoundToggle.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';
import { HeroSelector } from './main-menu/HeroSelector.tsx';
import { JoinRoomForm } from './main-menu/JoinRoomForm.tsx';
import { MainMenuNavigation } from './main-menu/MainMenuNavigation.tsx';
import { NicknameField } from './main-menu/NicknameField.tsx';

export function MainMenuScreen(): JSX.Element {
  const { ui, commands } = useServices();
  const messages = useMessages();
  const text = messages.menu;
  const busy = ui.busy.value;
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
        <NicknameField />
        <HeroSelector />
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
        <JoinRoomForm />
        <MainMenuNavigation />
        <a class="main-menu__source" href={STUDIO_GITHUB_URL} target="_blank" rel="noreferrer">
          {text.studioLink}
        </a>
      </div>
    </section>
  );
}
