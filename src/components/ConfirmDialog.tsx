import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  secondMessage: string;
  confirmLabel?: string;
}

/**
 * Requires the user to confirm twice before the action fires. The confirm/cancel
 * button positions are swapped on the second step, so a habitual "click the same
 * spot twice" reflex cannot accidentally trigger the action.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, secondMessage, confirmLabel = '確定執行' }: Props) {
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (open) setStep(1);
  }, [open]);

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleConfirmStep1 = () => setStep(2);

  const handleConfirmStep2 = () => {
    setStep(1);
    onConfirm();
    onClose();
  };

  const cancelBtn = (
    <button
      onClick={handleClose}
      className="flex-1 py-3 rounded-xl font-bold text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
    >
      取消
    </button>
  );

  const confirmBtn = (
    <button
      onClick={step === 1 ? handleConfirmStep1 : handleConfirmStep2}
      className="flex-1 py-3 rounded-xl font-bold text-sm bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5"
    >
      {step === 1 ? '繼續' : (
        <>
          <RotateCw className="w-3.5 h-3.5" /> {confirmLabel}
        </>
      )}
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div
            key={step}
            initial={{ scale: 0.94, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-5">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
              {title} {step === 2 && <span className="text-rose-500">（再次確認）</span>}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
              {step === 1 ? message : secondMessage}
            </p>

            {/* Buttons swap left/right position between step 1 and step 2 */}
            <div className="flex gap-3">
              {step === 1 ? (
                <>
                  {cancelBtn}
                  {confirmBtn}
                </>
              ) : (
                <>
                  {confirmBtn}
                  {cancelBtn}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
