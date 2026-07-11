import React from 'react';

interface EmotionBadgeProps {
  emotion?: string;
  confidence?: number;
}

const emotionConfig: Record<string, { emoji: string; color: string; textColor: string }> = {
  happy: { emoji: '😊', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
  sad: { emoji: '😢', color: 'bg-blue-100', textColor: 'text-blue-800' },
  anxious: { emoji: '😰', color: 'bg-orange-100', textColor: 'text-orange-800' },
  confused: { emoji: '😕', color: 'bg-purple-100', textColor: 'text-purple-800' },
  peaceful: { emoji: '😌', color: 'bg-green-100', textColor: 'text-green-800' },
  angry: { emoji: '😠', color: 'bg-red-100', textColor: 'text-red-800' },
  excited: { emoji: '🤩', color: 'bg-pink-100', textColor: 'text-pink-800' },
  neutral: { emoji: '😐', color: 'bg-gray-100', textColor: 'text-gray-800' },
};

export const EmotionBadge: React.FC<EmotionBadgeProps> = ({ emotion, confidence = 1 }) => {
  if (!emotion || !(emotion in emotionConfig)) return null;

  const config = emotionConfig[emotion];

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${config.color} ${config.textColor} text-xs font-medium`}>
      <span>{config.emoji}</span>
      <span className="capitalize">{emotion}</span>
      {confidence && <span className="ml-1 opacity-70">({Math.round(confidence * 100)}%)</span>}
    </div>
  );
};
