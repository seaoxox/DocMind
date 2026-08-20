export interface TextChunk {
  text: string;
  source: string;
}

const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 100;

/**
 * Splits a document's text into overlapping chunks, trying to break on paragraph
 * boundaries where possible so chunks stay semantically coherent.
 */
export function chunkText(content: string, source: string): TextChunk[] {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: TextChunk[] = [];
  let buffer = '';

  const flush = () => {
    if (buffer.trim()) chunks.push({ text: buffer.trim(), source });
    buffer = '';
  };

  for (const para of paragraphs) {
    if (para.length > CHUNK_SIZE) {
      // Paragraph itself is too long; flush what we have, then slide a window over it.
      flush();
      for (let i = 0; i < para.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
        const slice = para.slice(i, i + CHUNK_SIZE);
        if (slice.trim()) chunks.push({ text: slice.trim(), source });
      }
      continue;
    }

    if ((buffer + '\n\n' + para).length > CHUNK_SIZE) {
      flush();
      buffer = para;
    } else {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
    }
  }
  flush();

  return chunks;
}

export function chunkDocuments(docs: { content: string; name: string }[]): TextChunk[] {
  return docs.flatMap((d) => chunkText(d.content, d.name));
}
