import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { AppScreen } from '../../app/AppScreen.ts';
import { GRAPHICS_QUALITIES, TOUCH_CONTROLS_MODES } from '../../meta/settings/Settings.ts';
import { Button } from '../components/Button.tsx';
import { LanguageSwitch } from '../components/LanguageSwitch.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

export interface SettingsPanelProps {
  readonly onBack: () => void;
}

export function SettingsPanel(props: SettingsPanelProps): JSX.Element {
  const { commands, settings } = useServices();
  const [confirmReset, setConfirmReset] = useState(false);
  const current = settings.current.value;
  const messages = useMessages();
  const text = messages.settings;
  return (
    <ScreenFrame title={text.title} onBack={props.onBack}>
      <div class="settings">
        <div class="setting">
          <span>{messages.common.language}</span>
          <LanguageSwitch />
        </div>
        <div class="setting">
          <span>{text.graphics}</span>
          <div class="segmented">
            {GRAPHICS_QUALITIES.map((quality) => (
              <Button
                key={quality}
                variant={current.quality === quality ? 'primary' : 'ghost'}
                onClick={() => {
                  commands.updateSettings({ quality });
                }}
              >
                {text.qualities[quality]}
              </Button>
            ))}
          </div>
        </div>
        <div class="setting">
          <span>{text.touch}</span>
          <div class="segmented">
            {TOUCH_CONTROLS_MODES.map((mode) => (
              <Button
                key={mode}
                variant={current.touchControls === mode ? 'primary' : 'ghost'}
                onClick={() => {
                  commands.updateSettings({ touchControls: mode });
                }}
              >
                {text.touchModes[mode]}
              </Button>
            ))}
          </div>
        </div>
        <label class="setting setting--toggle">
          <span>{text.screenShake}</span>
          <input
            type="checkbox"
            checked={current.screenShake}
            onChange={(event) => {
              commands.updateSettings({ screenShake: event.currentTarget.checked });
            }}
          />
        </label>
        <label class="setting setting--toggle">
          <span>{text.cameraAimLead}</span>
          <input
            type="checkbox"
            checked={current.cameraAimLead}
            onChange={(event) => {
              commands.updateSettings({ cameraAimLead: event.currentTarget.checked });
            }}
          />
        </label>
        <label class="setting setting--toggle">
          <span>{text.showFps}</span>
          <input
            type="checkbox"
            checked={current.showFps}
            onChange={(event) => {
              commands.updateSettings({ showFps: event.currentTarget.checked });
            }}
          />
        </label>
        <div class="setting">
          <span>{text.screen}</span>
          <Button
            onClick={() => {
              commands.toggleFullscreen();
            }}
          >
            {text.fullscreen}
          </Button>
        </div>
        <div class="setting">
          <span>{text.progress}</span>
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
        </div>
      </div>
    </ScreenFrame>
  );
}

export function SettingsScreen(): JSX.Element {
  const { commands } = useServices();
  return (
    <SettingsPanel
      onBack={() => {
        commands.navigate(AppScreen.MainMenu);
      }}
    />
  );
}
