import React from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onAccept?: () => void;
};

const TermsModal: React.FC<Props> = ({ open, onClose, onAccept }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Terms and acknowledgements"
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-[#EFECDD] shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EFECDD]">
          <h2 className="text-2xl font-bold text-[#2C2C2A]">Terms &amp; Acknowledgements</h2>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-[#4E4D47] leading-relaxed">
          <p>
            By using Yadira, you agree to these terms. If you do not agree, do not use the service.
          </p>

          <h3 className="text-lg font-semibold text-[#2C2C2A]">1. Contact</h3>
          <p>
            Questions? Reach us at <b>partnerships@yadira.chat</b>.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-[#EFECDD] flex gap-3">
          {onAccept ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-white border border-[#E3DFC2] text-[#5E5D57] font-bold rounded-xl hover:bg-[#F4F1EA] transition-all"
              >
                Review later
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="flex-1 py-3 bg-[#3A5D45] text-white font-bold rounded-xl hover:bg-[#2B4633] transition-all"
              >
                I accept the updated terms
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-[#3A5D45] text-white font-bold rounded-xl hover:bg-[#2B4633] transition-all"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
