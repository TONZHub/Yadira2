// Hearth — the lodge's stone fireplace, the indoor sibling of the campfire.
// ------------------------------------------------------------------
// The patient's campfire grows with THEIR check-in streak; the hearth grows
// with the CAREGIVER's. Same covenant: it never goes out. A lapsed streak
// settles it back to warm embers behind the grate — never cold, never dead.
// Flame/ember styling deliberately mirrors Campfire.tsx so the two read as
// one family of fire.

import React from 'react';

interface HearthProps {
  /** Consecutive days the caregiver has come to the lodge (0 = embers). */
  streak: number;
  /** Rendered width in px — height follows. */
  width?: number;
}

const Flame: React.FC<{
  w: number;
  h: number;
  color: string;
  duration: string;
  delay?: string;
  opacity?: number;
}> = ({ w, h, color, duration, delay = '0s', opacity = 1 }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: '50%',
      width: w,
      height: h,
      background: color,
      opacity,
      borderRadius: '50% 50% 50% 50% / 62% 62% 38% 38%',
      transformOrigin: '50% 100%',
      animation: `hearth-flicker ${duration} ease-in-out ${delay} infinite`,
    }}
  />
);

export const Hearth: React.FC<HearthProps> = ({ streak, width = 210 }) => {
  const level = Math.min(Math.max(streak, 0), 7) / 7;
  const hasFlames = streak >= 1;

  // The firebox opening. Flames are sized to stay inside it.
  const boxW = width * 0.6;
  const boxH = width * 0.44;
  const outerH = boxH * (0.32 + level * 0.42);
  const outerW = boxW * (0.3 + level * 0.22);
  const midH = outerH * 0.68;
  const midW = outerW * 0.68;
  const coreH = outerH * 0.4;
  const coreW = outerW * 0.42;
  const glowOpacity = 0.3 + level * 0.45;
  const height = width * 0.62;

  return (
    <div
      role="img"
      aria-label={
        hasFlames
          ? `The lodge hearth burning — day ${streak} of coming to the lodge`
          : 'The lodge hearth resting as warm embers'
      }
      style={{ position: 'relative', width, height, margin: '0 auto' }}
    >
      <style>{`
        @keyframes hearth-flicker {
          0%, 100% { transform: translateX(-50%) scaleY(1) scaleX(1) rotate(-1.5deg); }
          25%      { transform: translateX(-50%) scaleY(1.08) scaleX(0.94) rotate(1.5deg); }
          50%      { transform: translateX(-50%) scaleY(0.92) scaleX(1.05) rotate(-1deg); }
          75%      { transform: translateX(-50%) scaleY(1.05) scaleX(0.96) rotate(2deg); }
        }
        @keyframes hearth-ember-pulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hearth-anim, .hearth-anim * { animation: none !important; }
        }
      `}</style>

      <div className="hearth-anim" style={{ position: 'absolute', inset: 0 }}>
        {/* Chimney breast */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: width * 0.86,
            height: height,
            borderRadius: '10px 10px 4px 4px',
            background: 'linear-gradient(180deg, #6E6259 0%, #5C5148 100%)',
            boxShadow: 'inset 0 -6px 14px rgba(0,0,0,0.25)',
          }}
        />
        {/* Stone texture — a few offset blocks */}
        {[
          { x: -32, y: 0.72, w: 26, h: 12 },
          { x: 8, y: 0.78, w: 30, h: 13 },
          { x: -38, y: 0.5, w: 22, h: 11 },
          { x: 20, y: 0.55, w: 24, h: 12 },
          { x: -8, y: 0.63, w: 28, h: 12 },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: height * s.y,
              left: `calc(50% + ${(s.x / 100) * width}px)`,
              width: (s.w / 100) * width,
              height: s.h,
              borderRadius: 5,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(0,0,0,0.12)',
            }}
          />
        ))}

        {/* Mantel shelf */}
        <div
          style={{
            position: 'absolute',
            bottom: height * 0.46,
            left: '50%',
            transform: 'translateX(-50%)',
            width: width * 0.98,
            height: 12,
            borderRadius: 4,
            background: 'linear-gradient(180deg, #7A563B, #553A28)',
            boxShadow: '0 3px 5px rgba(0,0,0,0.3)',
          }}
        />
        {/* A candle and a small frame on the mantel — someone lives here */}
        <div style={{ position: 'absolute', bottom: height * 0.46 + 12, left: '30%', width: 7, height: 16, background: '#E8DCC0', borderRadius: 2 }} />
        <div
          style={{
            position: 'absolute',
            bottom: height * 0.46 + 26,
            left: 'calc(30% + 1.5px)',
            width: 4,
            height: 7,
            borderRadius: '50% 50% 50% 50% / 62% 62% 38% 38%',
            background: '#F7B85E',
            animation: 'hearth-flicker 1.9s ease-in-out infinite',
            transformOrigin: '50% 100%',
          }}
        />
        <div style={{ position: 'absolute', bottom: height * 0.46 + 12, right: '28%', width: 20, height: 15, background: '#8A6A45', borderRadius: 2, border: '2px solid #553A28' }} />

        {/* Firebox opening */}
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: boxW,
            height: boxH,
            borderRadius: `${boxW / 2}px ${boxW / 2}px 6px 6px`,
            background: 'radial-gradient(80% 90% at 50% 100%, #2A1812 0%, #17100C 70%)',
            overflow: 'hidden',
            boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.6)',
          }}
        >
          {/* Firelight wash inside the box */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(70% 55% at 50% 92%, rgba(247,184,94,0.55), rgba(226,88,34,0.22) 55%, transparent 78%)',
              opacity: glowOpacity,
              animation: 'hearth-ember-pulse 3.2s ease-in-out infinite',
            }}
          />
          {/* Flames */}
          {hasFlames && (
            <div style={{ position: 'absolute', inset: 0, bottom: 12 }}>
              <Flame w={outerW} h={outerH} color="#E25822" duration="2.1s" opacity={0.92} />
              <Flame w={midW} h={midH} color="#F7B85E" duration="1.7s" delay="0.25s" opacity={0.95} />
              <Flame w={coreW} h={coreH} color="#FFE8A3" duration="1.3s" delay="0.1s" />
            </div>
          )}
          {/* Logs on the grate */}
          <div style={{ position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%) rotate(-12deg)', width: boxW * 0.62, height: 9, background: 'linear-gradient(180deg, #6B4A32, #4A3122)', borderRadius: 5 }} />
          <div style={{ position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%) rotate(12deg)', width: boxW * 0.62, height: 9, background: 'linear-gradient(180deg, #7A563B, #553A28)', borderRadius: 5 }} />
          {/* Embers — never out */}
          {[
            { x: -14, s: 6, d: '2.8s', delay: '0s' },
            { x: 0, s: 8, d: '3.4s', delay: '0.6s' },
            { x: 12, s: 5, d: '2.4s', delay: '1.1s' },
          ].map((e, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: 4,
                left: `calc(50% + ${e.x}px)`,
                width: e.s,
                height: e.s,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #FFB36B, #E25822 70%)',
                boxShadow: '0 0 8px rgba(226,88,34,0.8)',
                animation: `hearth-ember-pulse ${e.d} ease-in-out ${e.delay} infinite`,
              }}
            />
          ))}
        </div>

        {/* Warm spill onto the floor in front of the hearth */}
        <div
          style={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: width * 0.7,
            height: 22,
            background: 'radial-gradient(50% 60% at 50% 20%, rgba(247,184,94,0.5), transparent 75%)',
            opacity: glowOpacity,
            filter: 'blur(5px)',
            animation: 'hearth-ember-pulse 3.2s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
};

export default Hearth;
