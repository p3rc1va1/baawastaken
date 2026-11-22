export interface WireSegment {
  x: number;
  y: number;
  w: number;
}

export interface Bulb {
  x: number;
  y: number;
  colour: number;
  delay: string;
}

export interface LightsLayout {
  width: number;
  wire: WireSegment[];
  bulbs: Bulb[];
}

/** Wire height at x within one swag: pinned at the top at both ends, sagging in the middle. All values snap to the 4px grid. */
export function swagY(x: number, swagWidth: number, sag: number): number {
  const t = (x - swagWidth / 2) / (swagWidth / 2);
  return Math.round((sag * (1 - t * t)) / 4) * 4 + 4;
}

/**
 * Lays out string lights as a row of swags. The wire is drawn in 8px steps and equal-height steps are
 * merged into one rect; bulbs hang from the wire every `spacing` px.
 */
export function layoutLights(opts: {
  swagWidth: number;
  swags: number;
  sag: number;
  spacing: number;
}): LightsLayout {
  const { swagWidth, swags, sag, spacing } = opts;
  const wire: WireSegment[] = [];
  const bulbs: Bulb[] = [];
  let n = 0;

  for (let s = 0; s < swags; s++) {
    const left = s * swagWidth;
    for (let x = 0; x < swagWidth; x += 8) {
      const y = swagY(x, swagWidth, sag);
      const last = wire[wire.length - 1];
      if (last && last.y === y && last.x + last.w === left + x) last.w += 8;
      else wire.push({ x: left + x, y, w: 8 });
    }
    for (let x = spacing / 2; x < swagWidth; x += spacing) {
      bulbs.push({
        x: left + x,
        y: swagY(x, swagWidth, sag) + 4,
        colour: n % 4,
        delay: ((n * 0.37) % 2.4).toFixed(2),
      });
      n++;
    }
  }
  return { width: swagWidth * swags, wire, bulbs };
}
