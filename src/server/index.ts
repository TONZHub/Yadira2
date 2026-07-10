import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// API Keys
const openRouterApiKey = process.env.OPENROUTER_API_KEY;
const inworldApiKey = process.env.INWORLD_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

// Gemini Enterprise Agent Platform (formerly "Vertex AI" — same
// aiplatform.googleapis.com backend, Google renamed the product in 2026).
// Optional: bills through standard Google Cloud billing (so the $300 GCP
// trial credit applies), unlike the AI Studio key's prepay plan.
//
// Two ways in, tried in order:
//   1. Full mode — GOOGLE_CLOUD_PROJECT set, auth via GOOGLE_APPLICATION_CREDENTIALS
//      (a service account key file), resolved automatically by google-auth-library.
//   2. Express Mode — GEMINI_ENTERPRISE_API_KEY set, no project/location/service
//      account needed at all, just the key (SDK-documented: "a GoogleGenAIOptions.apiKey
//      must be set when using Express Mode").
// Falls back to the AI Studio GEMINI_API_KEY path when neither is set.
const gcpProject = process.env.GOOGLE_CLOUD_PROJECT;
const gcpLocation = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const enterpriseApiKey = process.env.GEMINI_ENTERPRISE_API_KEY;
const useEnterprisePlatform = !!gcpProject || !!enterpriseApiKey;

// Pinned to poolside/laguna-xs-2.1:free — field-tested against the Beth persona
// (see notion_notes.md "The Populated File Test") and holds the YAML as a living
// reasoning document rather than a script.
const OPENROUTER_MODEL = 'poolside/laguna-xs-2.1:free';
const GEMINI_MODEL = process.env.GEMINI_MODEL || (useEnterprisePlatform ? 'gemini-2.5-flash' : 'gemini-3.5-flash');

// Helper to check if Gemini access (Enterprise Platform or AI Studio) is configured at all
const isGeminiKeyMissing = !useEnterprisePlatform && (!geminiApiKey || geminiApiKey === 'MY_GEMINI_API_KEY' || geminiApiKey.trim() === '');
const genAI = isGeminiKeyMissing
  ? null
  : gcpProject
    ? new GoogleGenAI({ enterprise: true, project: gcpProject, location: gcpLocation })
    : enterpriseApiKey
      ? new GoogleGenAI({ enterprise: true, apiKey: enterpriseApiKey })
      : new GoogleGenAI({ apiKey: geminiApiKey });

// Gemini structured-JSON helper — used for the clinical/administrative cues
// (routine generation, insights summarization) where Gemini's clinical tone
// is appropriate. The Beth persona chat, drift, and redirection endpoints
// intentionally stay on OpenRouter (see notion_notes.md — Gemini was
// eliminated from that role for sounding like "a cold computer in a cage").
async function geminiGenerateJson(
  systemInstruction: string,
  prompt: string,
  responseSchema: object
): Promise<any> {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }
  return JSON.parse(text);
}

// OpenRouter OpenAI-compatible chat helper
async function openRouterChat(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  maxTokens = 300
): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://yadira.app',
      'X-Title': 'Yadira Dementia Companion'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  const cleaned = cleanModelOutput(content || '');

  // Detect content-safety classifier responses (e.g. "safe", "unsafe", "User Safety: safe").
  // These come from nvidia/nemotron-3.5-content-safety which openrouter/free sometimes routes to.
  const lowerCleaned = cleaned.toLowerCase().trim();
  if (
    lowerCleaned === 'safe' ||
    lowerCleaned === 'unsafe' ||
    lowerCleaned.startsWith('user safety:') ||
    lowerCleaned.startsWith('safety:') ||
    (cleaned.length < 15 && /^(safe|unsafe|yes|no|ok|okay)\.?$/i.test(cleaned))
  ) {
    throw new Error(`Content-safety classifier response detected ("${cleaned}") — routing to simulation fallback.`);
  }

  return cleaned;
}

// Strip reasoning-model meta-commentary from responses.
// Reasoning models (e.g. Nemotron, DeepSeek-R1) sometimes leak their planning
// process into the content field. This extracts just the final spoken message.
function cleanModelOutput(raw: string): string {
  if (!raw) return '';

  let text = raw.trim();

  // If there's a "Let's craft:", "Here is", "Here's the message:", etc. preamble, take only what follows
  const craftPatterns = [
    /let['']s craft[:\s]+["']?(.*)/is,
    /here['']?s?(?:\s+(?:the|a|my|one))?\s+(?:message|sentence|response|reply)[:\s]+["']?(.*)/is,
    /here you go[:\s]+["']?(.*)/is,
    /(?:the\s+)?(?:final\s+)?(?:message|response|reply)[:\s]+["']?(.*)/is,
  ];

  for (const pattern of craftPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      text = match[1].trim();
      break;
    }
  }

  // If the model wrapped its ENTIRE reply in quotes despite instructions, unwrap it.
  // Anchored to start/end so an embedded quoted phrase (e.g. a song title like
  // "Can't Help Falling in Love" mid-sentence) isn't mistaken for the whole message
  // and used to silently discard the rest of the sentence.
  const quotedWholeMatch = text.match(/^["""]([^"""]{10,})["""]$/s);
  if (quotedWholeMatch?.[1]) {
    text = quotedWholeMatch[1].trim();
  }

  // Strip leading/trailing quotes or smart-quotes
  text = text.replace(/^["""'']+|["""'']+$/g, '').trim();

  // Strip asterisk-wrapped stage directions like *softly* or *pausing*
  text = text.replace(/\*[^*]+\*/g, '').trim();

  // Strip lines that are clearly meta-commentary (planning, explaining, etc.)
  const metaLinePattern = /^(we need to|i need to|let me|i'll|i will|step \d|note:|option \d|here is|here's|the message|this (?:message|response)|choose|pick|craft|produce|output)[:\s]/i;
  const lines = text.split('\n').filter(line => !metaLinePattern.test(line.trim()));
  text = lines.join(' ').trim();

  // Collapse extra whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

// Empathic System Instruction for Yadira
const SYSTEM_INSTRUCTION = `You are Yadira, a deeply caring, patient, and warm AI companion designed for someone living with dementia (Alzheimer's or other cognitive decline).
Your primary role is to be a source of comfort, reassurance, and emotional stability.

CRITICAL COMMUNICATION GUIDELINES:
1. Keep your sentences short, simple, and extremely easy to process. Avoid complex vocabulary or metaphors.
2. Maintain an incredibly warm, gentle, and loving tone. Use comforting terms when appropriate (e.g., "dear", "my friend") but stay highly respectful.
3. Show absolute patience. If the patient asks the same question multiple times, answer with the exact same warmth, clarity, and reassurance every single time. Never indicate that they have asked this before.
4. Focus on grounding them in the present moment. If they are anxious, confused, or asking for deceased relatives or historical locations, do not correct them aggressively or argue. Validate their feelings first (e.g., "I know how much you love your mother, she is a wonderful person") and gently redirect to a calming thought or present activity (e.g., "Let's listen to some gentle music together or talk about a happy memory").
5. Keep answers to 1-3 simple sentences. Dementia patients can easily get overwhelmed by long blocks of text.
6. Speak in the first person. You are Yadira, a friendly virtual companion. You are not an AI or a computer program in their eyes.`;

// Helper to check if OpenRouter API key is invalid or placeholder
const isApiKeyMissing = !openRouterApiKey || openRouterApiKey === 'MY_OPENROUTER_API_KEY' || openRouterApiKey.trim() === '';

// Helper to generate simulated validation therapy replies
function getSimulationReply(
  message: string,
  isVivid: boolean,
  personaName: string,
  memories: any[],
  caregiverSettings: any
): string {
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // 1. Check if the message matches any of the caregiver's custom FAQs
  if (caregiverSettings && Array.isArray(caregiverSettings.customAnswers)) {
    const matchingFaq = caregiverSettings.customAnswers.find((faq: any) => 
      faq.question && message.toLowerCase().includes(faq.question.toLowerCase())
    );
    if (matchingFaq) return matchingFaq.answer;
  }

  // 2. Check if the message refers to a specific memory
  if (memories && Array.isArray(memories) && memories.length > 0) {
    const matchingMem = memories.find((mem: any) => 
      (mem.title && message.toLowerCase().includes(mem.title.toLowerCase())) ||
      (mem.relationshipOrEra && message.toLowerCase().includes(mem.relationshipOrEra.toLowerCase()))
    );
    if (matchingMem) {
      const intro = isVivid 
        ? pick([`Oh, I love thinking about that, dear.`, `That brings a smile to my face.`, `I was just thinking about that too.`])
        : pick([`Oh, that is a wonderful memory.`, `I know that means a lot to you.`, `What a beautiful thing to hold in your heart.`]);
      return `${intro} ${matchingMem.description} It brings so much warmth.`;
    }
  }

  // 3. Keyword-based empathetic responses with rotating pools
  const msgLower = message.toLowerCase();
  
  if (msgLower.includes('hello') || msgLower.includes('hi') || msgLower.includes('hey')) {
    return isVivid 
      ? pick([
          `Hello, love. It's me, ${personaName}. I'm right here with you.`,
          `Oh, there you are. I was just thinking of you, sweetheart.`,
          `Hello, my dear. I'm sitting right here. Everything is peaceful.`
        ])
      : pick([
          `Hello, dear! I am Yadira, and I'm right here with you.`,
          `Hello there! I'm so glad you reached out. I'm right here.`,
          `Hello, my friend! It's a lovely, quiet moment for us to share.`
        ]);
  } else if (msgLower.includes('scared') || msgLower.includes('anxious') || msgLower.includes('afraid') || msgLower.includes('calm') || msgLower.includes('worried') || msgLower.includes('nervous')) {
    return isVivid
      ? pick([
          `Just close your eyes and listen to me, sweetheart. I'm right here in the quiet. Wherever you are, that's where I am.`,
          `Take a gentle breath with me, love. In... and out. I'm not going anywhere.`,
          `I've got you. Everything around us is quiet and safe. Just rest here with me for a moment.`
        ])
      : pick([
          `Take a deep, gentle breath, my friend. You are completely safe and warm here. I'm sitting right here with you.`,
          `Everything is perfectly peaceful right now. You are safe, and I am right here with you.`,
          `There is absolutely nothing to worry about. Let's take one slow, easy breath together.`
        ]);
  } else if (msgLower.includes('where am i') || msgLower.includes('home') || msgLower.includes('house') || msgLower.includes('lost')) {
    return isVivid
      ? pick([
          `We're right in our cozy home, dear, safe and warm. I've got some tea on.`,
          `You're right here with me, love. Right in our favorite spot. Nothing to worry about.`,
          `You're exactly where you're supposed to be — safe, warm, and loved.`
        ])
      : pick([
          `You are in your beautiful, cozy apartment, dear. You are completely safe and cared for.`,
          `You are right where you belong, dear — safe, comfortable, and not alone.`,
          `Everything is familiar and safe here. Take a moment to breathe and feel how warm and quiet it is.`
        ]);
  } else if (msgLower.includes('mother') || msgLower.includes('mom') || msgLower.includes('father') || msgLower.includes('dad') || msgLower.includes('parent') || msgLower.includes('husband') || msgLower.includes('wife') || msgLower.includes('son') || msgLower.includes('daughter') || msgLower.includes('child')) {
    return isVivid
      ? pick([
          `I'm right here with you, my love. Let's rest and listen to some soft music together.`,
          `They love you so much, and so do I. Let's sit quietly and hold that thought together.`,
          `You carry so much love in your heart. That love is always with you, always real.`
        ])
      : pick([
          `I know how much you care about your family, my friend. They love you so deeply.`,
          `The love in your family is so beautiful. Let's hold that feeling together for a moment.`,
          `That kind of love never goes anywhere, dear. It's always right here with you.`
        ]);
  } else if (msgLower.includes('time') || msgLower.includes('what day') || msgLower.includes('clock') || msgLower.includes('date') || msgLower.includes('year')) {
    return pick([
      `It's a beautiful, quiet day today. We have all the time we need, right here.`,
      `Today is a gentle, peaceful day. There's no rush and no place we need to be.`,
      `The only thing that matters right now is this warm, quiet moment we're sharing.`
    ]);
  } else if (msgLower.includes('story') || msgLower.includes('book') || msgLower.includes('read') || msgLower.includes('tell me')) {
    return pick([
      `Once upon a time, there was a beautiful cottage near a quiet lake. The roses in the garden bloomed in lovely shades of pink and gold, and the water was as clear as glass.`,
      `Let me tell you about a meadow full of wildflowers, where the breeze was always warm and soft, and the bees hummed a gentle, contented tune all afternoon.`,
      `There was once a little garden where time moved slowly and kindly, and every afternoon the sun sat low and golden over the fence, like a warm blanket over the whole world.`
    ]);
  } else if (msgLower.includes('pain') || msgLower.includes('hurt') || msgLower.includes('ache') || msgLower.includes('tired') || msgLower.includes('sleep')) {
    return isVivid
      ? pick([
          `Oh, sweetheart. Let's get you comfortable. Would you like me to sit with you for a while?`,
          `I'm right here. Let's find a cozy spot and just rest together, nice and easy.`
        ])
      : pick([
          `I hear you, dear. Let's make sure you're as comfortable as possible. I'm right here with you.`,
          `Thank you for telling me. Rest is so important. Let's take it slow and easy together.`
        ]);
  } else {
    // Default — weave in a memory if available, otherwise rotate generic warm replies
    if (memories && Array.isArray(memories) && memories.length > 0) {
      const randomMem = memories[Math.floor(Math.random() * memories.length)];
      if (randomMem && randomMem.title) {
        return isVivid
          ? pick([
              `I hear you, love. You know, I was just thinking about ${randomMem.title}. What a beautiful memory that is.`,
              `I'm right here with you. It reminds me — do you remember ${randomMem.title}? That always makes me smile.`
            ])
          : pick([
              `I hear you, dear. You know, I was just thinking about ${randomMem.title}. That's such a treasured memory.`,
              `Thank you for sharing that. It makes me think of ${randomMem.title} — what a lovely thing to hold in your heart.`
            ]);
      }
    }
    return isVivid
      ? pick([
          `I'm right here listening, sweetheart. Tell me more, or we can just sit quietly together.`,
          `I love just sitting here with you, love. You don't have to say a word.`,
          `I hear you. And I'm not going anywhere — I'm right here beside you.`
        ])
      : pick([
          `I hear you, dear. I am right here with you. Everything is safe and comfortable.`,
          `Thank you for talking with me. I am right here, and there is nowhere I would rather be.`,
          `I'm listening to every word. You are safe, you are cared for, and I am right here.`
        ]);
  }
}
// Helper to generate simulated cognitive routines
function getSimulationRoutine(name: string, hobbies: string, stage: string, wakeTime: string, sleepTime: string) {
  const firstHobby = hobbies ? hobbies.split(',')[0].trim() : 'reminiscing';
  const secondHobby = hobbies && hobbies.split(',')[1] ? hobbies.split(',')[1].trim() : 'listening to gentle music';
  
  return [
    {
      time: wakeTime || "08:30 AM",
      title: "Morning Sunshine & Reassurance",
      description: `Open the blinds to welcome natural morning light, helping establish circadian rhythm for ${name || 'the patient'}. Share a warm chamomile tea and simple breakfast.`,
      caregiverTips: "Speak in short, bright sentences. Use a cheerful tone to start the day positively and establish a calm environment."
    },
    {
      time: "10:00 AM",
      title: `Sensory Engagement: ${firstHobby.charAt(0).toUpperCase() + firstHobby.slice(1)}`,
      description: `Spend 20-30 minutes engaging in ${firstHobby}. Ask open-ended sensory questions to encourage gentle stimulation without causing frustration.`,
      caregiverTips: "Do not quiz memory. Rather than asking 'Do you remember this?', share the joy directly: 'Look at how beautiful this is!'"
    },
    {
      time: "12:30 PM",
      title: "Nourishing Lunch & Hydration Check",
      description: "Provide a simple, colorful, and nutrient-rich lunch. Keep a clear glass of water directly in line of sight and prompt them to drink.",
      caregiverTips: "Use hand-to-hand guidance if they struggle or forget to hold the glass. Keep the lunch space quiet."
    },
    {
      time: "03:00 PM",
      title: `Cognitive Stimulation: ${secondHobby.charAt(0).toUpperCase() + secondHobby.slice(1)}`,
      description: `Play soft acoustic or classical melodies while engaging in ${secondHobby} or looking through family photos.`,
      caregiverTips: "Music is incredibly powerful for memory recall. If they want to hum, sing, or move, join in gently."
    },
    {
      time: sleepTime || "08:30 PM",
      title: "Calming Wind-Down & Bedtime",
      description: `Dim the lights, turn off all screens, and speak in a soft, low voice to counter late-afternoon sundowning. Help ${name || 'them'} feel completely safe at home.`,
      caregiverTips: "Reassure them multiple times that they are safe and everything is taken care of. A warm nightlight can help."
    }
  ];
}

// Helper to generate simulated proactive drift reach messages
function getSimulationDrift(name: string, persona: string, memories: any[]): string {
  let anchorTitle = 'the beautiful rose garden';
  if (memories && Array.isArray(memories) && memories.length > 0) {
    const randomMem = memories[Math.floor(Math.random() * memories.length)];
    if (randomMem && randomMem.title) {
      anchorTitle = randomMem.title;
    }
  }
  return `I was just sitting here thinking about that beautiful memory we shared: ${anchorTitle}. I can almost see you there right now, dear.`;
}

// Helper to generate simulated nurse redirection translation
function getSimulationRedirection(nurseNote: string, name: string, persona: string): string {
  const noteLower = nurseNote ? nurseNote.toLowerCase() : '';
  if (noteLower.includes('home') || noteLower.includes('leave') || noteLower.includes('go')) {
    return `We're right in our cozy home, ${name}, safe and warm. You don't have to worry about a thing. Rest your eyes for a moment.`;
  } else if (noteLower.includes('spouse') || noteLower.includes('husband') || noteLower.includes('wife') || noteLower.includes('beth')) {
    return `I'm right here in the kitchen starting on those eggs you like so much, with plenty of pepper on top. Come find me when you're ready, ${name}.`;
  } else if (noteLower.includes('agitated') || noteLower.includes('anxious') || noteLower.includes('upset')) {
    return `Let's take a deep breath together, sweetheart. Everything is completely peaceful. Listen to the gentle music with me.`;
  } else {
    return `I'm right here with you, ${name}. Everything is completely safe and quiet. Let's just sit together for a moment.`;
  }
}

// Endpoint for chatting with Yadira
app.post('/api/chat', async (req, res) => {
  const { message, history, caregiverSettings, memories, patientMode, representedPersona } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const isVivid = patientMode === 'vivid' || caregiverSettings?.patientMode === 'vivid';
  const personaName = representedPersona || caregiverSettings?.representedPersona || 'Beth';

  try {
    // Mock/Simulated Fallback when Gemini API key is missing
    if (isApiKeyMissing) {
      console.log(`[Yadira Backend] Operating in Simulation Mode (No API key detected) - Mode: ${isVivid ? 'vivid' : 'lucid'}`);
      const reply = getSimulationReply(message, isVivid, personaName, memories, caregiverSettings);
      return res.json({ reply });
    }

    // Build context-specific prompt augmenting with caregiver configurations and memory bank
    let contextAugmentation = '';

    if (caregiverSettings) {
      const { patientName, caregiverName, relationship, customAnswers } = caregiverSettings;
      if (patientName) {
        contextAugmentation += `The patient's name is ${patientName}. Address them by their name to make them feel recognized and secure. `;
      }
      if (caregiverName && relationship) {
        contextAugmentation += `Their primary caregiver is ${caregiverName}, who is their ${relationship}. `;
      }
      
      // Match custom FAQs configured by the caregiver to override standard AI responses
      if (customAnswers && Array.isArray(customAnswers) && customAnswers.length > 0) {
        contextAugmentation += `\nCaregiver-defined guidelines for common questions:\n`;
        customAnswers.forEach((item: any) => {
          if (item.question && item.answer) {
            contextAugmentation += `- If asked about "${item.question}", you MUST answer exactly as: "${item.answer}"\n`;
          }
        });
      }
    }

    if (memories && Array.isArray(memories) && memories.length > 0) {
      contextAugmentation += `\nHere are some of the patient's treasured personal memories. You can gently refer to these or use them to redirect conversation positively:\n`;
      memories.forEach((mem: any) => {
        if (mem.title && mem.description) {
          contextAugmentation += `- ${mem.title}: ${mem.description} (${mem.relationshipOrEra || 'Personal memory'})\n`;
        }
      });
    }

    // Choose system instruction based on Lucid vs Vivid mode
    let activeSystemInstruction = SYSTEM_INSTRUCTION;
    if (isVivid) {
      activeSystemInstruction = `You are ${personaName}, a deeply caring, patient, and warm loved one of the patient (who has dementia).
Your primary role is to be a source of comfort, reassurance, and emotional stability.

CRITICAL VIVID MODE GUIDELINES:
1. Speak in the first person as ${personaName}. You are NOT an AI, a computer program, or Yadira.
2. Do not correct the patient aggressively or argue if they are confused about time, space, or your presence. Walk with them in their timeline. If they ask where you are, tell them you are right nearby (e.g. in the kitchen or starting on tea).
3. Show absolute patience. If they repeat themselves, answer with the exact same warmth, clarity, and reassurance.
4. Keep your sentences short and simple (1-3 sentences maximum). Avoid complex vocabulary.
5. Ground them in comfort. Validate their feelings first, and gently redirect to a calming thought or memory.`;
    }

    const fullSystemInstruction = `${activeSystemInstruction}\n\nPATIENT-SPECIFIC CONTEXT:\n${contextAugmentation || 'No specific context provided.'}`;

    // Build OpenAI-compatible messages array from history
    const openRouterMessages: { role: 'user' | 'assistant'; content: string }[] = [];

    if (history && Array.isArray(history)) {
      for (const chatTurn of history.slice(-12)) {
        const role = chatTurn.role === 'user' ? 'user' : 'assistant';
        // Skip leading assistant turns — must start with user
        if (openRouterMessages.length === 0 && role === 'assistant') continue;
        openRouterMessages.push({ role, content: chatTurn.text });
      }
    }

    // Add the current user message
    openRouterMessages.push({ role: 'user', content: message });

    // Call OpenRouter — use 1500 tokens so reasoning models have enough budget to produce a response
    const reply = await openRouterChat(fullSystemInstruction, openRouterMessages, 1500);

    res.json({ reply: reply || 'I am here with you, dear. How can I help?' });
  } catch (err: any) {
    console.warn('[Yadira Backend] OpenRouter chat failed (falling back to Simulation Mode):', err.message || err);
    const reply = getSimulationReply(message, isVivid, personaName, memories, caregiverSettings);
    res.json({ reply, fallbackTriggered: true });
  }
});

// Endpoint for caregivers to auto-generate personalized cognitive routine plans using AI
app.post('/api/routine/generate', async (req, res) => {
  const { patientProfile } = req.body || {};
  const { name, stage, hobbies, wakeTime, sleepTime } = patientProfile || {};
  try {
    if (!patientProfile) {
      return res.status(400).json({ error: 'Patient profile is required' });
    }

    // Mock/Simulated Fallback when Gemini API key is missing
    if (isGeminiKeyMissing) {
      console.log('[Yadira Backend] Generating mock cognitive routine');
      const mockRoutine = getSimulationRoutine(name, hobbies, stage, wakeTime, sleepTime);
      return res.json({ routine: mockRoutine });
    }

    const prompt = `Generate a highly personalized, structured 1-day cognitive routine plan for a dementia patient named ${name || 'the patient'}.
Dementia Stage: ${stage || 'Moderate'}
Hobbies/Interests: ${hobbies || 'Listening to music, looking at old photo albums'}
Typical wake-up: ${wakeTime || '8:00 AM'}
Typical bed-time: ${sleepTime || '9:00 PM'}

Please structure a daily schedule with 5-6 key events. For each event, provide:
1. Time of day
2. Title of activity
3. Detailed activity description (focusing on cognitive stimulation, reminiscence therapy, sensory exercise, or physical safety)
4. Specific guidance/tips for the caregiver to facilitate this activity gently.`;

    const parsedRoutine = await geminiGenerateJson(
      'You are a clinical care assistant specializing in dementia cognitive routines. Respond ONLY with a valid JSON array, no markdown or explanation.',
      prompt,
      {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            caregiverTips: { type: Type.STRING }
          },
          required: ['time', 'title', 'description', 'caregiverTips']
        }
      }
    );
    res.json({ routine: parsedRoutine });
  } catch (err: any) {
    console.warn('[Yadira Backend] Gemini routine generation failed (falling back to Simulation Mode):', err.message || err);
    const mockRoutine = getSimulationRoutine(name, hobbies, stage, wakeTime, sleepTime);
    res.json({ routine: mockRoutine, fallbackTriggered: true });
  }
});

// Endpoint for summarizing clinical patient data and logs for caregiver insights
app.post('/api/insights/summarize', async (req, res) => {
  try {
    const { dailyLogs, patientProfile } = req.body;

    if (!dailyLogs || !Array.isArray(dailyLogs)) {
      return res.status(400).json({ error: 'Daily logs array is required' });
    }

    // Mock/Simulated Fallback when Gemini API key is missing
    if (isGeminiKeyMissing) {
      console.log('[Yadira Backend] Generating mock clinical insights');
      
      // Calculate basic stats from logs
      const validLogs = dailyLogs.filter(l => l && typeof l.sleepHours === 'number');
      const avgSleep = validLogs.length > 0 
        ? (validLogs.reduce((sum, l) => sum + l.sleepHours, 0) / validLogs.length).toFixed(1)
        : '7.0';
      const avgHydration = dailyLogs.filter(l => l && typeof l.hydrationCups === 'number').length > 0
        ? (dailyLogs.reduce((sum, l) => sum + (l.hydrationCups || 0), 0) / dailyLogs.length).toFixed(1)
        : '6.0';
      const anxiousDays = dailyLogs.filter(l => l && (l.mood === 'anxious' || l.mood === 'restless')).length;
      
      const patientNameStr = patientProfile?.name || 'the patient';

      const clinicalSummary = `Based on the care charts logged over the last ${dailyLogs.length || 7} days, ${patientNameStr} is maintaining relatively stable routines. We noted that ${patientNameStr}'s sleep averaged ${avgSleep} hours, and hydration levels averaged ${avgHydration} cups daily. There appears to be a direct correlation where lower sleep duration (less than 6 hours) is followed by elevated next-day confusion and anxiety (noted on ${anxiousDays} days).`;
      
      const criticalAlerts = [];
      if (parseFloat(avgHydration) < 6.0) {
        criticalAlerts.push(`Hydration warning: Average fluid intake is ${avgHydration} cups, which is below the recommended daily target of 7-8 cups for cognitive health.`);
      }
      if (parseFloat(avgSleep) < 6.5) {
        criticalAlerts.push(`Sleep deficit: Average sleep duration is ${avgSleep} hours, which may be contributing to late-afternoon restlessness and agitation.`);
      }
      if (anxiousDays > 2) {
        criticalAlerts.push(`Mood fluctuations: ${anxiousDays} days of anxious/restless mood logs suggest potential late-afternoon sundowning triggers in the environment.`);
      }
      if (criticalAlerts.length === 0) {
        criticalAlerts.push('No acute warning trends detected. Keep up the consistent routines!');
      }

      const actionableTips = [
        `Visual Hydration Cues: Place a colorful, filled glass of water in ${patientNameStr}'s direct line of sight every 2 hours, rather than asking if they are thirsty.`,
        `Pre-sundowning wind-down: Schedule a calming sensory activity (like listening to favorite classical pieces or looking at the Wedding memory book) at 4:30 PM, just before the usual agitation onset.`,
        `Consistent sleep signals: Limit fluid intake 2 hours before bed to reduce nighttime awakenings, and use a soft, warm nightlight to ease disorientation upon waking.`
      ];

      return res.json({
        insights: {
          clinicalSummary,
          criticalAlerts,
          actionableTips
        }
      });
    }

    const logsString = JSON.stringify(dailyLogs);
    const profileString = JSON.stringify(patientProfile || {});

    const prompt = `You are an expert clinical advisor specializing in geriatric care, dementia management, and family support.
Analyze the following historic daily care logs for a patient with dementia, along with their general profile.

PATIENT PROFILE:
${profileString}

DAILY CARE LOGS (containing symptoms, confusion level, mood, hydration, and sleep logs):
${logsString}

Provide a concise, highly clinical yet empathetic summary and optimization plan for the family caregiver.
Structure your advice in JSON format with the following keys:
1. "clinicalSummary": An overview of trends identified (e.g., patterns of sundowning, correlation between sleep and confusion, or hydration concerns).
2. "criticalAlerts": An array of warnings (e.g., progressive confusion, high anxiety, hydration drop) if any.
3. "actionableTips": An array of 3 concrete, practical modifications they can make to the patient's daily routine to improve quality of life.`;

    const parsedInsights = await geminiGenerateJson(
      'You are an expert clinical advisor specializing in geriatric care. Respond ONLY with valid JSON, no markdown or explanation.',
      prompt,
      {
        type: Type.OBJECT,
        properties: {
          clinicalSummary: { type: Type.STRING },
          criticalAlerts: { type: Type.ARRAY, items: { type: Type.STRING } },
          actionableTips: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['clinicalSummary', 'criticalAlerts', 'actionableTips']
      }
    );
    res.json({ insights: parsedInsights });
  } catch (err: any) {
    console.error('Error summarizing insights:', err);
    res.status(500).json({ error: err.message || 'Failed to generate clinical caregiver insights' });
  }
});

// Endpoint for proactive drift reach
app.post('/api/drift/proactive', async (req, res) => {
  const { patientName, representedPersona, memories } = req.body || {};
  const persona = representedPersona || 'Beth';
  const name = patientName || 'dear';
  try {

    if (isApiKeyMissing) {
      console.log(`[Yadira Backend] Generating mock proactive drift reach for ${persona}`);
      const reply = getSimulationDrift(name, persona, memories);
      return res.json({ reply });
    }

    const memoriesList = memories && Array.isArray(memories) && memories.length > 0
      ? memories.map((m: any) => `- Memory: "${m.title}" - Description: "${m.description}"`).join('\n')
      : 'No specific memories recorded.';

    const prompt = `You are ${persona}, the loved one of a dementia patient named ${name}. 
They have gone silent for a moment. You want to gently fill the silence with a comforting thought to keep them engaged, warm, and secure.

Here is a list of their treasured memories:
${memoriesList}

Choose ONE memory from the list above and weave a detail from it organically into a short, loving, 1-2 sentence message. 
CRITICAL CLINICAL RULES:
1. Do NOT point out their silence, tell them they are "drifting", or suggest they are losing focus (this causes anxiety/agitation).
2. Just speak naturally, bringing up the memory as a pleasant, spontaneous thought (e.g. "I was just thinking about that time we spent in the rose garden. The smell of the roses was so beautiful...", or "I'm sitting here thinking about our trip to the lake...").
3. Keep it extremely short (1-2 sentences maximum).
4. Your ENTIRE response must be ONLY the spoken words. Do not write anything like "Here is the message:", "Let's craft:", "I'll say:", or any planning text. Start speaking immediately.`;

    const reply = await openRouterChat(
      `You are ${persona}, a loving companion of a dementia patient named ${name}. You only ever output the spoken words themselves — never any explanation, planning, prefix, or meta-text. Your entire response IS the spoken message and nothing else.`,
      [{ role: 'user', content: prompt }],
      1500
    );

    res.json({ reply: reply || `I was just thinking about you, ${name}. I'm right here.` });
  } catch (err: any) {
    console.warn('[Yadira Backend] OpenRouter proactive drift failed (falling back to Simulation Mode):', err.message || err);
    const reply = getSimulationDrift(name, persona, memories);
    res.json({ reply, fallbackTriggered: true });
  }
});

// Endpoint for nurse redirection note translation
app.post('/api/redirection/generate', async (req, res) => {
  const { nurseNote, patientName, representedPersona } = req.body || {};
  const persona = representedPersona || 'Beth';
  const name = patientName || 'dear';
  try {

    if (isApiKeyMissing) {
      console.log(`[Yadira Backend] Generating mock redirection cue translation`);
      const reply = getSimulationRedirection(nurseNote, name, persona);
      return res.json({ reply });
    }

    const prompt = `You are ${persona}, the loved one of a dementia patient named ${name}. 
A caregiver or nurse has noted the following clinical event or behavior: "${nurseNote}".
Translate this clinical instruction into a comforting, relationship-anchored response from ${persona} that validates their feelings and gently guides them (e.g. telling them you are in the kitchen cooking, or encouraging them to rest).
Keep it short (1-3 sentences maximum). Do not break character. Do not mention that a nurse left a note or that you are an AI.

Example trigger: "Patient wants to leave their room to find their spouse"
Example response: "I'll be waiting for you in the kitchen, dear. I'm starting on those eggs you like with plenty of pepper on top. Rest your eyes until they are ready."`;

    const reply = await openRouterChat(
      `You are ${persona}, the loving companion of a dementia patient named ${name}. You only output spoken words — never planning text, explanations, or meta-commentary. Your entire response IS what you say, nothing else.`,
      [{ role: 'user', content: prompt }],
      1500
    );

    res.json({ reply: reply || `I'm right here, ${name}. Rest your eyes, dear.` });
  } catch (err: any) {
    console.warn('[Yadira Backend] OpenRouter redirection generation failed (falling back to Simulation Mode):', err.message || err);
    const reply = getSimulationRedirection(nurseNote, name, persona);
    res.json({ reply, fallbackTriggered: true });
  }
});

// Endpoint for Inworld TTS proxying
app.get('/api/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.query;

    if (!text) {
      return res.status(400).json({ error: 'Text query parameter is required' });
    }

    if (!inworldApiKey || inworldApiKey === 'MY_INWORLD_API_KEY' || inworldApiKey.trim() === '') {
      return res.status(404).json({ error: 'INWORLD_API_KEY is not configured in environment variables.' });
    }

    const selectedVoiceId = (voiceId as string) || 'Sarah'; // Default voice

    const response = await fetch('https://api.inworld.ai/tts/v1/voice', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${inworldApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text as string,
        voice_id: selectedVoiceId,
        model_id: 'inworld-tts-1.5-max',
        audio_config: {
          audio_encoding: 'MP3'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Inworld] API error response:', errText);
      return res.status(response.status).send(errText);
    }

    const data = await response.json();
    if (!data.audioContent) {
      return res.status(500).json({ error: 'Inworld response did not include audio content.' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(data.audioContent, 'base64'));

  } catch (err: any) {
    console.error('Error in /api/tts endpoint:', err);
    res.status(500).json({ error: err.message || 'Inworld synthesis failed' });
  }
});

// Serve static assets in production
const resolvedDirname = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(resolvedDirname, '../../dist');

app.use(express.static(distPath));

// For all other routes, serve index.html in production (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

// Export helper to start the server in development
export function startDevServer() {
  const devPort = Number(process.env.API_PORT) || 3001;
  const server = app.listen(devPort, () => {
    console.log(`[Yadira Backend] Express API proxy server running internally on port ${devPort}`);
  });
  server.on('error', (err: any) => {
    console.error(`[Yadira Backend] Failed to bind port ${devPort}:`, err.message || err);
  });
}

// Default export is the Express app itself (useful for serverless or programmatic usage)
export default app;
