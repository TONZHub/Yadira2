// Shared data types for Yadira
// Used by App.tsx, the data layer, and (eventually) the server

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
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
  representedVoiceId: 'Sarah',
  driftTimeoutSeconds: 25,
  driftEnabled: true,
};
