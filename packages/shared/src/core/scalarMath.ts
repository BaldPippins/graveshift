export const FULL_TURN = Math.PI * 2;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function wrapAngle(angle: number): number {
  const wrapped = (angle + Math.PI) % FULL_TURN;
  return (wrapped < 0 ? wrapped + FULL_TURN : wrapped) - Math.PI;
}

export function lerpAngle(from: number, to: number, t: number): number {
  return from + wrapAngle(to - from) * t;
}

export function exponentialDecayFactor(sharpness: number, deltaSeconds: number): number {
  return 1 - Math.exp(-sharpness * deltaSeconds);
}

export function fractionOf(part: number, whole: number): number {
  return whole > 0 ? part / whole : 0;
}
