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
  return (
    <aside class="editor-settings">
      <EditorGeometrySettings {...props} />
      <EditorWaveSettings {...props} />
      <EditorTeamSettings {...props} />
      <EditorWeaponSettings {...props} />
    </aside>
  );
}
