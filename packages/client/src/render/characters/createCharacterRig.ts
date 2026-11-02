import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import type { ModelKey } from '../../assets/ModelKey.ts';
import { CharacterRig } from './CharacterRig.ts';

const OPAQUE = 1;

export function createCharacterRig(
  assets: AssetLibrary,
  model: ModelKey,
  opacity: number = OPAQUE,
): CharacterRig {
  const rig = new CharacterRig(assets.instantiate(model), assets.clips(model));
  if (opacity < OPAQUE) {
    rig.setOpacity(opacity);
  }
  return rig;
}
