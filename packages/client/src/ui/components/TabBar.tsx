import type { JSX } from 'preact';
import { SegmentedControl } from './SegmentedControl.tsx';

export interface TabOption<TId extends string | number> {
  readonly id: TId;
  readonly label: string;
}

export interface TabBarProps<TId extends string | number> {
  readonly tabs: readonly TabOption<TId>[];
  readonly active: TId;
  readonly onSelect: (id: TId) => void;
}

export function TabBar<TId extends string | number>(props: TabBarProps<TId>): JSX.Element {
  return (
    <SegmentedControl
      mode="tab"
      options={props.tabs.map((tab) => tab.id)}
      value={props.active}
      label={(id) => {
        const tab = props.tabs.find((option) => option.id === id);
        return tab === undefined ? '' : tab.label;
      }}
      onChange={props.onSelect}
    />
  );
}
