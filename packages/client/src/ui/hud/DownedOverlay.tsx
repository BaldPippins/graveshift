import type { JSX } from 'preact';
import { LifeState } from '@graveshift/shared/model';
import type { HudState } from '../../app/state/HudState.ts';
import { Meter } from '../components/Meter.tsx';
import { useMessages } from '../useMessages.ts';

export interface DownedOverlayProps {
  readonly hud: HudState;
}

export function DownedOverlay(props: DownedOverlayProps): JSX.Element | null {
  const hud = props.hud;
  const text = useMessages().downed;
  if (hud.life === LifeState.Alive) {
    return null;
  }
  if (hud.life === LifeState.Dead) {
    return (
      <div class="downed">
        <h2>{text.deadTitle}</h2>
        <p>{text.deadText}</p>
      </div>
    );
  }
  const beingRevived = hud.reviveProgress > 0;
  return (
    <div class="downed">
      <h2>{text.downedTitle}</h2>
      <p>{beingRevived ? text.beingRevived : text.waitingRevive}</p>
      {beingRevived ? (
        <Meter value={hud.reviveProgress} tone="health" label={text.revive} />
      ) : (
        <Meter value={hud.bleedoutProgress} tone="danger" label={text.bleeding} />
      )}
    </div>
  );
}
