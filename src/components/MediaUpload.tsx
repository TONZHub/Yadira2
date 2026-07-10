import React, { useState, useRef } from 'react';
import { Upload, AlertTriangle, X, Loader } from 'lucide-react';
import { motion } from 'motion/react';

interface MediaUploadProps {
  onMediaAnalyzed: (insight: { description: string; emotion: string; suggestions: string[] }) => void;
  disabled?: boolean;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({ onMediaAnalyzed, disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'].includes(file.type)) {
      setError('Unsupported file type. Use JPEG, PNG, GIF, MP4, or WebM');
      return;
    }

    setError('');
    setFileName(file.name);

    // Create preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setPreview(dataUrl);

      // If video, extract first frame
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            analyzeMedia(canvas.toDataURL('image/jpeg'));
          }
        };
        video.src = dataUrl;
      } else {
        // Analyze image directly
        analyzeMedia(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const analyzeMedia = async (base64Data: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media: base64Data, mediaType: 'image' }),
      });

      if (!response.ok) throw new Error(`Analysis failed: ${response.statusText}`);

      const insight = await response.json();
      onMediaAnalyzed(insight);
      clearPreview();
    } catch (err) {
      setError(`Analysis error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {isLoading ? <Loader size={20} className="animate-spin" /> : <Upload size={20} />}
          Media
        </button>

        {isLoading && <span className="text-sm text-gray-500">Analyzing...</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-lg overflow-hidden bg-gray-100 p-2"
        >
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
          >
            <X size={16} />
          </button>
          <img src={preview} alt="Preview" className="w-full h-auto max-h-64 rounded" />
          <p className="text-xs text-gray-500 mt-2 truncate">{fileName}</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2"
        >
          <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-900">{error}</p>
        </motion.div>
      )}
    </div>
  );
};
