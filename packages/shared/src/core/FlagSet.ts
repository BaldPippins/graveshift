export interface FlagSetBrand<TFlag extends number> {
  readonly flagSetOf: TFlag;
}

export type FlagSet<TFlag extends number> = number & FlagSetBrand<TFlag>;

function maskOf(flags: readonly number[]): number {
  return flags.reduce((mask, flag) => mask | flag, 0);
}

export function flagSetOf<TFlag extends number>(flags: readonly TFlag[]): FlagSet<TFlag> {
  return maskOf(flags) as FlagSet<TFlag>;
}

export function hasFlag<TFlag extends number>(set: FlagSet<TFlag>, flag: TFlag): boolean {
  return (set & flag) !== 0;
}

export function isFlagSetOf<TFlag extends number>(
  mask: number,
  flags: readonly TFlag[],
): mask is FlagSet<TFlag> {
  return Number.isInteger(mask) && mask >= 0 && (mask & ~maskOf(flags)) === 0;
}
