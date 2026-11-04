import type { JSX } from 'preact';
import type { MatchResult } from '../../../app/state/MatchResult.ts';
import { ACHIEVEMENT_ICONS } from '../../../content/achievementContent.ts';
import { useMessages } from '../../useMessages.ts';

export interface UnlockedAchievementsProps {
  readonly result: MatchResult;
}

export function UnlockedAchievements(props: UnlockedAchievementsProps): JSX.Element | null {
  const messages = useMessages();
  const text = messages.results;
  return props.result.unlockedAchievements.length === 0 ? null : (
    <div class="unlocked">
      <h2>{text.newAchievements}</h2>
      <div class="unlocked__list">
        {props.result.unlockedAchievements.map((id) => (
          <span key={id} class="badge badge--gold">
            {ACHIEVEMENT_ICONS[id]} {messages.achievementTexts[id].title}
          </span>
        ))}
      </div>
    </div>
  );
}
