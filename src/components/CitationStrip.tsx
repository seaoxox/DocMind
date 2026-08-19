import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Quote, X } from 'lucide-react';
import type { Citation } from '../types';

interface StripProps {
  citations: Citation[];
  hasRecord: boolean;
  onSelect: (citation: Citation) => void;
  variant?: 'strip' | 'carousel';
}

export function CitationStrip({ citations, hasRecord, onSelect, variant = 'strip' }: StripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  if (!hasRecord) {
    return (
      <div className="flex items-center justify-center w-full text-slate-300 dark:text-slate-700 text-xs font-bold uppercase tracking-widest py-10 italic">
        Select a record to see citations
      </div>
    );
  }

  if (variant === 'carousel') {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
        {citations.map((citation, idx) => (
          <div
            key={idx}
            onClick={() => onSelect(citation)}
            className="min-w-[280px] snap-center bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-3 active:bg-indigo-50 dark:active:bg-indigo-900/20 h-48 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold text-indigo-500 bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                REF-{idx + 1}
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[150px]">
                {citation.source}
              </span>
            </div>
            <div className="pl-3 border-l-2 border-indigo-200 dark:border-indigo-900 overflow-y-auto flex-1 custom-scrollbar">
              <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">「{citation.text}」</p>
            </div>
            <div className="text-[9px] text-indigo-300 dark:text-indigo-400 font-bold uppercase text-right">Tap to expand</div>
          </div>
        ))}
        {citations.length === 0 && (
          <div className="flex items-center justify-center w-full text-slate-300 dark:text-slate-700 text-xs font-bold uppercase tracking-widest py-10 italic">
            此回答未提供可對應的引用出處
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={scrollRef} onWheel={handleWheel} className="flex gap-3 min-w-max overflow-x-auto overflow-y-hidden custom-scrollbar pb-1">
      {citations.map((citation, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => onSelect(citation)}
          className="w-72 h-32 bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col justify-between group hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all cursor-pointer active:scale-95 shrink-0 overflow-hidden"
        >
          <div className="mb-1">
            <div className="text-[8px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1 tracking-widest flex items-center gap-1">
              <Quote className="w-2 h-2 text-indigo-400 dark:text-indigo-500" />
              REF-{idx + 1}
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-snug italic line-clamp-3 font-medium px-2 border-l border-indigo-100 dark:border-indigo-900/50">
              「{citation.text}」
            </p>
          </div>
          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-50 dark:border-slate-700/50 mt-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[7px] font-mono font-bold bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 px-1 py-0.5 rounded">
                SRC
              </span>
              <span className="text-[8px] font-bold text-indigo-600 dark:text-indigo-400 line-clamp-1">{citation.source}</span>
            </div>
          </div>
        </motion.div>
      ))}
      {citations.length === 0 && (
        <div className="flex items-center justify-center w-full text-slate-300 dark:text-slate-700 text-xs font-bold uppercase tracking-widest py-10 italic">
          此回答未提供可對應的引用出處
        </div>
      )}
    </div>
  );
}

interface ModalProps {
  citation: Citation | null;
  onClose: () => void;
}

export function CitationModal({ citation, onClose }: ModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!citation) return;
    await navigator.clipboard.writeText(citation.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <AnimatePresence>
      {citation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center lg:p-8"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md" />

          {/* Desktop: centered card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="hidden lg:block relative bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-black/50 max-w-2xl w-full p-12 z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-2 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600 dark:bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
                  <Quote className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">完整引用內容</h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Document Segment Review
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-lg leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar italic whitespace-pre-wrap">
                「{citation.text}」
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-1">
                    來源 Source
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{citation.source}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopy}
                    className="px-6 py-4 rounded-2xl font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 transition-colors"
                  >
                    {copied ? '已複製' : '複製原文'}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-10 py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold shadow-2xl dark:shadow-none hover:bg-black dark:hover:bg-white transition-colors"
                  >
                    關閉視窗
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Mobile: bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            onClick={(e) => e.stopPropagation()}
            className="lg:hidden relative w-full bg-white dark:bg-slate-900 rounded-t-[32px] p-8 max-h-[80vh] flex flex-col shadow-2xl z-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-slate-800 dark:text-slate-100">完整引用內容</h4>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-600 dark:text-slate-300 italic text-sm border border-slate-100 dark:border-slate-700 whitespace-pre-wrap">
              「{citation.text}」
            </div>
            <div className="mt-6 flex justify-between items-center text-[11px] font-bold uppercase text-slate-400 dark:text-slate-600">
              <span>Source: {citation.source}</span>
            </div>
            <button
              onClick={onClose}
              className="w-full py-4 mt-8 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold"
            >
              關閉視窗
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
