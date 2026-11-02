import { Group } from 'three';
import type { HeroId } from '@graveshift/shared/config';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import { HERO_CONTENT } from '../../content/heroContent.ts';
import { AnimationName } from '../characters/clipTools.ts';
import type { CharacterRig } from '../characters/CharacterRig.ts';
import { createCharacterRig } from '../characters/createCharacterRig.ts';

const SPACING = 0.95;
const EMOTE_SECONDS = 1.6;

export class ShowcaseStage {
  readonly root = new Group();
  private readonly assets: AssetLibrary;
  private rigs: CharacterRig[] = [];
  private lineupKey = '';
  private emoteRemaining = 0;

  constructor(assets: AssetLibrary, x: number, y: number) {
    this.assets = assets;
    this.root.position.set(x, 0, y);
  }

  setLineup(heroes: readonly HeroId[]): void {
    const key = heroes.join(',');
    if (key === this.lineupKey) {
      return;
    }
    this.lineupKey = key;
    this.rigs.forEach((rig) => {
      rig.dispose();
    });
    this.rigs = heroes.map((hero, index) => {
      const model = HERO_CONTENT[hero].model;
      const rig = createCharacterRig(this.assets, model);
      rig.root.position.x = (index - (heroes.length - 1) / 2) * SPACING;
      rig.playBase(AnimationName.EmoteYes);
      this.root.add(rig.root);
      return rig;
    });
    this.emoteRemaining = EMOTE_SECONDS;
  }

  update(deltaSeconds: number): void {
    if (this.emoteRemaining > 0) {
      this.emoteRemaining -= deltaSeconds;
      if (this.emoteRemaining <= 0) {
        this.rigs.forEach((rig) => {
          rig.playBase(AnimationName.Idle);
        });
      }
    }
    this.rigs.forEach((rig) => {
      rig.update(deltaSeconds);
    });
  }
}
