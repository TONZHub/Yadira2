import React, { useEffect, useRef } from 'react';
import SensoryExit from './SensoryExit';

// Autumn Leaves — leaves drifting down on a warm breeze. Swipe near them and
// they scatter away on the wind. Soft wind underneath.

interface Leaf {
  x: number; y: number; vx: number; vy: number;
  size: number; angle: number; spin: number; hue: number; sway: number; swaySpeed: number;
}

export default function AutumnLeaves({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const leaves = useRef<Leaf[]>([]);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; seed(); };
    const HUES = [18, 28, 36, 8, 44, 22];
    const makeLeaf = (W: number, H: number, top: boolean): Leaf => ({
      x: Math.random() * W,
      y: top ? -30 - Math.random() * 200 : Math.random() * H,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.5 + Math.random() * 1.1,
      size: 12 + Math.random() * 18,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.04,
      hue: HUES[Math.floor(Math.random() * HUES.length)],
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02,
    });
    const seed = () => {
      const W = canvas.width, H = canvas.height;
      leaves.current = Array.from({ length: Math.max(24, Math.round((W * H) / 26000)) }, () => makeLeaf(W, H, false));
    };
    resize();
    window.addEventListener('resize', resize);

    // Wind ambience — lowpassed noise breathing with a slow LFO.
    try {
      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioRef.current = ac;
      const master = ac.createGain();
      master.gain.setValueAtTime(0.0001, ac.currentTime);
      master.gain.linearRampToValueAtTime(0.4, ac.currentTime + 1.5);
      master.connect(ac.destination);
      const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const wind = ac.createBufferSource(); wind.buffer = buf; wind.loop = true;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
      const wg = ac.createGain(); wg.gain.value = 0.5;
      wind.connect(lp); lp.connect(wg); wg.connect(master); wind.start();
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.08;
      const lfoGain = ac.createGain(); lfoGain.gain.value = 260;
      lfo.connect(lfoGain); lfoGain.connect(lp.frequency); lfo.start();
    } catch (_) { /* audio optional */ }

    const drawLeaf = (leaf: Leaf) => {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.angle);
      ctx.fillStyle = `hsl(${leaf.hue}, 70%, 45%)`;
      // simple leaf: two arcs meeting at points
      ctx.beginPath();
      ctx.moveTo(0, -leaf.size);
      ctx.quadraticCurveTo(leaf.size * 0.7, 0, 0, leaf.size);
      ctx.quadraticCurveTo(-leaf.size * 0.7, 0, 0, -leaf.size);
      ctx.fill();
      // midrib
      ctx.strokeStyle = `hsl(${leaf.hue}, 60%, 30%)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -leaf.size);
      ctx.lineTo(0, leaf.size);
      ctx.stroke();
      ctx.restore();
    };

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#c9702a');
      g.addColorStop(0.55, '#a8531d');
      g.addColorStop(1, '#6e3413');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const p = pointer.current;
      for (const leaf of leaves.current) {
        leaf.sway += leaf.swaySpeed;
        leaf.x += leaf.vx + Math.sin(leaf.sway) * 0.6;
        leaf.y += leaf.vy;
        leaf.angle += leaf.spin;
        leaf.vx *= 0.99;
        // swipe scatter — a gust away from the pointer
        if (p) {
          const dx = leaf.x - p.x, dy = leaf.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const f = (130 - dist) / 130;
            leaf.vx += (dx / (dist || 1)) * f * 2.4;
            leaf.vy += (dy / (dist || 1)) * f * 1.2 - 0.3;
            leaf.spin += (Math.random() - 0.5) * 0.02 * f;
          }
        }
        drawLeaf(leaf);
        if (leaf.y > H + 40 || leaf.x < -60 || leaf.x > W + 60) Object.assign(leaf, makeLeaf(W, H, true));
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      const ac = audioRef.current;
      if (ac) { try { ac.close(); } catch (_) {} }
    };
  }, []);

  const move = (x: number, y: number) => { pointer.current = { x, y }; };
  const clear = () => { pointer.current = null; };

  return (
    <div
      className="fixed inset-0 z-50 select-none"
      onPointerMove={(e) => move(e.clientX, e.clientY)}
      onPointerLeave={clear}
      onPointerDown={(e) => move(e.clientX, e.clientY)}
      onTouchMove={(e) => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY); }}
      onTouchEnd={clear}
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
      <SensoryExit onExit={onExit} tint="rgba(255,225,180," />
    </div>
  );
}
