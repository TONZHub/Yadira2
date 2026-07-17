// Campfire — the hearth of Hattie's camp, tied to the check-in streak.
// ------------------------------------------------------------------
// The fire's intensity reflects how many days in a row the patient has
// checked in with Hattie, but it NEVER goes out: with no streak at all
// it rests as comfy glowing embers, and each consecutive day feeds it
// until (a week in) it's a proper, happy campfire. There is no failure
// state by design — a lapsed streak just means the fire has settled
// back down to embers, warm and waiting, never cold or dead.

import React from 'react';

interface CampfireProps {
  /** Consecutive days checked in at camp (0 = embers only). */
  streak: number;
  /** Rendered width in px — height follows. */
  width?: number;
}

// One flame tongue. Teardrop = square with three rounded corners, rotated.
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
      animation: `campfire-flicker ${duration} ease-in-out ${delay} infinite`,
    }}
  />
);

export const Campfire: React.FC<CampfireProps> = ({ streak, width = 150 }) => {
  // 0 → embers, 7+ → full fire. Everything interpolates from this.
  const level = Math.min(Math.max(streak, 0), 7) / 7;
  const hasFlames = streak >= 1;

  // Flame geometry grows with the streak.
  const outerH = 34 + level * 62; // 34px wisp → 96px fire
  const outerW = 26 + level * 26;
  const midH = outerH * 0.68;
  const midW = outerW * 0.68;
  const coreH = outerH * 0.4;
  const coreW = outerW * 0.42;
  const glowSize = 60 + level * 90;
  const glowOpacity = 0.35 + level * 0.4;
  const height = outerH + 34; // flames + logs/embers

  return (
    <div
      role="img"
      aria-label={
        hasFlames
          ? `Campfire burning — day ${streak} of visiting camp`
          : 'Campfire resting as warm embers'
      }
      style={{ position: 'relative', width, height, margin: '0 auto' }}
    >
      <style>{`
        @keyframes campfire-flicker {
          0%, 100% { transform: translateX(-50%) scaleY(1) scaleX(1) rotate(-1.5deg); }
          25%      { transform: translateX(-50%) scaleY(1.08) scaleX(0.94) rotate(1.5deg); }
          50%      { transform: translateX(-50%) scaleY(0.92) scaleX(1.05) rotate(-1deg); }
          75%      { transform: translateX(-50%) scaleY(1.05) scaleX(0.96) rotate(2deg); }
        }
        @keyframes campfire-ember-pulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        @keyframes campfire-spark {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          15%  { opacity: 0.9; }
          100% { transform: translateY(-${Math.round(outerH * 0.9)}px) scale(0.3); opacity: 0; }
        }
      `}</style>

      {/* Warm glow on the ground — always on, scaled by intensity */}
      <div
        style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: glowSize,
          height: glowSize * 0.45,
          background: 'radial-gradient(50% 50% at 50% 60%, rgba(247,184,94,0.9), rgba(226,88,34,0.35) 55%, transparent 75%)',
          opacity: glowOpacity,
          filter: 'blur(6px)',
          animation: 'campfire-ember-pulse 3.2s ease-in-out infinite',
        }}
      />

      {/* Flames — only once the streak is alive; embers alone otherwise */}
      {hasFlames && (
        <div style={{ position: 'absolute', inset: 0, bottom: 16 }}>
          <Flame w={outerW} h={outerH} color="#E25822" duration="2.1s" opacity={0.92} />
          <Flame w={midW} h={midH} color="#F7B85E" duration="1.7s" delay="0.25s" opacity={0.95} />
          <Flame w={coreW} h={coreH} color="#FFE8A3" duration="1.3s" delay="0.1s" />
        </div>
      )}

      {/* Sparks drift up once the fire is established */}
      {streak >= 3 && (
        <>
          {[0, 1, 2].slice(0, streak >= 6 ? 3 : 2).map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: 24,
                left: `${42 + i * 8}%`,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: '#F7B85E',
                animation: `campfire-spark ${2.4 + i * 0.7}s ease-out ${i * 0.9}s infinite`,
              }}
            />
          ))}
        </>
      )}

      {/* Logs */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%) rotate(-14deg)',
          width: width * 0.5,
          height: 11,
          background: 'linear-gradient(180deg, #6B4A32, #4A3122)',
          borderRadius: 6,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%) rotate(14deg)',
          width: width * 0.5,
          height: 11,
          background: 'linear-gradient(180deg, #7A563B, #553A28)',
          borderRadius: 6,
        }}
      />

      {/* Embers — the part that never goes out */}
      {[
        { x: -16, s: 7, d: '2.8s', delay: '0s' },
        { x: -2, s: 9, d: '3.4s', delay: '0.6s' },
        { x: 12, s: 6, d: '2.4s', delay: '1.1s' },
      ].map((e, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: 6,
            left: `calc(50% + ${e.x}px)`,
            width: e.s,
            height: e.s,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FFB36B, #E25822 70%)',
            boxShadow: '0 0 8px rgba(226,88,34,0.8)',
            animation: `campfire-ember-pulse ${e.d} ease-in-out ${e.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
};

export default Campfire;
