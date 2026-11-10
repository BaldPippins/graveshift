import { TrapKind } from '@graveshift/shared/config';
import { TILE_KINDS, TileKind } from '@graveshift/shared/world';
import type { AssetLibrary } from '../../assets/AssetLibrary.ts';
import { ModelKey } from '../../assets/ModelKey.ts';
import type { ModelKey as ModelKeyType } from '../../assets/ModelKey.ts';
import { TRAP_CONTENT } from '../../content/trapContent.ts';
import { TILE_APPEARANCE } from '../map/tileAppearance.ts';
import { PortraitStudio } from './PortraitStudio.ts';

function modelOf(kind: TileKind): ModelKeyType | null {
  const appearance = TILE_APPEARANCE[kind];
  if (appearance !== null) {
    return appearance.model;
  }
  switch (kind) {
    case TileKind.PowderKegSpot:
      return TRAP_CONTENT[TrapKind.PowderKeg].armedModel;
    case TileKind.BearTrapSpot:
      return TRAP_CONTENT[TrapKind.BearTrap].armedModel;
    case TileKind.PumpkinPatch:
      return ModelKey.Pumpkin;
    case TileKind.Merchant:
      return ModelKey.Keeper;
    case TileKind.PlayerSpawn:
      return ModelKey.HeroPippin;
    default:
      return null;
  }
}

export function captureTilePortraits(assets: AssetLibrary): ReadonlyMap<TileKind, string> {
  const studio = new PortraitStudio();
  const portraits = new Map<TileKind, string>();
  try {
    for (const kind of TILE_KINDS) {
      const model = modelOf(kind);
      if (model !== null) {
        portraits.set(kind, studio.shoot(assets.instantiate(model)));
      }
    }
  } finally {
    studio.dispose();
  }
  return portraits;
}
