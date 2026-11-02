import { GraphicsQuality } from '../meta/settings/Settings.ts';

export interface RenderQualityProfile {
  readonly maxPixelRatio: number;
  readonly shadows: boolean;
  readonly pointLights: boolean;
}

export const RENDER_QUALITY: Readonly<Record<GraphicsQuality, RenderQualityProfile>> = {
  [GraphicsQuality.Low]: { maxPixelRatio: 1, shadows: false, pointLights: false },
  [GraphicsQuality.Medium]: { maxPixelRatio: 1.5, shadows: false, pointLights: true },
  [GraphicsQuality.High]: { maxPixelRatio: 2, shadows: true, pointLights: true },
};
