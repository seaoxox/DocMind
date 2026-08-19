import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, BookOpen, History as HistoryIcon, X, CheckCircle2, Quote } from 'lucide-react';

import type { AppDocument, ManualChapter, ProviderSettings, QuestionRecord, ViewMode, Citation } from './types';
import { cn, taipeiDateString, uid } from './lib/utils';
import { parseFile, parseFromUrl } from './services/docParser';
import { askQuestion } from './services/aiService';
import { loadManifest } from './services/manifest';
import {
  loadSettings,
  saveSettings,
  loadHistory,
  saveHistory,
  loadTheme,
  saveTheme,
  getDisclaimerAcceptedDate,
  setDisclaimerAcceptedDate,
} from './services/storage';

import { Disclaimer } from './components/Disclaimer';
import { SettingsModal } from './components/SettingsModal';
import { SidebarDrawer } from './components/SidebarDrawer';
import { DocPickerDropdown } from './components/DocPickerDropdown';
import { HistoryPanel, HistoryItem } from './components/HistoryPanel';
import { AnswerSection } from './components/AnswerSection';
import { CitationStrip, CitationModal } from './components/CitationStrip';
import { AskInput } from './components/AskInput';
import { ManualBrowser } from './components/ManualBrowser';

const BASE = import.meta.env.BASE_URL;

export default function App() {
  // ---- Theme ----
  const [theme, setTheme] = useState<'light' | 'dark'>(loadTheme());
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    saveTheme(theme);
  }, [theme]);

  // ---- Disclaimer ----
  const [disclaimerOpen, setDisclaimerOpen] = useState(() => getDisclaimerAcceptedDate() !== taipeiDateString());
  const acceptDisclaimer = () => {
    setDisclaimerAcceptedDate(taipeiDateString());
    setDisclaimerOpen(false);
  };

  // ---- Settings ----
  const [settings, setSettings] = useState<ProviderSettings>(loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const handleSaveSettings = (s: ProviderSettings) => {
    setSettings(s);
    saveSettings(s);
  };

  // ---- View mode / navigation ----
  const [viewMode, setViewMode] = useState<ViewMode>('qa');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ---- Documents ----
  const [mainDocs, setMainDocs] = useState<AppDocument[]>([]);
  const [extraDocs, setExtraDocs] = useState<AppDocument[]>([]);
  const [manualDocs, setManualDocs] = useState<AppDocument[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [docsLoading, setDocsLoading] = useState(true);
  const [manualChapters, setManualChapters] = useState<ManualChapter[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDocsLoading(true);
      try {
        const manifest = await loadManifest();

        const mainResults = await Promise.allSettled(
          manifest.instructionFiles.map((name) => parseFromUrl(`${BASE}instruction_files/${name}`, name, 'main'))
        );
        const extraResults = await Promise.allSettled(
          manifest.subInstructionFiles.map((name) =>
            parseFromUrl(`${BASE}sub_instruction_files/${name}`, name, 'extra')
          )
        );

        // Manual chapter files are auto-included in every question's context,
        // regardless of user selection (matches original behaviour).
        const manualFileJobs: Promise<AppDocument>[] = [];
        for (const chapter of manifest.manual) {
          for (const file of chapter.files) {
            if (file.type === 'image') continue;
            manualFileJobs.push(parseFromUrl(`${BASE}${file.path}`, file.filename, 'manual'));
          }
        }
        const manualResults = await Promise.allSettled(manualFileJobs);

        if (cancelled) return;
        setMainDocs(
          mainResults.filter((r): r is PromiseFulfilledResult<AppDocument> => r.status === 'fulfilled').map((r) => r.value)
        );
        setExtraDocs(
          extraResults.filter((r): r is PromiseFulfilledResult<AppDocument> => r.status === 'fulfilled').map((r) => r.value)
        );
        setManualDocs(
          manualResults.filter((r): r is PromiseFulfilledResult<AppDocument> => r.status === 'fulfilled').map((r) => r.value)
        );
        setManualChapters(manifest.manual);
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (_category: 'main' | 'extra', ids: string[], value: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (value ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  const handleUpload = async (files: FileList, category: 'main' | 'extra') => {
    setDocsLoading(true);
    try {
      const parsed = await Promise.all(Array.from(files).map((f) => parseFile(f, category)));
      if (category === 'main') setMainDocs((prev) => [...prev, ...parsed]);
      else setExtraDocs((prev) => [...prev, ...parsed]);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        parsed.forEach((d) => next.add(d.id));
        return next;
      });
    } catch (err) {
      console.error(err);
      alert('文件解析失敗，請確認檔案格式是否為 Word/PDF/Markdown/純文字。');
    } finally {
      setDocsLoading(false);
    }
  };

  const handleRemove = (id: string) => {
    setMainDocs((prev) => prev.filter((d) => d.id !== id));
    setExtraDocs((prev) => prev.filter((d) => d.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const allSelectableDocs = useMemo(() => [...mainDocs, ...extraDocs], [mainDocs, extraDocs]);
  const selectedDocs = useMemo(() => allSelectableDocs.filter((d) => selectedIds.has(d.id)), [allSelectableDocs, selectedIds]);
  // Manual docs are always included, on top of whatever the user explicitly selected.
  const contextDocs = useMemo(() => [...selectedDocs, ...manualDocs], [selectedDocs, manualDocs]);

  const docPickerProps = {
    mainDocs,
    extraDocs,
    selectedIds,
    onToggle: toggleSelect,
    onToggleAll: toggleAll,
    onUpload: handleUpload,
    onRemove: handleRemove,
    loading: docsLoading,
  };

  // ---- Mobile overlays ----
  const [mobileDocsOpen, setMobileDocsOpen] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  // ---- History / Q&A ----
  const [history, setHistory] = useState<QuestionRecord[]>(loadHistory());
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  useEffect(() => saveHistory(history), [history]);

  const currentRecord = history.find((r) => r.id === currentRecordId) ?? null;

  const handleAsk = async () => {
    if (!question.trim() || asking) return;
    if (contextDocs.length === 0) {
      setAskError('請先勾選至少一份文件再提問。');
      return;
    }
    setAskError(null);
    setAsking(true);
    const q = question;
    try {
      const result = await askQuestion(settings, q, contextDocs);
      const record: QuestionRecord = {
        id: uid('qr'),
        question: q,
        answer: result.answer,
        citations: result.citations,
        timestamp: Date.now(),
        docIds: contextDocs.map((d) => d.id),
        docNames: contextDocs.map((d) => d.name),
      };
      setHistory((prev) => [record, ...prev]);
      setCurrentRecordId(record.id);
      setQuestion('');
      setMobileHistoryOpen(false);
    } catch (err) {
      setAskError(err instanceof Error ? err.message : '提問時發生未知錯誤。');
    } finally {
      setAsking(false);
    }
  };

  const handleSelectHistory = (record: QuestionRecord) => {
    setCurrentRecordId(record.id);
    setAskError(null);
  };

  // ---- Mobile overlays ----
  const totalSelected = selectedDocs.length;

  return (
    <div className={cn('flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden', theme === 'dark' && 'dark')}>
      <Disclaimer open={disclaimerOpen} onAccept={acceptDisclaimer} />
      <SettingsModal open={settingsOpen} settings={settings} onClose={() => setSettingsOpen(false)} onSave={handleSaveSettings} />
      <SidebarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={viewMode}
        onChangeMode={setViewMode}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Floating control bar (top-left) */}
      <div className="fixed top-4 left-4 lg:top-6 lg:left-6 z-[110] flex items-center gap-2 lg:gap-3 max-w-[420px]">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 lg:p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl lg:rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95 transition-all text-slate-800 dark:text-white flex items-center gap-2 lg:gap-3 font-bold text-xs lg:text-sm pr-3 lg:pr-5 group shrink-0"
        >
          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-indigo-600 rounded-lg lg:rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none group-hover:rotate-12 transition-transform">
            <Menu className="w-3 h-3 lg:w-4 lg:h-4" />
          </div>
          <div className="flex flex-col items-start text-left">
            <span className="tracking-tight text-[10px] lg:text-xs">功能選單</span>
            <span className="text-[7px] lg:text-[8px] text-indigo-500 uppercase font-black tracking-widest leading-none mt-0.5">
              {viewMode === 'qa' ? '指引問答' : '指引文件'}
            </span>
          </div>
        </button>

        <AnimatePresence>
          {viewMode === 'qa' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="hidden lg:flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-md"
            >
              <div className="flex items-center gap-1.5 min-w-[180px]">
                <DocPickerDropdown {...docPickerProps} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex w-full h-full overflow-hidden relative">
        {viewMode === 'qa' ? (
          <>
            {/* DESKTOP QA LAYOUT */}
            <div className="hidden lg:flex w-full h-full">
              <aside className="w-[380px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm pt-24">
                <div className="flex-1 flex flex-col min-h-0 relative">
                  <div className="p-6 flex-1 flex flex-col min-h-0">
                    <HistoryPanel history={history} activeId={currentRecordId} onSelect={handleSelectHistory} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/50">
                    <AskInput
                      value={question}
                      onChange={setQuestion}
                      onSubmit={handleAsk}
                      loading={asking}
                      error={askError}
                      onRetry={handleAsk}
                      variant="desktop"
                    />
                  </div>
                </div>
              </aside>

              <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 relative h-full">
                <section className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                  <div className="max-w-3xl mx-auto min-h-full">
                    <AnswerSection record={currentRecord} loading={asking} error={null} />
                  </div>
                </section>

                <section className="h-[210px] border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 lg:p-5 flex flex-col overflow-hidden shrink-0">
                  <div className="flex items-center justify-between mb-2 max-w-5xl mx-auto w-full px-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                      <Quote className="w-2.5 h-2.5" />
                      對應出處 / Source References
                    </h3>
                    {currentRecord && (
                      <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase">
                        {currentRecord.citations.length} Citations
                      </span>
                    )}
                  </div>
                  <div className="max-w-5xl mx-auto w-full flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar pb-1">
                    <CitationStrip
                      citations={currentRecord?.citations ?? []}
                      hasRecord={!!currentRecord}
                      onSelect={setSelectedCitation}
                    />
                  </div>
                </section>

                <CitationModal citation={selectedCitation} onClose={() => setSelectedCitation(null)} />
              </main>
            </div>

            {/* MOBILE QA LAYOUT */}
            <div className="flex lg:hidden flex-col w-full h-full bg-white dark:bg-slate-900 relative">
              <header className="flex items-center justify-between p-4 pl-32 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
                <button
                  onClick={() => setMobileDocsOpen(true)}
                  className="flex items-center gap-2 py-2.5 px-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-2xl text-[11px] font-bold"
                >
                  <BookOpen className="w-4 h-4" />
                  選擇文件 {totalSelected > 0 && `(${totalSelected})`}
                </button>
                <button
                  onClick={() => setMobileHistoryOpen(true)}
                  className="flex items-center gap-2 py-2.5 px-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[11px] font-bold border border-slate-200 dark:border-slate-700"
                >
                  <HistoryIcon className="w-4 h-4" />
                  詢問紀錄
                </button>
              </header>

              <main className="flex-1 overflow-y-auto p-5 space-y-6 relative custom-scrollbar pb-32">
                <AnswerSection record={currentRecord} loading={asking} error={askError} compact />

                {currentRecord && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] px-1">
                      對應出處
                    </h3>
                    <CitationStrip
                      citations={currentRecord.citations}
                      hasRecord
                      onSelect={setSelectedCitation}
                      variant="carousel"
                    />
                  </div>
                )}

                <CitationModal citation={selectedCitation} onClose={() => setSelectedCitation(null)} />
              </main>

              <footer className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md absolute bottom-0 left-0 right-0 z-20">
                <AskInput value={question} onChange={setQuestion} onSubmit={handleAsk} loading={asking} variant="mobile" />
              </footer>

              {/* Mobile Overlays */}
              <AnimatePresence>
                {mobileDocsOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm p-4 flex flex-col justify-end"
                  >
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      className="bg-white dark:bg-slate-900 rounded-t-[32px] p-6 max-h-[85vh] flex flex-col shadow-2xl"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">指引文件管理</h2>
                        <button
                          onClick={() => setMobileDocsOpen(false)}
                          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-6 pb-6 custom-scrollbar">
                        <DocGroup
                          title="主要指引文件"
                          category="main"
                          docs={mainDocs}
                          selectedIds={selectedIds}
                          onToggle={toggleSelect}
                          onToggleAll={(ids, value) => toggleAll('main', ids, value)}
                          onUpload={handleUpload}
                        />
                        <DocGroup
                          title="額外指引文件"
                          category="extra"
                          docs={extraDocs}
                          selectedIds={selectedIds}
                          onToggle={toggleSelect}
                          onToggleAll={(ids, value) => toggleAll('extra', ids, value)}
                          onUpload={handleUpload}
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {mobileHistoryOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm p-4 flex flex-col justify-end"
                  >
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      className="bg-white dark:bg-slate-900 rounded-t-[32px] p-6 max-h-[70vh] flex flex-col shadow-2xl"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">最後 10 筆詢問記錄</h2>
                        <button
                          onClick={() => setMobileHistoryOpen(false)}
                          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3 pb-6 custom-scrollbar">
                        {history.slice(0, 10).map((record) => (
                          <HistoryItem
                            key={record.id}
                            record={record}
                            active={currentRecordId === record.id}
                            onClick={() => {
                              handleSelectHistory(record);
                              setMobileHistoryOpen(false);
                            }}
                          />
                        ))}
                        {history.length === 0 && (
                          <div className="p-10 text-center text-slate-400 italic">尚無詢問記錄</div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <ManualBrowser chapters={manualChapters} basePath={BASE} />
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}

function DocGroup({
  title,
  category,
  docs,
  selectedIds,
  onToggle,
  onToggleAll,
  onUpload,
}: {
  title: string;
  category: 'main' | 'extra';
  docs: AppDocument[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[], value: boolean) => void;
  onUpload: (files: FileList, category: 'main' | 'extra') => void;
}) {
  const allIds = docs.map((d) => d.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const inputId = `upload-${category}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</div>
        <div className="flex items-center gap-3">
          <label htmlFor={inputId} className="text-[10px] font-black text-slate-400 hover:text-indigo-500 uppercase cursor-pointer">
            上傳
          </label>
          <input
            id={inputId}
            type="file"
            multiple
            accept=".docx,.doc,.pdf,.md,.markdown,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) onUpload(e.target.files, category);
              e.target.value = '';
            }}
          />
          <button onClick={() => onToggleAll(allIds, !allSelected)} className="text-[10px] font-black text-indigo-500 uppercase">
            {allSelected ? '取消全選' : '全選'}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {docs.map((doc) => (
          <button
            key={doc.id}
            onClick={() => onToggle(doc.id)}
            className={cn(
              'w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all',
              selectedIds.has(doc.id)
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-400'
                : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            )}
          >
            <span className="text-sm font-bold truncate pr-4">{doc.name}</span>
            {selectedIds.has(doc.id) && <CheckCircle2 className="w-5 h-5" />}
          </button>
        ))}
        {docs.length === 0 && <div className="p-4 text-center text-[10px] text-slate-400 italic font-medium uppercase tracking-widest">No files</div>}
      </div>
    </div>
  );
}
