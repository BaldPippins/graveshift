import type { JSX } from 'preact';
import { ENEMIES, ENEMY_KINDS } from '@graveshift/shared/config';
import { ENEMY_CONTENT } from '../../../content/enemyContent.ts';
import { useServices } from '../../ServicesContext.ts';
import { useMessages } from '../../useMessages.ts';

export function Bestiary(): JSX.Element {
  const { ui } = useServices();
  const messages = useMessages();
  const portraits = ui.enemyPortraits.value;
  return (
    <div class="bestiary">
      {ENEMY_KINDS.map((kind) => {
        const portrait = portraits.get(kind);
        return (
          <article key={kind} class="bestiary__entry">
            {portrait === undefined ? (
              <span class="bestiary__portrait">{ENEMY_CONTENT[kind].icon}</span>
            ) : (
              <img class="bestiary__portrait" src={portrait} alt="" />
            )}
            <div class="bestiary__text">
              <strong>{messages.enemies[kind].name}</strong>
              <small>{messages.enemies[kind].description}</small>
              <span class="bestiary__stats">
                ❤ {ENEMIES[kind].maxHealth} · ⚔ {ENEMIES[kind].attackDamage} · 💰{' '}
                {ENEMIES[kind].bounty}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
