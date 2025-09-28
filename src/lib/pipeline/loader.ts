import type { KnowledgeBase, BuildKnowledgeBaseOptions } from './build';
import { buildKnowledgeBase } from './build';

let knowledgeBasePromise: Promise<KnowledgeBase> | null = null;

export function preloadKnowledgeBase(options: BuildKnowledgeBaseOptions = {}) {
  knowledgeBasePromise = buildKnowledgeBase(options);
  return knowledgeBasePromise;
}

export async function getKnowledgeBase(options: BuildKnowledgeBaseOptions = {}) {
  if (!knowledgeBasePromise) {
    knowledgeBasePromise = buildKnowledgeBase(options);
  }

  return knowledgeBasePromise;
}

