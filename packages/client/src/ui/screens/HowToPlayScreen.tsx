import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { AppScreen } from '../../app/AppScreen.ts';
import type { HowToTexts } from '../../i18n/Messages.ts';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { TabBar } from '../components/TabBar.tsx';
import type { TabOption } from '../components/TabBar.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';
import { HowToTab } from './HowToTab.ts';
import { TabContent } from './how-to/TabContent.tsx';

function howToTabs(text: HowToTexts): readonly TabOption<HowToTab>[] {
  return [
    { id: HowToTab.Controls, label: text.controlsTab },
    { id: HowToTab.Shift, label: text.shiftTab },
    { id: HowToTab.Combat, label: text.combatTab },
    { id: HowToTab.Bestiary, label: text.bestiaryTab },
  ];
}

export function HowToPlayScreen(): JSX.Element {
  const { commands } = useServices();
  const text = useMessages().howTo;
  const [tab, setTab] = useState<HowToTab>(HowToTab.Controls);
  return (
    <ScreenFrame
      title={text.title}
      subtitle={text.subtitle}
      wide
      onBack={() => {
        commands.navigate(AppScreen.MainMenu);
      }}
    >
      <div class="howto">
        <TabBar tabs={howToTabs(text)} active={tab} onSelect={setTab} />
        <div class="howto__content">
          <TabContent tab={tab} />
        </div>
      </div>
    </ScreenFrame>
  );
}
