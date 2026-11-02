export function hasBit(mask: number, bit: number): boolean {
  return (mask & bit) !== 0;
}
