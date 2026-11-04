import { PALETTE } from '../../content/palette.ts';

export interface HealthBarStyle {
  readonly fillColor: number;
  readonly showWhenFull: boolean;
}

export const ENEMY_HEALTH_BAR: HealthBarStyle = { fillColor: 0xd9433b, showWhenFull: false };
export const PLAYER_HEALTH_BAR: HealthBarStyle = { fillColor: 0x5fd36a, showWhenFull: true };
export const MERCHANT_HEALTH_BAR: HealthBarStyle = { fillColor: PALETTE.gold, showWhenFull: false };
export const OBSTACLE_HEALTH_BAR: HealthBarStyle = {
  fillColor: PALETTE.obstacleHealth,
  showWhenFull: false,
};
