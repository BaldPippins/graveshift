import type { JSX } from 'preact';

interface RuleListProps {
  readonly rules: readonly string[];
}

export function RuleList(props: RuleListProps): JSX.Element {
  return (
    <ul class="howto__rules">
      {props.rules.map((rule) => (
        <li key={rule}>{rule}</li>
      ))}
    </ul>
  );
}
