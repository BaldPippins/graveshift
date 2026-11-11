import { GRAVEYARD_LEVEL } from '@graveshift/shared/world';
import type { LevelDefinition } from '@graveshift/shared/world';

function equalValue(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length && left.every((value, index) => equalValue(value, right[index]))
    );
  }
  if (typeof left !== 'object' || left === null || typeof right !== 'object' || right === null) {
    return false;
  }
  const first = left as Readonly<Record<string, unknown>>;
  const second = right as Readonly<Record<string, unknown>>;
  const keys = Object.keys(first);
  return (
    keys.length === Object.keys(second).length &&
    keys.every((key) => Object.hasOwn(second, key) && equalValue(first[key], second[key]))
  );
}

export function isOfficialLevel(level: LevelDefinition): boolean {
  return level.id === GRAVEYARD_LEVEL.id && equalValue(level, GRAVEYARD_LEVEL);
}
