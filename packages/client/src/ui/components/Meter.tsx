import type { JSX } from 'preact';

export interface MeterProps {
  readonly value: number;
  readonly tone?: 'health' | 'progress' | 'gold' | 'danger';
  readonly label?: string;
}

export function Meter(props: MeterProps): JSX.Element {
  const width = `${Math.round(Math.min(1, Math.max(0, props.value)) * 100)}%`;
  return (
    <div class={`meter meter--${props.tone ?? 'progress'}`}>
      <div class="meter__fill" style={{ width }} />
      {props.label === undefined ? null : <span class="meter__label">{props.label}</span>}
    </div>
  );
}
