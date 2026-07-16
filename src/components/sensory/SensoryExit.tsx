import React, { useState } from 'react';

// Shared "return" affordance for every sensory room — visible and glowing,
// but unobtrusive against the calm. Tinted per room so it never clashes.
export default function SensoryExit({
  onExit,
  tint = 'rgba(180,200,255,',
}: {
  onExit: () => void;
  tint?: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onExit(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5 px-6 py-3 rounded-full border transition-all duration-500"
      style={{
        background: hover ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.14)',
        borderColor: hover ? `${tint}0.8)` : `${tint}0.5)`,
        boxShadow: hover
          ? `0 0 24px ${tint}0.4), inset 0 0 12px ${tint}0.1)`
          : `0 0 12px ${tint}0.2)`,
        color: hover ? `${tint}1)` : `${tint}0.85)`,
      }}
      aria-label="Return from this room"
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: `${tint}0.8)`, boxShadow: `0 0 8px ${tint}0.8)`, animation: 'pulse 2s ease-in-out infinite' }}
      />
      <span className="text-sm font-light tracking-widest">return</span>
    </button>
  );
}
