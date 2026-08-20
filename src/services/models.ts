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

/**
 * USD price per 1M tokens for each model, current as of Aug 2026 per each provider's
 * official pricing page. Prices change over time — treat as an estimate, not a guarantee.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-3.5-flash-lite': { input: 0.3, output: 2.5 },
  'gemini-3.6-flash': { input: 1.5, output: 7.5 },
  'gpt-5.6-luna': { input: 0.2, output: 1.2 },
  'gpt-5.6-terra': { input: 2.0, output: 12.0 },
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
  'claude-sonnet-5': { input: 2.0, output: 10.0 },
};

export function getModelPricing(modelId: string): { input: number; output: number } | null {
  return MODEL_PRICING[modelId] ?? null;
}

/** Computes USD cost from token counts using the model's per-1M-token pricing. */
export function computeCost(modelId: string, inputTokens: number, outputTokens: number): number | null {
  const pricing = getModelPricing(modelId);
  if (!pricing) return null;
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}
