// Shared data types for Yadira
// Used by App.tsx, the data layer, and (eventually) the server

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  emotion?: {
    emotion: string;
    confidence: number;
    tone: string;
  };
  mediaInsight?: {
    description: string;
    emotion: string;
    suggestions: string[];
  };
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  relationshipOrEra: string;
  imageTheme: 'family' | 'nature' | 'retro' | 'home' | 'wedding';
}

export interface CustomFAQ {
  id: string;
  question: string;
  answer: string;
}

export interface DailyLog {
  date: string;
  confusionLevel: number; // 1 (Very Clear) to 5 (Highly Confused)
  mood: 'peaceful' | 'anxious' | 'restless' | 'sad';
  hydrationCups: number;
  sleepHours: number;
  medsTaken: boolean;
  notes: string;
}

export interface RoutineItem {
  id: string;
  time: string;
  title: string;
  description: string;
  caregiverTips: string;
  completed: boolean;
}

// The persona file — Yadira's session-to-session memory.
// Written to after every conversation, read before the next one.
// This is the continuity architecture: Beth remembers so the patient doesn't have to.
export interface SessionMoment {
  id: string;
  date: string;
  summary: string; // what the patient shared
  emotionalTone: string; // how they seemed when they shared it
}

export interface PersonaFile {
  lastSessionAt: string | null;
  lastSummary: string; // 1-2 sentence recap of the most recent visit
  recurringThreads: string[]; // what the patient keeps coming back to
  moments: SessionMoment[]; // accumulated things the patient has shared
  threadToPickUp: string; // a warm line the persona can open with next session
}

export const DEFAULT_PERSONA_FILE: PersonaFile = {
  lastSessionAt: null,
  lastSummary: '',
  recurringThreads: [],
  moments: [],
  threadToPickUp: '',
};

export interface CaregiverProfile {
  patientName: string;
  patientStage: string;
  patientHobbies: string;
  patientWakeTime: string;
  patientSleepTime: string;
  caregiverName: string;
  caregiverRelationship: string;
  patientMode: 'lucid' | 'vivid';
  representedPersona: string;
  representedVoiceId: string;
  driftTimeoutSeconds: number;
  driftEnabled: boolean;
}

export const DEFAULT_PROFILE: CaregiverProfile = {
  patientName: 'Eleanor',
  patientStage: 'Moderate',
  patientHobbies: 'Classical music, rose gardening, baking pies',
  patientWakeTime: '08:00',
  patientSleepTime: '21:00',
  caregiverName: 'Thomas',
  caregiverRelationship: 'Son',
  patientMode: 'lucid',
  representedPersona: 'Beth',
  representedVoiceId: 'zippy-pecan-9151__design-voice-233c4887',
  driftTimeoutSeconds: 25,
  driftEnabled: true,
};
