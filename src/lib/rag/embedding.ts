import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';

const embeddingModel = openai.embedding('text-embedding-3-small');

// LRU Cache for embeddings - saves ~200-500ms per repeated query
const CACHE_MAX_SIZE = 100;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

type CacheEntry = { embedding: number[]; timestamp: number };
const embeddingCache = new Map<string, CacheEntry>();

function getCacheKey(value: string): string {
  return value.toLowerCase().trim().slice(0, 200); // Normalize and limit key size
}

function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of embeddingCache) {
    if (now - entry.timestamp > CACHE_TTL) {
      embeddingCache.delete(key);
    }
  }
  // Evict oldest entries if over max size
  if (embeddingCache.size > CACHE_MAX_SIZE) {
    const entriesToDelete = embeddingCache.size - CACHE_MAX_SIZE;
    const keys = Array.from(embeddingCache.keys());
    for (let i = 0; i < entriesToDelete; i++) {
      embeddingCache.delete(keys[i]);
    }
  }
}

export const generateEmbeddings = async (
  value: string,
): Promise<number[]> => {
  const cacheKey = getCacheKey(value);
  
  // Check cache first
  const cached = embeddingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('⚡ [Embedding] Cache HIT - skipping API call');
    return cached.embedding;
  }
  
  console.log('🔄 [Embedding] Cache MISS - calling API');
  
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: [value],
    providerOptions: {
      openai: {
        dimensions: 512,
      },
    },
  });
  
  // Store in cache
  embeddingCache.set(cacheKey, {
    embedding: embeddings[0],
    timestamp: Date.now(),
  });
  
  // Clean up periodically
  if (Math.random() < 0.1) { // 10% chance to clean
    cleanExpiredCache();
  }
  
  return embeddings[0];
};