import { ModelKey } from './ModelKey.ts';
import { ModelFit } from './ModelSpec.ts';
import type { ModelSpec } from './ModelSpec.ts';

const BASE = `${import.meta.env.BASE_URL}assets/kenney`;

function model(pack: string, file: string, fit: ModelFit, size: number): ModelSpec {
  return { url: `${BASE}/${pack}/${file}.glb`, fit, size };
}

const GRAVEYARD = 'graveyard-kit';
const CHARACTERS = 'mini-characters';
const DUNGEON = 'mini-dungeon';
const BLASTERS = 'blaster-kit';

export const MODEL_MANIFEST: Readonly<Record<ModelKey, ModelSpec>> = {
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
  [ModelKey.Pistol]: model(BLASTERS, 'blaster-a', ModelFit.Longest, 0.42),
  [ModelKey.Smg]: model(BLASTERS, 'blaster-d', ModelFit.Longest, 0.55),
  [ModelKey.Shotgun]: model(BLASTERS, 'blaster-l', ModelFit.Longest, 0.6),
  [ModelKey.Rifle]: model(BLASTERS, 'blaster-e', ModelFit.Longest, 0.75),
  [ModelKey.Gatling]: model(BLASTERS, 'blaster-p', ModelFit.Longest, 0.7),
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
