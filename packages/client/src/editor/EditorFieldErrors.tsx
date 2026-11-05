import type { JSX } from 'preact';
import type { LevelGeometryIssue } from '@graveshift/shared/world';
import type { EditorTexts } from './EditorTexts.ts';

interface FieldErrorsProps {
  readonly path: string;
  readonly issues: readonly LevelGeometryIssue[];
  readonly text: EditorTexts;
}

export function EditorFieldErrors(props: FieldErrorsProps): JSX.Element {
  return (
    <>
      {props.issues
        .filter((issue) => issue.path === props.path)
        .map((issue, index) => (
          <small class="editor-error" key={`${issue.code}-${index}`}>
            {props.text.issueNames[issue.code] ?? issue.code}
          </small>
        ))}
    </>
  );
}
