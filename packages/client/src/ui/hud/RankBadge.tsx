import type { JSX } from 'preact';
import { PALETTE } from '../../content/palette.ts';

const PODIUM_COLORS = [PALETTE.trophyGold, PALETTE.trophySilver, PALETTE.trophyBronze];

function cssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

interface RankBadgeProps {
  readonly place: number;
  readonly score: number;
}

export function RankBadge({ place, score }: RankBadgeProps): JSX.Element {
  const isPodium = score > 0 && place <= PODIUM_COLORS.length;

  return (
    <span
      class={isPodium ? 'scoreboard__rank is-podium' : 'scoreboard__rank'}
      style={{
        color: isPodium ? cssColor(PODIUM_COLORS[place - 1] ?? PALETTE.trophyGold) : undefined,
      }}
    >
      {isPodium ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d={
              'M7 3h10v2h4v2c0 3-2 5-5 5h-.1A5 5 0 0 1 13 15.9V19h4v2H7v-2h4' +
              'v-3.1A5 5 0 0 1 8.1 12H8c-3 0-5-2-5-5V5h4V3Zm0 4H5' +
              'c0 1.7.8 2.7 2.2 2.9A15 15 0 0 1 7 7Zm10 0c0 1-.1 2-.2 2.9' +
              'C18.2 9.7 19 8.7 19 7h-2Z'
            }
          />
        </svg>
      ) : null}
      <span style={{ color: isPodium ? cssColor(PALETTE.trophyNumber) : undefined }}>{place}</span>
    </span>
  );
}
