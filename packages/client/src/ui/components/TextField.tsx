import type { JSX } from 'preact';

export interface TextFieldProps {
  readonly value: string;
  readonly onInput: (value: string) => void;
  readonly maxLength?: number;
  readonly placeholder?: string;
  readonly class?: string;
}

export function TextField(props: TextFieldProps): JSX.Element {
  return (
    <input
      class={props.class}
      value={props.value}
      maxLength={props.maxLength}
      placeholder={props.placeholder}
      onInput={(event) => {
        props.onInput(event.currentTarget.value);
      }}
    />
  );
}
