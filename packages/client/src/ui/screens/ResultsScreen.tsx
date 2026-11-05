import type { JSX } from 'preact';
import { MatchOutcome } from '@graveshift/shared/model';
import { Button } from '../components/Button.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { formatDuration } from '../format.ts';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';
import { MatchRanking } from './results/MatchRanking.tsx';
import { UnlockedAchievements } from './results/UnlockedAchievements.tsx';

export function ResultsScreen(): JSX.Element {
  const { ui, commands } = useServices();
  const messages = useMessages();
  const text = messages.results;
  const result = ui.matchResult.value;
  if (result === null) {
    return <ScreenFrame title={text.title}>{null}</ScreenFrame>;
  }
  const victory = result.outcome === MatchOutcome.Victory;
  return (
    <ScreenFrame
      title={victory ? text.victory : text.defeat}
      subtitle={text.subtitle(
        result.wave,
        result.totalWaves,
        formatDuration(result.durationSeconds),
      )}
      side="left"
      panelClass="panel--results"
      footer={
        <Button
          variant="primary"
          onClick={() => {
            commands.continueFromResults();
          }}
        >
          {messages.common.continue}
        </Button>
      }
    >
      <MatchRanking result={result} />
      <UnlockedAchievements result={result} />
    </ScreenFrame>
  );
}
