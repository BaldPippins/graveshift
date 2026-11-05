import type { ComponentChildren, JSX } from 'preact';

export interface SettingRowProps {
  readonly label: string;
  readonly children: ComponentChildren;
  readonly as?: 'div' | 'label';
  readonly class?: string;
}

export function SettingRow(props: SettingRowProps): JSX.Element {
  const Element = props.as ?? 'div';
  return (
    <Element class={props.class === undefined ? 'setting' : `setting ${props.class}`}>
      <span>{props.label}</span>
      {props.children}
    </Element>
  );
}
