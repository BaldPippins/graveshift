import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { ENEMIES, ENEMY_KINDS } from '@graveshift/shared/config';
import { AppScreen } from '../../app/AppScreen.ts';
import { ENEMY_ICONS } from '../../content/enemyContent.ts';
import type { HowToTexts, KeyHint } from '../../i18n/Messages.ts';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { TabBar } from '../components/TabBar.tsx';
import type { TabOption } from '../components/TabBar.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';
import { HowToTab } from './HowToTab.ts';

interface KeyHintListProps {
  readonly title: string;
  readonly hints: readonly KeyHint[];
}

interface TabContentProps {
  readonly tab: HowToTab;
}

interface RuleListProps {
  readonly rules: readonly string[];
}

function howToTabs(text: HowToTexts): readonly TabOption<HowToTab>[] {
  return [
    { id: HowToTab.Controls, label: text.controlsTab },
    { id: HowToTab.Shift, label: text.shiftTab },
    { id: HowToTab.Combat, label: text.combatTab },
    { id: HowToTab.Bestiary, label: text.bestiaryTab },
  ];
}

function KeyHintList(props: KeyHintListProps): JSX.Element {
  return (
    <section class="howto__column">
      <h2>{props.title}</h2>
      <ul class="keys">
        {props.hints.map((hint) => (
          <li key={hint.action}>
            <span class="keys__combo">
              {hint.keys.map((key) => (
                <kbd key={key}>{key}</kbd>
              ))}
            </span>
            <span>{hint.action}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Controls(): JSX.Element {
  const { ui } = useServices();
  const text = useMessages().howTo;
  const keyboard = <KeyHintList title={text.keyboardTitle} hints={text.controls} />;
  const touch = <KeyHintList title={text.touchTitle} hints={text.touchControls} />;
  return (
    <div class="howto__columns">
      {ui.touchControls.value ? touch : keyboard}
      {ui.touchControls.value ? keyboard : touch}
    </div>
  );
}

function RuleList(props: RuleListProps): JSX.Element {
  return (
    <ul class="howto__rules">
      {props.rules.map((rule) => (
        <li key={rule}>{rule}</li>
      ))}
    </ul>
  );
}

function Bestiary(): JSX.Element {
  const { ui } = useServices();
  const messages = useMessages();
  const portraits = ui.enemyPortraits.value;
  return (
    <div class="bestiary">
      {ENEMY_KINDS.map((kind) => {
        const portrait = portraits.get(kind);
        return (
          <article key={kind} class="bestiary__entry">
            {portrait === undefined ? (
              <span class="bestiary__portrait">{ENEMY_ICONS[kind]}</span>
            ) : (
              <img class="bestiary__portrait" src={portrait} alt="" />
            )}
            <div class="bestiary__text">
              <strong>{messages.enemies[kind].name}</strong>
              <small>{messages.enemies[kind].description}</small>
              <span class="bestiary__stats">
                ❤ {ENEMIES[kind].maxHealth} · ⚔ {ENEMIES[kind].attackDamage} · 💰{' '}
                {ENEMIES[kind].bounty}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function TabContent(props: TabContentProps): JSX.Element {
  const text = useMessages().howTo;
  switch (props.tab) {
    case HowToTab.Controls:
      return <Controls />;
    case HowToTab.Shift:
      return <RuleList rules={text.shiftRules} />;
    case HowToTab.Combat:
      return <RuleList rules={text.combatRules} />;
    case HowToTab.Bestiary:
      return <Bestiary />;
  }
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
