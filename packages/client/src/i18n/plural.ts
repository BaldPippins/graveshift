export function pluralRu(count: number, one: string, few: string, many: string): string {
  const lastTwo = Math.abs(count) % 100;
  const last = lastTwo % 10;
  if (lastTwo > 10 && lastTwo < 20) {
    return many;
  }
  if (last === 1) {
    return one;
  }
  return last >= 2 && last <= 4 ? few : many;
}

export function pluralEn(count: number, one: string, other: string): string {
  return count === 1 ? one : other;
}

export function percentBonus(multiplier: number): number {
  return Math.round(Math.abs(multiplier - 1) * 100);
}
