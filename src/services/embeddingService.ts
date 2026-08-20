import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

const MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

export interface EmbeddingProgress {
  status: string;
  progress?: number;
  file?: string;
}

/**
 * Lazily loads (and caches) the feature-extraction pipeline. The model is downloaded
 * once from the Hugging Face Hub and cached by the browser; subsequent loads are fast.
 */
export function getExtractor(onProgress?: (p: EmbeddingProgress) => void): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODEL_ID, {
      progress_callback: (p: Record<string, unknown>) => {
        onProgress?.({
          status: String(p.status ?? ''),
          progress: typeof p.progress === 'number' ? p.progress : undefined,
          file: typeof p.file === 'string' ? p.file : undefined,
        });
      },
    }) as Promise<FeatureExtractionPipeline>;
  }
  return extractorPromise;
}

/** Embeds a batch of texts, returning one normalized vector (as a plain number[]) per text. */
export async function embedTexts(texts: string[], onProgress?: (p: EmbeddingProgress) => void): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor(onProgress);
  const output = await extractor(texts, { pooling: 'mean', normalize: true });
  const nested = output.tolist() as number[][];
  return nested;
}

/** Embeds a single query string. */
export async function embedQuery(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}
