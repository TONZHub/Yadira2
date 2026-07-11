import React, { useState, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '../lib/ToastContext';

interface VoiceInputProps {
  onTranscript: (text: string, emotion?: { emotion: string; confidence: number; tone: string }) => void;
  disabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, disabled = false }) => {
  const { error: toastError } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [waveformLevel, setWaveformLevel] = useState(0);

  // Initialize Web Speech API
  const initRecognition = () => {
    if (recognitionRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech Recognition not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onstart = () => {
      setIsRecording(true);
      setError('');
      setTranscript('');
      finalTranscript = '';
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      const errorMsg = `Voice Error: ${event.error}`;
      setError(errorMsg);
      toastError('Microphone Issue', event.error === 'no-speech' ? 'No speech detected. Try again.' : errorMsg);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  };

  const startRecording = () => {
    initRecognition();
    setError('');
    recognitionRef.current?.start();

    // Start audio visualization
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaStreamRef.current = stream;
        const audioContext = new (window as any).AudioContext();
        audioContextRef.current = audioContext;
        const analyzer = audioContext.createAnalyser();
        analyzerRef.current = analyzer;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyzer);

        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        dataArrayRef.current = dataArray;

        const updateWaveform = () => {
          if (isRecording && analyzerRef.current && dataArrayRef.current) {
            analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
            const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
            setWaveformLevel(average / 255);
            requestAnimationFrame(updateWaveform);
          }
        };
        updateWaveform();
      })
      .catch((err) => {
        const msg = `Microphone access denied: ${err.message}`;
        setError(msg);
        toastError('Microphone Permission', 'Please allow microphone access to use voice input');
      });
  };

  const stopRecording = async () => {
    recognitionRef.current?.stop();
    setIsRecording(false);

    // Stop audio stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    // If we have a transcript, analyze emotion and send
    if (transcript.trim()) {
      setIsAnalyzing(true);
      try {
        const token = localStorage.getItem('yadira_token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/analyze-emotion', {
          method: 'POST',
          headers,
          body: JSON.stringify({ text: transcript.trim() }),
        });

        if (!response.ok) throw new Error(`Emotion analysis failed: ${response.statusText}`);

        const emotion = await response.json();
        onTranscript(transcript.trim(), emotion);
        setTranscript('');
      } catch (err) {
        const msg = `Emotion analysis error: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setError(msg);
        toastError('Emotion Analysis Failed', 'Could not analyze emotion. Sending message without emotion context.', {
          label: 'Send Anyway',
          onClick: () => onTranscript(transcript.trim()),
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {isRecording ? (
          <motion.button
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            onClick={stopRecording}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            <MicOff size={20} />
            Stop ({Math.round(waveformLevel * 100)}%)
          </motion.button>
        ) : (
          <button
            onClick={startRecording}
            disabled={disabled || isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <Mic size={20} />
            Voice
          </button>
        )}

        {isAnalyzing && (
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} className="text-sm text-gray-500">
            Analyzing emotion...
          </motion.div>
        )}
      </div>

      {transcript && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">{transcript}</p>
          {isRecording && <p className="text-xs text-blue-600 mt-1">🎤 Recording... (click Stop to send)</p>}
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-900">{error}</p>
        </motion.div>
      )}
    </div>
  );
};
