import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { ROOM_RULES } from '@graveshift/shared/config';
import { Button } from '../../components/Button.tsx';
import { TextField } from '../../components/TextField.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';

export function JoinRoomForm(): JSX.Element {
  const { ui, commands } = useServices();
  const text = useMessages().menu;
  const [code, setCode] = useState('');
  const busy = ui.busy.value;
  return (
    <div class="join-row">
      <TextField
        class="join-row__code"
        value={code}
        maxLength={ROOM_RULES.codeLength}
        placeholder={text.codePlaceholder}
        onInput={(value) => {
          setCode(value.toUpperCase());
        }}
      />
      <Button
        disabled={busy || code.length !== ROOM_RULES.codeLength}
        onClick={() => {
          void commands.joinRoom(code);
        }}
      >
        {text.join}
      </Button>
    </div>
  );
}
