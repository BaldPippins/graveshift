import type { JSX } from 'preact';
import { AppScreen } from '../../app/AppScreen.ts';
import { useServices } from '../ServicesContext.ts';
import { SettingsPanel } from './settings/SettingsPanel.tsx';

export function SettingsScreen(): JSX.Element {
  const { commands } = useServices();
  return (
    <SettingsPanel
      onBack={() => {
        commands.navigate(AppScreen.MainMenu);
      }}
    />
  );
}
