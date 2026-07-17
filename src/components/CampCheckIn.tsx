// CampCheckIn — the daily check-in the patient does with Hattie before
// "leaving camp" to talk with Yadira.
// ------------------------------------------------------------------
// Design rules (this screen is seen by someone living with dementia):
//   • Large targets, large type, high contrast, no time pressure.
//   • No wrong answers — every feeling is met with warmth.
//   • Never a trap: "Leave camp" is always available, so a distressed
//     patient can reach Yadira (or Beth) instantly without checking in.

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { DailyLog } from '../types';
import { Hattie } from './Hattie';
import Campfire from './Campfire';
import { startCampfireAmbience, playCampCue, type CampfireHandle } from '../lib/campSounds';

type Mood = DailyLog['mood'];

interface CampCheckInProps {
  patientName?: string;
  /** Who "leaving camp" takes them to — the persona name in Vivid mode, else Yadira. */
  personaLabel: string;
  /** Today's already-recorded feeling, if they've checked in earlier today. */
  todaysMood?: Mood | null;
  /** Consecutive days checked in — feeds the campfire's intensity. */
  streakDays?: number;
  /** Mirrors the app-wide sound feedback setting; silences camp too. */
  soundEnabled?: boolean;
  onCheckIn: (mood: Mood) => void;
  onLeave: () => void;
}

const MOODS: { key: Mood; label: string; emoji: string; reply: string }[] = [
  { key: 'peaceful', label: 'Calm & content', emoji: '😌', reply: "That's wonderful. Let's hold onto that gentle feeling together." },
  { key: 'anxious', label: 'A little worried', emoji: '😟', reply: "That's alright. Take one slow breath with me — you're safe here at camp." },
  { key: 'restless', label: 'Restless', emoji: '😣', reply: "I understand. We'll take today nice and easy, you and me." },
  { key: 'sad', label: 'Missing someone', emoji: '🥺', reply: "I'm right here with you. It's alright to miss someone you love." },
];

const greetingForHour = (h: number) =>
  h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

export const CampCheckIn: React.FC<CampCheckInProps> = ({
  patientName,
  personaLabel,
  todaysMood,
  streakDays = 0,
  soundEnabled = true,
  onCheckIn,
  onLeave,
}) => {
  const [picked, setPicked] = useState<Mood | null>(todaysMood ?? null);
  const greeting = greetingForHour(new Date().getHours());
  const pickedReply = picked ? MOODS.find((m) => m.key === picked)?.reply : null;

  // The fire crackles for as long as camp is open, at the streak's warmth.
  // Hattie says a little marimba "hello" as the screen appears.
  const fireRef = useRef<CampfireHandle | null>(null);
  useEffect(() => {
    if (!soundEnabled) return;
    fireRef.current = startCampfireAmbience(Math.min(streakDays, 7) / 7);
    playCampCue('hello');
    return () => {
      fireRef.current?.stop();
      fireRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]);
  // Checking in feeds the fire — the crackle warms up right away.
  useEffect(() => {
    fireRef.current?.setIntensity(Math.min(streakDays, 7) / 7);
  }, [streakDays]);

  const handlePick = (mood: Mood) => {
    setPicked(mood);
    if (soundEnabled) playCampCue('mood');
    onCheckIn(mood);
  };

  const handleLeave = () => {
    if (soundEnabled) playCampCue('leave');
    onLeave();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center p-6 text-center overflow-y-auto"
      style={{
        background:
          'radial-gradient(120% 90% at 50% 30%, #F7E9CE 0%, #EFE3CB 40%, #E4D9BE 100%)',
      }}
    >
      {/* soft firelight vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 45% at 50% 68%, rgba(247,184,94,0.28), transparent 70%)' }}
      />

      {/* `m-auto` (not justify-center on the scroll container) so the card
          centers when there's room but scrolls from the top — never clipping
          Hattie's hat — when there isn't. */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center m-auto">
        <motion.div
          initial={{ scale: 0.85, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 14 }}
        >
          <Hattie size={132} />
        </motion.div>

        {/* The campfire — grows with each day they visit, never goes out.
            Hattie sits right up close to it. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="-mt-4"
        >
          <Campfire streak={streakDays} width={150} />
          <p className="mt-1.5 text-xs font-semibold text-[#8A6A45]">
            {streakDays >= 2
              ? `The fire is on day ${streakDays} — it grows a little warmer each day you visit.`
              : streakDays === 1
                ? 'You lit the fire today. Come back tomorrow and it will grow.'
                : 'The embers are warm, ready for you.'}
          </p>
        </motion.div>

        <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-[#3A5D45]">
          🏕️ Camp
        </p>

        {!picked ? (
          <>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#2C2C2A] leading-snug">
              {greeting}{patientName ? `, ${patientName}` : ''}. I'm Hattie.
            </h1>
            <p className="mt-2 text-lg text-[#5E5D57] font-medium">
              How are you feeling today?
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#2C2C2A] leading-snug">
              Thank you for telling me.
            </h1>
            <p className="mt-2 text-lg text-[#5E5D57] font-medium max-w-sm">
              {pickedReply}
            </p>
            <p className="mt-3 text-xs text-[#7E7D76]">
              ✓ Your caregiver will see today's check-in.
            </p>
          </>
        )}

        {/* Mood choices — big, warm, no wrong answers */}
        <div className="mt-6 grid grid-cols-2 gap-3 w-full">
          {MOODS.map((m) => {
            const active = picked === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => handlePick(m.key)}
                aria-pressed={active}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-3xl border-2 px-3 py-5 transition-all active:scale-95 ${
                  active
                    ? 'border-[#3A5D45] bg-[#EAF3EC] shadow-md scale-[1.03]'
                    : picked
                      ? 'border-[#E3DFC2] bg-white/70 opacity-60 hover:opacity-100'
                      : 'border-[#E3DFC2] bg-white/80 hover:border-[#5C8D71] hover:bg-white shadow-sm'
                }`}
              >
                <span className="text-4xl leading-none" aria-hidden="true">{m.emoji}</span>
                <span className="text-sm sm:text-base font-bold text-[#2C2C2A] leading-tight">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Leave camp — always available */}
        <button
          type="button"
          onClick={handleLeave}
          className={`mt-7 inline-flex items-center gap-2.5 rounded-full px-7 py-4 text-lg font-extrabold text-white shadow-lg transition-all active:scale-95 ${
            picked ? 'bg-[#3A5D45] hover:bg-[#2B4633]' : 'bg-[#5C8D71] hover:bg-[#4A7259]'
          }`}
        >
          Leave camp — talk with {personaLabel}
          <ArrowRight className="w-5 h-5" />
        </button>
        {!picked && (
          <p className="mt-3 text-xs text-[#7E7D76]">
            You can head over any time — Hattie will be right here when you get back.
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default CampCheckIn;
