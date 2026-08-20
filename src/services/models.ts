import type { AiProvider, ModelOption } from '../types';

/**
 * Curated fast + base tier models per provider, current as of Aug 2026.
 * "快速" = cheapest/fastest tier suitable for quick lookups.
 * "基礎" = balanced general-purpose tier, better reasoning quality.
 */
export const MODEL_OPTIONS: Record<AiProvider, ModelOption[]> = {
  gemini: [
    { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite', tier: '快速' },
    { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', tier: '基礎' },
  ],
  openai: [
    { id: 'gpt-5.6-luna', label: 'GPT-5.6 Luna', tier: '快速' },
    { id: 'gpt-5.6-terra', label: 'GPT-5.6 Terra', tier: '基礎' },
  ],
  anthropic: [
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', tier: '快速' },
    { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', tier: '基礎' },
  ],
};

export const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: MODEL_OPTIONS.gemini[1].id,
  openai: MODEL_OPTIONS.openai[1].id,
  anthropic: MODEL_OPTIONS.anthropic[1].id,
};
