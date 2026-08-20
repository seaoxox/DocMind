import type { AppDocument, RetrievedChunk } from '../types';
import { chunkDocuments } from './chunking';
import { embedQuery, embedTexts, type EmbeddingProgress } from './embeddingService';
import { clearChunks, countChunks, getAllChunks, getMeta, putChunks, setMeta, type StoredChunk } from './vectorStore';
import { uid } from '../lib/utils';

const FINGERPRINT_KEY = 'guidance-fingerprint';
const TOP_K = 6;

export type IndexStatus =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'embedding'; done: number; total: number }
  | { phase: 'ready'; chunkCount: number }
  | { phase: 'error'; message: string };

/** Cheap, deterministic fingerprint of the current guidance corpus (name + length per doc). */
async function computeFingerprint(docs: AppDocument[]): Promise<string> {
  const summary = docs
    .map((d) => `${d.name}:${d.sizeChars}`)
    .sort()
    .join('|');
  const encoded = new TextEncoder().encode(summary);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

let cachedChunks: StoredChunk[] | null = null;

/**
 * Ensures the local vector index reflects the current set of guidance/manual documents.
 * On first run (or whenever the underlying documents change), this chunks every document,
 * embeds each chunk locally via a Hugging Face model, and persists the vectors to IndexedDB.
 * On subsequent runs with unchanged documents, this is a fast no-op.
 */
export async function ensureIndex(
  docs: AppDocument[],
  onStatus: (status: IndexStatus) => void,
  forceRebuild = false
): Promise<void> {
  onStatus({ phase: 'checking' });

  const fingerprint = await computeFingerprint(docs);
  const storedFingerprint = await getMeta(FINGERPRINT_KEY);
  const existingCount = await countChunks();

  if (!forceRebuild && storedFingerprint === fingerprint && existingCount > 0) {
    cachedChunks = null; // will lazy-load from IndexedDB on first search
    onStatus({ phase: 'ready', chunkCount: existingCount });
    return;
  }

  try {
    await clearChunks();
    const chunks = chunkDocuments(docs.map((d) => ({ content: d.content, name: d.name })));

    if (chunks.length === 0) {
      await setMeta(FINGERPRINT_KEY, fingerprint);
      onStatus({ phase: 'ready', chunkCount: 0 });
      return;
    }

    const BATCH_SIZE = 16;
    const stored: StoredChunk[] = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const vectors = await embedTexts(
        batch.map((c) => c.text),
        (p: EmbeddingProgress) => {
          // Model download progress (first run only) reported as 0-100 per file;
          // we surface it as part of the same "embedding" phase for simplicity.
          if (p.progress !== undefined) {
            onStatus({ phase: 'embedding', done: i, total: chunks.length });
          }
        }
      );
      const newlyStored = batch.map((c, idx) => ({
        id: uid('chunk'),
        text: c.text,
        source: c.source,
        embedding: vectors[idx],
      }));
      stored.push(...newlyStored);
      await putChunks(newlyStored);
      onStatus({ phase: 'embedding', done: Math.min(i + BATCH_SIZE, chunks.length), total: chunks.length });
    }

    await setMeta(FINGERPRINT_KEY, fingerprint);
    cachedChunks = null;
    onStatus({ phase: 'ready', chunkCount: chunks.length });
  } catch (err) {
    onStatus({ phase: 'error', message: err instanceof Error ? err.message : '建立向量索引時發生錯誤。' });
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  // Embeddings are already normalized (unit length), so dot product == cosine similarity.
  return dot;
}

/** Performs a semantic search over the local vector index and returns the top-K most relevant chunks. */
export async function search(query: string, topK: number = TOP_K): Promise<RetrievedChunk[]> {
  if (!cachedChunks) {
    cachedChunks = await getAllChunks();
  }
  if (cachedChunks.length === 0) return [];

  const queryVec = await embedQuery(query);
  const scored = cachedChunks.map((c) => ({
    text: c.text,
    source: c.source,
    score: cosineSimilarity(queryVec, c.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
