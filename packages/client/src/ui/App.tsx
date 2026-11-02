import type { JSX } from 'preact';
import { AppScreen } from '../app/AppScreen.ts';
import type { AppServices } from './AppServices.ts';
import { ReconnectOverlay } from './components/ReconnectOverlay.tsx';
import { ToastStack } from './components/ToastStack.tsx';
import { AchievementsScreen } from './screens/AchievementsScreen.tsx';
import { GameScreen } from './screens/GameScreen.tsx';
import { HeroSelectScreen } from './screens/HeroSelectScreen.tsx';
import { HowToPlayScreen } from './screens/HowToPlayScreen.tsx';
import { LoadingScreen } from './screens/LoadingScreen.tsx';
import { LobbyScreen } from './screens/LobbyScreen.tsx';
import { MainMenuScreen } from './screens/MainMenuScreen.tsx';
import { ResultsScreen } from './screens/ResultsScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import { StatsScreen } from './screens/StatsScreen.tsx';
import { ServicesContext, useServices } from './ServicesContext.ts';

function CurrentScreen(): JSX.Element {
  const screen = useServices().ui.screen.value;
  switch (screen) {
    case AppScreen.Loading:
      return <LoadingScreen />;
    case AppScreen.MainMenu:
      return <MainMenuScreen />;
    case AppScreen.Lobby:
      return <LobbyScreen />;
    case AppScreen.HeroSelect:
      return <HeroSelectScreen />;
    case AppScreen.Game:
      return <GameScreen />;
    case AppScreen.Results:
      return <ResultsScreen />;
    case AppScreen.Achievements:
      return <AchievementsScreen />;
    case AppScreen.Stats:
      return <StatsScreen />;
    case AppScreen.Settings:
      return <SettingsScreen />;
    case AppScreen.HowToPlay:
      return <HowToPlayScreen />;
  }
}

export interface AppProps {
  readonly services: AppServices;
}

export function App(props: AppProps): JSX.Element {
  return (
    <ServicesContext.Provider value={props.services}>
      <CurrentScreen />
      <ReconnectOverlay />
      <ToastStack />
    </ServicesContext.Provider>
  );
}
