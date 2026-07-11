// Memory Soundscapes — synthesized melody + ambience per memory theme.
// ------------------------------------------------------------------
// Music reaches dementia patients when words can't, so each memory card
// opens with a few seconds of sound before the narration begins.
//
// Everything here is generated with the Web Audio API: no audio files,
// no CDN, nothing added to the bundle, works offline. All melodies are
// public-domain compositions (or original figures), so demo recordings
// of the app can be published without licensing worries.
// ------------------------------------------------------------------

export type SoundscapeTheme = 'family' | 'nature' | 'retro' | 'home' | 'wedding';

export interface SoundscapeHandle {
  /** Lower the soundscape to a quiet bed (call when narration starts). */
  duck: () => void;
  /** Fade out and release all audio resources. */
  stop: () => void;
}

// ---------- note helpers ----------

type Step = { n: string | null; d: number }; // note name (null = rest), duration in beats

const NOTE_OFFSETS: Record<string, number> = {
  C: -9, 'C#': -8, D: -7, 'D#': -6, E: -5, F: -4,
  'F#': -3, G: -2, 'G#': -1, A: 0, 'A#': 1, B: 2,
};

function noteToFreq(name: string): number {
  const match = name.match(/^([A-G]#?)(\d)$/);
  if (!match) return 440;
  const semitonesFromA4 = NOTE_OFFSETS[match[1]] + (Number(match[2]) - 4) * 12;
  return 440 * Math.pow(2, semitonesFromA4 / 12);
}

// ---------- melodies (public domain) ----------

const MELODIES: Record<SoundscapeTheme, { bpm: number; steps: Step[] }> = {
  // Wagner — Bridal Chorus (1850), "here comes the bride"
  wedding: {
    bpm: 72,
    steps: [
      { n: 'C4', d: 1 }, { n: 'F4', d: 0.75 }, { n: 'F4', d: 0.25 }, { n: 'F4', d: 2 },
      { n: 'C4', d: 1 }, { n: 'G4', d: 0.75 }, { n: 'E4', d: 0.25 }, { n: 'F4', d: 2 },
    ],
  },
  // Beethoven — Für Elise (1810), opening phrase
  retro: {
    bpm: 100,
    steps: [
      { n: 'E5', d: 0.5 }, { n: 'D#5', d: 0.5 }, { n: 'E5', d: 0.5 }, { n: 'D#5', d: 0.5 },
      { n: 'E5', d: 0.5 }, { n: 'B4', d: 0.5 }, { n: 'D5', d: 0.5 }, { n: 'C5', d: 0.5 },
      { n: 'A4', d: 1.75 },
    ],
  },
  // Bishop/Payne — Home! Sweet Home! (1823)
  home: {
    bpm: 84,
    steps: [
      { n: 'E4', d: 1 }, { n: 'E4', d: 0.5 }, { n: 'F4', d: 0.5 }, { n: 'G4', d: 1 },
      { n: 'G4', d: 0.5 }, { n: 'F4', d: 0.5 }, { n: 'E4', d: 1 }, { n: 'D4', d: 0.5 },
      { n: 'C4', d: 1.75 },
    ],
  },
  // Brahms — Wiegenlied / Lullaby (1868), opening phrase
  family: {
    bpm: 80,
    steps: [
      { n: 'E4', d: 0.5 }, { n: 'E4', d: 0.5 }, { n: 'G4', d: 1.5 },
      { n: 'E4', d: 0.5 }, { n: 'E4', d: 0.5 }, { n: 'G4', d: 1.5 },
      { n: 'E4', d: 0.5 }, { n: 'G4', d: 0.5 }, { n: 'C5', d: 1 }, { n: 'B4', d: 1.5 },
      { n: 'A4', d: 1 }, { n: 'A4', d: 1 }, { n: 'G4', d: 1.75 },
    ],
  },
  // Original pentatonic bell figure — no source melody, just stillness
  nature: {
    bpm: 60,
    steps: [
      { n: 'G4', d: 1 }, { n: 'A4', d: 1 }, { n: 'C5', d: 1.5 }, { n: null, d: 0.5 },
      { n: 'D5', d: 1 }, { n: 'E5', d: 2 }, { n: null, d: 1 },
      { n: 'C5', d: 1 }, { n: 'A4', d: 2 },
    ],
  },
};

// ---------- synthesis ----------

// A music-box voice: a triangle fundamental plus a quiet sine an octave up,
// fast attack, long natural decay.
function scheduleNote(ctx: AudioContext, out: AudioNode, freq: number, at: number, dur: number) {
  const voices: [OscillatorType, number, number][] = [
    ['triangle', freq, 0.28],
    ['sine', freq * 2, 0.08],
  ];
  for (const [type, f, peak] of voices) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = f;
    osc.detune.value = (Math.random() - 0.5) * 6; // slight imperfection = warmth
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(dur * 1.8, 0.4));
    osc.connect(gain);
    gain.connect(out);
    osc.start(at);
    osc.stop(at + Math.max(dur * 1.8, 0.4) + 0.05);
  }
}

function createNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function loopedNoise(ctx: AudioContext, out: AudioNode, filterType: BiquadFilterType, filterFreq: number, gainValue: number) {
  const src = ctx.createBufferSource();
  src.buffer = createNoiseBuffer(ctx);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = gainValue;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(out);
  src.start();
  return { src, filter, gain };
}

// Short filtered-noise bursts — fire crackle or vinyl pops.
function scheduleCrackles(ctx: AudioContext, out: AudioNode, count: number, over: number, freq: number, loudness: number) {
  for (let i = 0; i < count; i++) {
    const at = ctx.currentTime + Math.random() * over;
    const src = ctx.createBufferSource();
    src.buffer = createNoiseBuffer(ctx, 0.06);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq * (0.7 + Math.random() * 0.6);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(loudness * (0.4 + Math.random() * 0.6), at + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    src.start(at);
    src.stop(at + 0.08);
  }
}

// A very quiet sustained chord under the melody.
function schedulePad(ctx: AudioContext, out: AudioNode, freqs: number[], seconds: number) {
  for (const f of freqs) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0.03, ctx.currentTime + seconds - 2);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
    osc.connect(gain);
    gain.connect(out);
    osc.start();
    osc.stop(ctx.currentTime + seconds + 0.1);
  }
}

const SOUNDSCAPE_SECONDS = 16;

function createAmbience(ctx: AudioContext, out: AudioNode, theme: SoundscapeTheme) {
  switch (theme) {
    case 'nature': {
      // Lake water: slow-breathing lowpassed noise
      const water = loopedNoise(ctx, out, 'lowpass', 420, 0.07);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.15;
      lfoGain.gain.value = 160;
      lfo.connect(lfoGain);
      lfoGain.connect(water.filter.frequency);
      lfo.start();
      break;
    }
    case 'home':
      // Fireplace: warm noise floor + crackle bursts
      loopedNoise(ctx, out, 'lowpass', 240, 0.035);
      scheduleCrackles(ctx, out, 26, SOUNDSCAPE_SECONDS, 2800, 0.09);
      break;
    case 'retro':
      // Record player: faint surface hiss + sparse pops
      loopedNoise(ctx, out, 'highpass', 3200, 0.012);
      scheduleCrackles(ctx, out, 8, SOUNDSCAPE_SECONDS, 1600, 0.05);
      break;
    case 'wedding':
      schedulePad(ctx, out, [noteToFreq('F3'), noteToFreq('A3'), noteToFreq('C4')], SOUNDSCAPE_SECONDS);
      break;
    case 'family':
      schedulePad(ctx, out, [noteToFreq('C3'), noteToFreq('G3')], SOUNDSCAPE_SECONDS);
      break;
  }
}

// ---------- public API ----------

let active: SoundscapeHandle | null = null;

export function playMemorySoundscape(theme: SoundscapeTheme): SoundscapeHandle | null {
  try {
    active?.stop();

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);

    // Melody
    const { bpm, steps } = MELODIES[theme];
    const beat = 60 / bpm;
    let t = ctx.currentTime + 0.1;
    for (const { n, d } of steps) {
      const dur = d * beat;
      if (n) scheduleNote(ctx, master, noteToFreq(n), t, dur);
      t += dur;
    }

    // Ambience bed
    createAmbience(ctx, master, theme);

    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      try {
        master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.35);
      } catch (_) {}
      window.setTimeout(() => {
        ctx.close().catch(() => {});
      }, 1200);
      if (active === handle) active = null;
    };

    const handle: SoundscapeHandle = {
      duck: () => {
        if (stopped) return;
        try {
          master.gain.setTargetAtTime(0.14, ctx.currentTime, 0.5);
        } catch (_) {}
      },
      stop,
    };

    // Self-limiting: fade out after the soundscape has run its course.
    window.setTimeout(stop, SOUNDSCAPE_SECONDS * 1000);

    active = handle;
    return handle;
  } catch (err) {
    console.warn('[Soundscapes] Web Audio unavailable:', err);
    return null;
  }
}
