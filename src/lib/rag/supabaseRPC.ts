import { supabaseAdmin } from '@/lib/supabase/client';

interface QueryParams {
    query: string;
    embedding: number[];
    match_count?: number;
    full_text_weight?: number;
    semantic_weight?: number;
    rrf_k?: number;
}


// Example 1: Emphasize keyword precision (good for exact term searches)
export const keywordSearch = async (params: QueryParams) => await supabaseAdmin.rpc("hybrid_search_documents", {
    query_text: params.query,
    query_embedding: params.embedding,
    match_count: params.match_count ?? 5,
    full_text_weight: params.full_text_weight ?? 3.0, // Triple weight for exact keyword matches
    semantic_weight: params.semantic_weight ?? 1.0, // Normal semantic weight
    rrf_k: params.rrf_k ?? 50,
  });
   
  // Example 2: Emphasize semantic understanding (good for conceptual searches)
  export const semanticSearch = async (params: QueryParams) => await supabaseAdmin.rpc("hybrid_search_documents", {
    query_text: "managing component state",
    query_embedding: params.embedding,
    match_count: params.match_count ?? 5,
    full_text_weight: params.full_text_weight ?? 1.0, // Normal keyword weight
    semantic_weight: params.semantic_weight ?? 2.5, // 2.5x weight for semantic understanding
    rrf_k: params.rrf_k ?? 50,
  });
   
  // Example 3: Balanced approach (recommended starting point)
  export const balancedSearch = async (params: QueryParams) => await supabaseAdmin.rpc("hybrid_search_documents", {
    query_text: "React hooks tutorial",
    query_embedding: params.embedding,
    match_count: params.match_count ?? 5,
    full_text_weight: params.full_text_weight ?? 1.0, // Equal weights
    semantic_weight: params.semantic_weight ?? 1.0,
    rrf_k: params.rrf_k ?? 50,
  });