import type { ContentBlock } from '../types';

export interface TextChunk {
  text: string;
  source: string;
  headingPath: string[];
}

const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 100;

function samePath(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Groups a document's structural blocks (paragraphs/list items, each already tagged with
 * the heading it falls under — see docParser.ts) into chunks of roughly CHUNK_SIZE
 * characters. Unlike naive character-window slicing, this:
 *  - never spans two different sections in one chunk (a heading change always starts a
 *    new chunk), so a chunk can't blend unrelated topics together
 *  - hard-slices only when a single block is itself larger than CHUNK_SIZE
 *  - carries the heading path forward on every chunk, so callers can prefix it into the
 *    text used for embedding (giving the vector real topical context) without polluting
 *    the chunk's own text, which stays a verbatim excerpt of the source document.
 */
export function chunkBlocks(blocks: ContentBlock[], source: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  let buffer = '';
  let bufferPath: string[] = [];

  const flush = () => {
    if (buffer.trim()) chunks.push({ text: buffer.trim(), source, headingPath: bufferPath });
    buffer = '';
  };

  for (const block of blocks) {
    const text = block.text.trim();
    if (!text) continue;

    if (!samePath(block.headingPath, bufferPath) && buffer) {
      flush();
    }
    bufferPath = block.headingPath;

    if (text.length > CHUNK_SIZE) {
      flush();
      for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
        const slice = text.slice(i, i + CHUNK_SIZE);
        if (slice.trim()) chunks.push({ text: slice.trim(), source, headingPath: block.headingPath });
      }
      bufferPath = block.headingPath;
      continue;
    }

    const candidate = buffer ? `${buffer}\n\n${text}` : text;
    if (candidate.length > CHUNK_SIZE) {
      flush();
      buffer = text;
      bufferPath = block.headingPath;
    } else {
      buffer = candidate;
    }
  }
  flush();

  return chunks;
}

export function chunkDocuments(docs: { blocks: ContentBlock[]; name: string }[]): TextChunk[] {
  return docs.flatMap((d) => chunkBlocks(d.blocks, d.name));
}

/** Text actually embedded: heading context is prepended so the vector captures topical
 *  location, but this string is only ever used to compute the embedding — the chunk's
 *  own `text` (stored and shown to the LLM/user) stays an untouched excerpt of the source. */
export function toEmbeddingText(chunk: TextChunk): string {
  if (chunk.headingPath.length === 0) return chunk.text;
  return `[章節: ${chunk.headingPath.join(' > ')}]\n${chunk.text}`;
}
