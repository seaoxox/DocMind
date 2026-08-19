import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Folder, FileText, RefreshCw, BookOpen, LayoutDashboard, X, ArrowLeft } from 'lucide-react';
import type { ManualChapter, ManualFileEntry } from '../types';
import { cn } from '../lib/utils';
import { parseFromUrl } from '../services/docParser';

interface Props {
  chapters: ManualChapter[];
  basePath: string;
}

function extLabel(filename: string) {
  const ext = filename.split('.').pop()?.toUpperCase() ?? 'FILE';
  return ext;
}

function fileTypeLabel(file: ManualFileEntry) {
  if (file.type === 'markdown') return 'MARKDOWN';
  if (file.filename.toLowerCase().endsWith('.pdf')) return 'PDF';
  if (file.filename.toLowerCase().endsWith('.docx')) return 'WORD';
  return 'FILE';
}

export function ManualBrowser({ chapters, basePath }: Props) {
  const [activeFolder, setActiveFolder] = useState<ManualChapter | null>(chapters[0] ?? null);
  const [activeFile, setActiveFile] = useState<ManualFileEntry | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [contentLoading, setContentLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setActiveFolder(chapters[0] ?? null);
  }, [chapters]);

  const openFile = async (file: ManualFileEntry) => {
    if (!activeFolder) return;
    setActiveFile(file);
    setContentLoading(true);
    try {
      if (file.type === 'markdown') {
        const res = await fetch(`${basePath}${file.path}`);
        let text = await res.text();
        text = text.replace(
          /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
          (_m, alt, src) => `![${alt}](${basePath}manual_md/${activeFolder.folder}/${src})`
        );
        setFileContent(text);
      } else if (file.type === 'image') {
        setFileContent('');
      } else {
        const doc = await parseFromUrl(`${basePath}${file.path}`, file.filename, 'manual');
        setFileContent(doc.content);
      }
    } catch {
      setFileContent('（載入檔案內容失敗）');
    } finally {
      setContentLoading(false);
    }
  };

  const closeFile = () => {
    setActiveFile(null);
    setFileContent('');
  };

  useEffect(() => {
    closeFile();
  }, [activeFolder]);

  const folderList = useMemo(() => chapters, [chapters]);

  const FolderNav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="space-y-3">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-4">主要來源 / SYSTEM</div>
      {folderList.map((folder) => (
        <div key={folder.folder} className="space-y-1">
          <button
            onClick={() => {
              setActiveFolder(folder);
              onNavigate?.();
            }}
            className={cn(
              'w-full flex items-center justify-between group p-4 rounded-2xl transition-all cursor-pointer text-left',
              activeFolder?.folder === folder.folder
                ? 'bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/40'
            )}
          >
            <div className="flex items-center gap-4 overflow-hidden">
              <Folder
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  activeFolder?.folder === folder.folder ? 'text-indigo-500' : 'text-slate-300'
                )}
              />
              <span className="text-sm font-bold uppercase tracking-tight truncate">{folder.title}</span>
            </div>
            {activeFolder?.folder === folder.folder && (
              <motion.div layoutId="activeFolder" className="w-1 h-3 bg-indigo-500 rounded-full" />
            )}
          </button>
        </div>
      ))}
      {folderList.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-indigo-500 shadow-xl mb-4">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Repository...</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-white dark:bg-slate-900 h-full overflow-hidden relative">
      {/* Mobile: floating folder-menu trigger */}
      <div className="lg:hidden fixed top-4 right-4 z-[110]">
        <button
          onClick={() => setIsMenuOpen((o) => !o)}
          className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 active:scale-95 transition-all"
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[120]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute top-0 right-0 bottom-0 w-[300px] bg-slate-50 dark:bg-slate-950 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col p-6 overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">資料夾選單</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <FolderNav onNavigate={() => setIsMenuOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop: folder sidebar */}
      <aside className="hidden lg:flex w-[350px] bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex-col pt-8 pb-8 px-8 overflow-y-auto custom-scrollbar">
        <div className="mb-10 text-left">
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tighter">指引文件</h2>
          <div className="flex items-center gap-3">
            <div className="h-[2px] w-8 bg-indigo-500 rounded-full" />
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Reference Explorer</p>
          </div>
        </div>
        <FolderNav />
      </aside>

      <main className="flex-1 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar p-6 pt-6 lg:p-24 lg:pt-16">
        <div className="max-w-4xl mx-auto">
          {activeFile ? (
            <div className="space-y-8">
              <button
                onClick={closeFile}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-500 uppercase tracking-widest transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> 返回檔案列表
              </button>
              <div className="flex items-end justify-between border-b-4 border-slate-900 dark:border-white pb-6">
                <div>
                  <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mb-2">
                    File / {fileTypeLabel(activeFile)}
                  </div>
                  <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter break-all">
                    {activeFile.filename}
                  </h2>
                </div>
              </div>

              {contentLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-10">
                  <RefreshCw className="w-4 h-4 animate-spin" /> 載入內容中…
                </div>
              ) : activeFile.type === 'image' ? (
                <img
                  src={`${basePath}${activeFile.path}`}
                  alt={activeFile.filename}
                  className="max-w-full rounded-2xl border border-slate-100 dark:border-slate-800"
                />
              ) : activeFile.type === 'markdown' ? (
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{fileContent}</ReactMarkdown>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {fileContent}
                </div>
              )}
            </div>
          ) : activeFolder ? (
            <div className="space-y-12">
              <div className="flex items-end justify-between border-b-4 border-slate-900 dark:border-white pb-6">
                <div>
                  <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em] mb-2">
                    Folder / SYSTEM
                  </div>
                  <h2 className="text-5xl font-black text-slate-800 dark:text-white tracking-tighter">{activeFolder.title}</h2>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-slate-300 dark:text-slate-700">{activeFolder.files.length}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Files</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeFolder.files.map((file) => {
                  const type = fileTypeLabel(file);
                  return (
                    <button
                      key={file.filename}
                      onClick={() => openFile(file)}
                      className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 group transition-all flex items-center gap-4 text-left hover:border-indigo-200 dark:hover:border-indigo-900"
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-[8px] tracking-tighter leading-none shrink-0',
                          type === 'PDF'
                            ? 'bg-red-50 text-red-600 dark:bg-red-900/30'
                            : type === 'WORD'
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30'
                              : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30'
                        )}
                      >
                        <FileText className="w-5 h-5 mb-1" />
                        {extLabel(file.filename)}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate uppercase tracking-tight">
                          {file.filename}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{type}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {activeFolder.files.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                  <div className="text-slate-300 dark:text-slate-700 mb-4">
                    <Folder className="w-16 h-16 mx-auto opacity-20" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">此資料夾尚無檔案</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-40 opacity-20">
              <BookOpen className="w-20 h-20 mb-8" />
              <p className="text-xs font-black uppercase tracking-[0.5em]">Select a folder to browse files</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
