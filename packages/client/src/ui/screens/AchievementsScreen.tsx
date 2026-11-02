import type { JSX } from 'preact';
import { AppScreen } from '../../app/AppScreen.ts';
import { ACHIEVEMENT_ICONS } from '../../content/achievementContent.ts';
import { ACHIEVEMENTS } from '../../meta/achievements/achievementCatalog.ts';
import { Meter } from '../components/Meter.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { formatNumber } from '../format.ts';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

export function AchievementsScreen(): JSX.Element {
  const { commands, progression } = useServices();
  const messages = useMessages();
  const unlocked = progression.achievements.unlocked.value;
  const unlockedCount = ACHIEVEMENTS.filter(
    (definition) => unlocked[definition.id] !== undefined,
  ).length;
  return (
    <ScreenFrame
      title={messages.achievements.title}
      subtitle={messages.achievements.progress(unlockedCount, ACHIEVEMENTS.length)}
      onBack={() => {
        commands.navigate(AppScreen.MainMenu);
      }}
    >
      <div class="achievement-grid">
        {ACHIEVEMENTS.map((definition) => {
          const texts = messages.achievementTexts[definition.id];
          const done = unlocked[definition.id] !== undefined;
          const progress = progression.achievements.progressOf(definition);
          const reached = formatNumber(progress * definition.target, messages);
          const target = formatNumber(definition.target, messages);
          return (
            <article
              key={definition.id}
              class={done ? 'achievement achievement--done' : 'achievement'}
            >
              <span class="achievement__icon">
                {done ? ACHIEVEMENT_ICONS[definition.id] : '🔒'}
              </span>
              <div class="achievement__text">
                <strong>{texts.title}</strong>
                <small>{texts.description(definition.target)}</small>
                {done || definition.target === 1 ? null : (
                  <Meter value={progress} label={`${reached} / ${target}`} />
                )}
              </div>
            </article>
          );
        })}
      </div>
    </ScreenFrame>
  );
}
