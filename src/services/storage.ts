import type { ProviderSettings, QuestionRecord, RagSettings } from '../types';
import { DEFAULT_MODELS } from './models';
import { TOP_K } from './ragPipeline';

const KEYS = {
  settings: 'docmind.settings',
  rag: 'docmind.rag',
  history: 'docmind.history',
  theme: 'docmind.theme',
  disclaimer: 'disclaimerAcceptedDate',
};

export function loadSettings(): ProviderSettings {
  try {
    const raw = localStorage.getItem(KEYS.settings);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { provider: 'gemini', apiKey: '', model: DEFAULT_MODELS.gemini };
}

export function saveSettings(settings: ProviderSettings) {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}

export const RAG_TOP_K_BOUNDS = { min: 4, max: 32 } as const;
const MIN_TOP_K = RAG_TOP_K_BOUNDS.min;
const MAX_TOP_K = RAG_TOP_K_BOUNDS.max;

export function loadRagSettings(): RagSettings {
  try {
    const raw = localStorage.getItem(KEYS.rag);
    if (raw) {
      const parsed = JSON.parse(raw);
      const topK = Number(parsed?.topK);
      if (Number.isFinite(topK)) {
        return { topK: Math.min(MAX_TOP_K, Math.max(MIN_TOP_K, Math.round(topK))) };
      }
    }
  } catch {
    /* ignore */
  }
  return { topK: TOP_K };
}

export function saveRagSettings(settings: RagSettings) {
  localStorage.setItem(KEYS.rag, JSON.stringify(settings));
}

export function loadHistory(): QuestionRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.history);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

export function saveHistory(history: QuestionRecord[]) {
  try {
    localStorage.setItem(KEYS.history, JSON.stringify(history));
  } catch {
    // localStorage quota exceeded; drop oldest half and retry once
    const trimmed = history.slice(0, Math.floor(history.length / 2));
    try {
      localStorage.setItem(KEYS.history, JSON.stringify(trimmed));
    } catch {
      /* give up silently */
    }
  }
}

export function loadTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(KEYS.theme);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function saveTheme(theme: 'light' | 'dark') {
  localStorage.setItem(KEYS.theme, theme);
}

export function getDisclaimerAcceptedDate(): string | null {
  return localStorage.getItem(KEYS.disclaimer);
}

export function setDisclaimerAcceptedDate(dateStr: string) {
  localStorage.setItem(KEYS.disclaimer, dateStr);
}
