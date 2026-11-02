import type { ComponentChildren, JSX } from 'preact';

export interface ButtonProps {
  readonly children: ComponentChildren;
  readonly onClick: () => void;
  readonly variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  readonly disabled?: boolean;
  readonly wide?: boolean;
  readonly title?: string;
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
      onClick={() => {
        props.onClick();
      }}
    >
      {props.children}
    </button>
  );
}
