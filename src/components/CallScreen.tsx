import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneOff, Mic, Volume2 } from 'lucide-react';
import type { Message } from '../types';

interface CallScreenProps {
  /** Who's on the call: the persona name in Vivid mode, or "Yadira" in Lucid. */
  callerName: string;
  isSpeaking: boolean;
  onUserSpoke: (text: string) => void;
  onExit: () => void;
  /** Cut the companion's speech short — listening resumes automatically. */
  onSkipSpeech?: () => void;
  chatMessages: Message[];
}

export default function CallScreen({
  callerName,
  isSpeaking,
  onUserSpoke,
  onExit,
  onSkipSpeech,
  chatMessages,
}: CallScreenProps) {
  const [callState, setCallState] = useState<'ringing' | 'connected'>('ringing');
  const [duration, setDuration] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [interimSpeech, setInterimSpeech] = useState('');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringSourceRef = useRef<OscillatorNode[]>([]);
  const ringGainRef = useRef<GainNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);

  const personaName = callerName || 'Yadira';

  // 1. Synthesize Ringtone & Connection Sounds
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.2, ctx.currentTime);
      masterGain.connect(ctx.destination);
      ringGainRef.current = masterGain;

      // Pulse Ringtone: 2s on, 4s off
      const playRing = () => {
        if (!ctx || ctx.state === 'closed') return;
        const now = ctx.currentTime;
        
        // US Ring tone is a combination of 440Hz and 480Hz
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.frequency.value = 440;
        osc2.frequency.value = 480;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(1, now + 0.1);
        gainNode.gain.setValueAtTime(1, now + 1.8);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 2.1);
        osc2.stop(now + 2.1);

        ringSourceRef.current = [osc1, osc2];
      };

      // Play immediately and then repeat
      playRing();
      const ringInterval = window.setInterval(playRing, 6000);

      // Auto-connect after 4.5 seconds (roughly two rings)
      const connectTimeout = window.setTimeout(() => {
        window.clearInterval(ringInterval);
        
        // Stop any currently playing ring oscs
        try {
          ringSourceRef.current.forEach(osc => osc.stop());
        } catch (_) {}

        // Connection beep
        const now = ctx.currentTime;
        const beep = ctx.createOscillator();
        const beepGain = ctx.createGain();
        beep.frequency.value = 880; // pure C5 chime
        beepGain.gain.setValueAtTime(0.0001, now);
        beepGain.gain.linearRampToValueAtTime(0.4, now + 0.05);
        beepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        beep.connect(beepGain);
        beepGain.connect(masterGain);
        beep.start(now);
        beep.stop(now + 0.4);

        setCallState('connected');
        
        // Tell parent call connected so it can trigger initial voice prompt
        onUserSpoke('');
      }, 4500);

      return () => {
        window.clearInterval(ringInterval);
        window.clearTimeout(connectTimeout);
        try {
          ringSourceRef.current.forEach(osc => osc.stop());
        } catch (_) {}
        ctx.close().catch(() => {});
      };
    } catch (err) {
      console.warn('Web Audio not supported for ringtone:', err);
      setCallState('connected');
      onUserSpoke('');
    }
  }, []);

  // 2. Call duration timer
  useEffect(() => {
    if (callState !== 'connected') return;

    timerRef.current = window.setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [callState]);

  // Format call duration
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 3. Hands-free Speech Recognition Control
  useEffect(() => {
    if (callState !== 'connected') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    let finalTranscript = '';
    // Track the latest interim text so we can submit it if the browser's VAD
    // ends the session before a final result arrives (mid-sentence cutoff).
    let lastInterim = '';

    rec.onstart = () => {
      setIsListening(true);
      setInterimSpeech('');
      finalTranscript = '';
      lastInterim = '';
    };

    rec.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += text + ' ';
          lastInterim = ''; // clear once we have a confirmed final segment
        } else {
          interimTranscript += text;
        }
      }
      if (interimTranscript) lastInterim = interimTranscript;
      setInterimSpeech(finalTranscript + interimTranscript);
    };

    rec.onend = () => {
      setIsListening(false);
      // Prefer confirmed final text; fall back to the last interim chunk if the
      // browser's VAD cut the session before a final result was delivered.
      const spokenText = (finalTranscript.trim() || lastInterim.trim());
      if (spokenText) {
        onUserSpoke(spokenText);
        setInterimSpeech('');
        lastInterim = '';
      } else {
        // No speech captured — restart recognition so the user can keep talking
        // without needing to tap anything (handles browser timeout on silence).
        try {
          rec.start();
        } catch (_) {}
      }
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch (_) {}
    };
  }, [callState]);

  // 4. Toggle Speech Recognition based on Yadira's speech state (hands-free turn-taking)
  useEffect(() => {
    if (callState !== 'connected' || !recognitionRef.current) return;

    if (isSpeaking) {
      // Companion is speaking, stop listening so we don't record our own voice
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      // Companion finished speaking, start listening automatically
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Safe check for already running recognition
        console.warn('Failed to start speech recognition:', err);
      }
    }
  }, [isSpeaking, callState]);

  // Filter conversation history for just the call context (newest assistant/user messages)
  const callMessages = chatMessages
    .filter(msg => msg.role === 'user' || msg.role === 'model')
    .slice(-4); // Show last 4 messages on screen for readability

  return (
    <div className="fixed inset-0 z-50 bg-[#070b19] text-white flex flex-col justify-between p-6 select-none">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-radial-at-t from-[#1b2d4a] via-[#070b19] to-[#04060d] opacity-80 pointer-events-none z-0" />

      {/* Top Section: Caller Info */}
      <div className="relative z-10 flex flex-col items-center mt-12">
        <motion.div
          animate={callState === 'ringing' ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-32 h-32 rounded-full bg-[#1b2a47] border-2 border-green-400 flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(74,222,128,0.2)] mb-6"
        >
          {personaName.charAt(0)}
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">{personaName}</h2>
        <p className="text-sm font-light uppercase tracking-[0.2em] text-green-400 min-h-[20px]">
          {callState === 'ringing' ? 'Calling...' : formatTime(duration)}
        </p>
      </div>

      {/* Middle Section: Captions & Live Transcription */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg w-full mx-auto my-8 overflow-hidden">
        <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 flex flex-col justify-end">
          <AnimatePresence>
            {callState === 'connected' && callMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600/35 border border-blue-400/25 self-end text-blue-100'
                    : 'bg-[#FCFAF5]/10 border border-[#E3DFC2]/10 self-start text-[#FCFAF5]/90'
                }`}
              >
                {msg.text}
              </motion.div>
            ))}

            {/* Interim Speech (Real-time feedback as the patient speaks) */}
            {isListening && interimSpeech && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.8, y: 0 }}
                className="p-4 rounded-2xl max-w-[85%] text-sm bg-blue-600/20 border border-blue-400/10 self-end text-blue-200 italic"
              >
                {interimSpeech}...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Section: Controls */}
      <div className="relative z-10 flex flex-col items-center mb-10 gap-6">
        {/* Status indicator bar */}
        <div className="flex items-center gap-4 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          {isSpeaking ? (
            <>
              <Volume2 className="w-4 h-4 text-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-green-400 tracking-wider uppercase">Speaking</span>
              {onSkipSpeech && (
                <button
                  type="button"
                  onClick={onSkipSpeech}
                  className="ml-1 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white/90 hover:bg-white/20 transition-all active:scale-95"
                  title="Skip — your turn to talk"
                >
                  Skip
                </button>
              )}
            </>
          ) : isListening ? (
            <>
              <Mic className="w-4 h-4 text-blue-400 animate-bounce" />
              <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase">Listening</span>
            </>
          ) : (
            <span className="text-xs font-semibold text-white/40 tracking-wider uppercase">Standby</span>
          )}
        </div>

        {/* End Call Button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            // Stop any recognition
            if (recognitionRef.current) {
              try { recognitionRef.current.abort(); } catch (_) {}
            }
            onExit();
          }}
          className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all"
          aria-label="End Call"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </motion.button>
      </div>
    </div>
  );
}
