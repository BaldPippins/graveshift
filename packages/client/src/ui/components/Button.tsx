import type { ComponentChildren, JSX, KeyboardEventHandler } from 'preact';

export interface ButtonProps {
  readonly children: ComponentChildren;
  readonly onClick: () => void;
  readonly variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  readonly disabled?: boolean;
  readonly wide?: boolean;
  readonly title?: string;
  readonly role?: 'radio' | 'tab';
  readonly ariaChecked?: boolean | undefined;
  readonly ariaSelected?: boolean | undefined;
  readonly ariaPressed?: boolean | undefined;
  readonly tabIndex?: number;
  readonly onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
}

export function Button(props: ButtonProps): JSX.Element {
  const classes = [
    'btn',
    `btn--${props.variant ?? 'secondary'}`,
    props.wide === true ? 'btn--wide' : '',
  ];
  return (
    <button
      type="button"
      class={classes.join(' ')}
      disabled={props.disabled}
      title={props.title}
      role={props.role}
      aria-checked={props.ariaChecked}
      aria-selected={props.ariaSelected}
      aria-pressed={props.ariaPressed}
      tabIndex={props.tabIndex}
      onKeyDown={props.onKeyDown}
      onClick={() => {
        props.onClick();
      }}
    >
      {props.children}
    </button>
  );
}
