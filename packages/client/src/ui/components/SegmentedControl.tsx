import type { ComponentChildren, JSX } from 'preact';
import { Button } from './Button.tsx';
import { selectOptionOnKeyDown } from './selectOptionOnKeyDown.ts';

export interface SegmentedControlProps<T extends string | number> {
  readonly options: readonly T[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly label: (value: T) => ComponentChildren;
  readonly ariaLabel?: string;
  readonly mode?: 'radio' | 'tab';
}

export function SegmentedControl<T extends string | number>(
  props: SegmentedControlProps<T>,
): JSX.Element {
  const tab = props.mode === 'tab';
  return (
    <div
      class={tab ? 'segmented tab-bar' : 'segmented'}
      role={tab ? 'tablist' : 'radiogroup'}
      aria-label={props.ariaLabel}
    >
      {props.options.map((option) => {
        const selected = option === props.value;
        return (
          <Button
            key={option}
            variant={selected ? 'primary' : 'ghost'}
            role={tab ? 'tab' : 'radio'}
            ariaChecked={tab ? undefined : selected}
            ariaSelected={tab ? selected : undefined}
            tabIndex={selected ? 0 : -1}
            onKeyDown={(event) => {
              selectOptionOnKeyDown(event, props.options, option, props.onChange);
            }}
            onClick={() => {
              props.onChange(option);
            }}
          >
            {props.label(option)}
          </Button>
        );
      })}
    </div>
  );
}
