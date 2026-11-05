import type { JSX } from 'preact';
import type { KeyHint } from '../../../i18n/Messages.ts';

interface KeyHintListProps {
  readonly title: string;
  readonly hints: readonly KeyHint[];
}

export function KeyHintList(props: KeyHintListProps): JSX.Element {
  return (
    <section class="howto__column">
      <h2>{props.title}</h2>
      <ul class="keys">
        {props.hints.map((hint) => (
          <li key={hint.action}>
            <span class="keys__combo">
              {hint.keys.map((key) => (
                <kbd key={key}>{key}</kbd>
              ))}
            </span>
            <span>{hint.action}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
