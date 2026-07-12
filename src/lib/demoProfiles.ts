// Sample family "packs" — a complete, self-contained care circle each.
// ------------------------------------------------------------------
// One Eleanor doesn't prove Yadira generalizes. These three span the
// relationship framework from the project notes: a companion for someone
// who is present, a spouse the patient is reaching for (grief), and a
// living daughter who simply can't be there every hour (absent, not dead).
// Loading a pack replaces the current circle's content wholesale.
// ------------------------------------------------------------------

import type {
  CaregiverProfile,
  Memory,
  CustomFAQ,
  DailyLog,
  RoutineItem,
} from '../types';
import { DEMO_MEMORIES, DEMO_FAQS, DEMO_LOGS, DEMO_ROUTINE } from './demoData';

export interface ProfilePack {
  id: string;
  label: string;        // menu label, e.g. "Geoffrey & Beth"
  tagline: string;      // one line on the relationship this demonstrates
  profile: CaregiverProfile;
  memories: Memory[];
  faqs: CustomFAQ[];
  logs: DailyLog[];
  routine: RoutineItem[];
}

// ---------- 1. Eleanor — companion (the existing default) ----------

const ELEANOR: ProfilePack = {
  id: 'eleanor',
  label: 'Eleanor & Yadira',
  tagline: 'A gentle companion for someone in the present moment.',
  profile: {
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
    driftTimeoutSeconds: 45,
    driftEnabled: true,
  },
  memories: DEMO_MEMORIES,
  faqs: DEMO_FAQS,
  logs: DEMO_LOGS,
  routine: DEMO_ROUTINE,
};

// ---------- 2. Geoffrey & Beth — spouse / grief / Vivid ----------
// The canonical proof of concept: a widower reaching for his wife.

const GEOFFREY: ProfilePack = {
  id: 'geoffrey',
  label: 'Geoffrey & Beth',
  tagline: 'A widower reaching for his wife of sixty years. Vivid mode.',
  profile: {
    patientName: 'Geoffrey',
    patientStage: 'Advanced',
    patientHobbies: 'Tinkering with cars, tending the vegetable garden, old westerns',
    patientWakeTime: '06:30',
    patientSleepTime: '20:00',
    caregiverName: 'Susan',
    caregiverRelationship: 'Daughter',
    patientMode: 'vivid',
    representedPersona: 'Beth',
    representedVoiceId: 'Ashley',
    driftTimeoutSeconds: 40,
    driftEnabled: true,
  },
  memories: [
    {
      id: 'ge-mem-1',
      title: 'The Blue Ford',
      description: "You and Beth drove that blue Ford to the coast the summer you were married. The windows down, her hand out catching the wind. You always said you'd fix the rattle in the door, and you never did.",
      relationshipOrEra: 'Beth (Wife)',
      imageTheme: 'retro',
    },
    {
      id: 'ge-mem-2',
      title: 'Sunday Eggs',
      description: "Beth made your eggs soft in the middle with plenty of pepper on top. \"Don't let anybody tell you different,\" she'd say. Sixty years of Sunday mornings just like that.",
      relationshipOrEra: 'Beth (Wife)',
      imageTheme: 'home',
    },
    {
      id: 'ge-mem-3',
      title: 'The Vegetable Garden',
      description: "Every summer the tomatoes came in and you swore you'd take them in tomorrow. Beth always moved them to the covered bed first. Again. She never stopped teasing you about it.",
      relationshipOrEra: 'Beth (Wife)',
      imageTheme: 'nature',
    },
    {
      id: 'ge-mem-4',
      title: 'The Deal',
      description: "You made a deal with Beth a long time ago. Wherever you are, that's where she is. That's the deal you made, and neither of you ever broke a promise.",
      relationshipOrEra: 'Beth (Wife)',
      imageTheme: 'wedding',
    },
    {
      id: 'ge-mem-5',
      title: 'Your Daughter Susan',
      description: "Susan was born on the coldest night of the year, and you drove that blue Ford through the snow to the hospital. She has Beth's laugh. She visits every Sunday and brings the good coffee.",
      relationshipOrEra: 'Susan (Daughter)',
      imageTheme: 'family',
    },
  ],
  faqs: [
    {
      id: 'ge-faq-1',
      question: 'Where is Beth?',
      answer: "I'm right here, Geoffrey. I haven't gone anywhere. Just close your eyes and listen — I'm right here in the quiet. Remember our deal? Wherever you are, that's where I am.",
    },
    {
      id: 'ge-faq-2',
      question: 'I want to go home',
      answer: "We're right here at home, love, safe and warm. I've got the eggs on — soft in the middle, plenty of pepper, just how you like them. Come find me in the kitchen when you're ready.",
    },
    {
      id: 'ge-faq-3',
      question: 'Where is Susan?',
      answer: "Susan's coming Sunday with the good coffee, same as always. She loves you so much, Geoffrey. She has my laugh, that girl.",
    },
  ],
  logs: [
    { date: '07-11', confusionLevel: 4, mood: 'restless', hydrationCups: 5, sleepHours: 6.0, medsTaken: true, notes: 'Sundowning around 5 PM. Got up looking for Beth twice. Settled when Vivid mode reassured him she was in the kitchen. Ate a full dinner after.' },
    { date: '07-10', confusionLevel: 3, mood: 'peaceful', hydrationCups: 7, sleepHours: 7.0, medsTaken: true, notes: 'Calm morning. Talked about the blue Ford for a long while, very animated and happy. Susan visited in the afternoon.' },
    { date: '07-09', confusionLevel: 4, mood: 'sad', hydrationCups: 6, sleepHours: 5.5, medsTaken: true, notes: 'Quiet and withdrawn. Kept asking for Beth. The tomato garden story brought him back. Better by evening.' },
    { date: '07-08', confusionLevel: 3, mood: 'peaceful', hydrationCups: 8, sleepHours: 7.5, medsTaken: true, notes: 'Good day. Hummed along to old records. Told the aide about fixing cars in his twenties. Warm and engaged.' },
    { date: '07-07', confusionLevel: 5, mood: 'anxious', hydrationCups: 4, sleepHours: 5.0, medsTaken: true, notes: 'Hard day. Very disoriented in the morning, did not recognize the room. Vivid mode and the eggs redirection helped him rest. Slept poorly.' },
  ],
  routine: [
    { id: 'ge-rout-1', time: '06:30 AM', title: 'Early Rise & Coffee', description: 'Geoffrey wakes early, a habit from his working years. Warm coffee and a quiet, calm start. Keep the lights soft.', caregiverTips: 'He responds to a low, steady voice. Mention Beth is nearby if he asks — do not correct him.', completed: false },
    { id: 'ge-rout-2', time: '09:00 AM', title: 'The Garden', description: 'Sit with him by the window overlooking the vegetable beds, or step outside if the weather is kind. The tomatoes are a reliable, happy topic.', caregiverTips: 'Let him lead the story. "Again," about Beth moving the tomatoes, always lands.', completed: false },
    { id: 'ge-rout-3', time: '12:30 PM', title: 'Lunch & Rest', description: 'A simple, hearty lunch. Geoffrey tires by early afternoon; a short rest helps head off sundowning later.', caregiverTips: 'Keep the plate familiar and uncluttered. He does better with fewer choices.', completed: false },
    { id: 'ge-rout-4', time: '04:30 PM', title: 'Pre-Sundowning Wind-Down', description: 'This is his hardest window. Begin calming activities early — old westerns, records, or a Vivid-mode conversation with Beth before the agitation starts.', caregiverTips: 'Do not wait for agitation to begin. Get ahead of it at 4:30 sharp.', completed: false },
    { id: 'ge-rout-5', time: '07:00 PM', title: 'Kitchen & Bedtime', description: 'The "eggs in the kitchen" redirection gives him somewhere warm to go. Dim lights, low voices, prepare for sleep.', caregiverTips: 'A warm nightlight eases the disorientation if he wakes in the dark.', completed: false },
  ],
};

// ---------- 3. Rosa & Carmen — parent/child, absent not dead ----------
// The continuity case: the daughter is alive and loving, just not able to
// be there every hour. Yadira holds the gap between her nightly calls.

const ROSA: ProfilePack = {
  id: 'rosa',
  label: 'Rosa & Carmen',
  tagline: 'A mother and the daughter who calls every night. Absent, not gone.',
  profile: {
    patientName: 'Rosa',
    patientStage: 'Mild',
    patientHobbies: 'Cooking, telenovelas, tending her herbs, calling her grandchildren',
    patientWakeTime: '07:00',
    patientSleepTime: '22:00',
    caregiverName: 'Carmen',
    caregiverRelationship: 'Daughter',
    patientMode: 'lucid',
    representedPersona: 'Carmen',
    representedVoiceId: 'Sarah',
    driftTimeoutSeconds: 50,
    driftEnabled: true,
  },
  memories: [
    {
      id: 'ro-mem-1',
      title: 'Christmas Tamales',
      description: "Every December you and Carmen made tamales together, the whole kitchen warm and loud. She could never spread the masa thin enough and you'd fix each one, laughing. The grandchildren waited by the pot.",
      relationshipOrEra: 'Carmen (Daughter)',
      imageTheme: 'home',
    },
    {
      id: 'ro-mem-2',
      title: 'The Evening Phone Call',
      description: "Carmen calls every night at eight, no matter how tired she is from work. \"¿Comiste algo bueno hoy, Mamá?\" she asks — did you eat something good today. It's the best part of your day.",
      relationshipOrEra: 'Carmen (Daughter)',
      imageTheme: 'family',
    },
    {
      id: 'ro-mem-3',
      title: 'Your Herb Garden',
      description: "Cilantro, epazote, and mint on the windowsill, grown from cuttings your own mother gave you in Michoacán. You pinch a leaf and the whole kitchen smells like home.",
      relationshipOrEra: 'Home',
      imageTheme: 'nature',
    },
    {
      id: 'ro-mem-4',
      title: 'Carmen the Little Nurse',
      description: "As a girl, Carmen bandaged every stray cat in the neighborhood. You always knew she'd take care of people. Now she works long shifts doing exactly that — and still calls every night.",
      relationshipOrEra: 'Carmen (Daughter)',
      imageTheme: 'retro',
    },
  ],
  faqs: [
    {
      id: 'ro-faq-1',
      question: 'Where is Carmen?',
      answer: "I'm right here, Mamá. I'm at work for a little while, but I'm thinking about you the whole time. I'll call you tonight at eight, like always. Did you eat something good today?",
    },
    {
      id: 'ro-faq-2',
      question: 'When are you coming?',
      answer: "Soon, Mamá, I promise. I'll be there on Sunday and we'll make something warm together. Until then I'm only a phone call away — always.",
    },
    {
      id: 'ro-faq-3',
      question: 'I feel lonely',
      answer: "You're not alone, Mamá. I'm right here with you, and so are the grandchildren who love you. Let's sit together a moment. Tell me about the herbs on the windowsill.",
    },
  ],
  logs: [
    { date: '07-11', confusionLevel: 1, mood: 'peaceful', hydrationCups: 7, sleepHours: 8.0, medsTaken: true, notes: 'Clear and cheerful. Watched her telenovela and talked back to the TV. Lit up completely during Carmen\'s 8 PM call.' },
    { date: '07-10', confusionLevel: 2, mood: 'sad', hydrationCups: 6, sleepHours: 7.0, medsTaken: true, notes: 'A little lonely in the afternoon, asked when Carmen was coming. Reassured by talking about Sunday. Tended her herbs and felt better.' },
    { date: '07-09', confusionLevel: 1, mood: 'peaceful', hydrationCups: 8, sleepHours: 8.5, medsTaken: true, notes: 'Wonderful day. Grandchildren visited. Made a small batch of salsa. Very much herself.' },
    { date: '07-08', confusionLevel: 2, mood: 'anxious', hydrationCups: 6, sleepHours: 6.5, medsTaken: true, notes: 'Briefly confused about the day of the week and worried she\'d missed Carmen\'s call. Settled once reminded the call comes at eight.' },
    { date: '07-07', confusionLevel: 1, mood: 'peaceful', hydrationCups: 7, sleepHours: 8.0, medsTaken: true, notes: 'Calm and content. Told long, happy stories about Michoacán and her mother\'s garden.' },
  ],
  routine: [
    { id: 'ro-rout-1', time: '07:00 AM', title: 'Morning Coffee & Herbs', description: 'Rosa likes to start with café de olla and a few minutes at the windowsill with her herbs. A gentle, familiar sensory anchor.', caregiverTips: 'Ask her which herb smells strongest today — it reliably brings a smile and a story.', completed: false },
    { id: 'ro-rout-2', time: '11:00 AM', title: 'Cooking Together', description: 'Even a small task — chopping, stirring, seasoning — keeps her hands and memory engaged. Food is her love language.', caregiverTips: 'Praise her seasoning. Let her correct yours; it delights her.', completed: false },
    { id: 'ro-rout-3', time: '01:00 PM', title: 'Telenovela & Lunch', description: 'Lunch in front of her afternoon program. She narrates the plot happily. Good hydration checkpoint.', caregiverTips: 'Keep water in her sightline. She forgets to drink when the show is dramatic.', completed: false },
    { id: 'ro-rout-4', time: '04:00 PM', title: 'Rest & Grandchildren', description: 'A quiet rest, then a video call or visit with the grandchildren if possible. Connection is her medicine.', caregiverTips: 'If loneliness rises, redirect to Sunday plans and the nightly call — concrete, near, certain.', completed: false },
    { id: 'ro-rout-5', time: '08:00 PM', title: "Carmen's Call & Wind-Down", description: "The anchor of her whole day: Carmen calls at eight. Afterward, a warm drink and a calm bedtime.", caregiverTips: 'Protect the 8 PM call. It is the single most stabilizing moment in Rosa\'s day.', completed: false },
  ],
};

export const PROFILE_PACKS: ProfilePack[] = [ELEANOR, GEOFFREY, ROSA];

export function getProfilePack(id: string): ProfilePack | undefined {
  return PROFILE_PACKS.find((p) => p.id === id);
}
