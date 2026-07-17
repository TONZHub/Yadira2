// Camp sounds — Hattie's corner of the audio world.
// ------------------------------------------------------------------
// Same rules as the rest of Yadira's audio: everything is synthesized
// with the Web Audio API — no files, no CDN, works offline. Volumes sit
// low and warm; camp is a calm place and the fire should feel like it's
// a few feet away, not in your ear.
//
//   • startCampfireAmbience(intensity) — a looping crackle bed whose
//     density and warmth follow the fire's intensity (0 = embers,
//     1 = full fire). Returns a handle to retune or stop it.
//   • playCampCue(type) — Hattie's little marimba voice: 'hello' when
//     camp opens, 'mood' when a feeling is tapped, 'leave' on the way
//     out to Yadira.
// ------------------------------------------------------------------

export interface CampfireHandle {
  /** Retune the fire's sound to a new intensity (0..1) without restarting. */
  setIntensity: (level: number) => void;
  /** Fade out and release all audio resources. */
  stop: () => void;
}

// Browsers keep an AudioContext suspended until a user gesture. Camp can
// auto-open on load, so the ambience arms itself and starts on the first
// tap/keypress if it couldn't start immediately.
function resumeOnGesture(ctx: AudioContext) {
  if (ctx.state !== 'suspended') return;
  const resume = () => {
    ctx.resume().catch(() => {});
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('keydown', resume);
  };
  window.addEventListener('pointerdown', resume, { passive: true });
  window.addEventListener('keydown', resume, { passive: true });
}

export function startCampfireAmbience(intensity: number): CampfireHandle | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new AudioCtx();
    resumeOnGesture(ctx);

    let level = Math.min(Math.max(intensity, 0), 1);
    let stopped = false;

    const master = ctx.createGain();
    // Embers whisper, the full fire is present but still gentle.
    master.gain.value = 0.05 + level * 0.09;
    master.connect(ctx.destination);

    // ---- warm noise bed (the fire's low breath) ----
    const bedSeconds = 2;
    const bedBuf = ctx.createBuffer(1, ctx.sampleRate * bedSeconds, ctx.sampleRate);
    const bedData = bedBuf.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < bedData.length; i++) {
      // brown noise — deep and soft, no hiss
      brown = (brown + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      bedData[i] = brown * 3.5;
    }
    const bed = ctx.createBufferSource();
    bed.buffer = bedBuf;
    bed.loop = true;
    const bedFilter = ctx.createBiquadFilter();
    bedFilter.type = 'lowpass';
    bedFilter.frequency.value = 240;
    const bedGain = ctx.createGain();
    bedGain.gain.value = 0.5;
    bed.connect(bedFilter).connect(bedGain).connect(master);
    bed.start();

    // ---- crackles (short bright noise pops, randomly scheduled) ----
    const crackleBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const crackleData = crackleBuf.getChannelData(0);
    for (let i = 0; i < crackleData.length; i++) {
      crackleData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / crackleData.length, 2);
    }

    let crackleTimer = 0;
    const scheduleCrackle = () => {
      if (stopped) return;
      // Sparse, soft pops for embers; busy, brighter fire when it's roaring.
      const gapMs = 1200 - level * 950 + Math.random() * (900 - level * 600);
      crackleTimer = window.setTimeout(() => {
        if (stopped) return;
        try {
          const src = ctx.createBufferSource();
          src.buffer = crackleBuf;
          src.playbackRate.value = 0.7 + Math.random() * 1.1;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 1200 + Math.random() * 2600;
          bp.Q.value = 1.2;
          const g = ctx.createGain();
          g.gain.value = (0.25 + Math.random() * 0.5) * (0.45 + level * 0.55);
          src.connect(bp).connect(g).connect(master);
          src.start();
        } catch { /* context torn down mid-schedule */ }
        scheduleCrackle();
      }, gapMs);
    };
    scheduleCrackle();

    return {
      setIntensity: (next: number) => {
        level = Math.min(Math.max(next, 0), 1);
        try {
          master.gain.linearRampToValueAtTime(0.05 + level * 0.09, ctx.currentTime + 0.8);
        } catch { /* ignore */ }
      },
      stop: () => {
        if (stopped) return;
        stopped = true;
        window.clearTimeout(crackleTimer);
        try {
          master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        } catch { /* ignore */ }
        window.setTimeout(() => ctx.close().catch(() => {}), 800);
      },
    };
  } catch (err) {
    console.warn('[Camp] campfire ambience unavailable:', err);
    return null;
  }
}

// ---- Hattie's cues — soft marimba-ish notes, nothing sharp ----

const CUE_NOTES: Record<'hello' | 'mood' | 'leave', { freq: number; at: number }[]> = {
  // A friendly upward "hel-lo!"
  hello: [
    { freq: 392.0, at: 0 },     // G4
    { freq: 523.25, at: 0.16 }, // C5
  ],
  // A warm, settling "mm-hm" — you were heard.
  mood: [
    { freq: 440.0, at: 0 },     // A4
    { freq: 349.23, at: 0.18 }, // F4
  ],
  // A gentle "off you go" wave toward Yadira.
  leave: [
    { freq: 523.25, at: 0 },    // C5
    { freq: 392.0, at: 0.14 },  // G4
    { freq: 329.63, at: 0.28 }, // E4
  ],
};

export function playCampCue(type: 'hello' | 'mood' | 'leave') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new AudioCtx();
    resumeOnGesture(ctx);
    const now = ctx.currentTime;
    for (const { freq, at } of CUE_NOTES[type]) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle'; // rounder than sine at low volume, marimba-like
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now + at);
      g.gain.linearRampToValueAtTime(0.09, now + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.5);
      osc.connect(g).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 0.55);
    }
    window.setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch (err) {
    console.warn('[Camp] cue unavailable:', err);
  }
}
