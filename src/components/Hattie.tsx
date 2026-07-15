// Hattie — Yadira's mascot: a pygmy hippo in camp gear.
// ------------------------------------------------------------------
// The name is the point: Hattie → *hippo*campus, the brain's memory-keeper
// and the first region dementia takes. The camp gear makes the pun visible;
// the warmth is what matters to the person looking at her.
//
// PLACEHOLDER ART: this hand-built SVG is intentionally self-contained so it
// can be swapped for a commissioned illustration later WITHOUT touching any
// check-in / camp logic. Keep the same props (size, animated, className) and
// the rest of the app won't notice the change.

import React from 'react';

interface HattieProps {
  /** Rendered width/height in px (she's square). Default 200. */
  size?: number;
  /** Gentle breathing + blink idle animation. Default true. */
  animated?: boolean;
  className?: string;
  'aria-hidden'?: boolean;
}

export const Hattie: React.FC<HattieProps> = ({
  size = 200,
  animated = true,
  className,
  'aria-hidden': ariaHidden,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      className={className}
      role={ariaHidden ? undefined : 'img'}
      aria-label={ariaHidden ? undefined : 'Hattie the pygmy hippo'}
      aria-hidden={ariaHidden}
    >
      {animated && (
        <style>{`
          @keyframes hattieBreathe{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(2px) scaleY(.985)}}
          @keyframes hattieBlink{0%,92%,100%{transform:scaleY(1)}95%,97%{transform:scaleY(.08)}}
          .hattie-body{transform-box:fill-box;transform-origin:50% 92%;animation:hattieBreathe 4.2s ease-in-out infinite}
          .hattie-lids{transform-box:fill-box;transform-origin:center;animation:hattieBlink 6s ease-in-out infinite}
          @media (prefers-reduced-motion:reduce){.hattie-body,.hattie-lids{animation:none}}
        `}</style>
      )}
      <g className={animated ? 'hattie-body' : undefined}>
        {/* ground shadow */}
        <ellipse cx="120" cy="204" rx="52" ry="12" fill="#000" opacity="0.10" />

        {/* back feet */}
        <ellipse cx="96" cy="198" rx="17" ry="11" fill="#8E8494" />
        <ellipse cx="146" cy="198" rx="17" ry="11" fill="#8E8494" />

        {/* body */}
        <ellipse cx="121" cy="152" rx="60" ry="55" fill="#9C90A4" />
        <ellipse cx="121" cy="164" rx="40" ry="38" fill="#B4AAB9" />

        {/* ears */}
        <ellipse cx="82" cy="102" rx="13" ry="12" fill="#9C90A4" />
        <ellipse cx="82" cy="103" rx="6.5" ry="6" fill="#C89AA6" />
        <ellipse cx="160" cy="102" rx="13" ry="12" fill="#9C90A4" />
        <ellipse cx="160" cy="103" rx="6.5" ry="6" fill="#C89AA6" />

        {/* cheeks */}
        <ellipse cx="80" cy="152" rx="12" ry="8" fill="#E39BA0" opacity="0.45" />
        <ellipse cx="162" cy="152" rx="12" ry="8" fill="#E39BA0" opacity="0.45" />

        {/* eyes */}
        <ellipse cx="101" cy="130" rx="8" ry="10" fill="#fff" opacity="0.9" />
        <ellipse cx="141" cy="130" rx="8" ry="10" fill="#fff" opacity="0.9" />
        <g className={animated ? 'hattie-lids' : undefined}>
          <circle cx="101" cy="131" r="5.4" fill="#463C50" />
          <circle cx="141" cy="131" r="5.4" fill="#463C50" />
          <circle cx="103" cy="128.5" r="1.7" fill="#fff" />
          <circle cx="143" cy="128.5" r="1.7" fill="#fff" />
        </g>

        {/* muzzle */}
        <ellipse cx="121" cy="160" rx="46" ry="30" fill="#AA9EB0" />
        <ellipse cx="121" cy="152" rx="46" ry="20" fill="#B7ACC0" />
        <ellipse cx="106" cy="152" rx="4.6" ry="6" fill="#5B4F66" />
        <ellipse cx="136" cy="152" rx="4.6" ry="6" fill="#5B4F66" />
        <path d="M108 172 Q121 182 134 172" fill="none" stroke="#6E6178" strokeWidth="2.6" strokeLinecap="round" />

        {/* camp neckerchief */}
        <path d="M96 188 Q121 198 146 188 L140 198 Q121 204 102 198 Z" fill="#D98C5F" />
        <path d="M96 188 Q121 198 146 188 L143 192 Q121 201 99 192 Z" fill="#C6784C" />

        {/* camp bucket hat */}
        <ellipse cx="121" cy="98" rx="42" ry="12" fill="#5C8D71" />
        <path d="M90 98 Q92 70 121 68 Q150 70 152 98 Z" fill="#3A5D45" />
        <rect x="90" y="92" width="62" height="8" rx="4" fill="#C8A96A" />
        <path d="M143 86 q7 -3 9 4 q-7 3 -9 -4 Z" fill="#8FB89A" />
      </g>
    </svg>
  );
};

export default Hattie;
