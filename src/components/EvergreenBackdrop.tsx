import React, { useMemo } from 'react';

// EvergreenBackdrop — a minimalist forest of triangular firs in Yadira's sage
// palette. Pure SVG, no image assets, works offline. Purely decorative
// (aria-hidden); it sits behind foreground content. Layered back-to-front and
// darkening toward the ground for a calm sense of depth, matched to Hattie's
// woodland world.

// Small deterministic PRNG so tree placement is stable across renders (no
// flicker) and reproducible in tests — never Math.random().
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VIEW_W = 1200;
const VIEW_H = 760;

// One three-tier minimalist fir (three stacked triangles + a short trunk),
// anchored at ground line `groundY`, growing upward.
function firPath(cx: number, groundY: number, w: number, h: number): string {
  const b1 = groundY;
  const b2 = groundY - h * 0.30;
  const b3 = groundY - h * 0.58;
  const a1 = groundY - h * 0.52;
  const a2 = groundY - h * 0.80;
  const a3 = groundY - h;
  const t = w * 0.5;
  return [
    `M ${cx - t} ${b1} L ${cx} ${a1} L ${cx + t} ${b1} Z`,
    `M ${cx - t * 0.72} ${b2} L ${cx} ${a2} L ${cx + t * 0.72} ${b2} Z`,
    `M ${cx - t * 0.46} ${b3} L ${cx} ${a3} L ${cx + t * 0.46} ${b3} Z`,
  ].join(' ');
}

interface Layer {
  seed: number;
  groundY: number;
  count: number;
  hMin: number;
  hMax: number;
  wRatio: number;
  color: string;
  opacity: number;
}

function layerPath(layer: Layer): string {
  const rnd = mulberry32(layer.seed);
  const step = VIEW_W / (layer.count - 1);
  let d = '';
  for (let i = 0; i < layer.count; i++) {
    // Even spacing plus jitter so the ridge reads organic, not combed.
    const cx = i * step + (rnd() - 0.5) * step * 0.7;
    const h = layer.hMin + rnd() * (layer.hMax - layer.hMin);
    const w = h * layer.wRatio;
    d += firPath(cx, layer.groundY, w, h) + ' ';
  }
  return d;
}

export const EvergreenBackdrop: React.FC<{ className?: string }> = ({ className }) => {
  // Back-to-front: distant firs are lighter/shorter and mistier; near firs are
  // tall and deep forest-green.
  const layers: Layer[] = useMemo(
    () => [
      { seed: 11, groundY: VIEW_H * 0.60, count: 13, hMin: 90, hMax: 150, wRatio: 0.62, color: '#6E9C82', opacity: 0.45 },
      { seed: 27, groundY: VIEW_H * 0.74, count: 11, hMin: 150, hMax: 230, wRatio: 0.62, color: '#3F6B51', opacity: 0.7 },
      { seed: 43, groundY: VIEW_H * 0.92, count: 9, hMin: 230, hMax: 340, wRatio: 0.64, color: '#294636', opacity: 1 },
      { seed: 58, groundY: VIEW_H * 1.06, count: 8, hMin: 280, hMax: 380, wRatio: 0.66, color: '#1E3529', opacity: 1 },
    ],
    []
  );

  return (
    <svg
      className={className}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="eg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6FA187" />
          <stop offset="55%" stopColor="#4A7259" />
          <stop offset="100%" stopColor="#33553F" />
        </linearGradient>
        {/* Soft mist band settling between the ridges. */}
        <linearGradient id="eg-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DCE7DD" stopOpacity="0" />
          <stop offset="100%" stopColor="#DCE7DD" stopOpacity="0.22" />
        </linearGradient>
        {/* Soft clearing-glow — radial so it fades to nothing, no hard edge. */}
        <radialGradient id="eg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4E7C6" stopOpacity="0.20" />
          <stop offset="55%" stopColor="#EFE6CF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#EFE6CF" stopOpacity="0" />
        </radialGradient>
        {/* Forest floor — deepens the ground so gaps between front trunks read
            as shadow, not sky. */}
        <linearGradient id="eg-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E3529" stopOpacity="0" />
          <stop offset="100%" stopColor="#182A20" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#eg-sky)" />
      {/* a low, soft clearing-glow near the horizon for warmth */}
      <ellipse cx={VIEW_W * 0.5} cy={VIEW_H * 0.46} rx={VIEW_W * 0.5} ry={VIEW_H * 0.3} fill="url(#eg-glow)" />
      <rect x="0" y={VIEW_H * 0.68} width={VIEW_W} height={VIEW_H * 0.32} fill="url(#eg-floor)" />

      {layers.map((layer, i) => (
        <g key={i}>
          <path d={layerPath(layer)} fill={layer.color} opacity={layer.opacity} />
          {i < layers.length - 1 && (
            <rect x="0" y={layer.groundY - 26} width={VIEW_W} height="60" fill="url(#eg-mist)" />
          )}
        </g>
      ))}
    </svg>
  );
};

export default EvergreenBackdrop;
