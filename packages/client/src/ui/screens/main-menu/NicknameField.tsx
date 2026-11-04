import type { JSX } from 'preact';
import { ROOM_RULES } from '@graveshift/shared/config';
import { TextField } from '../../components/TextField.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';

export function NicknameField(): JSX.Element {
  const { commands, settings } = useServices();
  const current = settings.current.value;
  const text = useMessages().menu;
  return (
    <label class="field">
      <span>{text.nickname}</span>
      <TextField
        value={current.nickname}
        maxLength={ROOM_RULES.maxNicknameLength}
        placeholder={text.nicknamePlaceholder}
        onInput={(nickname) => {
          commands.updateSettings({ nickname });
        }}
      />
    </label>
  );
}
