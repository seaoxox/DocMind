const CJK_RANGE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/;

/**
 * Rough token-count estimate, since exact counts require each provider's own tokenizer.
 * CJK characters are counted at roughly 1.5 tokens/char, everything else at roughly
 * 4 chars/token (typical for English/markdown/punctuation). This is only used for the
 * pre-send cost *prediction* — actual billed usage always comes from the API response.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  let cjkCount = 0;
  let otherCount = 0;
  for (const ch of text) {
    if (CJK_RANGE.test(ch)) cjkCount++;
    else otherCount++;
  }
  return Math.ceil(cjkCount * 1.5 + otherCount / 4);
}
