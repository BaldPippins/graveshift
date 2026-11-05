import type { JSX } from 'preact';

export interface SliderProps {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly onInput: (value: number) => void;
}

export function Slider(props: SliderProps): JSX.Element {
  return (
    <input
      type="range"
      min={props.min}
      max={props.max}
      step={props.step}
      value={props.value}
      onInput={(event) => {
        props.onInput(event.currentTarget.valueAsNumber);
      }}
    />
  );
}
