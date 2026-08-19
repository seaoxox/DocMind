import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, KeyRound, Info } from 'lucide-react';
import type { AiProvider, ProviderSettings } from '../types';
import { DEFAULT_MODELS } from '../services/aiService';
import { cn } from '../lib/utils';

interface Props {
  open: boolean;
  settings: ProviderSettings;
  onClose: () => void;
  onSave: (settings: ProviderSettings) => void;
}

const PROVIDERS: { id: AiProvider; label: string; keyHint: string; keyUrl: string }[] = [
  { id: 'gemini', label: 'Google Gemini', keyHint: 'AIza...', keyUrl: 'https://aistudio.google.com/apikey' },
  { id: 'openai', label: 'OpenAI', keyHint: 'sk-...', keyUrl: 'https://platform.openai.com/api-keys' },
  { id: 'anthropic', label: 'Anthropic Claude', keyHint: 'sk-ant-...', keyUrl: 'https://console.anthropic.com/settings/keys' },
];

export function SettingsModal({ open, settings, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<ProviderSettings>(settings);

  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  const handleProviderChange = (provider: AiProvider) => {
    setDraft((d) => ({ ...d, provider, model: '' }));
  };

  const handleSave = () => {
    onSave({ ...draft, model: draft.model.trim() || DEFAULT_MODELS[draft.provider] });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-semibold">AI 供應商設定</h2>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">供應商</label>
                <div className="grid grid-cols-3 gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleProviderChange(p.id)}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-xs font-medium transition',
                        draft.provider === p.id
                          ? 'border-indigo-600 bg-indigo-600/10 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-300'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">API Key</label>
                <input
                  type="password"
                  value={draft.apiKey}
                  onChange={(e) => setDraft((d) => ({ ...d, apiKey: e.target.value }))}
                  placeholder={PROVIDERS.find((p) => p.id === draft.provider)?.keyHint}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <a
                  href={PROVIDERS.find((p) => p.id === draft.provider)?.keyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  <Info size={12} /> 前往取得 API Key
                </a>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  模型名稱（選填，預設 {DEFAULT_MODELS[draft.provider]}）
                </label>
                <input
                  type="text"
                  value={draft.model}
                  onChange={(e) => setDraft((d) => ({ ...d, model: e.target.value }))}
                  placeholder={DEFAULT_MODELS[draft.provider]}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                您的 API Key 僅儲存於瀏覽器本機（localStorage），不會傳送至任何第三方伺服器，僅在您提問時直接呼叫所選供應商的官方
                API。若使用 Anthropic，部分帳戶可能因瀏覽器 CORS 限制而無法直接呼叫，建議優先使用 Gemini 或 OpenAI。
              </p>
            </div>

            <button
              onClick={handleSave}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              儲存設定
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
