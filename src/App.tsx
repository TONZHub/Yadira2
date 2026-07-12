import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Heart, 
  User, 
  Users,
  Plus, 
  Trash, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  Clock, 
  Activity, 
  Check, 
  Image as ImageIcon, 
  AlertTriangle, 
  Send, 
  RefreshCw, 
  Sliders, 
  PlusCircle,
  HelpCircle,
  Shield,
  HeartHandshake,
  Music2,
  LogOut
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Message, Memory, CustomFAQ, DailyLog, RoutineItem, PersonaFile, SessionMoment } from './types';
import { DEFAULT_PROFILE, DEFAULT_PERSONA_FILE } from './types';
import { useStoreList, useStoreDoc } from './lib/useStore';
import { getCircleId } from './lib/firebase';
import { VoiceInput, MediaUpload, EmotionBadge, LoginScreen, AuroraScreen, DigestibleMessage, FamilySetup, SensoryRoomsMenu, RainyWindow, AutumnLeaves, ForestCanopy } from './components';
import type { FamilyPackApply } from './components';
import type { RoomId } from './lib/sensoryRooms';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ToastProvider, useToast } from './lib/ToastContext';
import { DEMO_MEMORIES, DEMO_FAQS, DEMO_LOGS, DEMO_ROUTINE } from './lib/demoData';
import { playMemorySoundscape } from './lib/soundscapes';
import { ChatMessageSkeleton, MemorySkeleton, RoutineSkeleton, LogSkeleton } from './components/LoadingSkeletons';

// Realistic pre-populated clinical logs for a high-fidelity starting state (caregiver charts look populated immediately)
const INITIAL_LOGS: DailyLog[] = [
  { date: '07-02', confusionLevel: 2, mood: 'peaceful', hydrationCups: 6, sleepHours: 7.5, medsTaken: true, notes: 'Eleanor was very engaged in the morning. Had tea and talked about gardening.' },
  { date: '07-03', confusionLevel: 3, mood: 'anxious', hydrationCups: 4, sleepHours: 6.0, medsTaken: true, notes: 'Some sundowning agitation around 5 PM. Calmed down after hearing soft music.' },
  { date: '07-04', confusionLevel: 4, mood: 'restless', hydrationCups: 5, sleepHours: 5.5, medsTaken: true, notes: 'Slightly more confused today, asked for her mother twice. Grounded with old photos.' },
  { date: '07-05', confusionLevel: 2, mood: 'peaceful', hydrationCups: 7, sleepHours: 8.0, medsTaken: true, notes: 'Excellent day. Had family visit. Remained coherent and smiling.' },
  { date: '07-06', confusionLevel: 3, mood: 'sad', hydrationCups: 6, sleepHours: 6.5, medsTaken: true, notes: 'A bit quiet and withdrawn. Listened to old jazz records which cheered her up.' },
  { date: '07-07', confusionLevel: 2, mood: 'peaceful', hydrationCups: 8, sleepHours: 7.5, medsTaken: true, notes: 'Stable. Engaged in puzzle solving.' },
];

const INITIAL_MEMORIES: Memory[] = [
  {
    id: 'mem-1',
    title: 'Your Wedding with Edward (1974)',
    description: 'You married Edward on a beautiful sunny June day in the rose garden. You wore a white lace dress and danced to "Can\'t Help Falling in Love".',
    relationshipOrEra: 'Edward (Husband)',
    imageTheme: 'wedding'
  },
  {
    id: 'mem-2',
    title: 'Your Dog, Barnaby',
    description: 'Barnaby was a sweet golden retriever who loved running after tennis balls and sleeping right at the foot of your bed. He was your loyal companion.',
    relationshipOrEra: 'Pet',
    imageTheme: 'family'
  },
  {
    id: 'mem-3',
    title: 'Growing up in Lake Tahoe',
    description: 'You spent summers swimming in the crystal blue waters of Lake Tahoe and winters drinking hot cocoa with marshmallow by the stone fireplace.',
    relationshipOrEra: 'Childhood',
    imageTheme: 'nature'
  }
];

const INITIAL_FAQS: CustomFAQ[] = [
  {
    id: 'faq-1',
    question: 'Where is my family?',
    answer: 'Your son Thomas is currently at work, dear. He loves you very much and is coming over to have dinner with you at 5:30 PM. You are completely safe and warm here.'
  },
  {
    id: 'faq-2',
    question: 'Where am I?',
    answer: 'You are in your beautiful, cozy apartment in Portland. Your favorite green chair is right here, and your favorite tea is brewing. You are safe.'
  }
];

const DEFAULT_ROUTINE: RoutineItem[] = [
  {
    id: 'rout-1',
    time: '08:30 AM',
    title: 'Morning Sunshine & Warm Tea',
    description: 'Open the blinds for natural morning light to help establish circadian rhythm. Share a warm chamomile tea and a simple, nutritious breakfast.',
    caregiverTips: 'Speak in short, bright sentences. Use a cheerful tone to start the day positively.',
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
    description: 'Serve a colourful lunch rich in Omega-3s. Fill a clear cup with water and gently encourage drinking.',
    caregiverTips: 'Place the cup directly in their line of sight. Hand-to-hand guidance is helpful if they forget to sip.',
    completed: false
  },
  {
    id: 'rout-4',
    time: '03:00 PM',
    title: 'Gentle Classical Music & Puzzle',
    description: 'Play soft piano or orchestral music (classical baroque or Chopin) while working on a simple tactile puzzle or folding warm linens.',
    caregiverTips: 'Music is incredibly powerful for memory. If they want to hum or move, join in gently.',
    completed: false
  },
  {
    id: 'rout-5',
    time: '06:00 PM',
    title: 'Calming Dinner & Grounding Conversation',
    description: 'Keep the dinner environment quiet and dim to counter any evening sundowning confusion. Reassure them that they are safe at home.',
    caregiverTips: 'Avoid noisy television or clattering dishes. Speak slowly and maintain reassuring eye contact.',
    completed: false
  }
];

function AppContent() {
  const { user, sessionRole, logout } = useAuth();
  const isPatientSession = sessionRole === 'patient';
  const { error: toastError, success: toastSuccess } = useToast();
  const [demoSeeded, setDemoSeeded] = useState(false);

  // Auth headers for API requests that must fail *silently* (drift, reflection)
  // — apiCall below raises a toast on failure, which is wrong for background
  // calls the patient should never notice.
  const authHeaders = (): HeadersInit => {
    const token = localStorage.getItem('yadira_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  // Helper to add auth token to API requests
  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const token = localStorage.getItem('yadira_token');
      const headers = new Headers(options.headers || {});
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const response = await fetch(url, { ...options, headers });
      if (!response.ok && response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (err: any) {
      toastError('Network Error', err.message || 'Failed to reach server');
      throw err;
    }
  };

  // Navigation: 'patient' or 'caregiver'
  const [activeTab, setActiveTab] = useState<'patient' | 'caregiver'>(isPatientSession ? 'patient' : 'caregiver');
  const isCaregiverPreview = !isPatientSession && activeTab === 'patient';
  useEffect(() => {
    if (isPatientSession && activeTab !== 'patient') {
      setActiveTab('patient');
    }
  }, [isPatientSession, activeTab]);

  // Caregiver Config State — now persisted (was lost on refresh before)
  const [profile, setProfile] = useStoreDoc('profile', DEFAULT_PROFILE);
  const { 
    patientName, 
    patientStage, 
    patientHobbies, 
    patientWakeTime, 
    patientSleepTime, 
    caregiverName, 
    caregiverRelationship,
    patientMode,
    representedPersona,
    representedVoiceId,
    driftTimeoutSeconds,
    driftEnabled
  } = profile;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  
  const setPatientName = (v: string) => setProfile({ ...profile, patientName: v });
  const setPatientStage = (v: string) => setProfile({ ...profile, patientStage: v });
  const setPatientHobbies = (v: string) => setProfile({ ...profile, patientHobbies: v });
  const setPatientWakeTime = (v: string) => setProfile({ ...profile, patientWakeTime: v });
  const setPatientSleepTime = (v: string) => setProfile({ ...profile, patientSleepTime: v });
  const setCaregiverName = (v: string) => setProfile({ ...profile, caregiverName: v });
  const setCaregiverRelationship = (v: string) => setProfile({ ...profile, caregiverRelationship: v });
  const setPatientMode = (v: 'lucid' | 'vivid') => {
    setProfile({ ...profileRef.current, patientMode: v });
    // Same-browser fast path: fires the native `storage` event in any other
    // tab of this browser sharing localStorage.
    localStorage.setItem('yadira_shared_mode', JSON.stringify({ mode: v, at: Date.now() }));
    // Cross-context path: also push to the backend so two genuinely separate
    // browser tabs/devices (which don't share localStorage) stay in sync too.
    fetch('/api/shared-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: v, circle: getCircleId() }),
    }).catch((err) => console.warn('[Yadira] shared-mode push failed', err));
  };
  const setRepresentedPersona = (v: string) => setProfile({ ...profile, representedPersona: v });
  const setRepresentedVoiceId = (v: string) => setProfile({ ...profile, representedVoiceId: v });
  const setDriftTimeoutSeconds = (v: number) => setProfile({ ...profile, driftTimeoutSeconds: v });
  const setDriftEnabled = (v: boolean) => setProfile({ ...profile, driftEnabled: v });

  // Persisted stores — localStorage today, Firestore the moment config exists
  const [memories, setMemories] = useStoreList<Memory>('memories', INITIAL_MEMORIES);
  const [faqs, setFaqs] = useStoreList<CustomFAQ>('faqs', INITIAL_FAQS);
  const [logs, setLogs] = useStoreList<DailyLog>('logs', INITIAL_LOGS, 'date');
  const [routine, setRoutine] = useStoreList<RoutineItem>('routine', DEFAULT_ROUTINE);

  // The persona file — session-to-session memory. Written to after every
  // conversation (see runReflection), read into every chat prompt. This is
  // what separates Yadira from tools that forget the people who forget.
  const [personaFile, setPersonaFile] = useStoreDoc<PersonaFile>('personaFile', DEFAULT_PERSONA_FILE);
  const personaFileRef = useRef(personaFile);
  personaFileRef.current = personaFile;

  // Seed demo data on first login
  useEffect(() => {
    if (user && !demoSeeded) {
      // Per-circle flag: each new family gets the sample content once, and a
      // second account on the same browser doesn't inherit the first's flag.
      const seededKey = `yadira_${getCircleId()}_seeded_demo`;
      const isFirstLogin = localStorage.getItem(seededKey) !== 'true';
      if (isFirstLogin) {
        setMemories(DEMO_MEMORIES);
        setFaqs(DEMO_FAQS);
        setLogs(DEMO_LOGS);
        setRoutine(DEMO_ROUTINE);
        localStorage.setItem(seededKey, 'true');
        setDemoSeeded(true);
        if (sessionRole === 'patient') {
          toastSuccess('Welcome back', `${patientName || 'Eleanor'}, you are safe and supported.`);
        } else {
          toastSuccess('Welcome, Thomas!', `${patientName || 'Eleanor'}'s profile is loaded and ready`);
        }
      }
    }
  }, [user, demoSeeded, sessionRole, patientName]);

  useEffect(() => {
    const applySharedMode = (nextMode: unknown) => {
      if ((nextMode === 'lucid' || nextMode === 'vivid') && profileRef.current.patientMode !== nextMode) {
        setProfile({ ...profileRef.current, patientMode: nextMode });
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'yadira_shared_mode' || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as { mode?: 'lucid' | 'vivid' };
        applySharedMode(parsed.mode);
      } catch {
        // Ignore malformed sync payloads.
      }
    };

    const existingLocal = localStorage.getItem('yadira_shared_mode');
    if (existingLocal) {
      try {
        const parsed = JSON.parse(existingLocal) as { mode?: 'lucid' | 'vivid' };
        applySharedMode(parsed.mode);
      } catch {
        // Ignore malformed local payloads.
      }
    }

    window.addEventListener('storage', onStorage);

    // Poll the backend too. The `storage` event only reaches other tabs of
    // the SAME browser — it never fires for genuinely separate browser
    // windows/devices. Polling the shared server state is what makes the
    // caregiver tab and patient tab agree even when they aren't sharing
    // localStorage.
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/shared-mode?circle=${encodeURIComponent(getCircleId())}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) applySharedMode(data?.mode);
      } catch {
        // Best-effort — ignore transient network errors during polling.
      }
    };
    poll();
    const intervalId = window.setInterval(poll, 1500);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
      window.clearInterval(intervalId);
    };
  }, []);

  // ---- Yadira Premium (gates the extra calming rooms + paid features) ----
  // Persisted per circle so both the caregiver's and patient's devices agree.
  // Stripe checkout will flip `unlocked` here; for now a caregiver toggles it.
  const [premium, setPremium] = useStoreDoc<{ unlocked: boolean }>('premium', { unlocked: false });
  const isPremium = !!premium.unlocked;

  // Calming rooms — Aurora (free) plus the premium sensory rooms.
  const [showRoomsMenu, setShowRoomsMenu] = useState(false);
  const [premiumRoom, setPremiumRoom] = useState<RoomId | null>(null);

  // ---- Aurora (intentional visual dissociation screen) ----
  const [auroraActive, setAuroraActiveState] = useState(false);

  const setAuroraActive = (active: boolean) => {
    setAuroraActiveState(active);
    // Silence Yadira when drifting — audio is jarring against the visual calm
    if (active) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      try { window.speechSynthesis.cancel(); } catch (_) {}
      setIsSpeaking(false);
    }
    // Same-browser tabs via storage event
    localStorage.setItem('yadira_aurora_mode', JSON.stringify({ active, at: Date.now() }));
    // Cross-device sync via backend
    fetch('/api/aurora-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active, circle: getCircleId() }),
    }).catch((err) => console.warn('[Yadira] aurora push failed', err));
  };

  // Launch a room from the picker. Aurora keeps its cross-device beam; the
  // premium rooms open locally on the device that chose them.
  const openRoom = (id: RoomId) => {
    setShowRoomsMenu(false);
    if (id === 'aurora') {
      setAuroraActive(true);
      return;
    }
    if (!isPremium) return; // menu already gates, belt-and-suspenders
    // Quiet Yadira's voice against the calm, same as Aurora does.
    if (activeAudioRef.current) { activeAudioRef.current.pause(); activeAudioRef.current = null; }
    try { window.speechSynthesis.cancel(); } catch (_) {}
    setIsSpeaking(false);
    setPremiumRoom(id);
  };

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== 'yadira_aurora_mode' || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as { active?: boolean };
        if (typeof parsed.active === 'boolean') setAuroraActiveState(parsed.active);
      } catch { /* ignore */ }
    };
    window.addEventListener('storage', onStorage);

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/aurora-mode?circle=${encodeURIComponent(getCircleId())}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (typeof data?.active === 'boolean') setAuroraActiveState(data.active);
      } catch { /* best-effort */ }
    };
    poll();
    const id = window.setInterval(poll, 1500);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
      window.clearInterval(id);
    };
  }, []);

  // New Memory Modal State
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemDesc, setNewMemDesc] = useState('');
  const [newMemEra, setNewMemEra] = useState('');
  const [newMemTheme, setNewMemTheme] = useState<'family' | 'nature' | 'retro' | 'home' | 'wedding'>('family');
  const [showMemModal, setShowMemModal] = useState(false);

  // Family setup / onboarding modal
  const [showFamilySetup, setShowFamilySetup] = useState(false);

  // New FAQ State
  const [newFaqQuest, setNewFaqQuest] = useState('');
  const [newFaqAns, setNewFaqAns] = useState('');

  // Daily Log Inputs
  const [logConfusion, setLogConfusion] = useState<number>(2);
  const [logMood, setLogMood] = useState<'peaceful' | 'anxious' | 'restless' | 'sad'>('peaceful');
  const [logHydration, setLogHydration] = useState<number>(6);
  const [logSleep, setLogSleep] = useState<number>(7.5);
  const [logMeds, setLogMeds] = useState<boolean>(true);
  const [logNotes, setLogNotes] = useState('');

  // AI Generation Loading States
  const [loadingRoutine, setLoadingRoutine] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [aiInsights, setAiInsights] = useState<{
    clinicalSummary: string;
    criticalAlerts: string[];
    actionableTips: string[];
  } | null>(null);

  // Patient Chat State — persisted like every other store, so a page refresh
  // or connection drop never erases the conversation. (The Elsy killswitch
  // test: ask her if she remembers. She does.)
  const buildGreeting = (): Message => {
    const isVividMode = profile?.patientMode === 'vivid';
    const persona = profile?.representedPersona || 'Beth';
    const thread = personaFile?.threadToPickUp || '';
    const greetingText = isVividMode
      ? thread
        ? `Hello, love. It's me, ${persona}. ${thread}`
        : `Hello, love. It's me, ${persona}. I'm right here with you.`
      : `Hello, ${profile?.patientName || 'dear'}! I am Yadira, and I'm sitting right here with you. How is your heart feeling today?`;
    return {
      id: 'greet',
      role: 'model',
      text: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };
  const [chatMessages, setChatMessages] = useStoreList<Message>('chat', [buildGreeting()]);
  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;
  // Messages that were already present at mount render fully; anything that
  // arrives later reveals one thought-bubble at a time (see DigestibleMessage).
  const mountIdsRef = useRef<Set<string> | null>(null);
  if (mountIdsRef.current === null) {
    mountIdsRef.current = new Set(chatMessages.map((m) => m.id));
  }
  // Chunk reveals happen after the message itself is appended, so the log
  // needs a nudge to follow them down.
  const scrollLogToBottom = () => {
    const log = messageLogRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
  };
  // Append helper — caps the stored transcript so localStorage/Firestore stay lean.
  const appendChatMessage = (msg: Message) => {
    setChatMessages(prev => [...prev, msg].slice(-60));
  };
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  // Tracks whether Beth's voice is actually playing (Inworld audio or the
  // browser SpeechSynthesis fallback) so the drift timer can wait for her
  // to finish talking instead of starting the moment text generation ends.
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(isPatientSession);
  const [soundFeedback, setSoundFeedback] = useState(true);

  // Ref for chat auto-scrolling — the message-log container itself, NOT a
  // sentinel div: scrollIntoView() scrolls every scrollable ancestor, and the
  // root overflow-hidden wrapper is programmatically scrollable, so on load it
  // silently shifted the whole app up ~100px and clipped the header.
  const messageLogRef = useRef<HTMLDivElement>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);
  const startupGreetingSpokenRef = useRef(false);

  // Unlock browser audio autoplay policy on the first user interaction.
  // This is critical so that Inworld audio can play even when the chat
  // is submitted via Enter key (which browsers don't count as a gesture).
  useEffect(() => {
    const unlock = () => {
      if (audioUnlockedRef.current) return;
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ctx.resume().then(() => {
          ctx.suspend();
          audioUnlockedRef.current = true;
          console.log('[Audio] Context unlocked by user interaction.');
        });
      } catch (_) {}
    };
    window.addEventListener('click', unlock, { once: false, passive: true });
    window.addEventListener('keydown', unlock, { once: false, passive: true });
    window.addEventListener('touchstart', unlock, { once: false, passive: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // (localStorage sync now handled inside useStore — with Firestore on top)

  // Scroll to bottom of chat — scoped to the log container only
  useEffect(() => {
    const log = messageLogRef.current;
    if (log) {
      log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  // Handle active mode transition dynamically (update greeting and speak it)
  const prevModeRef = useRef(patientMode);
  useEffect(() => {
    if (prevModeRef.current !== patientMode) {
      prevModeRef.current = patientMode;
      if (patientMode === 'vivid') {
        const thread = personaFileRef.current?.threadToPickUp || '';
        const text = thread
          ? `Hello, love. It's me, ${representedPersona || 'Beth'}. ${thread}`
          : `Hello, love. It's me, ${representedPersona || 'Beth'}. I'm right here with you.`;
        setChatMessages(prev => prev.map(m => m.id === 'greet' ? { ...m, text } : m));
        if (activeTab === 'patient' && !auroraActive) speakText(text);
        if (soundFeedback) playSoundCue('chime');
      } else {
        const text = `Hello, ${patientName || 'dear'}! I am Yadira, and I'm sitting right here with you. How is your heart feeling today?`;
        setChatMessages(prev => prev.map(m => m.id === 'greet' ? { ...m, text } : m));
        if (activeTab === 'patient' && !auroraActive) speakText(text);
        if (soundFeedback) playSoundCue('pop');
      }
    }
  }, [patientMode, representedPersona, patientName, soundFeedback, activeTab]);

  // Proactive Drift Detection (Inactivity Timer calling /api/drift/proactive)
  // We derive the last user message ID so the effect only re-runs when the
  // patient actually says something — NOT when model/drift messages are added.
  const lastUserMsg = chatMessages.filter(m => m.role === 'user').slice(-1)[0];
  const lastUserMsgId = lastUserMsg?.id ?? null;

  // She reaches into the silence at most twice, then rests until the patient
  // says something. Counted from the persisted transcript itself (trailing
  // drift messages since the last user message), so page reloads can't re-arm
  // an endless stream of unanswered reaches into an empty room.
  const MAX_UNANSWERED_REACHES = 2;
  let trailingDriftReaches = 0;
  for (let i = chatMessages.length - 1; i >= 0; i--) {
    if (chatMessages[i].role === 'user') break;
    if (chatMessages[i].id.startsWith('msg-drift-')) trailingDriftReaches++;
  }

  useEffect(() => {
    if (activeTab !== 'patient' || !driftEnabled || auroraActive) return;
    if (isTyping) return;
    // Wait for Beth's voice to actually finish before starting the drift
    // countdown — otherwise the timer runs out while she's still talking.
    if (isSpeaking) return;

    // The reaches went unanswered — rest, stay present, don't pester.
    if (trailingDriftReaches >= MAX_UNANSWERED_REACHES) return;

    const triggerDriftReach = async () => {
      try {
        // Auth middleware protects /api/drift — without the Bearer header this
        // call 401s and the proactive reach silently never happens.
        const response = await fetch('/api/drift/proactive', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            patientName,
            representedPersona,
            memories: memories.map(m => ({ title: m.title, description: m.description, relationshipOrEra: m.relationshipOrEra })),
            personaFile: personaFileRef.current
          })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const driftReply: Message = {
          id: `msg-drift-${Date.now()}`,
          role: 'model',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        appendChatMessage(driftReply);
        speakText(data.reply);
        if (soundFeedback) playSoundCue('chime');
      } catch (err) {
        console.error('Proactive reach error:', err);
      }
    };

    const timer = setTimeout(() => {
      triggerDriftReach();
    }, driftTimeoutSeconds * 1000);

    return () => clearTimeout(timer);
  }, [lastUserMsgId, trailingDriftReaches, userInput, driftEnabled, driftTimeoutSeconds, activeTab, isTyping, isSpeaking, patientName, representedPersona, memories]);

  // ---- Session reflection: writing the persona file ----
  // Every few patient turns (and whenever the tab is hidden), the transcript
  // is distilled server-side into what they shared, how they seemed, and what
  // they keep coming back to. The result is persisted and read back into every
  // chat prompt — Beth remembers so the patient doesn't have to.
  const reflectingRef = useRef(false);
  const lastReflectedCountRef = useRef<number | null>(null);
  const userMsgCount = chatMessages.filter(m => m.role === 'user').length;
  if (lastReflectedCountRef.current === null) {
    // Messages restored from a previous session were already reflected.
    lastReflectedCountRef.current = userMsgCount;
  }

  const runReflection = async (options: { keepalive?: boolean } = {}): Promise<PersonaFile | null> => {
    const currentCount = chatMessagesRef.current.filter(m => m.role === 'user').length;
    if (reflectingRef.current) return null;
    if (currentCount - (lastReflectedCountRef.current ?? 0) < 1) return null;
    reflectingRef.current = true;
    try {
      const response = await fetch('/api/session/reflect', {
        method: 'POST',
        keepalive: options.keepalive,
        headers: authHeaders(),
        body: JSON.stringify({
          transcript: chatMessagesRef.current.slice(-20).map(m => ({ role: m.role, text: m.text })),
          patientName: profileRef.current.patientName,
          representedPersona: profileRef.current.representedPersona,
          personaFile: personaFileRef.current
        })
      });
      const data = await response.json();
      if (!response.ok || data.error || !data.reflection) return null;

      lastReflectedCountRef.current = currentCount;
      const r = data.reflection;
      const prev = personaFileRef.current;
      const dateStr = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
      const newMoments: SessionMoment[] = (Array.isArray(r.newMoments) ? r.newMoments : [])
        .filter((m: any) => m && m.summary)
        .map((m: any, i: number) => ({
          id: `moment-${Date.now()}-${i}`,
          date: dateStr,
          summary: m.summary,
          emotionalTone: m.emotionalTone || 'calm'
        }));
      const merged: PersonaFile = {
        lastSessionAt: new Date().toISOString(),
        lastSummary: r.sessionSummary || prev.lastSummary,
        recurringThreads: (Array.isArray(r.recurringThreads) && r.recurringThreads.length > 0
          ? r.recurringThreads
          : prev.recurringThreads).slice(0, 6),
        moments: [...newMoments, ...prev.moments].slice(0, 30),
        threadToPickUp: r.threadToPickUp || prev.threadToPickUp
      };
      setPersonaFile(merged);
      return merged;
    } catch (err) {
      console.warn('[Yadira] Session reflection failed (will retry later):', err);
      return null;
    } finally {
      reflectingRef.current = false;
    }
  };

  // Reflect every 3 patient messages while the conversation is quiet…
  useEffect(() => {
    if (isTyping) return;
    if (userMsgCount - (lastReflectedCountRef.current ?? 0) >= 3) {
      runReflection();
    }
  }, [userMsgCount, isTyping]);

  // …and when the tab is hidden or closed, so nothing shared is ever lost.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        runReflection({ keepalive: true });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // "Start Fresh Session" — the killswitch demo. Reflect whatever is pending,
  // clear the conversation, and let the greeting pick the thread back up.
  // The chat resets; the memory doesn't.
  const handleStartFreshSession = async () => {
    const merged = await runReflection();
    const pf = merged || personaFileRef.current;
    const p = profileRef.current;
    const persona = p.representedPersona || 'Beth';
    const greetingText = p.patientMode === 'vivid'
      ? pf.threadToPickUp
        ? `Hello, love. It's me, ${persona}. ${pf.threadToPickUp}`
        : `Hello, love. It's me, ${persona}. I'm right here with you.`
      : pf.threadToPickUp
        ? `Hello, ${p.patientName || 'dear'}! I am Yadira, right here with you as always. ${pf.threadToPickUp}`
        : `Hello, ${p.patientName || 'dear'}! I am Yadira, and I'm sitting right here with you. How is your heart feeling today?`;
    setChatMessages([{
      id: 'greet',
      role: 'model',
      text: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    lastReflectedCountRef.current = 0;
    toastSuccess('New session started', `${persona} kept everything from the last visit.`);
  };

  // Load a sample family or a freshly created one into THIS circle. Replaces
  // the profile and all content, clears the persona file and conversation so
  // the new family starts clean, and syncs the mode across devices.
  const applyFamilyPack = (pack: FamilyPackApply, label: string) => {
    setProfile(pack.profile);
    setMemories(pack.memories);
    setFaqs(pack.faqs);
    setLogs(pack.logs);
    setRoutine(pack.routine);
    setPersonaFile(DEFAULT_PERSONA_FILE);

    const p = pack.profile;
    const greetingText = p.patientMode === 'vivid'
      ? `Hello, love. It's me, ${p.representedPersona || 'Beth'}. I'm right here with you.`
      : `Hello, ${p.patientName || 'dear'}! I am Yadira, and I'm sitting right here with you. How is your heart feeling today?`;
    setChatMessages([{
      id: 'greet',
      role: 'model',
      text: greetingText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    lastReflectedCountRef.current = 0;

    // A loaded family is intentional content — don't let the first-login
    // auto-seed overwrite it on the next mount.
    localStorage.setItem(`yadira_${getCircleId()}_seeded_demo`, 'true');

    // Keep any separate patient device in step with the new family's mode.
    localStorage.setItem('yadira_shared_mode', JSON.stringify({ mode: p.patientMode, at: Date.now() }));
    fetch('/api/shared-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: p.patientMode, circle: getCircleId() }),
    }).catch(() => {});

    setShowFamilySetup(false);
    toastSuccess('Care circle ready', `${label} is loaded and ready.`);
  };

  // Text To Speech helper
  // Core TTS — no tab/voice guard, used internally and by caregiver memory preview.
  const speakTextDirect = (text: string) => {

    // Stop any currently playing speech/audio
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    try {
      window.speechSynthesis.cancel();
    } catch (_) {}

    // Clean text by removing markdown asterisks (e.g. *softly*) so they aren't read out literally
    const cleanedText = text.replace(/\*.*?\*/g, '').trim();
    if (!cleanedText) {
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);

    // Voice is a Yadira Premium feature. Free circles still hear a talking
    // companion — just the device's built-in voice, not the natural (and
    // per-call paid) Inworld voice. If a subscription ever lapses this is the
    // same graceful path: the companion never goes silent, it just softens
    // back to the browser voice. The custom voice config is never discarded,
    // so re-subscribing restores the exact voice a family designed.
    if (!isPremium) {
      fallbackSpeechSynthesis(cleanedText);
      return;
    }

    // First try Inworld proxy endpoint (authenticated fetch), then fall back to browser TTS.
    void (async () => {
      try {
        const selectedVoice = representedVoiceId || 'Sarah';
        const token = localStorage.getItem('yadira_token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const response = await fetch('/api/tts', {
          method: 'POST',
          headers,
          body: JSON.stringify({ text: cleanedText, voiceId: selectedVoice }),
        });
        if (!response.ok) {
          const details = await response.text();
          throw new Error(`TTS request failed (${response.status}): ${details || 'no details'}`);
        }

        const audioBlob = await response.blob();
        const objectUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(objectUrl);
        activeAudioRef.current = audio;

        audio.addEventListener('ended', () => {
          URL.revokeObjectURL(objectUrl);
          setIsSpeaking(false);
        });

        audio.addEventListener('error', () => {
          URL.revokeObjectURL(objectUrl);
          fallbackSpeechSynthesis(cleanedText);
        });

        await audio.play();
      } catch (err) {
        console.warn('[TTS] Inworld backend proxy failed, falling back to browser SpeechSynthesis.', err);
        fallbackSpeechSynthesis(cleanedText);
      }
    })();
  };

  const fallbackSpeechSynthesis = (text: string) => {
    // Try puter.js high-quality cloud TTS first
    void (async () => {
      try {
        const { default: puterModule } = await import('@heyputer/puter.js');
        const selectedVoice = representedVoiceId || 'Sarah';
        const isMale = selectedVoice.toLowerCase() === 'dennis';
        const puterVoice = isMale ? 'onyx' : 'nova';

        const audio = await puterModule.ai.txt2speech(text, {
          provider: 'openai',
          model: 'tts-1',
          voice: puterVoice,
        });
        activeAudioRef.current = audio;

        audio.addEventListener('ended', () => {
          setIsSpeaking(false);
        });

        audio.addEventListener('error', () => {
          // Last resort fallback
          browserLocalSpeechSynthesis(text);
        });

        await audio.play();
      } catch (err) {
        console.warn('[TTS] puter.js failed, falling back to browser local SpeechSynthesis.', err);
        browserLocalSpeechSynthesis(text);
      }
    })();
  };

  const browserLocalSpeechSynthesis = (text: string) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.82;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const friendlyVoice = voices.find(v =>
        v.name.includes('Google US English') ||
        v.name.includes('Natural') ||
        v.name.includes('Zira') ||
        v.name.includes('Samantha')
      );
      if (friendlyVoice) {
        utterance.voice = friendlyVoice;
      }
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('[TTS] Local SpeechSynthesis error:', e);
      setIsSpeaking(false);
    }
  };

  // Public wrapper — only speaks when voice is enabled and on the patient tab.
  const speakText = (text: string) => {
    if (!voiceEnabled || activeTab !== 'patient') return;
    speakTextDirect(text);
  };

  // Play a soft pleasant tone when patient does certain actions (sound therapy cue)
  const playSoundCue = (type: 'chime' | 'pop') => {
    if (!soundFeedback) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'chime') {
        // High, pure harmonic chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.15); // G5
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
      } else {
        // Soft bubble pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      }
    } catch (err) {
      console.warn('AudioContext failed:', err);
    }
  };

  // Speak initial greeting when voice is enabled
  useEffect(() => {
    const storageKey = 'yadira_startup_greeting_spoken';
    const alreadySpokenThisLoad = typeof window !== 'undefined' && sessionStorage.getItem(storageKey) === 'true';
    if (activeTab === 'patient' && chatMessages.length === 1 && voiceEnabled && !startupGreetingSpokenRef.current && !alreadySpokenThisLoad) {
      startupGreetingSpokenRef.current = true;
      sessionStorage.setItem(storageKey, 'true');
      speakText(chatMessages[0].text);
    }
  }, [voiceEnabled, activeTab]);

  // Handle Patient message submission
  const handleSendMessage = async (textToSend: string, emotion?: { emotion: string; confidence: number; tone: string }, mediaInsight?: { description: string; emotion: string; suggestions: string[] }) => {
    if (!textToSend.trim()) return;

    const userMsgId = `msg-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion,
      mediaInsight
    };

    appendChatMessage(userMsg);
    setUserInput('');
    setIsTyping(true);

    if (soundFeedback) playSoundCue('pop');

    try {
      // Build full state details for context injection on the server
      const caregiverSettings = {
        patientName,
        caregiverName,
        relationship: caregiverRelationship,
        customAnswers: faqs.map(f => ({ question: f.question, answer: f.answer })),
        patientMode,
        representedPersona
      };

      const serverHistory = chatMessages.map(m => ({
        role: m.role,
        text: m.text
      }));

      // Inject emotion/media context into the prompt
      let contextualMessage = textToSend;
      if (emotion) {
        contextualMessage += ` [Detected emotion: ${emotion.emotion}]`;
      }
      if (mediaInsight) {
        contextualMessage += ` [Media insight: ${mediaInsight.description}. Emotion: ${mediaInsight.emotion}]`;
      }

      const response = await apiCall('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contextualMessage,
          history: serverHistory,
          caregiverSettings,
          patientMode,
          representedPersona,
          memories: memories.map(m => ({ title: m.title, description: m.description, relationshipOrEra: m.relationshipOrEra })),
          personaFile: personaFileRef.current
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const yadiraReply: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      appendChatMessage(yadiraReply);
      speakText(data.reply);
    } catch (err: any) {
      console.error('Chat error:', err);
      const isVivid = patientMode === 'vivid';
      const persona = representedPersona || 'Beth';
      const fallbackText = isVivid
        ? `I'm right here, sweetheart. I just wanted you to know I'm thinking of you. Take a moment with me.`
        : `I hear you, dear. I am right here with you. Everything is safe and comfortable.`;
      const errorReply: Message = {
        id: `msg-err-${Date.now()}`,
        role: 'model',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      appendChatMessage(errorReply);
      speakText(errorReply.text);
    } finally {
      setIsTyping(false);
    }
  };

  // Routine Activity Completion
  const toggleRoutine = (id: string) => {
    const updated = routine.map(item => {
      if (item.id === id) {
        const nextState = !item.completed;
        if (nextState && soundFeedback) playSoundCue('chime');
        return { ...item, completed: nextState };
      }
      return item;
    });
    setRoutine(updated);
  };

  // Add Caregiver Daily Log
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }).replace('/', '-');
    const newLog: DailyLog = {
      date: todayStr,
      confusionLevel: logConfusion,
      mood: logMood,
      hydrationCups: logHydration,
      sleepHours: logSleep,
      medsTaken: logMeds,
      notes: logNotes || 'Logged symptoms'
    };

    setLogs(prev => {
      // If a log for today already exists, filter it out first
      const clean = prev.filter(l => l.date !== todayStr);
      return [...clean, newLog];
    });

    setLogNotes('');
    alert('Today\'s symptoms and daily stats have been logged securely.');
  };

  // Delete Log
  const handleDeleteLog = (date: string) => {
    setLogs(prev => prev.filter(l => l.date !== date));
  };

  // Memory Actions
  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemTitle || !newMemDesc) return;

    const newMem: Memory = {
      id: `mem-${Date.now()}`,
      title: newMemTitle,
      description: newMemDesc,
      relationshipOrEra: newMemEra || 'Family',
      imageTheme: newMemTheme
    };

    setMemories(prev => [newMem, ...prev]);
    setNewMemTitle('');
    setNewMemDesc('');
    setNewMemEra('');
    setShowMemModal(false);
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  // FAQ Actions
  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuest || !newFaqAns) return;

    const newFaq: CustomFAQ = {
      id: `faq-${Date.now()}`,
      question: newFaqQuest,
      answer: newFaqAns
    };

    setFaqs(prev => [...prev, newFaq]);
    setNewFaqQuest('');
    setNewFaqAns('');
  };

  const handleDeleteFaq = (id: string) => {
    setFaqs(prev => prev.filter(f => f.id !== id));
  };

  // Send Nurse Redirection Cue to Backend and Push as Message to Patient
  const handleSendRedirection = async (nurseNote: string) => {
    if (!nurseNote.trim()) return;
    try {
      // apiCall attaches the Bearer token — /api routes are auth-protected.
      const response = await apiCall('/api/redirection/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nurseNote,
          patientName,
          representedPersona
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Create message from the persona (model)
      const redirectMsg: Message = {
        id: `msg-redirect-${Date.now()}`,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      appendChatMessage(redirectMsg);
      speakText(data.reply);
      if (soundFeedback) playSoundCue('chime');
      alert(`Redirection cue successfully dispatched to Patient View: "${data.reply}"`);
    } catch (err: any) {
      console.error('Redirection error:', err);
      alert('Could not dispatch redirection. Please check if server is running.');
    }
  };

  // AI-Powered Routine Generation
  const handleGenerateAiRoutine = async () => {
    setLoadingRoutine(true);
    try {
      const response = await apiCall('/api/routine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientProfile: {
            name: patientName,
            stage: patientStage,
            hobbies: patientHobbies,
            wakeTime: patientWakeTime,
            sleepTime: patientSleepTime
          }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.routine && Array.isArray(data.routine)) {
        const formattedRoutine: RoutineItem[] = data.routine.map((item: any, idx: number) => ({
          id: `rout-ai-${Date.now()}-${idx}`,
          time: item.time,
          title: item.title,
          description: item.description,
          caregiverTips: item.caregiverTips,
          completed: false
        }));

        setRoutine(formattedRoutine);
        alert('AI successfully synthesized a highly personalized cognitive routine! It is now loaded into the patient\'s active schedule.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Could not synthesize routine. Please check that GEMINI_API_KEY is configured.');
    } finally {
      setLoadingRoutine(false);
    }
  };

  // AI-Powered Clinical Insights Generation
  const handleGenerateInsights = async () => {
    setLoadingInsights(true);
    try {
      const response = await apiCall('/api/insights/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyLogs: logs,
          patientProfile: {
            name: patientName,
            stage: patientStage,
            hobbies: patientHobbies
          }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.insights) {
        setAiInsights(data.insights);
      }
    } catch (err: any) {
      console.error(err);
      alert('Could not generate clinical insights. Please check that GEMINI_API_KEY is configured.');
    } finally {
      setLoadingInsights(false);
    }
  };

  // Custom SVG theme icons for memory books
  const getThemeGradient = (theme: string) => {
    switch (theme) {
      case 'nature': return 'from-teal-100 to-emerald-200 text-teal-800 border-teal-200';
      case 'retro': return 'from-amber-100 to-orange-200 text-amber-900 border-amber-200';
      case 'wedding': return 'from-rose-100 to-pink-200 text-rose-800 border-rose-200';
      case 'home': return 'from-blue-100 to-indigo-200 text-blue-800 border-blue-200';
      default: return 'from-sage-100 to-green-200 text-sage-800 border-sage-200';
    }
  };

  return (
    <div className={`min-h-screen text-[#2C2C2A] font-sans antialiased flex flex-col transition-all duration-700 ${
      activeTab === 'patient' && patientMode === 'vivid'
        ? 'bg-[#FCF5F5]'
        : 'bg-[#F4F1EA]'
    } relative overflow-hidden`}>
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -top-20 -left-24 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #b7e4c7 0%, #74c69d 45%, transparent 72%)' }}
          animate={{ x: [0, 28, -16, 0], y: [0, 18, -10, 0], scale: [1, 1.08, 0.96, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -right-28 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, #ffd6e0 0%, #ff8fab 48%, transparent 74%)' }}
          animate={{ x: [0, -22, 14, 0], y: [0, -16, 12, 0], scale: [1, 0.95, 1.07, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-28 left-1/4 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #dbeafe 0%, #93c5fd 45%, transparent 72%)' }}
          animate={{ x: [0, 20, -18, 0], y: [0, -14, 10, 0], scale: [1, 1.05, 0.94, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      
      {/* Dynamic Header */}
      <header className="app-header relative z-10 bg-white/90 backdrop-blur-sm border-b border-[#E3DFC2] sticky top-0 px-4 md:px-8 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 md:gap-4 shadow-xs">
        <div className="flex min-w-[150px] items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5C8D71] flex items-center justify-center text-white shadow-xs">
            <Brain className="w-6 h-6" id="app-logo-icon" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-semibold tracking-tight text-[#3A5D45]">Yadira</span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E8F1EB] text-[#3A5D45] uppercase tracking-wider border border-[#CEDFCF]">
              XPRIZE Dementia Companion
            </span>
          </div>
        </div>

        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Global Tab Switcher */}
          {!isPatientSession && (
            <div className="tab-switcher flex flex-wrap gap-1 p-1 bg-[#F4F1EA] rounded-xl border border-[#E3DFC2] w-full sm:w-auto">
              <button
                id="tab-patient"
                onClick={() => { setActiveTab('patient'); playSoundCue('pop'); }}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeTab === 'patient'
                    ? 'bg-white text-[#3A5D45] shadow-xs scale-[1.02]'
                    : 'text-[#7E7D76] hover:text-[#3A5D45]'
                }`}
              >
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Preview Patient View</span>
              </button>
              <button
                id="tab-caregiver"
                onClick={() => { setActiveTab('caregiver'); playSoundCue('pop'); }}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeTab === 'caregiver'
                    ? 'bg-[#3A5D45] text-white shadow-xs font-bold scale-[1.02]'
                    : 'text-[#5E5D57] hover:text-[#3A5D45]'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Caregiver Hub</span>
              </button>
            </div>
          )}

          {/* Calming rooms button — patient side */}
          {activeTab === 'patient' && (
            <button
              id="btn-aurora"
              onClick={() => setShowRoomsMenu(true)}
              className="p-2 sm:p-2.5 rounded-xl border border-[#E3DFC2] bg-white text-[#A6A27B] hover:text-indigo-500 hover:border-indigo-200 transition-all"
              title="Calming rooms — a gentle place to rest"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          )}

          {/* Log out — returns to the role-selection/login screen. Confirmed
              first so a patient can't accidentally end their own session. */}
          <button
            id="btn-logout"
            onClick={async () => {
              const message = isPatientSession
                ? 'Return to the Yadira login screen? (Caregiver use only)'
                : 'Log out of Yadira and return to the login screen?';
              if (window.confirm(message)) {
                await logout();
              }
            }}
            className="p-2 sm:p-2.5 rounded-xl border border-[#E3DFC2] bg-white text-[#A6A27B] hover:text-red-600 hover:border-red-200 transition-all"
            title="Log out and return to the login screen"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Calming rooms picker */}
      {showRoomsMenu && (
        <SensoryRoomsMenu
          isPremium={isPremium}
          onSelect={openRoom}
          onClose={() => setShowRoomsMenu(false)}
        />
      )}

      {/* Aurora full-screen overlay — rendered above everything */}
      {auroraActive && (
        <AuroraScreen onExit={() => setAuroraActive(false)} />
      )}

      {/* Premium sensory rooms */}
      {premiumRoom === 'rain' && <RainyWindow onExit={() => setPremiumRoom(null)} />}
      {premiumRoom === 'leaves' && <AutumnLeaves onExit={() => setPremiumRoom(null)} />}
      {premiumRoom === 'canopy' && <ForestCanopy onExit={() => setPremiumRoom(null)} />}

      {/* Main Content Stage */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-8 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          {activeTab === 'patient' ? (
            
            /* ================================================================= */
            /*                          PATIENT VIEW                            */
            /* ================================================================= */
            <motion.div
              key="patient-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1"
            >
              
              {/* Left Column: Yadira Core Conversation Window */}
              <div className={`lg:col-span-7 flex flex-col bg-white rounded-3xl border shadow-sm overflow-hidden min-h-[550px] lg:min-h-[650px] transition-all duration-500 ${
                patientMode === 'vivid' ? 'border-rose-200 ring-2 ring-rose-500/5' : 'border-[#E3DFC2]'
              }`}>
                
                {/* Active Yadira Header — extra top padding so the avatar and
                    its pulsing halo sit clear of the card's clipped top edge */}
                <div className={`border-b px-6 pt-7 pb-4 flex items-center justify-between transition-all duration-500 ${
                  patientMode === 'vivid' ? 'bg-[#FCF6F6] border-rose-100' : 'bg-[#FAF9F5] border-[#E3DFC2]'
                }`}>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {/* Gentle pulsating visual heartbeat matching respiration rate */}
                      <span className={`absolute inset-0 rounded-full opacity-20 animate-ping transition-all duration-500 ${
                        patientMode === 'vivid' ? 'bg-rose-500' : 'bg-[#5C8D71]'
                      }`}></span>
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-tr flex items-center justify-center text-white border-2 border-white shadow-sm relative transition-all duration-500 ${
                        patientMode === 'vivid' 
                          ? 'from-rose-400 to-pink-500' 
                          : 'from-[#5C8D71] to-[#92B4A1]'
                      }`}>
                        <HeartHandshake className="w-7 h-7" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-[#2C2C2A] leading-tight">
                          {patientMode === 'vivid' ? representedPersona : 'Yadira'}
                        </h2>
                        {isCaregiverPreview && (
                          <span className="inline-flex items-center rounded-full border border-[#E3DFC2] bg-[#F7F3EA] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7E7D76]">
                            Preview
                          </span>
                        )}
                      </div>
                      <p className={`text-xs font-semibold flex items-center transition-all duration-500 ${
                        patientMode === 'vivid' ? 'text-rose-500' : 'text-[#5C8D71]'
                      }`}>
                        <span className={`w-2 h-2 rounded-full mr-1.5 animate-pulse transition-all duration-500 ${
                          patientMode === 'vivid' ? 'bg-rose-500' : 'bg-[#5C8D71]'
                        }`}></span>
                        {patientMode === 'vivid' ? 'Right here with you' : 'Sitting right here with you'}
                      </p>
                    </div>
                  </div>

                  {/* Accessibility Audio Settings */}
                  <div className="flex items-center space-x-2">
                    <button
                      id="toggle-voice"
                      onClick={() => { setVoiceEnabled(!voiceEnabled); playSoundCue('pop'); }}
                      className={`p-3 rounded-xl border transition-all ${
                        voiceEnabled 
                          ? 'bg-[#E8F1EB] text-[#3A5D45] border-[#CEDFCF]' 
                          : 'bg-[#F2EFE9] text-[#7E7D76] border-[#D8D5C4]'
                      }`}
                      title={voiceEnabled ? "Mute Yadira's Voice" : "Enable Yadira's Voice"}
                    >
                      {voiceEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                    </button>
                    <button
                      id="toggle-chime"
                      onClick={() => { setSoundFeedback(!soundFeedback); playSoundCue('pop'); }}
                      className={`p-3 rounded-xl border transition-all ${
                        soundFeedback 
                          ? 'bg-[#E8F1EB] text-[#3A5D45] border-[#CEDFCF]' 
                          : 'bg-[#F2EFE9] text-[#7E7D76] border-[#D8D5C4]'
                      }`}
                      title={soundFeedback ? "Mute sound triggers" : "Enable sound triggers"}
                    >
                      <Music2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Subtitle / Big Screen Text Display */}
                <div className="bg-[#FAF9F5] border-b border-[#E3DFC2] px-6 py-2 text-center text-xs text-[#8A8981] font-medium tracking-wide">
                  CLINICAL ACCESSIBILITY STANDARD: SENSORY CONTRAST & SLOW DIALOGUE REASSURANCE
                </div>

                {/* Message Log */}
                <div ref={messageLogRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FCFAF5]">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'model' ? (
                        // Model replies land one thought per bubble, revealed at
                        // a human pace — a paragraph is a wall of text to a
                        // dementia patient; a sentence is a moment.
                        <DigestibleMessage
                          text={msg.text}
                          animate={!mountIdsRef.current?.has(msg.id)}
                          bubbleClassName="rounded-2xl p-5 shadow-xs transition-all bg-white text-[#2C2C2A] border border-[#E4E0C4] rounded-tl-none font-medium"
                          textClassName="text-lg md:text-xl leading-relaxed tracking-wide font-sans"
                          onChunkRevealed={scrollLogToBottom}
                          extras={
                            msg.mediaInsight ? (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-900">
                                  <span className="font-semibold">Photo:</span> {msg.mediaInsight.description}
                                </p>
                                <div className="mt-1">
                                  <EmotionBadge emotion={msg.mediaInsight.emotion} />
                                </div>
                              </div>
                            ) : undefined
                          }
                          footer={
                            <div className="flex items-center justify-between mt-3 text-xs text-[#8A8981]">
                              <span>{msg.timestamp}</span>
                              <button
                                onClick={() => speakText(msg.text)}
                                className="flex items-center space-x-1 px-2.5 py-1 bg-[#F5F3EC] hover:bg-[#EAE8DD] rounded-md transition-all text-[#3A5D45]"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                <span className="font-semibold text-xs">Read to me</span>
                              </button>
                            </div>
                          }
                        />
                      ) : (
                        <div className="max-w-[85%] rounded-2xl p-5 shadow-xs transition-all bg-[#E3EFE7] text-[#25422F] border border-[#CEDFCE] rounded-tr-none">
                          {/* Huge easy-to-read text size for dementia patients */}
                          <p className="text-lg md:text-xl leading-relaxed tracking-wide font-sans">
                            {msg.text}
                          </p>

                          {msg.emotion && (
                            <div className="mt-2">
                              <EmotionBadge emotion={msg.emotion.emotion} confidence={msg.emotion.confidence} />
                            </div>
                          )}

                          {msg.mediaInsight && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-900">
                                <span className="font-semibold">Photo:</span> {msg.mediaInsight.description}
                              </p>
                              <div className="mt-1">
                                <EmotionBadge emotion={msg.mediaInsight.emotion} />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 text-xs text-[#8A8981]">
                            <span>{msg.timestamp}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-[#E4E0C4] rounded-2xl rounded-tl-none p-5 shadow-xs">
                        <div className="flex items-center space-x-2 text-[#5C8D71]">
                          <span className="text-sm font-semibold tracking-wide animate-pulse">
                            {patientMode === 'vivid' ? `${representedPersona} is thinking gently...` : 'Yadira is thinking gently...'}
                          </span>
                          <div className="flex space-x-1">
                            <span className="w-2.5 h-2.5 bg-[#5C8D71] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2.5 h-2.5 bg-[#5C8D71] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2.5 h-2.5 bg-[#5C8D71] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                </div>

                {/* Pre-configured Helpful Anxious Cues */}
                <div className="bg-[#FAF9F5] border-t border-[#E3DFC2] p-4 flex flex-wrap gap-2.5">
                  <span className="text-xs text-[#7E7D76] w-full font-bold uppercase tracking-wider mb-1 px-1">
                    Tap to ask {patientMode === 'vivid' ? representedPersona : 'Yadira'}:
                  </span>
                  {faqs.map((faq) => (
                    <button
                      key={faq.id}
                      id={`patient-faq-${faq.id}`}
                      onClick={() => handleSendMessage(faq.question)}
                      disabled={isTyping}
                      className="px-4 py-2.5 bg-white border border-[#E3DFC2] text-sm font-bold text-[#3A5D45] rounded-xl hover:bg-[#EAE8DD] hover:border-[#C4C09E] transition-all duration-200 active:scale-95 text-left max-w-full truncate shadow-xs"
                    >
                      {faq.question}
                    </button>
                  ))}
                  <button
                    onClick={() => handleSendMessage("Tell me a comforting story.")}
                    disabled={isTyping}
                    className="px-4 py-2.5 bg-white border border-[#E3DFC2] text-sm font-bold text-[#3A5D45] rounded-xl hover:bg-[#EAE8DD] hover:border-[#C4C09E] transition-all duration-200 shadow-xs"
                  >
                    📖 Tell me a story
                  </button>
                  <button
                    onClick={() => handleSendMessage("Help me feel calm, I am a bit anxious.")}
                    disabled={isTyping}
                    className="px-4 py-2.5 bg-[#FFF2F2] border border-[#FFD9D9] text-sm font-bold text-red-700 rounded-xl hover:bg-red-100 transition-all duration-200 shadow-xs"
                  >
                    ❤️ Help me feel calm
                  </button>
                </div>

                {/* Patient Chat Input */}
                <div className="p-4 bg-white border-t border-[#E3DFC2] flex flex-col gap-3">
                  {/* Voice and Media Controls */}
                  <div className="flex gap-3 flex-wrap">
                    <div className="flex-1 min-w-0 sm:min-w-[200px]">
                      <VoiceInput
                        onTranscript={(text, emotion) => handleSendMessage(text, emotion)}
                        disabled={isTyping}
                      />
                    </div>
                    <div className="flex-1 min-w-0 sm:min-w-[200px]">
                      <MediaUpload
                        onMediaAnalyzed={(insight) => {
                          const msg = `I see something interesting!`;
                          handleSendMessage(msg, undefined, insight);
                        }}
                        disabled={isTyping}
                      />
                    </div>
                  </div>

                  {/* Text Input */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(userInput)}
                      placeholder={`Type here to talk to ${patientMode === 'vivid' ? representedPersona : 'Yadira'}, ${patientName || 'dear'}...`}
                      disabled={isTyping}
                      className="flex-1 px-5 py-4 border border-[#C4C09E] rounded-2xl focus:outline-hidden focus:ring-3 focus:ring-[#5C8D71] focus:border-transparent text-lg md:text-xl font-medium bg-[#FCFAF5] shadow-inner"
                      id="patient-chat-input"
                    />
                    <button
                      id="btn-send-message"
                      onClick={() => handleSendMessage(userInput)}
                      disabled={isTyping || !userInput.trim()}
                      className="w-full sm:w-auto p-4 bg-[#3A5D45] hover:bg-[#2B4633] text-white rounded-2xl font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center sm:min-w-[60px]"
                    >
                      <Send className="w-7 h-7" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Routine Cues & Memory Book */}
              <div className="lg:col-span-5 flex flex-col space-y-8">
                
                {/* Daily Routine / Care Tasks Visual Checklist */}
                <div className="bg-white p-6 rounded-3xl border border-[#E3DFC2] shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-[#E8F1EB] text-[#3A5D45]">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-[#2C2C2A]">Today's Warm Rituals</h3>
                    </div>
                    <span className="text-xs font-bold text-[#7E7D76] uppercase tracking-wider bg-[#F4F1EA] px-2.5 py-1 rounded-full border border-[#D5D2B3]">
                      Today
                    </span>
                  </div>

                  <p className="text-sm text-[#7E7D76] mb-5 leading-relaxed">
                    Checking these off plays comforting sound therapy cues and logs active mental engagement.
                  </p>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px] pr-1.5">
                    {routine.map((task) => (
                      <button
                        key={task.id}
                        id={`task-item-${task.id}`}
                        onClick={() => toggleRoutine(task.id)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-start space-x-4 transition-all duration-300 group ${
                          task.completed
                            ? 'bg-[#F2FAF4] border-[#CEDFCF] text-[#4F7359]'
                            : 'bg-[#FCFAF5] border-[#E3DFC2] hover:bg-white hover:border-[#A6A27B]'
                        }`}
                      >
                        <div className={`mt-0.5 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                          task.completed
                            ? 'bg-[#3A5D45] border-[#3A5D45] text-white scale-105'
                            : 'border-[#A6A27B] bg-white group-hover:border-[#3A5D45]'
                        }`}>
                          {task.completed && <Check className="w-5 h-5 stroke-[3px]" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-base font-bold ${task.completed ? 'line-through text-[#8A9C8E]' : 'text-[#2C2C2A]'}`}>
                              {task.title}
                            </span>
                            <span className="text-xs font-bold text-[#8A8981] flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              {task.time}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 leading-relaxed ${task.completed ? 'text-[#8A9C8E]' : 'text-[#5E5D57]'}`}>
                            {task.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Treasured Memory Album View */}
                <div className="bg-white p-6 rounded-3xl border border-[#E3DFC2] shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-[#FDF1F1] text-rose-500">
                        <Heart className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-[#2C2C2A]">Treasured Memory Album</h3>
                    </div>
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                      {memories.length} Memories
                    </span>
                  </div>

                  <p className="text-sm text-[#7E7D76] mb-5 leading-relaxed">
                    Beautiful historical landmarks and personal history logs designed for comforting reminiscent triggers.
                  </p>

                  <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[350px] pr-1">
                    {memories.map((mem) => {
                      const grad = getThemeGradient(mem.imageTheme);
                      return (
                        <div
                          key={mem.id}
                          className="p-5 rounded-2xl bg-[#FCFAF5] border border-[#E3DFC2] flex flex-col shadow-xs"
                        >
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-white border border-[#D5D2B3] text-[#5C8D71]">
                              🏷️ {mem.relationshipOrEra}
                            </span>
                            <button
                              onClick={() => {
                                // Sound first, words second — the soundscape
                                // (a public-domain melody + ambience matched to
                                // the memory's theme) opens the door, then the
                                // narration walks through it over a quiet bed.
                                const soundscape = playMemorySoundscape(mem.imageTheme);
                                window.setTimeout(() => {
                                  soundscape?.duck();
                                  // Use speakTextDirect so the narration works from
                                  // the caregiver tab regardless of voiceEnabled state.
                                  speakTextDirect(`Let me share this memory with you, dear. It is titled: ${mem.title}. ${mem.description}`);
                                }, soundscape ? 2800 : 0);
                              }}
                              className="flex items-center space-x-1.5 px-3 py-1 bg-[#3A5D45] text-white hover:bg-[#2B4633] rounded-lg transition-all text-xs font-semibold shadow-xs"
                            >
                              <Volume2 className="w-4 h-4" />
                              <span>Listen to Memory</span>
                            </button>
                          </div>

                          {/* Decorative memory visualization illustration */}
                          <div className={`mt-3 h-14 w-full rounded-lg bg-gradient-to-r ${grad} flex items-center justify-center border text-2xl`}>
                            {mem.imageTheme === 'wedding' && '💍🌹🌸'}
                            {mem.imageTheme === 'family' && '🏡🐾❤️'}
                            {mem.imageTheme === 'nature' && '🌲🏔️☀️'}
                            {mem.imageTheme === 'retro' && '📸⏳👴'}
                            {mem.imageTheme === 'home' && '🛋️☕🍽️'}
                          </div>

                          <h4 className="text-lg font-bold text-[#2C2C2A] mt-3">{mem.title}</h4>
                          <p className="text-sm text-[#5E5D57] leading-relaxed mt-1.5">
                            {mem.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </motion.div>
          ) : (
            
            /* ================================================================= */
            /*                         CAREGIVER HUB                             */
            /* ================================================================= */
            <motion.div
              key="caregiver-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="caregiver-layout space-y-6 md:space-y-8 flex-1 min-w-0"
            >
              
              {/* Header Profile Dashboard Card */}
              <div className="bg-white p-6 rounded-3xl border border-[#E3DFC2] shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                  <div className="w-16 h-16 rounded-full bg-[#E8F1EB] text-[#3A5D45] flex items-center justify-center border border-[#CEDFCF]">
                    <User className="w-9 h-9" />
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C2C2A] flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-0">
                      {patientName}'s Clinical Profile
                      <span className="sm:ml-3 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {patientStage} Stage
                      </span>
                    </h2>
                    <p className="text-sm text-[#5E5D57] mt-1.5 leading-relaxed">
                      Primary Caregiver: <strong className="text-[#3A5D45]">{caregiverName} ({caregiverRelationship})</strong>
                    </p>
                    <p className="text-xs text-[#8A8981] mt-0.5">
                      Hobbies: <span className="italic">{patientHobbies}</span>
                    </p>
                  </div>
                </div>
                
                {/* Diagnostic Settings Edit Button */}
                <div className="md:col-span-4 flex justify-center md:justify-end">
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    {/* Routine Regenerator triggering key */}
                    <button
                      onClick={handleGenerateAiRoutine}
                      disabled={loadingRoutine}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3.5 bg-white border border-[#3A5D45] hover:bg-emerald-50 text-[#3A5D45] rounded-xl font-bold transition-all shadow-xs disabled:opacity-50"
                    >
                      {loadingRoutine ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span>Regen Routine</span>
                    </button>
                    
                    <button
                      id="btn-family-setup"
                      onClick={() => setShowFamilySetup(true)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3.5 bg-[#FCFAF5] border border-[#E3DFC2] text-[#5E5D57] rounded-xl hover:bg-[#EAE8DD] transition-all font-bold"
                      title="Switch families or create a new care circle"
                    >
                      <Users className="w-5 h-5" />
                      <span>Switch / New Family</span>
                    </button>
                  </div>
                </div>
              </div>
 
              {/* Clinical Session Control & Mode Settings */}
              <div className="bg-white p-6 rounded-3xl border border-[#E3DFC2] shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Mode Control (Lucid vs Vivid) */}
                <div className="lg:col-span-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#2C2C2A] flex items-center mb-1.5">
                      <Sliders className="w-5 h-5 text-[#3A5D45] mr-2" />
                      Active Care Mode Control
                    </h3>
                    <p className="text-xs text-[#7E7D76] mb-4 leading-relaxed">
                      Toggle the companion mode in real time. Vivid Mode changes the interface, voice, and prompts to represent the chosen persona.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => { setPatientMode('lucid'); playSoundCue('pop'); }}
                        className={`flex-1 p-4 rounded-2xl border text-left flex items-start space-x-3 transition-all duration-300 ${
                          patientMode === 'lucid'
                            ? 'bg-[#E8F1EB] border-[#3A5D45] text-[#3A5D45] ring-2 ring-[#3A5D45]/10 font-bold scale-[1.02]'
                            : 'bg-[#FCFAF5] border-[#E3DFC2] text-[#5E5D57] hover:bg-[#EAE8DD]'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white text-[#3A5D45] shadow-xs">
                          <Brain className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm block font-bold">Lucid Mode</span>
                          <span className="text-[11px] font-normal leading-tight block mt-0.5 text-[#5E5D57]">
                            Patient is grounded. Yadira acts as a helpful companion.
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setPatientMode('vivid'); playSoundCue('chime'); }}
                        className={`flex-1 p-4 rounded-2xl border text-left flex items-start space-x-3 transition-all duration-300 ${
                          patientMode === 'vivid'
                            ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/10 font-bold scale-[1.02]'
                            : 'bg-[#FCFAF5] border-[#E3DFC2] text-[#5E5D57] hover:bg-[#EAE8DD]'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white text-rose-500 shadow-xs">
                          <Heart className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm block font-bold">Vivid Mode</span>
                          <span className="text-[11px] font-normal leading-tight block mt-0.5 text-[#5E5D57]">
                            Patient is reaching. {representedPersona || 'Beth'} steps forward.
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Persona & Drift Controls */}
                <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Aurora — caregiver trigger */}
                  <button
                    type="button"
                    id="btn-caregiver-aurora"
                    onClick={() => setAuroraActive(true)}
                    className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50 text-left flex items-start space-x-3 hover:bg-indigo-100 active:scale-[0.98] transition-all duration-300"
                  >
                    <div className="p-2 rounded-xl bg-white text-indigo-500 shadow-xs shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm block font-bold text-indigo-700">Aurora</span>
                      <span className="text-[11px] font-normal leading-tight block mt-0.5 text-indigo-500">
                        Opens a soothing aurora screen on both devices. The soft “return” button below ends it.
                      </span>
                    </div>
                  </button>

                  {/* Yadira Premium — gates the extra calming rooms & paid features */}
                  <div className={`p-4 rounded-2xl border flex flex-col justify-between ${isPremium ? 'border-[#CEDFCF] bg-[#F2FAF4]' : 'border-[#E3DFC2] bg-[#FCFAF5]'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#2C2C2A] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Yadira Premium
                        </span>
                        <span className="text-[10px] text-[#7E7D76] leading-tight mt-1 block">
                          {isPremium
                            ? `Active — ${representedPersona || 'the'} natural voice, all calming rooms, and premium features are unlocked for this family.`
                            : `Unlocks ${representedPersona || 'the loved one'}'s natural voice, the Rainy Window / Autumn Leaves / Forest Canopy rooms, and more. Free companion uses the device voice.`}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${isPremium ? 'bg-[#3A5D45] text-white' : 'bg-[#EAE8DD] text-[#7E7D76]'}`}>
                        {isPremium ? 'On' : 'Free'}
                      </span>
                    </div>
                    <button
                      type="button"
                      id="btn-toggle-premium"
                      onClick={() => setPremium({ unlocked: !isPremium })}
                      className={`mt-3 w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        isPremium
                          ? 'bg-white border border-[#E3DFC2] text-[#5E5D57] hover:bg-[#EAE8DD]'
                          : 'bg-[#3A5D45] text-white hover:bg-[#2B4633] shadow-xs'
                      }`}
                      title="Stripe checkout will connect here"
                    >
                      {isPremium ? 'Turn off Premium' : 'Unlock Premium (demo)'}
                    </button>
                  </div>

                  {/* Persona Configuration */}
                  <div className="p-4 bg-[#FCFAF5] border border-[#E3DFC2] rounded-2xl flex flex-col justify-between space-y-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-[#5E5D57] mb-1">
                        Represented Persona & Voice
                      </label>
                      <span className="text-[10px] text-[#7E7D76] leading-tight block mb-2">
                        Configure who Yadira becomes and their voice preset.
                      </span>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] font-bold text-[#5E5D57] block mb-1">Name:</span>
                          <input
                            type="text"
                            value={representedPersona}
                            onChange={(e) => setRepresentedPersona(e.target.value)}
                            placeholder="e.g. Beth, Thomas"
                            className="w-full p-2 bg-white border border-[#C4C09E] rounded-xl text-xs font-bold text-[#2C2C2A] focus:ring-1 focus:ring-[#3A5D45]"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-[#5E5D57] block mb-1">Inworld Voice Preset:</span>
                          <select
                            value={
                              ['Sarah', 'Ashley', 'Dennis'].includes(representedVoiceId)
                                ? representedVoiceId
                                : 'custom'
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val !== 'custom') {
                                setRepresentedVoiceId(val);
                              } else {
                                const customId = prompt("Enter Inworld Custom Voice ID:", representedVoiceId) || representedVoiceId;
                                setRepresentedVoiceId(customId);
                              }
                            }}
                            className="w-full p-2 bg-white border border-[#C4C09E] rounded-xl text-xs font-bold text-[#2C2C2A] focus:ring-1 focus:ring-[#3A5D45]"
                          >
                            <option value="Sarah">Sarah (Warm Female - Default)</option>
                            <option value="Ashley">Ashley (Warm Female - Natural)</option>
                            <option value="Dennis">Dennis (Calm Male - Friendly)</option>
                            <option value="custom">Custom Inworld Voice ID...</option>
                          </select>

                          {!['Sarah', 'Ashley', 'Dennis'].includes(representedVoiceId) && (
                            <div className="mt-1.5 flex items-center space-x-1">
                              <span className="text-[9px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100 font-bold block truncate max-w-full">
                                Custom ID: {representedVoiceId}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const customId = prompt("Enter Inworld Custom Voice ID:", representedVoiceId) || representedVoiceId;
                                  setRepresentedVoiceId(customId);
                                }}
                                className="text-[9px] text-[#3A5D45] hover:underline font-bold"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proactive Drift Controls */}
                  <div className="p-4 bg-[#FCFAF5] border border-[#E3DFC2] rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#2C2C2A]">
                          Proactive Reach
                        </span>
                        <span className="text-[10px] text-[#7E7D76] leading-tight mt-0.5">
                          Reach out during silence.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDriftEnabled(!driftEnabled)}
                        className={`w-11 h-6 rounded-full p-0.5 transition-all ${
                          driftEnabled ? 'bg-[#3A5D45]' : 'bg-[#D8D5C4]'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white transition-all transform ${
                          driftEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs font-bold text-[#5E5D57] mb-1">
                        <span>Drift Timeout:</span>
                        <span className="text-[#3A5D45] font-extrabold">{driftTimeoutSeconds}s</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="120"
                        step="5"
                        disabled={!driftEnabled}
                        value={driftTimeoutSeconds}
                        onChange={(e) => setDriftTimeoutSeconds(Number(e.target.value))}
                        className="w-full accent-[#3A5D45] h-1.5 bg-[#E3DFC2] rounded-lg appearance-none cursor-pointer disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 1: Symptom Logger & Custom FAQ Override */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Daily Symptom & Care Logger */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E3DFC2] shadow-sm flex flex-col">
                  <div className="flex items-center space-x-2.5 mb-5">
                    <div className="p-2 rounded-lg bg-[#E8F1EB] text-[#3A5D45]">
                      <Activity className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-[#2C2C2A]">Today's Daily Care Log</h3>
                  </div>

                  <form onSubmit={handleAddLog} className="space-y-4 flex-1 flex flex-col">
                    
                    {/* Confusion Level Tracker */}
                    <div>
                      <label className="block text-sm font-bold text-[#5E5D57] mb-2">
                        Cognitive Confusion Level: <span className="text-[#3A5D45] font-extrabold">{logConfusion} / 5</span>
                      </label>
                      <div className="flex space-x-2.5">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            type="button"
                            key={val}
                            onClick={() => setLogConfusion(val)}
                            className={`flex-1 py-2.5 rounded-xl border text-base font-bold transition-all ${
                              logConfusion === val
                                ? 'bg-[#3A5D45] text-white border-[#3A5D45]'
                                : 'bg-[#FCFAF5] border-[#E3DFC2] text-[#5E5D57] hover:bg-[#EAE8DD]'
                            }`}
                          >
                            {val === 1 ? 'Clear' : val === 5 ? 'Severe' : val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mood Selector */}
                    <div>
                      <label className="block text-sm font-bold text-[#5E5D57] mb-1.5">Primary Patient Mood</label>
                      <select
                        value={logMood}
                        onChange={(e: any) => setLogMood(e.target.value)}
                        className="w-full p-3 bg-[#FCFAF5] border border-[#E3DFC2] rounded-xl text-sm font-bold text-[#2C2C2A] focus:ring-2 focus:ring-[#3A5D45] focus:border-transparent"
                      >
                        <option value="peaceful">Peaceful & Pleasant</option>
                        <option value="anxious">Anxious & Agitated</option>
                        <option value="restless">Restless & Wandering</option>
                        <option value="sad">Sad & Quiet</option>
                      </select>
                    </div>

                    {/* Quick Stats: Hydration & Sleep */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-[#5E5D57] mb-1">Hydration (Cups)</label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={logHydration}
                          onChange={(e) => setLogHydration(Number(e.target.value))}
                          className="w-full p-3 bg-[#FCFAF5] border border-[#E3DFC2] rounded-xl text-sm font-bold text-[#2C2C2A] focus:ring-2 focus:ring-[#3A5D45] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#5E5D57] mb-1">Sleep (Hours)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          value={logSleep}
                          onChange={(e) => setLogSleep(Number(e.target.value))}
                          className="w-full p-3 bg-[#FCFAF5] border border-[#E3DFC2] rounded-xl text-sm font-bold text-[#2C2C2A] focus:ring-2 focus:ring-[#3A5D45] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Medication Compliance Toggle */}
                    <div className="flex items-center justify-between p-3.5 bg-[#FCFAF5] border border-[#E3DFC2] rounded-2xl">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#2C2C2A]">Vitamins & Meds Taken</span>
                        <span className="text-xs text-[#7E7D76]">Confirm morning/evening compliance</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLogMeds(!logMeds)}
                        className={`w-14 h-8 rounded-full p-1 transition-all ${
                          logMeds ? 'bg-[#3A5D45]' : 'bg-[#D8D5C4]'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full bg-white transition-all transform ${
                          logMeds ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* Clinical Notes */}
                    <div>
                      <label className="block text-sm font-bold text-[#5E5D57] mb-1">Caregiver Observation Notes</label>
                      <textarea
                        value={logNotes}
                        onChange={(e) => setLogNotes(e.target.value)}
                        placeholder="Detail behavior triggers, foods eaten, activities enjoyed..."
                        rows={3}
                        className="w-full p-3 bg-[#FCFAF5] border border-[#E3DFC2] rounded-xl text-sm text-[#2C2C2A] focus:ring-2 focus:ring-[#3A5D45] focus:border-transparent"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-[#3A5D45] hover:bg-[#2B4633] text-white rounded-2xl font-bold shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>Log Daily Observations</span>
                    </button>
                  </form>
                </div>

                {/* FAQ override settings (Patient Reassurance Mapping) */}
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E3DFC2] shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-[#FDF1F1] text-rose-500">
                          <HelpCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-[#2C2C2A]">Empathetic Reassurance Settings</h3>
                      </div>
                      <span className="text-xs font-bold text-[#7E7D76] uppercase tracking-wider bg-[#F4F1EA] px-2.5 py-1 rounded-full border border-[#D5D2B3]">
                        FAQ Override
                      </span>
                    </div>

                    <p className="text-sm text-[#7E7D76] mb-5 leading-relaxed">
                      Dementia patients often repeat anxious questions. Yadira overrides generic AI responses with these tailored, personal reassurances whenever the questions are asked.
                    </p>

                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                      {faqs.map((faq) => (
                        <div key={faq.id} className="p-4 bg-[#FCFAF5] border border-[#E3DFC2] rounded-2xl relative">
                          <button
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-all"
                            title="Remove reassurance override"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#5C8D71]">Anxious Question:</p>
                          <p className="text-sm font-bold text-[#2C2C2A] mt-0.5">"{faq.question}"</p>
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mt-2.5">Yadira Reassuring Answer:</p>
                          <p className="text-sm text-[#5E5D57] italic mt-0.5 leading-relaxed">"{faq.answer}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleAddFaq} className="border-t border-[#E3DFC2] pt-4 mt-4 space-y-3">
                    <p className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Add New Patient FAQ Reassurance:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newFaqQuest}
                        onChange={(e) => setNewFaqQuest(e.target.value)}
                        placeholder="Patient repeats (e.g. Where is my key?)"
                        className="p-3 bg-[#FCFAF5] border border-[#E3DFC2] rounded-xl text-xs text-[#2C2C2A] focus:ring-1 focus:ring-[#3A5D45]"
                      />
                      <input
                        type="text"
                        value={newFaqAns}
                        onChange={(e) => setNewFaqAns(e.target.value)}
                        placeholder="Reassuring answer (e.g. Your keys are safe with Thomas.)"
                        className="p-3 bg-[#FCFAF5] border border-[#E3DFC2] rounded-xl text-xs text-[#2C2C2A] focus:ring-1 focus:ring-[#3A5D45]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newFaqQuest || !newFaqAns}
                      className="w-full py-3 bg-[#3A5D45] hover:bg-[#2B4633] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Activate Reassurance Override</span>
                    </button>
                  </form>
                </div>

              </div>

              {/* Grid 2: SVG Trend Visualizations & AI Clinical Summarizer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Custom SVG Interactive Dashboard Charts */}
                <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#E3DFC2] shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-lg bg-[#E8F1EB] text-[#3A5D45]">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-[#2C2C2A]">Patient Symptom Trends</h3>
                      </div>
                      <span className="text-xs font-bold text-[#3A5D45] bg-[#E8F1EB] px-2 py-1 rounded-full">
                        7-Day Diagnostics
                      </span>
                    </div>

                    <p className="text-sm text-[#7E7D76] mb-5 leading-relaxed">
                      Custom clinical charts mapping cognitive confusion and physical rest patterns to detect Sundowning symptoms.
                    </p>

                    {/* interactive SVG chart rendering */}
                    <div className="w-full bg-[#FCFAF5] border border-[#E3DFC2] rounded-2xl p-4 flex flex-col space-y-4">
                      <div className="text-xs font-bold text-[#5E5D57] uppercase tracking-wider flex items-center justify-between">
                        <span>Cognitive Confusion Progress</span>
                        <span className="text-[#3A5D45]">1 (Clear) - 5 (Confused)</span>
                      </div>
                      
                      {/* Simple custom SVG chart */}
                      <div className="relative h-44 w-full">
                        <svg className="h-full w-full" viewBox="0 0 300 120">
                          {/* Grid Lines */}
                          <line x1="0" y1="20" x2="300" y2="20" stroke="#EAE6DA" strokeDasharray="3,3" />
                          <line x1="0" y1="55" x2="300" y2="55" stroke="#EAE6DA" strokeDasharray="3,3" />
                          <line x1="0" y1="90" x2="300" y2="90" stroke="#EAE6DA" strokeDasharray="3,3" />
                          
                          {/* Graph Path */}
                          <path
                            d={logs.map((l, idx) => {
                              const x = (idx / (logs.length - 1)) * 280 + 10;
                              // map confusion 1-5 to y coordinate 100 to 10
                              const y = 110 - ((l.confusionLevel - 1) / 4) * 90;
                              return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#3A5D45"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                          
                          {/* Graph Dots */}
                          {logs.map((l, idx) => {
                            const x = (idx / (logs.length - 1)) * 280 + 10;
                            const y = 110 - ((l.confusionLevel - 1) / 4) * 90;
                            return (
                              <g key={idx} className="group cursor-pointer">
                                <circle cx={x} cy={y} r="6" fill="#3A5D45" stroke="white" strokeWidth="2" />
                                <text x={x} y={y - 12} fontSize="8" fontWeight="bold" fill="#3A5D45" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1">
                                  {l.confusionLevel}
                                </text>
                              </g>
                            );
                          })}

                          {/* Labels */}
                          {logs.map((l, idx) => {
                            const x = (idx / (logs.length - 1)) * 280 + 10;
                            return (
                              <text key={idx} x={x} y="115" fontSize="8" fontWeight="bold" fill="#8A8981" textAnchor="middle">
                                {l.date}
                              </text>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Sleep & Hydration correlations */}
                      <div className="grid grid-cols-2 gap-4 border-t border-[#E3DFC2] pt-3 text-xs text-[#5E5D57]">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-[#3A5D45]"></div>
                          <span>Average Rest: <strong>{ (logs.reduce((sum, l) => sum + l.sleepHours, 0) / logs.length).toFixed(1) } hrs</strong></span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>Avg Hydration: <strong>{ (logs.reduce((sum, l) => sum + l.hydrationCups, 0) / logs.length).toFixed(1) } cups</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Historical Log list with delete controls */}
                  <div className="border-t border-[#E3DFC2] pt-4 mt-4">
                    <p className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider mb-2">Past Logs History:</p>
                    <div className="max-h-[140px] overflow-y-auto pr-1 space-y-2 text-xs">
                      {logs.slice().reverse().map((log) => (
                        <div key={log.date} className="p-3 bg-[#FCFAF5] border border-[#E3DFC2] rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[#2C2C2A] mr-2">{log.date}</span>
                            <span className="text-[#3A5D45] font-bold mr-2">Confusion: {log.confusionLevel}/5</span>
                            <span className="text-blue-600 font-bold mr-2">Hydration: {log.hydrationCups}c</span>
                            <span className="text-purple-600 font-bold mr-2">Sleep: {log.sleepHours}h</span>
                            <span className="text-[#7E7D76] block mt-1">"{log.notes}"</span>
                          </div>
                          <button
                            onClick={() => handleDeleteLog(log.date)}
                            className="text-red-400 hover:text-red-600 p-1"
                            title="Delete log"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI-Powered Clinical Advisor Insights Panel */}
                <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-[#E3DFC2] shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-lg bg-[#E8F1EB] text-[#3A5D45]">
                          <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-[#2C2C2A]">AI Clinical insights Advisor</h3>
                      </div>
                      <button
                        onClick={handleGenerateInsights}
                        disabled={loadingInsights}
                        className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#3A5D45] hover:bg-[#2B4633] text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50"
                      >
                        {loadingInsights ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>{aiInsights ? 'Refresh Analysis' : 'Synthesize Insights'}</span>
                      </button>
                    </div>

                    <p className="text-sm text-[#7E7D76] mb-5 leading-relaxed">
                      Utilizes clinical prompts to aggregate daily patient activity, mood logs, and medication compliance trends into structured geriatric advice.
                    </p>

                    <AnimatePresence mode="wait">
                      {loadingInsights ? (
                        <motion.div
                          key="loading-insights"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="p-8 text-center space-y-4"
                        >
                          <RefreshCw className="w-10 h-10 animate-spin text-[#3A5D45] mx-auto" />
                          <div>
                            <p className="text-base font-bold text-[#2C2C2A]">Analyzing Care Trends...</p>
                            <p className="text-xs text-[#7E7D76] mt-1">Cross-referencing sleep logs, mood triggers, and confusion coordinates.</p>
                          </div>
                        </motion.div>
                      ) : aiInsights ? (
                        <motion.div
                          key="results-insights"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          {/* Clinical Overview */}
                          <div className="p-4 bg-[#F5FAF6] border border-[#CEDFCF] rounded-2xl">
                            <h4 className="text-sm font-bold text-[#3A5D45] uppercase tracking-wider flex items-center">
                              🩺 Clinical Diagnostic Summary
                            </h4>
                            <p className="text-sm text-[#2C2C2A] leading-relaxed mt-2 font-medium">
                              {aiInsights.clinicalSummary}
                            </p>
                          </div>

                          {/* Critical Warnings */}
                          {aiInsights.criticalAlerts && aiInsights.criticalAlerts.length > 0 && (
                            <div className="p-4 bg-[#FFF2F2] border border-[#FFD9D9] rounded-2xl">
                              <h4 className="text-sm font-bold text-red-700 uppercase tracking-wider flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-1.5" /> Critical Observation Triggers
                              </h4>
                              <ul className="list-disc list-inside text-xs font-bold text-red-900 mt-2 space-y-1">
                                {aiInsights.criticalAlerts.map((alert, i) => (
                                  <li key={i}>{alert}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Actionable Clinical Tips */}
                          <div>
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5E5D57] mb-2">
                              Actionable Caregiver Interventions:
                            </h4>
                            <div className="space-y-2">
                              {aiInsights.actionableTips.map((tip, i) => (
                                <div key={i} className="p-3 bg-[#FCFAF5] border border-[#E3DFC2] rounded-xl text-xs text-[#5E5D57] leading-relaxed flex items-start space-x-2">
                                  <span className="font-extrabold text-[#3A5D45] mt-0.5">{i+1}.</span>
                                  <span>{tip}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="no-insights"
                          className="p-8 text-center bg-[#FCFAF5] border border-dashed border-[#C4C09E] rounded-2xl"
                        >
                          <Activity className="w-10 h-10 text-[#C4C09E] mx-auto mb-2" />
                          <p className="text-base font-bold text-[#5E5D57]">No Insights Generated</p>
                          <p className="text-xs text-[#8A8981] mt-1 max-w-xs mx-auto">
                            Click "Synthesize Insights" above to securely call Gemini and analyze your clinical patient logs.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="bg-[#FAF9F5] border-t border-[#E3DFC2] p-3 rounded-xl text-[11px] text-[#8A8981] italic mt-4 text-center">
                    Note: Yadira clinical outputs are generative and optimized to support familial caregiver comfort; they are not substitutes for certified geriatric practitioner prescriptions.
                  </div>
                </div>

              </div>

              {/* Nurse Redirection Portal */}
              <div className="bg-white p-6 rounded-3xl border border-[#E3DFC2] shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-500">
                      <HeartHandshake className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#2C2C2A] break-words">Nurse Redirection Portal (Real-time Intervention)</h3>
                  </div>
                  <span className="self-start sm:self-auto text-xs font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                    Live Dispatch
                  </span>
                </div>

                <p className="text-sm text-[#7E7D76] mb-5 leading-relaxed">
                  If the patient becomes restless, wanders, or repeatedly asks to leave their room, select a clinical redirection cue below. Yadira will dynamically translate it into comforting, relationship-anchored guidance from {representedPersona || 'Beth'} and speak it to the patient.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => handleSendRedirection("Patient is asking to go home")}
                    className="p-4 bg-[#FCFAF5] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-[#E3DFC2] rounded-2xl text-left text-xs font-bold transition-all active:scale-95 shadow-xs"
                  >
                    🏡 Trigger Home Grounding
                    <span className="block font-normal mt-1 text-[#7E7D76] hover:text-rose-600">
                      "Patient wants to leave room to go home."
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendRedirection(`Patient is looking for their spouse (${representedPersona})`)}
                    className="p-4 bg-[#FCFAF5] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-[#E3DFC2] rounded-2xl text-left text-xs font-bold transition-all active:scale-95 shadow-xs"
                  >
                    🍳 Trigger Kitchen Redirect
                    <span className="block font-normal mt-1 text-[#7E7D76] hover:text-rose-600">
                      "Patient is looking for their spouse."
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendRedirection("Patient is highly anxious and restless")}
                    className="p-4 bg-[#FCFAF5] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-[#E3DFC2] rounded-2xl text-left text-xs font-bold transition-all active:scale-95 shadow-xs"
                  >
                    ❤️ Trigger Calming Grounding
                    <span className="block font-normal mt-1 text-[#7E7D76] hover:text-rose-600">
                      "Patient is showing high sundowning agitation."
                    </span>
                  </button>
                </div>

                {/* Custom Redirection Text input */}
                <div className="nurse-dispatch-row flex flex-col sm:flex-row gap-3 border-t border-[#E3DFC2] pt-4">
                  <input
                    type="text"
                    id="nurse-custom-note"
                    placeholder="Type custom nurse observation / redirection instruction here (e.g. Eleanor wants to go bake a pie)..."
                    className="w-full min-w-0 flex-1 p-3.5 border border-[#C4C09E] rounded-xl text-sm bg-[#FCFAF5] focus:ring-2 focus:ring-[#3A5D45] text-[#2C2C2A] font-medium"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          handleSendRedirection(input.value);
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('nurse-custom-note') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleSendRedirection(input.value);
                        input.value = '';
                      }
                    }}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3.5 bg-[#3A5D45] hover:bg-[#2B4633] text-white rounded-xl text-sm font-bold shadow-xs transition-all active:scale-95"
                  >
                    Dispatch Cue
                  </button>
                </div>
              </div>

              {/* Persona File — session-to-session memory (the continuity architecture) */}
              <div className="bg-white p-6 rounded-3xl border border-[#E3DFC2] shadow-sm flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-[#E8F1EB] text-[#3A5D45]">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#2C2C2A] break-words">
                      Persona File — What {representedPersona || 'Beth'} Remembers
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleStartFreshSession}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#3A5D45] hover:bg-[#2B4633] text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
                      title="End the current conversation and start a new session — the persona file carries over"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Start Fresh Session</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Clear everything ${representedPersona || 'Beth'} remembers between sessions? This cannot be undone.`)) {
                          setPersonaFile(DEFAULT_PERSONA_FILE);
                        }
                      }}
                      className="p-2 bg-[#FCFAF5] border border-[#E3DFC2] text-[#A6A27B] hover:text-red-500 rounded-xl transition-all"
                      title="Clear persona file"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-[#7E7D76] mb-5 leading-relaxed">
                  Written automatically after every conversation and read before the next one. A disconnection is a pause, not a forgetting —
                  ask {representedPersona || 'Beth'} if she remembers. She does.
                </p>

                {personaFile.moments.length === 0 && !personaFile.lastSummary ? (
                  <div className="p-8 text-center bg-[#FCFAF5] border border-dashed border-[#C4C09E] rounded-2xl">
                    <MessageSquare className="w-10 h-10 text-[#C4C09E] mx-auto mb-2" />
                    <p className="text-base font-bold text-[#5E5D57]">Nothing remembered yet</p>
                    <p className="text-xs text-[#8A8981] mt-1 max-w-sm mx-auto">
                      The persona file grows as {patientName || 'the patient'} talks with {representedPersona || 'Beth'}. After a few messages, what they share appears here — and {representedPersona || 'Beth'} carries it into every future session.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 space-y-4">
                      {personaFile.lastSummary && (
                        <div className="p-4 bg-[#F5FAF6] border border-[#CEDFCF] rounded-2xl">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#3A5D45]">Last Visit</h4>
                          <p className="text-sm text-[#2C2C2A] leading-relaxed mt-1.5 font-medium">{personaFile.lastSummary}</p>
                          {personaFile.lastSessionAt && (
                            <p className="text-[10px] text-[#8A8981] mt-2">
                              Updated {new Date(personaFile.lastSessionAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      )}

                      {personaFile.recurringThreads.length > 0 && (
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5E5D57] mb-2">
                            They keep coming back to:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {personaFile.recurringThreads.map((thread, i) => (
                              <span key={i} className="px-3 py-1.5 bg-[#FCFAF5] border border-[#E3DFC2] rounded-full text-xs font-bold text-[#3A5D45]">
                                {thread}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {personaFile.threadToPickUp && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600">
                            {representedPersona || 'Beth'} will open the next session with:
                          </h4>
                          <p className="text-sm text-rose-900 italic leading-relaxed mt-1.5">
                            "{personaFile.threadToPickUp}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-7">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#5E5D57] mb-2">
                        Moments they shared ({personaFile.moments.length}):
                      </h4>
                      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                        {personaFile.moments.map((moment) => (
                          <div key={moment.id} className="p-3 bg-[#FCFAF5] border border-[#E3DFC2] rounded-xl flex items-start justify-between space-x-3">
                            <p className="text-sm text-[#2C2C2A] leading-relaxed flex-1">{moment.summary}</p>
                            <div className="flex flex-col items-end shrink-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white border border-[#D5D2B3] text-[#5C8D71]">
                                {moment.emotionalTone}
                              </span>
                              <span className="text-[10px] text-[#8A8981] mt-1">{moment.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Memory Bank Editor */}
              <div className="bg-white p-6 rounded-3xl border border-[#E3DFC2] shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-[#E8F1EB] text-[#3A5D45]">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-[#2C2C2A]">Memory Bank Editor</h3>
                  </div>
                  <button
                    id="btn-open-memory-modal"
                    onClick={() => { playSoundCue('pop'); setShowMemModal(true); }}
                    className="flex items-center space-x-1 px-4 py-2 bg-[#3A5D45] hover:bg-[#2B4633] text-white rounded-xl text-sm font-bold shadow-xs transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Memory Card</span>
                  </button>
                </div>

                <p className="text-sm text-[#7E7D76] mb-5 leading-relaxed">
                  Store and organize treasured moments. These memories directly ground Yadira AI's dialogue, helping to guide the patient through periods of forgetfulness.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {memories.map((mem) => {
                    const grad = getThemeGradient(mem.imageTheme);
                    return (
                      <div key={mem.id} className="p-5 bg-[#FCFAF5] border border-[#E3DFC2] rounded-2xl flex flex-col justify-between shadow-xs relative">
                        <button
                          onClick={() => handleDeleteMemory(mem.id)}
                          className="absolute top-4 right-4 text-[#A6A27B] hover:text-red-500 transition-all p-1"
                          title="Delete memory"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                        <div>
                          <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-white border border-[#D5D2B3] text-[#5C8D71]">
                            {mem.relationshipOrEra}
                          </span>
                          <div className={`mt-3 h-14 w-full rounded-lg bg-gradient-to-r ${grad} flex items-center justify-center border text-2xl`}>
                            {mem.imageTheme === 'wedding' && '💍🌹🌸'}
                            {mem.imageTheme === 'family' && '🏡🐾❤️'}
                            {mem.imageTheme === 'nature' && '🌲🏔️☀️'}
                            {mem.imageTheme === 'retro' && '📸⏳👴'}
                            {mem.imageTheme === 'home' && '🛋️☕🍽️'}
                          </div>
                          <h4 className="text-lg font-bold text-[#2C2C2A] mt-3">{mem.title}</h4>
                          <p className="text-xs text-[#5E5D57] mt-2 leading-relaxed">{mem.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Memory Modal Dialog */}
              {showFamilySetup && (
                <FamilySetup onClose={() => setShowFamilySetup(false)} onApply={applyFamilyPack} />
              )}

              {showMemModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white max-w-md w-full p-6 rounded-3xl border border-[#E3DFC2] shadow-xl space-y-4"
                  >
                    <h3 className="text-xl font-bold text-[#2C2C2A]">Add Treasured Memory Card</h3>
                    <form onSubmit={handleAddMemory} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#5E5D57] mb-1">Memory Title</label>
                        <input
                          type="text"
                          required
                          value={newMemTitle}
                          onChange={(e) => setNewMemTitle(e.target.value)}
                          placeholder="Wedding Day, Family Dog..."
                          className="w-full p-3 bg-[#FCFAF5] border border-[#E3DFC2] rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#5E5D57] mb-1">Era or Person Reference</label>
                        <input
                          type="text"
                          value={newMemEra}
                          onChange={(e) => setNewMemEra(e.target.value)}
                          placeholder="e.g., Husband, Summer 1980"
                          className="w-full p-3 bg-[#FCFAF5] border border-[#E3DFC2] rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#5E5D57] mb-1">Detailed Narrative Story</label>
                        <textarea
                          required
                          rows={3}
                          value={newMemDesc}
                          onChange={(e) => setNewMemDesc(e.target.value)}
                          placeholder="Write a warm, sensory narrative story. Use active, cheerful phrasing."
                          className="w-full p-3 bg-[#FCFAF5] border border-[#E3DFC2] rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#5E5D57] mb-1">Card Graphic Theme</label>
                        <select
                          value={newMemTheme}
                          onChange={(e: any) => setNewMemTheme(e.target.value)}
                          className="w-full p-3 bg-[#FCFAF5] border border-[#E3DFC2] rounded-xl text-sm"
                        >
                          <option value="family">Family (Warm, Home, Pets)</option>
                          <option value="nature">Nature (Scenic, Outdoors, Trips)</option>
                          <option value="wedding">Wedding (Romantic, Celebration)</option>
                          <option value="retro">Historical / Retro (Eras, Youth)</option>
                          <option value="home">Home (Daily Life, Comfort)</option>
                        </select>
                      </div>
                      <div className="flex space-x-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setShowMemModal(false)}
                          className="flex-1 py-3 bg-[#FCFAF5] hover:bg-[#EAE8DD] border border-[#E3DFC2] rounded-xl text-sm font-bold text-[#5E5D57]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-[#3A5D45] hover:bg-[#2B4633] text-white rounded-xl text-sm font-bold"
                        >
                          Create Memory Card
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 bg-white/90 backdrop-blur-sm border-t border-[#E3DFC2] py-6 px-4 text-center text-xs text-[#7E7D76] font-medium mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <HeartHandshake className="w-4 h-4 text-[#3A5D45]" />
            <span>Yadira Dementia Companion Hub — Pitch Protocol</span>
          </div>
          <p className="text-xs">
            Optimized for XPRIZE Dementia Care, leveraging secure server-side Gemini 3.5 LLMs.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Wrapper component with Auth
function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5C8D71] to-[#3A5D45] flex items-center justify-center">
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="text-white text-lg font-semibold">
          Loading Yadira...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AppContent />;
}

export default function AppWithProvider() {
  return (
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  );
}
