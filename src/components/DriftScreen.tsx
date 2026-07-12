import React, { useEffect, useRef, useState } from 'react';

interface DriftScreenProps {
  onExit: () => void;
}

interface AuroraBlob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  hueSpeed: number;
  opacity: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  hue: number;
}

export default function DriftScreen({ onExit }: DriftScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const blobsRef = useRef<AuroraBlob[]>([]);
  const ripples = useRef<Ripple[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const [exitHovered, setExitHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const HUES = [170, 200, 260, 150, 220, 190];
    blobsRef.current = HUES.map((hue, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.25,
      radius: 220 + Math.random() * 280,
      hue,
      hueSpeed: (Math.random() - 0.5) * 0.06,
      opacity: 0.10 + Math.random() * 0.12,
      pulsePhase: (i / HUES.length) * Math.PI * 2,
      pulseSpeed: 0.004 + Math.random() * 0.003,
    }));

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const mouse = mouseRef.current;

      ctx.fillStyle = 'rgba(4, 6, 22, 0.14)';
      ctx.fillRect(0, 0, W, H);

      for (const blob of blobsRef.current) {
        // Gentle cursor attraction — blobs drift slowly toward pointer
        if (mouse) {
          const dx = mouse.x - blob.x;
          const dy = mouse.y - blob.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const pull = 0.012;
          blob.vx += (dx / dist) * pull;
          blob.vy += (dy / dist) * pull;
          // Dampen so they don't accelerate forever
          blob.vx *= 0.98;
          blob.vy *= 0.98;
        }

        blob.x += blob.vx;
        blob.y += blob.vy;
        if (blob.x < -blob.radius) blob.x = W + blob.radius;
        if (blob.x > W + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = H + blob.radius;
        if (blob.y > H + blob.radius) blob.y = -blob.radius;

        blob.pulsePhase += blob.pulseSpeed;
        blob.hue += blob.hueSpeed;
        const pulse = 0.72 + Math.sin(blob.pulsePhase) * 0.28;
        const r = blob.radius * pulse;

        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, r);
        const a0 = blob.opacity * pulse;
        const a1 = blob.opacity * 0.5 * pulse;
        grad.addColorStop(0,    `hsla(${blob.hue},      55%, 68%, ${a0})`);
        grad.addColorStop(0.35, `hsla(${blob.hue + 15}, 50%, 55%, ${a1})`);
        grad.addColorStop(0.7,  `hsla(${blob.hue + 30}, 45%, 42%, ${a1 * 0.4})`);
        grad.addColorStop(1,    `hsla(${blob.hue + 40}, 40%, 35%, 0)`);

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Draw and age ripples
      for (let i = ripples.current.length - 1; i >= 0; i--) {
        const rip = ripples.current[i];
        rip.r += (rip.maxR - rip.r) * 0.045;
        rip.alpha -= 0.012;
        if (rip.alpha <= 0) { ripples.current.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${rip.hue}, 60%, 75%, ${rip.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    ctx.fillStyle = '#04060e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const spawnRipple = (x: number, y: number) => {
    ripples.current.push({
      x, y,
      r: 10,
      maxR: 120 + Math.random() * 80,
      alpha: 0.55,
      hue: 170 + Math.random() * 120,
    });
  };

  const disperseBlobs = (x: number, y: number) => {
    for (const blob of blobsRef.current) {
      const dx = blob.x - x;
      const dy = blob.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      // Stronger push the closer the blob is
      const force = Math.min(6, 800 / dist);
      blob.vx += (dx / dist) * force;
      blob.vy += (dy / dist) * force;
    }
  };

  // Soft pentatonic pad chord — position on screen maps to pitch.
  // Left side = lower notes, right side = higher. No audio files needed.
  const playPad = (x: number) => {
    try {
      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      const master = ac.createGain();
      master.gain.setValueAtTime(0.0001, ac.currentTime);
      master.gain.linearRampToValueAtTime(0.16, ac.currentTime + 0.55);
      master.gain.setValueAtTime(0.16, ac.currentTime + 1.1);
      master.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 3.0);
      master.connect(ac.destination);

      const PENTA = [196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00];
      const idx = Math.floor((x / window.innerWidth) * PENTA.length);
      const root = PENTA[Math.min(idx, PENTA.length - 1)];
      // Root + perfect fifth + octave
      for (const freq of [root, root * 1.5, root * 2]) {
        for (const [type, g] of [['triangle', 0.55], ['sine', 0.35]] as [OscillatorType, number][]) {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = type;
          osc.frequency.value = freq;
          osc.detune.value = (Math.random() - 0.5) * 7;
          gain.gain.value = g;
          osc.connect(gain);
          gain.connect(master);
          osc.start(ac.currentTime);
          osc.stop(ac.currentTime + 3.2);
        }
      }
      window.setTimeout(() => ac.close().catch(() => {}), 4000);
    } catch (_) { /* Web Audio unavailable */ }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerLeave = () => {
    mouseRef.current = null;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    spawnRipple(e.clientX, e.clientY);
    disperseBlobs(e.clientX, e.clientY);
    playPad(e.clientX);
  };

  const handleTouch = (e: React.TouchEvent) => {
    for (let i = 0; i < e.touches.length; i++) {
      spawnRipple(e.touches[i].clientX, e.touches[i].clientY);
      disperseBlobs(e.touches[i].clientX, e.touches[i].clientY);
      playPad(e.touches[i].clientX);
      mouseRef.current = { x: e.touches[i].clientX, y: e.touches[i].clientY };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 select-none"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleCanvasClick}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />

      {/* Exit button — visible, glowing, but unobtrusive */}
      <button
        onClick={(e) => { e.stopPropagation(); onExit(); }}
        onMouseEnter={() => setExitHovered(true)}
        onMouseLeave={() => setExitHovered(false)}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5 px-6 py-3 rounded-full border transition-all duration-500"
        style={{
          background: exitHovered
            ? 'rgba(255,255,255,0.15)'
            : 'rgba(255,255,255,0.07)',
          borderColor: exitHovered
            ? 'rgba(180,200,255,0.55)'
            : 'rgba(180,200,255,0.2)',
          boxShadow: exitHovered
            ? '0 0 24px rgba(150,180,255,0.35), inset 0 0 12px rgba(150,180,255,0.08)'
            : '0 0 12px rgba(100,140,255,0.15)',
          color: exitHovered ? 'rgba(220,230,255,0.95)' : 'rgba(180,200,255,0.5)',
        }}
        aria-label="Return from Drift Mode"
      >
        {/* Soft pulsing dot */}
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: exitHovered ? 'rgba(180,210,255,0.9)' : 'rgba(150,180,255,0.5)',
            boxShadow: '0 0 8px rgba(150,180,255,0.8)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        <span className="text-sm font-light tracking-widest">
          return
        </span>
      </button>
    </div>
  );
}
