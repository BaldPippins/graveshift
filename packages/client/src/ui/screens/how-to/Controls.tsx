import type { JSX } from 'preact';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';
import { KeyHintList } from './KeyHintList.tsx';

export function Controls(): JSX.Element {
  const { ui } = useServices();
  const text = useMessages().howTo;
  const keyboard = <KeyHintList title={text.keyboardTitle} hints={text.controls} />;
  const touch = <KeyHintList title={text.touchTitle} hints={text.touchControls} />;
  return (
    <div class="howto__columns">
      {ui.touchControls.value ? touch : keyboard}
      {ui.touchControls.value ? keyboard : touch}
    </div>
  );
}
