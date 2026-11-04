import type { ComponentChildren, JSX } from 'preact';

export interface SettingRowProps {
  readonly label: string;
  readonly children: ComponentChildren;
}

export function SettingRow(props: SettingRowProps): JSX.Element {
  return (
    <div class="setting">
      <span>{props.label}</span>
      {props.children}
    </div>
  );
}
