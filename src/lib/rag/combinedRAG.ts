import type { CoreMessage } from "ai";
import { generateEmbeddings } from "./embedding";
import { getPrismaSchema } from "./schema";
import {
  searchFewShotQueries,
  searchTableDetails,
} from "./vectorization-service";

export async function numericalQueryRAG(
  userQuery: string,
  options?: {
    tableLimit?: number;
    fewShotLimit?: number;
    conversationHistory?: CoreMessage[];
  }
) {
  const startTime = performance.now();
  const timings: Record<string, number> = {};
  
  try {
    console.log("🚀 [RAG] Starting query processing...");
    
    const embeddingStart = performance.now();
    const queryEmbedding = await generateEmbeddings(userQuery);
    timings.embedding = performance.now() - embeddingStart;
    console.log(
      `⏱️  [RAG] Embedding generation: ${timings.embedding.toFixed(2)}ms`
    );
    
    const searchStart = performance.now();
    const [tableResults, fewShotResults] = await Promise.all([
      searchTableDetails(userQuery, queryEmbedding, {
        limit: options?.tableLimit ?? 5,
      }),
      searchFewShotQueries(userQuery, queryEmbedding, {
        limit: options?.fewShotLimit ?? 5,
      }),
    ]);
    timings.vectorSearch = performance.now() - searchStart;
    console.log(
      `⏱️  [RAG] Vector searches: ${timings.vectorSearch.toFixed(2)}ms`
    );

    // Format retrieved context
    const tableDetailsText = tableResults
      .map((t) => `- ${t.tableName}: ${t.description}`)
      .join("\n");

    const fewShotExamplesText = fewShotResults
      .map((ex) => `Question: ${ex.query}\nPrismaQuery: ${ex.sql}`)
      .join("\n\n");

    const schema = getPrismaSchema();

    const totalTime = performance.now() - startTime;
    console.log(
      `✅ [RAG] numericalQueryRAG completed in ${totalTime.toFixed(2)}ms`,
      { timings }
    );

    return {
      userQuery,
      tableDetailsText,
      fewShotExamplesText,
      schema,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const totalTime = performance.now() - startTime;
    
    // Log the full error for debugging
    console.error("❌ [RAG] Error in numericalQueryRAG:", {
      error: errorMessage,
      stack: errorStack,
      userQuery,
      totalTime: `${totalTime.toFixed(2)}ms`,
      timings,
    });

    throw error;
  }
}
