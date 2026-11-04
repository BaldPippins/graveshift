import type { ComponentChildren, JSX } from 'preact';
import { Button } from './Button.tsx';

export interface SingleSelectProps<T extends string | number> {
  readonly options: readonly T[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly label: (value: T) => ComponentChildren;
  readonly variant: 'segmented' | 'radio';
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly radioGroup?: boolean;
}

export function SingleSelect<T extends string | number>(props: SingleSelectProps<T>): JSX.Element {
  const radio = props.variant === 'radio';
  return (
    <div
      class={radio ? 'bot-picker__options' : 'segmented'}
      role={radio || props.radioGroup === true ? 'radiogroup' : undefined}
      aria-label={props.ariaLabel}
    >
      {props.options.map((option) =>
        radio ? (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={option === props.value}
            class={
              option === props.value
                ? 'bot-picker__option bot-picker__option--active'
                : 'bot-picker__option'
            }
            disabled={props.disabled === true}
            onClick={() => {
              props.onChange(option);
            }}
          >
            {props.label(option)}
          </button>
        ) : (
          <Button
            key={option}
            variant={option === props.value ? 'primary' : 'ghost'}
            disabled={props.disabled === true}
            onClick={() => {
              props.onChange(option);
            }}
          >
            {props.label(option)}
          </Button>
        ),
      )}
    </div>
  );
}
