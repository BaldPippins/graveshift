import type { JSX } from 'preact';
import { LifeState } from '@graveshift/shared/model';
import type { TeammateHud } from '../../app/state/HudState.ts';
import { HERO_CONTENT } from '../../content/heroContent.ts';
import { Meter } from '../components/Meter.tsx';

export interface TeamPanelProps {
  readonly teammates: readonly TeammateHud[];
}

export function TeamPanel(props: TeamPanelProps): JSX.Element | null {
  const others = props.teammates.filter((teammate) => !teammate.isLocal);
  if (others.length === 0) {
    return null;
  }
  return (
    <div class="team">
      {others.map((teammate) => (
        <div
          key={teammate.id}
          class="team__member"
          style={{ '--hero-color': HERO_CONTENT[teammate.hero].color }}
        >
          <span class="team__name">
            {teammate.statusIcon} {teammate.nickname}
          </span>
          <Meter
            value={teammate.healthFraction}
            tone={teammate.life === LifeState.Alive ? 'health' : 'danger'}
          />
        </div>
      ))}
    </div>
  );
}
