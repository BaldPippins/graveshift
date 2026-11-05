import type { ComponentChildren, JSX } from 'preact';
import { selectOptionOnKeyDown } from './selectOptionOnKeyDown.ts';

export interface RadioOptionsProps<T extends string | number> {
  readonly options: readonly T[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly label: (value: T) => ComponentChildren;
  readonly disabled?: boolean;
  readonly ariaLabel: string;
}

export function RadioOptions<T extends string | number>(props: RadioOptionsProps<T>): JSX.Element {
  return (
    <div class="radio-options" role="radiogroup" aria-label={props.ariaLabel}>
      {props.options.map((option) => {
        const selected = option === props.value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            class={
              selected
                ? 'radio-options__option radio-options__option--active'
                : 'radio-options__option'
            }
            disabled={props.disabled === true}
            onKeyDown={(event) => {
              selectOptionOnKeyDown(event, props.options, option, props.onChange);
            }}
            onClick={() => {
              props.onChange(option);
            }}
          >
            {props.label(option)}
          </button>
        );
      })}
    </div>
  );
}
