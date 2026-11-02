import type { JSX } from 'preact';
import { BOT_RULES, ROOM_RULES } from '@graveshift/shared/config';
import { useMessages } from '../useMessages.ts';

export interface BotCountPickerProps {
  readonly humans: number;
  readonly bots: number;
  readonly editable: boolean;
  readonly onChange: (count: number) => void;
}

export function BotCountPicker(props: BotCountPickerProps): JSX.Element {
  const text = useMessages().lobby;
  const limit = Math.min(BOT_RULES.maxBots, ROOM_RULES.maxPlayers - props.humans);
  const options = Array.from({ length: Math.max(0, limit) + 1 }, (_, count) => count);
  return (
    <div class="bot-picker">
      <span class="bot-picker__label">{text.bots}</span>
      <div class="bot-picker__options" role="radiogroup">
        {options.map((count) => (
          <button
            key={count}
            type="button"
            role="radio"
            aria-checked={count === props.bots}
            class={
              count === props.bots
                ? 'bot-picker__option bot-picker__option--active'
                : 'bot-picker__option'
            }
            disabled={!props.editable}
            onClick={() => {
              props.onChange(count);
            }}
          >
            {count}
          </button>
        ))}
      </div>
      {props.editable ? null : <small class="bot-picker__hint">{text.botsHostOnly}</small>}
    </div>
  );
}
