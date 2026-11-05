import type { JSX } from 'preact';
import { Button } from '../../components/Button.tsx';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';
import { SettingRow } from './SettingRow.tsx';

export function FullscreenSetting(): JSX.Element {
  const { commands } = useServices();
  const text = useMessages().settings;
  return (
    <SettingRow label={text.screen}>
      <Button
        onClick={() => {
          commands.toggleFullscreen();
        }}
      >
        {text.fullscreen}
      </Button>
    </SettingRow>
  );
}
