export type MetalStops = readonly [number, string][];

export function conicOrLinearGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  stops: MetalStops,
): CanvasGradient {
  const gradient =
    typeof ctx.createConicGradient === 'function'
      ? ctx.createConicGradient(Math.PI / 4, x, y)
      : ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  return gradient;
}

/** How the metal is shaded: `dark` is the deep vignette used for the LCD face and dial hub,
 *  `vivid` the BPM knob body on dark themes (lighter vignette, stronger highlight, so the ring
 *  reads as lit metal rather than a dim disc), `light` the knob body on the light theme. */
export type MetalFinish = 'dark' | 'vivid' | 'light';

interface Shading {
  /** Radial vignette: center glow, mid and rim darkening. */
  center: string;
  mid: string;
  rim: string;
  /** Linear highlight sweep: lit edge and the opposite shadowed edge. */
  shine: string;
  shineFalloff: string;
  shadowMid: string;
  shadow: string;
  /** Peak opacity of the light machined grooves, and of the dark ones between them (0 = none).
   *  The brighter vivid finish needs both, or its grooves wash out against the lighter metal. */
  groove: number;
  darkGroove: number;
}

const SHADING: Record<MetalFinish, Shading> = {
  dark: {
    center: 'rgba(255, 255, 255, 0.08)',
    mid: 'rgba(0, 0, 0, 0.12)',
    rim: 'rgba(0, 0, 0, 0.55)',
    shine: 'rgba(255, 255, 255, 0.32)',
    shineFalloff: 'rgba(255, 255, 255, 0.06)',
    shadowMid: 'rgba(0, 0, 0, 0.08)',
    shadow: 'rgba(0, 0, 0, 0.28)',
    groove: 0.14,
    darkGroove: 0,
  },
  vivid: {
    center: 'rgba(255, 255, 255, 0.14)',
    mid: 'rgba(0, 0, 0, 0.04)',
    rim: 'rgba(0, 0, 0, 0.28)',
    shine: 'rgba(255, 255, 255, 0.42)',
    shineFalloff: 'rgba(255, 255, 255, 0.1)',
    shadowMid: 'rgba(0, 0, 0, 0.04)',
    shadow: 'rgba(0, 0, 0, 0.14)',
    groove: 0.2,
    darkGroove: 0.16,
  },
  light: {
    center: 'rgba(255, 255, 255, 0.12)',
    mid: 'rgba(0, 0, 0, 0.04)',
    rim: 'rgba(0, 0, 0, 0.18)',
    shine: 'rgba(255, 255, 255, 0.4)',
    shineFalloff: 'rgba(255, 255, 255, 0.08)',
    shadowMid: 'rgba(0, 0, 0, 0.04)',
    shadow: 'rgba(0, 0, 0, 0.12)',
    groove: 0.14,
    darkGroove: 0.08,
  },
};

/** Paints the knob's conic brushed-metal texture into a reusable canvas. */
export function renderMetalTexture(
  radius: number,
  dpr: number,
  stops: MetalStops,
  finish: MetalFinish = 'dark',
): OffscreenCanvas | HTMLCanvasElement {
  const shade = SHADING[finish];
  const diameter = radius * 2;
  const useOffscreen = typeof OffscreenCanvas !== 'undefined';
  const canvas = useOffscreen
    ? new OffscreenCanvas(diameter * dpr, diameter * dpr)
    : document.createElement('canvas');
  if (!useOffscreen) {
    canvas.width = diameter * dpr;
    canvas.height = diameter * dpr;
  }
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
  if (!ctx) return canvas;
  ctx.scale(dpr, dpr);
  const c = radius;

  ctx.fillStyle = conicOrLinearGradient(ctx, c, c, radius, stops);
  ctx.beginPath();
  ctx.arc(c, c, radius, 0, Math.PI * 2);
  ctx.fill();

  const depth = ctx.createRadialGradient(c, c, 0, c, c, radius);
  depth.addColorStop(0.0, shade.center);
  depth.addColorStop(0.7, shade.mid);
  depth.addColorStop(1.0, shade.rim);
  ctx.fillStyle = depth;
  ctx.beginPath();
  ctx.arc(c, c, radius, 0, Math.PI * 2);
  ctx.fill();

  for (let r = 2; r < radius; r += 0.9 + Math.random() * 0.9) {
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    const dark = shade.darkGroove > 0 && Math.random() < 0.4;
    const opacity = (0.25 + Math.random() * 0.75) * (dark ? shade.darkGroove : shade.groove);
    ctx.strokeStyle = dark ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
    ctx.lineWidth = 0.35 + Math.random() * 0.45;
    ctx.stroke();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, radius, 0, Math.PI * 2);
  ctx.clip();
  const highlightAngle = -Math.PI / 3;
  const hl = ctx.createLinearGradient(
    c + Math.cos(highlightAngle) * radius,
    c + Math.sin(highlightAngle) * radius,
    c - Math.cos(highlightAngle) * radius,
    c - Math.sin(highlightAngle) * radius,
  );
  hl.addColorStop(0, shade.shine);
  hl.addColorStop(0.18, shade.shineFalloff);
  hl.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
  hl.addColorStop(0.82, shade.shadowMid);
  hl.addColorStop(1, shade.shadow);
  ctx.fillStyle = hl;
  ctx.fillRect(0, 0, diameter, diameter);
  ctx.restore();
  return canvas;
}

/** One colour band of a banded knob ring: its metal stops, and where its outer edge sits as a
 *  fraction of the ring (0 = the LCD's edge, 1 = the ring's rim). */
export interface MetalBand {
  stops: MetalStops;
  outerEdge: number;
  /** Half the width of the blend into the band outside it, as a fraction of the ring. */
  seam?: number;
}

/** Default half-width of the soft seam between two bands, as a fraction of the ring's width. */
const BAND_SEAM = 0.05;

/**
 * The knob ring in concentric colour bands: the first band fills the whole disc, and each later
 * one is the same brushed metal in its own colours, faded in up to its outer edge with a short
 * soft seam. Built once like renderMetalTexture (the knob caches it), so the bands add nothing
 * per frame. `innerRadius` is where the ring starts (the LCD's edge), in the same units as radius.
 */
export function renderBandedMetalTexture(
  radius: number,
  innerRadius: number,
  dpr: number,
  bands: readonly MetalBand[],
  finish: MetalFinish,
): OffscreenCanvas | HTMLCanvasElement {
  const base = renderMetalTexture(radius, dpr, bands[0].stops, finish);
  const baseCtx = base.getContext('2d') as CanvasRenderingContext2D | null;
  if (!baseCtx) return base;
  const center = radius * dpr;
  const ringWidth = (radius - innerRadius) * dpr;
  for (const band of bands.slice(1)) {
    const layer = renderMetalTexture(radius, dpr, band.stops, finish);
    const ctx = layer.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx) continue;
    const edge = innerRadius * dpr + band.outerEdge * ringWidth;
    const seam = (band.seam ?? BAND_SEAM) * ringWidth;
    const outer = edge + seam;
    const mask = ctx.createRadialGradient(center, center, 0, center, center, outer);
    mask.addColorStop(0, '#000');
    // A smoothstep fade across the seam, so a wide blend has no visible start or end.
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const alpha = 1 - t * t * (3 - 2 * t);
      const at = Math.min(1, Math.max(0, (edge - seam + 2 * seam * t) / outer));
      mask.addColorStop(at, `rgba(0, 0, 0, ${alpha.toFixed(3)})`);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, layer.width, layer.height);
    baseCtx.save();
    baseCtx.setTransform(1, 0, 0, 1, 0, 0);
    baseCtx.drawImage(layer, 0, 0);
    baseCtx.restore();
  }
  return base;
}

/** The knob's conic metal pattern in one set of hi/mid/lo colours. */
export function metalStops(hi: string, mid: string, lo: string): MetalStops {
  return [
    [0.0, lo],
    [0.18, hi],
    [0.35, lo],
    [0.52, mid],
    [0.7, hi],
    [0.88, lo],
    [1.0, lo],
  ];
}

/** Stops for an extra ring band from `--knob-<name>-hi/mid/lo`, or null when the theme has none. */
export function bandStops(el: Element, name: string): MetalStops | null {
  const css = getComputedStyle(el);
  const hi = css.getPropertyValue(`--knob-${name}-hi`).trim();
  const mid = css.getPropertyValue(`--knob-${name}-mid`).trim();
  const lo = css.getPropertyValue(`--knob-${name}-lo`).trim();
  return hi && mid && lo ? metalStops(hi, mid, lo) : null;
}
