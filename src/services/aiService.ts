import type { AppDocument, Citation, ProviderSettings } from '../types';

export interface AskResult {
  answer: string;
  citations: Citation[];
  raw?: string;
}

const SYSTEM_PROMPT = `You are a document assistant. Your task is to answer questions based STRICTLY on the provided context documents.
If the answer is not contained in the context, clearly say you don't know based on the provided documents. Do not fabricate information.

Formatting Rules:
1. Provide a concise, accurate answer in Traditional Chinese (繁體中文), using Markdown for structure (headings/bullets) where helpful.
2. For every claim or paragraph in the answer, you MUST provide supporting citations drawn verbatim from the context.
3. Respond with ONLY a raw JSON object (no markdown code fences, no commentary) with this exact structure:
{
  "answer": "The full text answer here, in Markdown.",
  "citations": [
    { "text": "The EXACT ORIGINAL QUOTATION from the document context that supports this part of the answer", "source": "The name of the Document" }
  ]
}`;

function buildContext(docs: AppDocument[]): string {
  return docs
    .map((d) => `[Document: ${d.name}]\n${d.content}`)
    .join('\n\n---\n\n');
}

function buildUserPrompt(question: string, docs: AppDocument[]): string {
  const context = buildContext(docs);
  return `Context:\n${context}\n\n---\n\nQuestion: ${question}`;
}

/** Try to safely parse a JSON answer, tolerating stray markdown fences or prose around it. */
function safeParseAnswer(text: string): AskResult {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

  // Try to locate the outermost JSON object if there's extra text around it.
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const candidate = firstBrace !== -1 && lastBrace !== -1 ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;

  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed.answer === 'string') {
      const citations: Citation[] = Array.isArray(parsed.citations)
        ? parsed.citations
            .filter((c: unknown) => c && typeof c === 'object')
            .map((c: { text?: string; source?: string }) => ({
              text: String(c.text ?? ''),
              source: String(c.source ?? ''),
            }))
        : [];
      return { answer: parsed.answer, citations, raw: text };
    }
  } catch {
    // fall through to plain-text fallback
  }
  return { answer: text, citations: [], raw: text };
}

async function callGemini(
  settings: ProviderSettings,
  question: string,
  docs: AppDocument[]
): Promise<AskResult> {
  const model = settings.model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    settings.apiKey
  )}`;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(question, docs) }] }],
    generationConfig: { responseMimeType: 'application/json' },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API 錯誤 (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  if (!text) throw new Error('Gemini 未回傳任何內容，請確認模型名稱與 API Key 是否正確。');
  return safeParseAnswer(text);
}

async function callOpenAI(
  settings: ProviderSettings,
  question: string,
  docs: AppDocument[]
): Promise<AskResult> {
  const model = settings.model || 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  const body = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(question, docs) },
    ],
    response_format: { type: 'json_object' },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenAI API 錯誤 (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('OpenAI 未回傳任何內容，請確認模型名稱與 API Key 是否正確。');
  return safeParseAnswer(text);
}

async function callAnthropic(
  settings: ProviderSettings,
  question: string,
  docs: AppDocument[]
): Promise<AskResult> {
  const model = settings.model || 'claude-sonnet-4-6';
  const url = 'https://api.anthropic.com/v1/messages';

  const body = {
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(question, docs) }],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Anthropic API 錯誤 (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();
  const text: string = data?.content?.map((b: { type: string; text?: string }) => (b.type === 'text' ? b.text ?? '' : '')).join('') ?? '';
  if (!text) throw new Error('Anthropic 未回傳任何內容，請確認模型名稱與 API Key 是否正確。');
  return safeParseAnswer(text);
}

export async function askQuestion(
  settings: ProviderSettings,
  question: string,
  docs: AppDocument[]
): Promise<AskResult> {
  if (!settings.apiKey.trim()) {
    throw new Error('請先在「設定」中輸入您的 API Key。');
  }
  if (docs.length === 0) {
    throw new Error('請先勾選至少一份文件再提問。');
  }

  switch (settings.provider) {
    case 'gemini':
      return callGemini(settings, question, docs);
    case 'openai':
      return callOpenAI(settings, question, docs);
    case 'anthropic':
      return callAnthropic(settings, question, docs);
    default:
      throw new Error('未知的 AI 供應商');
  }
}

export const DEFAULT_MODELS: Record<ProviderSettings['provider'], string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-6',
};
