import { WEAPON_IDS } from '@graveshift/shared/config';
import { WEAPON_CONTENT } from '../content/weaponContent.ts';
import { ModelKey, weaponModelKey } from './ModelKey.ts';
import type { StaticModelKey, WeaponModelKey } from './ModelKey.ts';
import { KenneyPack, kenneyModel as model, ModelFit } from './ModelSpec.ts';
import type { ModelSpec } from './ModelSpec.ts';

const GRAVEYARD = KenneyPack.Graveyard;
const CHARACTERS = KenneyPack.Characters;
const DUNGEON = KenneyPack.Dungeon;

const STATIC_MODELS: Readonly<Record<StaticModelKey, ModelSpec>> = {
  [ModelKey.HeroPippin]: model(CHARACTERS, 'character-male-b', ModelFit.Height, 0.95),
  [ModelKey.HeroWatchman]: model(CHARACTERS, 'character-male-c', ModelFit.Height, 0.95),
  [ModelKey.HeroLamplighter]: model(CHARACTERS, 'character-female-b', ModelFit.Height, 0.95),
  [ModelKey.HeroUndertaker]: model(CHARACTERS, 'character-male-d', ModelFit.Height, 0.95),
  [ModelKey.HeroAgatha]: model(CHARACTERS, 'character-female-c', ModelFit.Height, 0.95),
  [ModelKey.Zombie]: model(GRAVEYARD, 'character-zombie', ModelFit.Height, 1.0),
  [ModelKey.Skeleton]: model(GRAVEYARD, 'character-skeleton', ModelFit.Height, 0.95),
  [ModelKey.Ghost]: model(GRAVEYARD, 'character-ghost', ModelFit.Height, 1.0),
  [ModelKey.Brute]: model(DUNGEON, 'character-orc', ModelFit.Height, 1.45),
  [ModelKey.Vampire]: model(GRAVEYARD, 'character-vampire', ModelFit.Height, 1.3),
  [ModelKey.Keeper]: model(GRAVEYARD, 'character-keeper', ModelFit.Height, 1.0),
  [ModelKey.GraveRound]: model(GRAVEYARD, 'gravestone-round', ModelFit.Footprint, 0.7),
  [ModelKey.GraveCross]: model(GRAVEYARD, 'gravestone-cross', ModelFit.Footprint, 0.7),
  [ModelKey.GraveBroken]: model(GRAVEYARD, 'gravestone-broken', ModelFit.Footprint, 0.7),
  [ModelKey.GraveWide]: model(GRAVEYARD, 'gravestone-wide', ModelFit.Footprint, 0.85),
  [ModelKey.GraveDecorative]: model(GRAVEYARD, 'gravestone-decorative', ModelFit.Footprint, 0.75),
  [ModelKey.Crypt]: model(GRAVEYARD, 'crypt', ModelFit.Footprint, 1.0),
  [ModelKey.Pine]: model(GRAVEYARD, 'pine', ModelFit.Height, 2.4),
  [ModelKey.PineCrooked]: model(GRAVEYARD, 'pine-crooked', ModelFit.Height, 2.1),
  [ModelKey.IronFence]: model(GRAVEYARD, 'iron-fence', ModelFit.Footprint, 1.0),
  [ModelKey.StoneWall]: model(GRAVEYARD, 'stone-wall', ModelFit.Footprint, 1.0),
  [ModelKey.Lightpost]: model(GRAVEYARD, 'lightpost-single', ModelFit.Height, 2.0),
  [ModelKey.Pumpkin]: model(GRAVEYARD, 'pumpkin-carved', ModelFit.Footprint, 0.45),
  [ModelKey.Rocks]: model(GRAVEYARD, 'rocks', ModelFit.Footprint, 0.85),
  [ModelKey.Coffin]: model(GRAVEYARD, 'coffin', ModelFit.Footprint, 0.9),
  [ModelKey.OpenGrave]: model(GRAVEYARD, 'grave', ModelFit.Footprint, 0.95),
  [ModelKey.FireBasket]: model(GRAVEYARD, 'fire-basket', ModelFit.Height, 0.8),
  [ModelKey.Candles]: model(GRAVEYARD, 'candle-multiple', ModelFit.Footprint, 0.4),
  [ModelKey.Coin]: model(DUNGEON, 'coin', ModelFit.Longest, 0.35),
  [ModelKey.Potion]: model(DUNGEON, 'potion', ModelFit.Height, 0.45),
};

const WEAPON_MODELS = Object.fromEntries(
  WEAPON_IDS.map((weapon) => [weaponModelKey(weapon), WEAPON_CONTENT[weapon].model]),
) as Record<WeaponModelKey, ModelSpec>;

export const MODEL_MANIFEST: Readonly<Record<ModelKey, ModelSpec>> = {
  ...STATIC_MODELS,
  ...WEAPON_MODELS,
};
