import type { JSX } from 'preact';
import { Checkbox } from '../../components/Checkbox.tsx';
import { SettingRow } from './SettingRow.tsx';

export interface ToggleSettingProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

export function ToggleSetting(props: ToggleSettingProps): JSX.Element {
  return (
    <SettingRow as="label" class="setting--toggle" label={props.label}>
      <Checkbox checked={props.checked} onChange={props.onChange} />
    </SettingRow>
  );
}
