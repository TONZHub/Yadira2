// PhotoAlbum — the family's real photobook, full screen.
// ------------------------------------------------------------------
// Yadira often suggests "looking at old photos" — this is the actual
// book she's talking about. Design rules (a dementia patient is the
// primary reader):
//   • One photo at a time, as large as the screen allows.
//   • Big page-turn buttons, big type, warm calm palette.
//   • No destructive actions here — managing the album lives in the
//     Caregiver Hub; this view can only look and talk.
//   • "Tell me about this photo" hands the photo to the companion so
//     the conversation continues naturally from what they're seeing.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X, MessageSquare } from 'lucide-react';
import type { GalleryPhoto } from '../types';

interface PhotoAlbumProps {
  photos: GalleryPhoto[];
  /** The companion's current name — Yadira, or the persona in Vivid mode. */
  companionName: string;
  onClose: () => void;
  /** Ask the companion about the photo currently on the page. */
  onAskAbout: (photo: GalleryPhoto) => void;
}

export const PhotoAlbum: React.FC<PhotoAlbumProps> = ({
  photos,
  companionName,
  onClose,
  onAskAbout,
}) => {
  const [page, setPage] = useState(photos.length ? photos.length - 1 : 0); // open on the newest photo
  const photo = photos[Math.min(page, photos.length - 1)];

  if (!photo) return null;

  const prev = () => setPage((p) => Math.max(0, p - 1));
  const next = () => setPage((p) => Math.min(photos.length - 1, p + 1));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col p-4 sm:p-6"
      style={{
        background:
          'radial-gradient(120% 90% at 50% 30%, #F7EFDD 0%, #EFE6CF 45%, #E4D9BE 100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between max-w-3xl w-full mx-auto">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C2C2A]">
          📷 Our Photo Album
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/80 border-2 border-[#C4C09E] text-[#3A5D45] font-bold hover:bg-white transition-all active:scale-95"
          aria-label="Close the album"
        >
          <X className="w-5 h-5" />
          Close
        </button>
      </div>

      {/* The photo, one page at a time */}
      <div className="flex-1 flex items-center justify-center gap-2 sm:gap-4 max-w-4xl w-full mx-auto min-h-0 py-4">
        <button
          type="button"
          onClick={prev}
          disabled={page === 0}
          className="shrink-0 p-3 sm:p-4 rounded-full bg-white/80 border-2 border-[#C4C09E] text-[#3A5D45] hover:bg-white disabled:opacity-30 transition-all active:scale-95"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-7 h-7 sm:w-9 sm:h-9" />
        </button>

        <div className="flex-1 min-w-0 h-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="bg-white rounded-3xl p-3 sm:p-4 shadow-xl border border-[#E3DFC2] max-h-full flex flex-col"
            >
              <img
                src={photo.dataUrl}
                alt={photo.caption}
                className="rounded-2xl object-contain min-h-0 max-h-[55vh] max-w-full"
              />
              <p className="mt-3 text-base sm:text-lg font-semibold text-[#2C2C2A] text-center leading-snug px-2">
                {photo.caption}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={next}
          disabled={page >= photos.length - 1}
          className="shrink-0 p-3 sm:p-4 rounded-full bg-white/80 border-2 border-[#C4C09E] text-[#3A5D45] hover:bg-white disabled:opacity-30 transition-all active:scale-95"
          aria-label="Next photo"
        >
          <ChevronRight className="w-7 h-7 sm:w-9 sm:h-9" />
        </button>
      </div>

      {/* Footer: page indicator + talk about it */}
      <div className="flex flex-col items-center gap-3 max-w-3xl w-full mx-auto pb-2">
        <p className="text-sm font-bold text-[#7E7D76] tracking-wide">
          Photo {page + 1} of {photos.length}
        </p>
        <button
          type="button"
          onClick={() => onAskAbout(photo)}
          className="inline-flex items-center gap-2.5 rounded-full px-7 py-4 text-lg font-extrabold text-white bg-[#3A5D45] hover:bg-[#2B4633] shadow-lg transition-all active:scale-95"
        >
          <MessageSquare className="w-5 h-5" />
          Tell me about this photo, {companionName}
        </button>
      </div>
    </motion.div>
  );
};

export default PhotoAlbum;
