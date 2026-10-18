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
