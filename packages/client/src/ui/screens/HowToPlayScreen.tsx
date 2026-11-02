import type { JSX } from 'preact';
import { ENEMIES, ENEMY_KINDS } from '@graveshift/shared/config';
import { AppScreen } from '../../app/AppScreen.ts';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useServices } from '../ServicesContext.ts';
import { useMessages } from '../useMessages.ts';

export function HowToPlayScreen(): JSX.Element {
  const { commands } = useServices();
  const messages = useMessages();
  const text = messages.howTo;
  return (
    <ScreenFrame
      title={text.title}
      subtitle={text.subtitle}
      onBack={() => {
        commands.navigate(AppScreen.MainMenu);
      }}
    >
      <div class="howto">
        <section>
          <h2>{text.controlsTitle}</h2>
          <ul class="keys">
            {text.controls.map((hint) => (
              <li key={hint.action}>
                {hint.keys.map((key) => (
                  <kbd key={key}>{key}</kbd>
                ))}{' '}
                {hint.action}
              </li>
            ))}
            <li>{text.touchHint}</li>
          </ul>
        </section>
        <section>
          <h2>{text.rulesTitle}</h2>
          <ul>
            {text.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>{text.bestiaryTitle}</h2>
          <div class="bestiary">
            {ENEMY_KINDS.map((kind) => (
              <article key={kind} class="bestiary__entry">
                <strong>{messages.enemies[kind].name}</strong>
                <small>{messages.enemies[kind].description}</small>
                <span class="bestiary__stats">
                  ❤ {ENEMIES[kind].maxHealth} · ⚔ {ENEMIES[kind].attackDamage} · 💰{' '}
                  {ENEMIES[kind].bounty}
                </span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </ScreenFrame>
  );
}
