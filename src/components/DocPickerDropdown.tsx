import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { DocPickerPanel } from './DocPicker';
import { cn } from '../lib/utils';
import type { AppDocument } from '../types';

type SelectableCategory = 'main' | 'extra';

interface Props {
  mainDocs: AppDocument[];
  extraDocs: AppDocument[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (category: SelectableCategory, ids: string[], value: boolean) => void;
  onUpload: (files: FileList, category: SelectableCategory) => void;
  onRemove: (id: string) => void;
  loading: boolean;
}

export function DocPickerDropdown(props: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedCount = props.selectedIds.size;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm transition-all hover:border-indigo-300 dark:hover:border-indigo-900 group/drop"
      >
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-1 group-hover/drop:text-indigo-500 transition-colors shrink-0">
            主要文件
          </span>
          <span className="truncate text-slate-700 dark:text-slate-300 text-[10px] font-bold leading-none">
            {selectedCount === 0 ? '選擇…' : `已選擇 ${selectedCount}`}
          </span>
        </div>
        <ChevronDown className={cn('w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-[calc(100%+8px)] z-30 w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-indigo-200/50 dark:border-white/10 dark:bg-[#0e1424] dark:shadow-black/50"
          >
            <DocPickerPanel {...props} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
