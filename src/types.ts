export type DocType = 'markdown' | 'word' | 'pdf' | 'text' | 'unknown';
export type DocCategory = 'main' | 'extra' | 'manual';

export interface AppDocument {
  id: string;
  name: string;
  content: string;
  type: DocType;
  category: DocCategory;
  /** true if this came from the bundled public/ manifest, false if user-uploaded */
  builtIn: boolean;
  sizeChars: number;
}

export interface Citation {
  text: string;
  source: string;
}

export interface QuestionRecord {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  timestamp: number;
  docIds: string[];
  docNames: string[];
}

export type AiProvider = 'gemini' | 'openai' | 'anthropic';

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
  instructionFiles: string[];
  subInstructionFiles: string[];
  manual: ManualChapter[];
}

export type ViewMode = 'qa' | 'manual';
export type AnswerTab = 'answer' | 'citations';
