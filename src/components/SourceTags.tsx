import { FileCheck2 } from 'lucide-react';

interface Props {
  sources: string[];
  max?: number;
}

export function SourceTags({ sources, max = 3 }: Props) {
  if (sources.length === 0) return null;
  const shown = sources.slice(0, max);
  const hiddenCount = sources.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
      <FileCheck2 className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
      {shown.map((s) => (
        <span
          key={s}
          className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full truncate max-w-[140px] shrink-0"
          title={s}
        >
          {s}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span
          className="text-[9px] font-bold text-slate-400 dark:text-slate-500 shrink-0"
          title={sources.slice(max).join('、')}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}
