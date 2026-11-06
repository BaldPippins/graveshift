import type { JSX } from 'preact';
import type { LevelDefinition, LevelGeometryIssue } from '@graveshift/shared/world';
import type { Messages } from '../i18n/Messages.ts';
import type { EditorTexts } from './EditorTexts.ts';
import { EditorGeometrySettings } from './EditorGeometrySettings.tsx';
import { EditorWaveSettings } from './EditorWaveSettings.tsx';
import { EditorTeamSettings } from './EditorTeamSettings.tsx';
import { EditorWeaponSettings } from './EditorWeaponSettings.tsx';

export interface EditorSettingsProps {
  readonly level: LevelDefinition;
  readonly issues: readonly LevelGeometryIssue[];
  readonly messages: Messages;
  readonly text: EditorTexts;
  readonly onChange: (level: LevelDefinition) => void;
  readonly onResize: (width: number, height: number) => boolean;
}

export function EditorSettings(props: EditorSettingsProps): JSX.Element {
  const count = (paths: readonly string[]): string => {
    const total = props.issues.filter((issue) =>
      paths.some((path) => issue.path === path || issue.path.startsWith(`${path}.`)),
    ).length;
    return total === 0 ? '' : ` · ${total}`;
  };
  return (
    <aside class="editor-settings">
      <h2>{props.text.settings}</h2>
      <details open>
        <summary>
          {props.text.geometry}
          {count(['id', 'width', 'height', 'rows'])}
        </summary>
        <EditorGeometrySettings {...props} />
      </details>
      <details>
        <summary>
          {props.text.waves}
          {count(['waves'])}
        </summary>
        <EditorWaveSettings {...props} />
      </details>
      <details>
        <summary>
          {props.text.team}
          {count(['team'])}
        </summary>
        <EditorTeamSettings {...props} />
      </details>
      <details>
        <summary>
          {props.text.weapons}
          {count(['weapons'])}
        </summary>
        <EditorWeaponSettings {...props} />
      </details>
    </aside>
  );
}
