import type { JSX } from 'preact';
import { Checkbox } from '../ui/components/Checkbox.tsx';
import type { AdminLevel } from './AdminLevel.ts';
import type { AdminTexts } from './AdminTexts.ts';

export interface AdminLevelsProps {
  readonly text: AdminTexts;
  readonly levels: readonly AdminLevel[];
  readonly names: Readonly<Record<string, string>>;
  readonly busy: boolean;
  readonly onChange: (id: string, enabled: boolean) => void;
}

export function AdminLevels(props: AdminLevelsProps): JSX.Element {
  return (
    <section class="admin-section">
      <h2>{props.text.maps}</h2>
      <p>{props.text.mapHint}</p>
      <div class="admin-levels">
        {props.levels.map((level) => (
          <label class="admin-level" key={level.id}>
            <span>
              <strong>{props.names[level.id] ?? level.id}</strong>
              <small>{level.enabled ? props.text.enabled : props.text.disabled}</small>
            </span>
            <Checkbox
              checked={level.enabled}
              disabled={props.busy}
              onChange={(enabled) => {
                props.onChange(level.id, enabled);
              }}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
