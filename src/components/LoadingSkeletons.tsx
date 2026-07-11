import React from 'react';
import { motion } from 'motion/react';

export const SkeletonBar: React.FC<{ width?: string; height?: string; className?: string }> = ({
  width = 'w-full',
  height = 'h-4',
  className = '',
}) => (
  <motion.div
    animate={{ opacity: [0.6, 0.3, 0.6] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    className={`${width} ${height} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded ${className}`}
  />
);

export const SkeletonCircle: React.FC<{ size?: string; className?: string }> = ({ size = 'w-12 h-12', className = '' }) => (
  <motion.div
    animate={{ opacity: [0.6, 0.3, 0.6] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    className={`${size} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full ${className}`}
  />
);

export const ChatMessageSkeleton: React.FC = () => (
  <div className="mb-4">
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-tl-none p-5 bg-white border border-[#E4E0C4] space-y-3">
        <SkeletonBar width="w-48" />
        <SkeletonBar width="w-64" />
        <SkeletonBar width="w-40" />
      </div>
    </div>
  </div>
);

export const MemorySkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-white p-4 rounded-2xl border border-[#E3DFC2] space-y-3"
  >
    <SkeletonCircle size="w-16 h-16" />
    <SkeletonBar width="w-3/4" />
    <SkeletonBar width="w-full" />
    <SkeletonBar width="w-2/3" />
  </motion.div>
);

export const RoutineSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-4 bg-[#FAF9F5] rounded-lg border border-[#E3DFC2] space-y-2">
        <SkeletonBar width="w-20" height="h-3" />
        <SkeletonBar width="w-full" height="h-3" />
        <SkeletonBar width="w-2/3" height="h-3" />
      </motion.div>
    ))}
  </div>
);

export const LogSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(2)].map((_, i) => (
      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="p-4 bg-white rounded-lg border border-[#E3DFC2] space-y-3">
        <div className="flex justify-between">
          <SkeletonBar width="w-24" />
          <SkeletonBar width="w-20" />
        </div>
        <SkeletonBar width="w-full" />
        <SkeletonBar width="w-2/3" />
      </motion.div>
    ))}
  </div>
);
