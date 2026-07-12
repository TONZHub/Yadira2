import React, { useEffect, useRef } from 'react';
import SensoryExit from './SensoryExit';

// Forest Canopy — soft dappled sunlight drifting through leaves overhead,
// with faint swaying silhouettes. Tap to let a warm shaft of light bloom.
// Gentle wind and the occasional far-off birdsong.

interface Pool { x: number; y: number; r: number; phase: number; speed: number; drift: number; }
interface Bloom { x: number; y: number; r: number; maxR: number; alpha: number; }

export default function ForestCanopy({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const pools = useRef<Pool[]>([]);
  const blooms = useRef<Bloom[]>([]);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; seed(); };
    const seed = () => {
      const W = canvas.width, H = canvas.height;
      pools.current = Array.from({ length: Math.max(9, Math.round((W * H) / 90000)) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 80 + Math.random() * 160, phase: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.004, drift: 0.08 + Math.random() * 0.12,
      }));
    };
    resize();
    window.addEventListener('resize', resize);

    // Wind bed + occasional soft bird chirps (short pentatonic blips).
    let birdTimer = 0;
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
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
      const wg = ac.createGain(); wg.gain.value = 0.4;
      wind.connect(lp); lp.connect(wg); wg.connect(master); wind.start();

      const chirp = () => {
        const now = ac.currentTime;
        const notes = [880, 987.77, 1174.66, 1318.51];
        const base = notes[Math.floor(Math.random() * notes.length)];
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
          const t = now + i * 0.09;
          const osc = ac.createOscillator();
          const g = ac.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(base * (1 + i * 0.12), t);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
          osc.connect(g); g.connect(master);
          osc.start(t); osc.stop(t + 0.2);
        }
      };
      birdTimer = window.setInterval(() => { if (Math.random() < 0.5) chirp(); }, 3400);
    } catch (_) { /* audio optional */ }

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#1a3a22');
      g.addColorStop(1, '#0f2416');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // dappled light pools, drifting and breathing
      for (const p of pools.current) {
        p.phase += p.speed;
        p.x += Math.sin(p.phase) * p.drift;
        p.y += Math.cos(p.phase * 0.7) * p.drift * 0.6;
        const pulse = 0.6 + Math.sin(p.phase) * 0.4;
        const r = p.r * (0.85 + pulse * 0.15);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, `rgba(230,240,180,${0.16 * pulse})`);
        grad.addColorStop(0.4, `rgba(180,220,130,${0.09 * pulse})`);
        grad.addColorStop(1, 'rgba(120,180,90,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        if (p.x < -p.r) p.x = W + p.r; if (p.x > W + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = H + p.r; if (p.y > H + p.r) p.y = -p.r;
      }

      // tap blooms — a brighter shaft opening up
      for (let i = blooms.current.length - 1; i >= 0; i--) {
        const b = blooms.current[i];
        b.r += (b.maxR - b.r) * 0.05;
        b.alpha -= 0.008;
        if (b.alpha <= 0) { blooms.current.splice(i, 1); continue; }
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0, `rgba(255,250,205,${b.alpha})`);
        grad.addColorStop(0.5, `rgba(220,240,160,${b.alpha * 0.4})`);
        grad.addColorStop(1, 'rgba(200,230,140,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.clearInterval(birdTimer);
      const ac = audioRef.current;
      if (ac) { try { ac.close(); } catch (_) {} }
    };
  }, []);

  const bloom = (x: number, y: number) => {
    blooms.current.push({ x, y, r: 20, maxR: 150 + Math.random() * 100, alpha: 0.7 });
  };

  return (
    <div
      className="fixed inset-0 z-50 select-none"
      onClick={(e) => bloom(e.clientX, e.clientY)}
      onTouchStart={(e) => { for (let i = 0; i < e.touches.length; i++) bloom(e.touches[i].clientX, e.touches[i].clientY); }}
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
      <SensoryExit onExit={onExit} tint="rgba(210,235,170," />
    </div>
  );
}
