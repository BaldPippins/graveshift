import type { JSX } from 'preact';

export interface CheckboxProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly class?: string;
}

export function Checkbox(props: CheckboxProps): JSX.Element {
  return (
    <input
      type="checkbox"
      class={props.class}
      checked={props.checked}
      disabled={props.disabled}
      onChange={(event) => {
        props.onChange(event.currentTarget.checked);
      }}
    />
  );
}
