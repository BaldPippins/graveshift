import { cssColor } from './cssColor.ts';
import { PALETTE } from './palette.ts';

const HOTSPOT = 16;
const RETICLE = "<circle cx='16' cy='16' r='9'/><path d='M16 2v7M16 23v7M2 16h7M23 16h7'/>";

function svgColor(color: number): string {
  return encodeURIComponent(cssColor(color));
}

function crosshairSvg(): string {
  return (
    "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>" +
    "<g fill='none' stroke-linecap='round'>" +
    `<g stroke='${svgColor(PALETTE.crosshairShadow)}' stroke-opacity='0.6' stroke-width='4'>` +
    `${RETICLE}</g>` +
    `<g stroke='${svgColor(PALETTE.crosshairLine)}' stroke-width='2'>${RETICLE}</g></g>` +
    `<circle cx='16' cy='16' r='1.6' fill='${svgColor(PALETTE.crosshairDot)}'/></svg>`
  );
}

const CROSSHAIR_IMAGE = `url("data:image/svg+xml;utf8,${crosshairSvg()}")`;

export const CROSSHAIR_CURSOR = `${CROSSHAIR_IMAGE} ${HOTSPOT} ${HOTSPOT}, crosshair`;
