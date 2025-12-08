import { generateEmbeddings } from '@/lib/rag/embedding';
import { supabaseAdmin } from '@/lib/supabase/client';

/**
 * Convert embedding array to PostgreSQL vector format string
 */
function embeddingToVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Search table details using hybrid search
 */
export async function searchTableDetails(
  query: string,
  options?: {
    limit?: number;
    fullTextWeight?: number;
    semanticWeight?: number;
    rrfK?: number;
  }
) {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbeddings(query);
    const queryEmbeddingVector = embeddingToVector(queryEmbedding);

    // Call hybrid search RPC
    const { data, error } = await supabaseAdmin.rpc(
      'hybrid_search_table_details',
      {
        query_text: query,
        query_embedding: queryEmbeddingVector,
        match_count: options?.limit ?? 5,
        full_text_weight: options?.fullTextWeight ?? 1.0,
        semantic_weight: options?.semanticWeight ?? 1.0,
        rrf_k: options?.rrfK ?? 50,
      }
    );

    if (error) {
      throw new Error(`Table search failed: ${error.message}`);
    }

    return (data || []) as Array<{
      id: string;
      tableName: string;
      description: string;
      metadata: Record<string, unknown>;
      score: number;
    }>;
  } catch (error) {
    console.error('Error searching table details:', error);
    throw error;
  }
}

/**
 * Search few-shot queries using hybrid search
 */
export async function searchFewShotQueries(
  query: string,
  options?: {
    limit?: number;
    fullTextWeight?: number;
    semanticWeight?: number;
    rrfK?: number;
  }
) {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbeddings(query);
    const queryEmbeddingVector = embeddingToVector(queryEmbedding);

    // Call hybrid search RPC
    const { data, error } = await supabaseAdmin.rpc(
      'hybrid_search_few_shot_queries',
      {
        query_text: query,
        query_embedding: queryEmbeddingVector,
        match_count: options?.limit ?? 5,
        full_text_weight: options?.fullTextWeight ?? 1.0,
        semantic_weight: options?.semanticWeight ?? 1.0,
        rrf_k: options?.rrfK ?? 50,
      }
    );

    if (error) {
      throw new Error(`Few-shot search failed: ${error.message}`);
    }

    return (data || []) as Array<{
      id: string;
      query: string;
      sql: string;
      metadata: Record<string, unknown>;
      score: number;
    }>;
  } catch (error) {
    console.error('Error searching few-shot queries:', error);
    throw error;
  }
}

