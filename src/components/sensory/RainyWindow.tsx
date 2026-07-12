import React, { useEffect, useRef } from 'react';
import SensoryExit from './SensoryExit';

// Rainy Window — condensation on the glass, runner droplets sliding down,
// and tap ripples through the pane. Soft looping rain underneath.

interface Drop { x: number; y: number; r: number; }
interface Runner { x: number; y: number; r: number; speed: number; trail: number; }
interface Ripple { x: number; y: number; r: number; maxR: number; alpha: number; }

export default function RainyWindow({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const drops = useRef<Drop[]>([]);
  const runners = useRef<Runner[]>([]);
  const ripples = useRef<Ripple[]>([]);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; seed(); };
    const seed = () => {
      const W = canvas.width, H = canvas.height;
      drops.current = Array.from({ length: Math.round((W * H) / 9000) }, () => ({
        x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2.5,
      }));
      runners.current = Array.from({ length: Math.max(10, Math.round(W / 90)) }, () => makeRunner(W, H, true));
    };
    const makeRunner = (W: number, H: number, anywhere: boolean): Runner => ({
      x: Math.random() * W, y: anywhere ? Math.random() * H : -20,
      r: 2.5 + Math.random() * 4, speed: 0.6 + Math.random() * 1.8, trail: 40 + Math.random() * 120,
    });
    resize();
    window.addEventListener('resize', resize);

    // Rain ambience: broadband noise through a gentle bandpass + a low bed.
    try {
      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioRef.current = ac;
      const master = ac.createGain();
      master.gain.setValueAtTime(0.0001, ac.currentTime);
      master.gain.linearRampToValueAtTime(0.5, ac.currentTime + 1.2);
      master.connect(ac.destination);

      const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      const hiss = ac.createBufferSource(); hiss.buffer = buf; hiss.loop = true;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.5;
      const hg = ac.createGain(); hg.gain.value = 0.28;
      hiss.connect(bp); bp.connect(hg); hg.connect(master); hiss.start();

      const bed = ac.createBufferSource(); bed.buffer = buf; bed.loop = true;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
      const bg = ac.createGain(); bg.gain.value = 0.18;
      bed.connect(lp); lp.connect(bg); bg.connect(master); bed.start();
    } catch (_) { /* audio optional */ }

    const draw = () => {
      const W = canvas.width, H = canvas.height;

      // Cool fogged-glass gradient
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#233039');
      g.addColorStop(1, '#141d24');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Static condensation — tiny highlights
      ctx.fillStyle = 'rgba(210,225,235,0.08)';
      for (const d of drops.current) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Runner droplets sliding down, clearing a streak of condensation
      for (const rn of runners.current) {
        rn.y += rn.speed;
        rn.x += Math.sin(rn.y * 0.03) * 0.3;
        const grad = ctx.createLinearGradient(rn.x, rn.y - rn.trail, rn.x, rn.y);
        grad.addColorStop(0, 'rgba(150,180,200,0)');
        grad.addColorStop(1, 'rgba(190,215,230,0.28)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = rn.r * 0.7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rn.x, rn.y - rn.trail);
        ctx.lineTo(rn.x, rn.y);
        ctx.stroke();
        // droplet head
        ctx.beginPath();
        ctx.arc(rn.x, rn.y, rn.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(215,235,245,0.6)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rn.x - rn.r * 0.3, rn.y - rn.r * 0.3, rn.r * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fill();
        if (rn.y - rn.trail > H) Object.assign(rn, makeRunner(W, H, false));
      }

      // Tap ripples
      for (let i = ripples.current.length - 1; i >= 0; i--) {
        const rp = ripples.current[i];
        rp.r += (rp.maxR - rp.r) * 0.06;
        rp.alpha -= 0.014;
        if (rp.alpha <= 0) { ripples.current.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,225,240,${rp.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
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

  const splash = (x: number, y: number) => {
    ripples.current.push({ x, y, r: 6, maxR: 90 + Math.random() * 70, alpha: 0.6 });
    // spawn a couple of fresh runners near the tap, as if it dislodged drops
    const W = window.innerWidth;
    for (let i = 0; i < 2; i++) {
      runners.current.push({ x: x + (Math.random() - 0.5) * 40, y: y, r: 3 + Math.random() * 3, speed: 1.2 + Math.random() * 1.5, trail: 30 });
    }
    if (runners.current.length > Math.max(24, W / 40)) runners.current.splice(0, runners.current.length - Math.round(W / 40));
  };

  return (
    <div
      className="fixed inset-0 z-50 select-none"
      onClick={(e) => splash(e.clientX, e.clientY)}
      onTouchStart={(e) => { for (let i = 0; i < e.touches.length; i++) splash(e.touches[i].clientX, e.touches[i].clientY); }}
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
      <SensoryExit onExit={onExit} tint="rgba(190,215,230," />
    </div>
  );
}
