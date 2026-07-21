import express from 'express';
import OpenAI, { toFile } from 'openai';

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const WHISPER_TURBO_MODEL = 'openai/whisper-large-v3-turbo';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const SUPPORTED_AUDIO_TYPES = new Map<string, string>([
  ['audio/mp4', 'mp4'],
  ['audio/mpeg', 'mp3'],
  ['audio/mp3', 'mp3'],
  ['audio/ogg', 'ogg'],
  ['audio/wav', 'wav'],
  ['audio/webm', 'webm'],
  ['audio/x-m4a', 'm4a'],
  ['audio/x-wav', 'wav'],
]);

class AudioPayloadError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type DecodedAudio = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};

function normalizeMimeType(value: unknown) {
  if (typeof value !== 'string') return null;
  const normalized = value.split(';', 1)[0]?.trim().toLowerCase();
  return normalized || null;
}

function extensionForMimeType(mimeType: string) {
  return SUPPORTED_AUDIO_TYPES.get(mimeType) || null;
}

function decodeBase64Audio(payload: string) {
  const cleaned = payload.replace(/\s+/g, '');
  if (!cleaned) {
    throw new AudioPayloadError(400, 'invalid_audio', 'Audio payload is empty.');
  }
  if (!BASE64_RE.test(cleaned)) {
    throw new AudioPayloadError(400, 'invalid_audio', 'Audio payload must be base64 encoded.');
  }

  const buffer = Buffer.from(cleaned, 'base64');
  if (!buffer.length || buffer.toString('base64').replace(/=+$/, '') !== cleaned.replace(/=+$/, '')) {
    throw new AudioPayloadError(400, 'invalid_audio', 'Audio payload could not be decoded.');
  }
  if (buffer.length > MAX_AUDIO_BYTES) {
    throw new AudioPayloadError(413, 'audio_too_large', 'Audio payload exceeds the 10 MB limit.');
  }

  return buffer;
}

function decodeIncomingAudio(audio: unknown, mimeType: unknown): DecodedAudio {
  if (typeof audio !== 'string' || !audio.trim()) {
    throw new AudioPayloadError(400, 'missing_audio', 'Request body must include a non-empty audio string.');
  }

  const declaredMimeType = normalizeMimeType(mimeType);
  const dataUrl = audio.match(/^data:([^;,]+)(?:;[^,]*)?;base64,(.+)$/i);
  const embeddedMimeType = normalizeMimeType(dataUrl?.[1]);
  const resolvedMimeType = declaredMimeType || embeddedMimeType;

  if (!resolvedMimeType) {
    throw new AudioPayloadError(400, 'missing_mime_type', 'A supported audio mimeType is required.');
  }
  if (!extensionForMimeType(resolvedMimeType)) {
    throw new AudioPayloadError(
      415,
      'unsupported_mime_type',
      `Unsupported audio mimeType "${resolvedMimeType}".`,
    );
  }
  if (declaredMimeType && embeddedMimeType && declaredMimeType !== embeddedMimeType) {
    throw new AudioPayloadError(
      400,
      'mismatched_mime_type',
      'Audio mimeType does not match the embedded data URL mime type.',
    );
  }

  const base64Payload = dataUrl ? dataUrl[2] : audio;
  if (audio.startsWith('data:') && !dataUrl) {
    throw new AudioPayloadError(400, 'invalid_audio', 'Audio data URL must use base64 encoding.');
  }

  const extension = extensionForMimeType(resolvedMimeType);
  const buffer = decodeBase64Audio(base64Payload);

  return {
    buffer,
    filename: `dictation.${extension}`,
    mimeType: resolvedMimeType,
  };
}

function transcriptionConfig() {
  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const apiKey = openAIKey || openRouterKey || '';
  const baseURL = process.env.OPENAI_BASE_URL?.trim() || (!openAIKey && openRouterKey ? OPENROUTER_BASE_URL : undefined);

  return {
    apiKey,
    baseURL,
    configured: !!apiKey && apiKey !== 'MY_OPENAI_API_KEY' && apiKey !== 'MY_OPENROUTER_API_KEY',
  };
}

const notConfigured = (res: express.Response) =>
  res.status(501).json({
    error: 'transcription_not_configured',
    message:
      'Server transcription is unavailable. Set OPENAI_API_KEY (or OPENROUTER_API_KEY) and optionally OPENAI_BASE_URL to enable Whisper Turbo.',
  });

export function registerTranscribeRoutes(app: express.Express) {
  app.post('/api/transcribe', async (req: express.Request, res: express.Response) => {
    const config = transcriptionConfig();
    if (!config.configured) return notConfigured(res);

    try {
      const audio = decodeIncomingAudio(req.body?.audio, req.body?.mimeType);
      const client = new OpenAI({
        apiKey: config.apiKey,
        ...(config.baseURL ? { baseURL: config.baseURL } : {}),
      });

      const file = await toFile(audio.buffer, audio.filename, { type: audio.mimeType });
      const transcription = await client.audio.transcriptions.create({
        file,
        model: WHISPER_TURBO_MODEL,
      });

      if (typeof transcription?.text !== 'string') {
        throw new Error('Transcription provider returned an invalid response.');
      }

      res.json({ text: transcription.text });
    } catch (err) {
      if (err instanceof AudioPayloadError) {
        return res.status(err.status).json({ error: err.code, message: err.message });
      }

      const message = err instanceof Error ? err.message : 'Unknown transcription provider error';
      console.error('[Transcribe] Request failed:', message);
      return res.status(502).json({
        error: 'transcription_failed',
        message: `Transcription provider error: ${message}`,
      });
    }
  });
}
