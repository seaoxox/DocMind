export type DocType = 'markdown' | 'word' | 'pdf' | 'text' | 'unknown';
export type DocCategory = 'guidance' | 'manual';

export interface AppDocument {
  id: string;
  name: string;
  content: string;
  type: DocType;
  category: DocCategory;
  sizeChars: number;
}

export interface Citation {
  text: string;
  source: string;
}

export interface RetrievedChunk {
  text: string;
  source: string;
  score: number;
}

export interface QuestionRecord {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  timestamp: number;
  retrievedSources: string[];
}

export type AiProvider = 'gemini' | 'openai' | 'anthropic';

export interface ModelOption {
  id: string;
  label: string;
  tier: '快速' | '基礎';
}

export interface ProviderSettings {
  provider: AiProvider;
  apiKey: string;
  model: string;
}

export interface ManualFileEntry {
  filename: string;
  path: string; // relative path under manual_md/, used for fetch
  type: 'markdown' | 'image' | 'other';
}

export interface ManualChapter {
  folder: string;
  title: string;
  files: ManualFileEntry[];
}

export interface Manifest {
  guidanceFiles: string[];
  manual: ManualChapter[];
}

export type ViewMode = 'qa' | 'manual';

