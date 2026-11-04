import type { JSX } from 'preact';
import { Button } from './Button.tsx';

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
    <div class="segmented tab-bar" role="tablist">
      {props.tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={tab.id === props.active ? 'primary' : 'ghost'}
          onClick={() => {
            props.onSelect(tab.id);
          }}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
