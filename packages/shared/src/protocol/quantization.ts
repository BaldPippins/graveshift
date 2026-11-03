import { FULL_TURN, clamp } from '../core/scalarMath.ts';

const AXIS_SCALE = 127;
const ANGLE_STEPS = 65536;
const RATIO_SCALE = 255;
const MAX_MILLISECONDS = 65535;

export function quantizeAxis(value: number): number {
  return Math.round(clamp(value, -1, 1) * AXIS_SCALE);
}

export function dequantizeAxis(value: number): number {
  return value / AXIS_SCALE;
}

export function quantizeAngle(radians: number): number {
  const turns = (((radians % FULL_TURN) + FULL_TURN) % FULL_TURN) / FULL_TURN;
  return Math.round(turns * ANGLE_STEPS) % ANGLE_STEPS;
}

export function dequantizeAngle(value: number): number {
  const radians = (value / ANGLE_STEPS) * FULL_TURN;
  return radians > Math.PI ? radians - FULL_TURN : radians;
}

export function quantizeRatio(value: number): number {
  return Math.round(clamp(value, 0, 1) * RATIO_SCALE);
}

export function dequantizeRatio(value: number): number {
  return value / RATIO_SCALE;
}

export function quantizeMilliseconds(value: number): number {
  return Math.round(clamp(value, 0, MAX_MILLISECONDS));
}

export function roundTripAxis(value: number): number {
  return dequantizeAxis(quantizeAxis(value));
}

export function roundTripAngle(radians: number): number {
  return dequantizeAngle(quantizeAngle(radians));
}
