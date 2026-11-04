import type { JSX } from 'preact';
import { Checkbox } from '../../components/Checkbox.tsx';

export interface ToggleSettingProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

export function ToggleSetting(props: ToggleSettingProps): JSX.Element {
  return (
    <label class="setting setting--toggle">
      <span>{props.label}</span>
      <Checkbox checked={props.checked} onChange={props.onChange} />
    </label>
  );
}
