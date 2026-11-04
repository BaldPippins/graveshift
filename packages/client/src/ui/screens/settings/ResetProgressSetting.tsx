import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { Button } from '../../components/Button.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';
import { SettingRow } from './SettingRow.tsx';

export function ResetProgressSetting(): JSX.Element {
  const { commands } = useServices();
  const messages = useMessages();
  const text = messages.settings;
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <SettingRow label={text.progress}>
      {confirmReset ? (
        <div class="segmented">
          <Button
            variant="danger"
            onClick={() => {
              commands.resetProgress();
              setConfirmReset(false);
            }}
          >
            {text.confirmReset}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setConfirmReset(false);
            }}
          >
            {messages.common.cancel}
          </Button>
        </div>
      ) : (
        <Button
          variant="danger"
          onClick={() => {
            setConfirmReset(true);
          }}
        >
          {text.reset}
        </Button>
      )}
    </SettingRow>
  );
}
