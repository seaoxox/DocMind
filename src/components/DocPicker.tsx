import { useRef } from 'react';
import { FileText, FileType, Upload, Trash2, CheckSquare, Square } from 'lucide-react';
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

function docIcon(type: AppDocument['type']) {
  switch (type) {
    case 'word':
      return <FileType size={14} className="text-blue-400 shrink-0" />;
    case 'pdf':
      return <FileText size={14} className="text-rose-400 shrink-0" />;
    default:
      return <FileText size={14} className="text-slate-400 shrink-0" />;
  }
}

function Group({
  title,
  category,
  docs,
  selectedIds,
  onToggle,
  onToggleAll,
  onUpload,
  onRemove,
  loading,
}: {
  title: string;
  category: SelectableCategory;
  docs: AppDocument[];
} & Omit<Props, 'mainDocs' | 'extraDocs'>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedCount = docs.filter((d) => selectedIds.has(d.id)).length;
  const allSelected = docs.length > 0 && selectedCount === docs.length;

  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {title} {selectedCount > 0 && <span className="text-indigo-500 dark:text-indigo-400">({selectedCount})</span>}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleAll(category, docs.map((d) => d.id), !allSelected)}
            disabled={docs.length === 0}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-500 disabled:opacity-30 dark:text-slate-500 dark:hover:text-indigo-400"
          >
            {allSelected ? <CheckSquare size={11} /> : <Square size={11} />}
            全選
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400"
          >
            <Upload size={11} /> 上傳
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".docx,.doc,.pdf,.md,.markdown,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) onUpload(e.target.files, category);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {loading && <p className="py-1 text-xs text-slate-400">解析文件中…</p>}
      {docs.length === 0 && !loading && <p className="py-1 text-xs text-slate-500">尚無文件</p>}

      <ul className="space-y-0.5">
        {docs.map((doc) => (
          <li
            key={doc.id}
            className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100/70 dark:hover:bg-white/5"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(doc.id)}
              onChange={() => onToggle(doc.id)}
              className="h-3.5 w-3.5 shrink-0 rounded accent-indigo-600"
            />
            {docIcon(doc.type)}
            <span className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300" title={doc.name}>
              {doc.name}
            </span>
            {!doc.builtIn && (
              <button
                onClick={() => onRemove(doc.id)}
                className="hidden text-slate-400 hover:text-rose-500 group-hover:block"
                title="移除"
              >
                <Trash2 size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocPickerPanel(props: Props) {
  return (
    <div className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto dark:divide-white/[0.06]">
      <Group title="主要文件" category="main" docs={props.mainDocs} {...props} />
      <Group title="額外文件" category="extra" docs={props.extraDocs} {...props} />
    </div>
  );
}
