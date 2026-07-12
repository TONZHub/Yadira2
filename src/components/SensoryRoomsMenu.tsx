import React from 'react';
import { motion } from 'motion/react';
import { X, Lock, Sparkles } from 'lucide-react';
import { SENSORY_ROOMS, type RoomId } from '../lib/sensoryRooms';

// The room chooser. Aurora is free; the rest are Yadira Premium and show a
// lock until the family's circle is unlocked.
export default function SensoryRoomsMenu({
  isPremium,
  onSelect,
  onClose,
}: {
  isPremium: boolean;
  onSelect: (id: RoomId) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white max-w-lg w-full rounded-3xl border border-[#E3DFC2] shadow-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#E3DFC2] flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#2C2C2A]">Calming Rooms</h3>
            <p className="text-xs text-[#7E7D76] mt-0.5">A quiet place to rest the senses.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#A6A27B] hover:text-[#2C2C2A] hover:bg-[#F4F1EA] transition-all" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SENSORY_ROOMS.map((room) => {
            const locked = room.premium && !isPremium;
            return (
              <button
                key={room.id}
                disabled={locked}
                onClick={() => { if (!locked) { onSelect(room.id); } }}
                className={`relative text-left rounded-2xl overflow-hidden border transition-all ${
                  locked ? 'border-[#E3DFC2] cursor-not-allowed' : 'border-[#E3DFC2] hover:border-[#3A5D45] active:scale-[0.98]'
                }`}
              >
                {/* preview swatch */}
                <div
                  className="h-24 w-full relative"
                  style={{ background: `linear-gradient(135deg, ${room.preview[0]}, ${room.preview[1]})` }}
                >
                  <span className="absolute top-2 left-3 text-2xl drop-shadow">{room.emoji}</span>
                  {room.premium && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-[#3A5D45]">
                      Premium
                    </span>
                  )}
                  {locked && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-white/90" />
                    </div>
                  )}
                </div>
                <div className="p-3 bg-[#FCFAF5]">
                  <p className="font-bold text-[#2C2C2A] text-sm">{room.label}</p>
                  <p className="text-[11px] text-[#7E7D76] leading-snug mt-0.5">{room.blurb}</p>
                </div>
              </button>
            );
          })}
        </div>

        {!isPremium && (
          <div className="px-5 pb-5">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white text-indigo-500 shadow-xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-indigo-700">Unlock all calming rooms with Yadira Premium</p>
                <p className="text-xs text-indigo-500 leading-snug mt-0.5">
                  Rainy Window, Autumn Leaves, and Forest Canopy — plus Beth's real voice and lasting memory.
                  A caregiver can enable Premium from the Caregiver Hub.
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
