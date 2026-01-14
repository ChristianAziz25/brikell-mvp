import { supabaseAdmin } from '@/lib/supabase/client';

interface QueryParams {
    query: string;
    embedding: number[];
    match_count?: number;
    full_text_weight?: number;
    semantic_weight?: number;
    rrf_k?: number;
}

// Emphasize keyword precision (good for exact term searches)
export const keywordSearch = async (params: QueryParams) => {
    try {
        const { data, error } = await supabaseAdmin.rpc("hybrid_search_documents", {
            query_text: params.query,
            query_embedding: params.embedding,
            match_count: params.match_count ?? 5,
            full_text_weight: params.full_text_weight ?? 3.0,
            semantic_weight: params.semantic_weight ?? 1.0,
            rrf_k: params.rrf_k ?? 50,
        });
        if (error) {
            console.error('[Supabase RPC] keywordSearch error:', error.message);
            return null;
        }
        return data;
    } catch (err) {
        console.error('[Supabase RPC] keywordSearch unexpected error:', err);
        return null;
    }
};

// Emphasize semantic understanding (good for conceptual searches)
export const semanticSearch = async (params: QueryParams) => {
    try {
        const { data, error } = await supabaseAdmin.rpc("hybrid_search_documents", {
            query_text: params.query,
            query_embedding: params.embedding,
            match_count: params.match_count ?? 5,
            full_text_weight: params.full_text_weight ?? 1.0,
            semantic_weight: params.semantic_weight ?? 2.5,
            rrf_k: params.rrf_k ?? 50,
        });
        if (error) {
            console.error('[Supabase RPC] semanticSearch error:', error.message);
            return null;
        }
        return data;
    } catch (err) {
        console.error('[Supabase RPC] semanticSearch unexpected error:', err);
        return null;
    }
};

// Balanced approach (recommended starting point)
export const balancedSearch = async (params: QueryParams) => {
    try {
        const { data, error } = await supabaseAdmin.rpc("hybrid_search_documents", {
            query_text: params.query,
            query_embedding: params.embedding,
            match_count: params.match_count ?? 5,
            full_text_weight: params.full_text_weight ?? 1.0,
            semantic_weight: params.semantic_weight ?? 1.0,
            rrf_k: params.rrf_k ?? 50,
        });
        if (error) {
            console.error('[Supabase RPC] balancedSearch error:', error.message);
            return null;
        }
        return data;
    } catch (err) {
        console.error('[Supabase RPC] balancedSearch unexpected error:', err);
        return null;
    }
};