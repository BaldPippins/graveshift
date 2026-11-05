import type { JSX } from 'preact';
import type { EditorSettingsProps } from './EditorSettings.tsx';
import { EditorFieldErrors } from './EditorFieldErrors.tsx';

export function EditorGeometrySettings(props: EditorSettingsProps): JSX.Element {
  const { level, text } = props;
  const errors = (path: string): JSX.Element => (
    <EditorFieldErrors path={path} issues={props.issues} text={text} />
  );
  return (
    <fieldset>
      <legend>{text.geometry}</legend>
      <label>
        {text.id}
        <input
          value={level.id}
          onInput={(event) => {
            props.onChange({ ...level, id: event.currentTarget.value });
          }}
        />
        {errors('id')}
      </label>
      <label>
        {text.width}
        <input
          type="number"
          min="8"
          max="64"
          value={level.width}
          onChange={(event) => {
            if (!props.onResize(Number(event.currentTarget.value), level.height)) {
              event.currentTarget.value = String(level.width);
            }
          }}
        />
        {errors('width')}
      </label>
      <label>
        {text.height}
        <input
          type="number"
          min="8"
          max="64"
          value={level.height}
          onChange={(event) => {
            if (!props.onResize(level.width, Number(event.currentTarget.value))) {
              event.currentTarget.value = String(level.height);
            }
          }}
        />
        {errors('height')}
      </label>
    </fieldset>
  );
}
