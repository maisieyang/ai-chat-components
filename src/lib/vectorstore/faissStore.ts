import { embedTexts, embedText } from '../embeddings';
import type { PageChunk } from '../confluence/chunk';

export interface StoredEmbedding {
  vector: number[];
  chunk: PageChunk;
}

export interface SearchResult {
  chunk: PageChunk;
  score: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const minLength = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLength; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class FaissVectorStore {
  private readonly documents: StoredEmbedding[] = [];

  async addChunks(chunks: PageChunk[]): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    const embeddings = await embedTexts(chunks.map((chunk) => chunk.content));

    embeddings.forEach((vector, index) => {
      const chunk = chunks[index];
      this.documents.push({ vector, chunk });
    });
  }

  async search(query: string, k = 5): Promise<SearchResult[]> {
    if (this.documents.length === 0) {
      return [];
    }

    const queryEmbedding = await embedText(query);

    const scored = this.documents.map(({ vector, chunk }) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, vector),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  get size(): number {
    return this.documents.length;
  }
}

