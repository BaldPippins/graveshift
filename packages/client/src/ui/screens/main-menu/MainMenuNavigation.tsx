import type { JSX } from 'preact';
import { AppScreen } from '../../../app/AppScreen.ts';
import { Button } from '../../components/Button.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';

export function MainMenuNavigation(): JSX.Element {
  const { commands } = useServices();
  const text = useMessages().menu;
  return (
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
  );
}
