import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';

// Digestible messages — one thought per bubble.
// ------------------------------------------------------------------
// A three-sentence reply rendered as a single block is a wall of text
// to someone with dementia. Field research on Elsy showed the kinder
// pattern: each sentence lands as its own small bubble, arriving at a
// human pace, so every thought gets its own moment.
// ------------------------------------------------------------------

// Split a reply at sentence boundaries, merging short neighbors so a
// tiny "Yes, dear." doesn't sit alone unless it's the whole message.
export function splitIntoDigestibleChunks(text: string): string[] {
  // Boundary = terminal punctuation, optionally wrapped in a closing quote
  // or bracket (e.g. `danced to "Can't Help Falling in Love." Those…`).
  const sentences = text
    .split(/(?<=[.!?…]["”'’)\]]?)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return sentences.length ? sentences : [text];

  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (!current) {
      current = sentence;
    } else if (`${current} ${sentence}`.length <= 90) {
      current = `${current} ${sentence}`;
    } else {
      chunks.push(current);
      current = sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

interface DigestibleMessageProps {
  text: string;
  /** Reveal chunks one at a time (new arrivals) vs. all at once (restored history). */
  animate: boolean;
  /** Bubble styling, shared with the rest of the chat log. */
  bubbleClassName: string;
  textClassName: string;
  /** Badges (emotion, media insight) — rendered inside the last bubble. */
  extras?: React.ReactNode;
  /** Timestamp / read-to-me row — rendered inside the last bubble. */
  footer?: React.ReactNode;
  /** Called each time a chunk appears, so the log can keep itself scrolled. */
  onChunkRevealed?: () => void;
}

export default function DigestibleMessage({
  text,
  animate,
  bubbleClassName,
  textClassName,
  extras,
  footer,
  onChunkRevealed,
}: DigestibleMessageProps) {
  // Memoized on text: the reveal timer's effect depends on this array, and a
  // fresh reference on every parent re-render would clear and re-arm the timer
  // before it fires — freezing the reveal at the first bubble whenever anything
  // in the app re-renders faster than the chunk delay (e.g. the 1.5s alert poll).
  const chunks = useMemo(() => splitIntoDigestibleChunks(text), [text]);
  const [shown, setShown] = useState(animate ? 1 : chunks.length);

  useEffect(() => {
    if (shown >= chunks.length) return;
    // Pace by the length of the upcoming thought — enough time to finish
    // reading the current one, never so long the pause feels like absence.
    const upcoming = chunks[shown];
    const delay = Math.min(2800, 900 + upcoming.length * 30);
    const timer = window.setTimeout(() => setShown((s) => s + 1), delay);
    return () => window.clearTimeout(timer);
  }, [shown, chunks]);

  useEffect(() => {
    if (animate) onChunkRevealed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  const fullyRevealed = shown >= chunks.length;

  return (
    <div className="max-w-[85%] space-y-2">
      {chunks.slice(0, shown).map((chunk, i) => {
        const isLastBubble = i === chunks.length - 1 && fullyRevealed;
        return (
          <motion.div
            key={i}
            initial={animate ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={bubbleClassName}
          >
            <p className={textClassName}>{chunk}</p>
            {isLastBubble && extras}
            {isLastBubble && footer}
          </motion.div>
        );
      })}
    </div>
  );
}
