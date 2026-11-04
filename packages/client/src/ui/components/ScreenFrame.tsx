import type { ComponentChildren, JSX } from 'preact';
import { useMessages } from '../useMessages.ts';
import { Button } from './Button.tsx';

export interface ScreenFrameProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack?: () => void;
  readonly children: ComponentChildren;
  readonly footer?: ComponentChildren;
  readonly side?: 'center' | 'left';
  readonly wide?: boolean;
  readonly panelClass?: string;
}

export function ScreenFrame(props: ScreenFrameProps): JSX.Element {
  const back = useMessages().common.back;
  return (
    <section class={`screen screen--${props.side ?? 'center'}`}>
      <div class={['panel', props.wide === true ? 'panel--wide' : '', props.panelClass].join(' ')}>
        <header class="panel__header">
          {props.onBack === undefined ? null : (
            <Button variant="ghost" onClick={props.onBack} title={back}>
              ←
            </Button>
          )}
          <div>
            <h1 class="panel__title">{props.title}</h1>
            {props.subtitle === undefined ? null : <p class="panel__subtitle">{props.subtitle}</p>}
          </div>
        </header>
        <div class="panel__body">{props.children}</div>
        {props.footer === undefined ? null : <footer class="panel__footer">{props.footer}</footer>}
      </div>
    </section>
  );
}
