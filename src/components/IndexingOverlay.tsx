import { motion, AnimatePresence } from 'motion/react';
import { Database, FileText } from 'lucide-react';
import type { IndexStatus } from '../services/ragPipeline';

interface Props {
  status: IndexStatus;
  isRebuild?: boolean;
}

export function IndexingOverlay({ status, isRebuild = false }: Props) {
  const visible = status.phase === 'embedding';
  const pct = status.phase === 'embedding' && status.total > 0 ? Math.round((status.done / status.total) * 100) : 0;
  const currentSource = status.phase === 'embedding' ? status.currentSource : undefined;
  const done = status.phase === 'embedding' ? status.done : 0;
  const total = status.phase === 'embedding' ? status.total : 0;

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
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
              {isRebuild ? '正在重新建立向量索引' : '正在建立向量索引'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 leading-relaxed">
              {isRebuild
                ? '正在清除舊索引並重新切割、嵌入所有指引文件。'
                : '首次使用需在瀏覽器本機下載嵌入模型並將指引文件轉換為向量，僅需執行一次，之後即可快速搜尋。'}
            </p>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-indigo-600 dark:bg-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {done.toLocaleString()} / {total.toLocaleString()} 段落
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pct}%</p>
            </div>
            {currentSource && (
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-xl py-2 px-3">
                <FileText className="w-3 h-3 shrink-0 text-indigo-400" />
                <span className="truncate">處理中：{currentSource}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
