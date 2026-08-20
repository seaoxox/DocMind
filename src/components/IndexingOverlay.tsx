import { motion, AnimatePresence } from 'motion/react';
import { Database } from 'lucide-react';
import type { IndexStatus } from '../services/ragPipeline';

interface Props {
  status: IndexStatus;
}

export function IndexingOverlay({ status }: Props) {
  const visible = status.phase === 'embedding';
  const pct = status.phase === 'embedding' && status.total > 0 ? Math.round((status.done / status.total) * 100) : 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-md"
        >
          <div className="max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 dark:shadow-none animate-pulse">
              <Database className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">正在建立向量索引</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 leading-relaxed">
              首次使用需在瀏覽器本機下載嵌入模型並將指引文件轉換為向量，僅需執行一次，之後即可快速搜尋。
            </p>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-indigo-600 dark:bg-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pct}%</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
