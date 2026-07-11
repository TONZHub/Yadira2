// Rich demo data for XPRIZE Hackathon demo
// Clinically realistic Eleanor profile + memories + FAQs + logs

import type { Memory, CustomFAQ, DailyLog, RoutineItem } from '../types';

export const DEMO_MEMORIES: Memory[] = [
  {
    id: 'mem-1',
    title: 'Your Wedding with Edward (1974)',
    description: 'You married Edward on a beautiful sunny June day in the rose garden. You wore a white lace dress and danced to "Can\'t Help Falling in Love". Edward looked so handsome in his navy suit.',
    relationshipOrEra: 'Edward (Husband)',
    imageTheme: 'wedding'
  },
  {
    id: 'mem-2',
    title: 'Your Dog, Barnaby',
    description: 'Barnaby was a sweet golden retriever who loved running after tennis balls and sleeping right at the foot of your bed. He was your loyal companion for 12 wonderful years.',
    relationshipOrEra: 'Pet',
    imageTheme: 'family'
  },
  {
    id: 'mem-3',
    title: 'Growing up in Lake Tahoe',
    description: 'You spent summers swimming in the crystal blue waters of Lake Tahoe and winters drinking hot cocoa with marshmallow by the stone fireplace in your family cabin.',
    relationshipOrEra: 'Childhood',
    imageTheme: 'nature'
  },
  {
    id: 'mem-4',
    title: 'Rose Gardening at Home',
    description: 'You spent every spring planting hybrid tea roses and tending your beautiful garden. The scent of blooming roses was your favorite thing in the world. You\'d cut bouquets for the dinner table.',
    relationshipOrEra: 'Hobby',
    imageTheme: 'nature'
  },
  {
    id: 'mem-5',
    title: 'Thomas\'s First Day of School',
    description: 'Your son Thomas was so nervous about starting kindergarten. You sent him off with his favorite red lunchbox and a kiss on the forehead. He came home so proud of his artwork.',
    relationshipOrEra: 'Thomas (Son)',
    imageTheme: 'family'
  },
  {
    id: 'mem-6',
    title: 'Classical Music Nights',
    description: 'Edward and you would sit together listening to Chopin and Beethoven on the record player. You\'d hold hands during the Nocturnes. Those were some of your most peaceful moments.',
    relationshipOrEra: 'Edward (Husband)',
    imageTheme: 'retro'
  },
];

export const DEMO_FAQS: CustomFAQ[] = [
  {
    id: 'faq-1',
    question: 'Where is my family?',
    answer: 'Your son Thomas is currently at work, dear. He loves you very much and is coming over to have dinner with you at 5:30 PM. You are completely safe and warm here. He calls every morning to say hello.'
  },
  {
    id: 'faq-2',
    question: 'Where am I?',
    answer: 'You are in your beautiful, cozy apartment in Portland. Your favorite green chair is right here by the window with a lovely view of the garden. Your favorite tea is brewing. You are safe.'
  },
  {
    id: 'faq-3',
    question: 'Did I take my medicine?',
    answer: 'Yes, dear! You took your medicine this morning at 8:00 AM with your orange juice. You\'re all set. Thomas will help you with your evening dose at 6:00 PM when he visits.'
  },
  {
    id: 'faq-4',
    question: 'Is Edward here?',
    answer: 'Edward is resting right now, but he loves you very much. He\'s thinking of you. Would you like to look through some photos of your beautiful times together?'
  },
];

export const DEMO_LOGS: DailyLog[] = [
  {
    date: '07-10',
    confusionLevel: 2,
    mood: 'peaceful',
    hydrationCups: 8,
    sleepHours: 7.5,
    medsTaken: true,
    notes: 'Eleanor was very engaged this morning. Had tea and looked through old photos. Enjoyed classical music at 2 PM. Calm and smiling throughout the day.'
  },
  {
    date: '07-09',
    confusionLevel: 3,
    mood: 'anxious',
    hydrationCups: 6,
    sleepHours: 6.0,
    medsTaken: true,
    notes: 'Some sundowning agitation around 5 PM. Asked where Thomas was several times. Calmed down after listening to soft music and looking at family photos. Better after dinner.'
  },
  {
    date: '07-08',
    confusionLevel: 2,
    mood: 'peaceful',
    hydrationCups: 7,
    sleepHours: 8.0,
    medsTaken: true,
    notes: 'Excellent day. Thomas visited. Eleanor remained coherent and smiled a lot. They played cards together. Had healthy lunch and dinner.'
  },
  {
    date: '07-07',
    confusionLevel: 4,
    mood: 'restless',
    hydrationCups: 5,
    sleepHours: 5.5,
    medsTaken: true,
    notes: 'Slightly more confused today. Asked for her mother twice. Grounded with old photos and stories. Evening was better.'
  },
  {
    date: '07-06',
    confusionLevel: 3,
    mood: 'sad',
    hydrationCups: 6,
    sleepHours: 6.5,
    medsTaken: true,
    notes: 'A bit quiet and withdrawn this morning. Listened to old jazz records which seemed to cheer her up. Smiled during lunch.'
  },
  {
    date: '07-05',
    confusionLevel: 2,
    mood: 'peaceful',
    hydrationCups: 8,
    sleepHours: 7.5,
    medsTaken: true,
    notes: 'Stable and engaged with puzzle solving. Very cooperative. Good appetite at all meals. Peaceful in the evening.'
  },
];

export const DEMO_ROUTINE: RoutineItem[] = [
  {
    id: 'rout-1',
    time: '08:30 AM',
    title: 'Morning Sunshine & Warm Tea',
    description: 'Open the blinds for natural morning light to help establish circadian rhythm. Share a warm chamomile tea and a simple, nutritious breakfast.',
    caregiverTips: 'Speak in short, bright sentences. Use a cheerful tone to start the day positively. Eleanor loves to sit by the window.',
    completed: false
  },
  {
    id: 'rout-2',
    time: '10:00 AM',
    title: 'Memory Album Reminiscence',
    description: 'Flip through the Yadira Memory Book or physical albums. Ask open-ended sensory questions (e.g., "Doesn\'t that lake look beautiful and cool?").',
    caregiverTips: 'Do not test or quiz them ("Do you remember who this is?"). Instead, share the memory directly ("This is you and Edward at Tahoe!").',
    completed: false
  },
  {
    id: 'rout-3',
    time: '12:30 PM',
    title: 'Nourishing Lunch & Hydration Check',
    description: 'Prepare a simple, familiar lunch. Ensure Eleanor drinks water or herbal tea. This is a good moment to check medication adherence.',
    caregiverTips: 'Keep portions moderate. Offer choices between two options. Praise her for eating well.',
    completed: false
  },
  {
    id: 'rout-4',
    time: '02:00 PM',
    title: 'Gentle Activity: Classical Music or Gardening',
    description: 'Eleanor loves classical music and gardening. Play Chopin or Beethoven, or do light gardening activities together.',
    caregiverTips: 'Avoid overstimulation. Keep activities low-stress. Let her lead the pace.',
    completed: false
  },
  {
    id: 'rout-5',
    time: '05:30 PM',
    title: 'Thomas\'s Visit & Family Time',
    description: 'Thomas visits most evenings. They share dinner and conversation. This is Eleanor\'s favorite time of day.',
    caregiverTips: 'Encourage engagement but don\'t push if Eleanor is tired. Keep visit calm and positive.',
    completed: false
  },
  {
    id: 'rout-6',
    time: '08:00 PM',
    title: 'Evening Wind-Down & Preparation for Bed',
    description: 'Dim the lights. Switch to calming activities. Light herbal tea or warm milk. Prepare bedroom for sleep.',
    caregiverTips: 'Routine is critical for good sleep. Keep bedtime consistent. No screens 30 mins before sleep.',
    completed: false
  },
];
