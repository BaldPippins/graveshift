import type { JSX } from 'preact';
import { useMessages } from '../../useMessages.ts';
import { HowToTab } from '../HowToTab.ts';
import { Bestiary } from './Bestiary.tsx';
import { Controls } from './Controls.tsx';
import { RuleList } from './RuleList.tsx';

interface TabContentProps {
  readonly tab: HowToTab;
}

export function TabContent(props: TabContentProps): JSX.Element {
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
