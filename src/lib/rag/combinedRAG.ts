import type { CoreMessage } from "ai";
import { generateEmbeddings } from "./embedding";
import {
  localSearchFewShotQueries,
  localSearchTableDetails,
} from "./localHybridSearch";
import { getPrismaSchema } from "./schema";

export async function numericalQueryRAG(
  userQuery: string,
  options?: {
    tableLimit?: number;
    fewShotLimit?: number;
    conversationHistory?: CoreMessage[];
  }
): Promise<{
  userQuery: string;
  tableDetailsText: string;
  fewShotExamplesText: string;
  schema: string;
}> {
  const startTime = performance.now();
  const timings: Record<string, number> = {};
  
  try {
    console.log("🚀 [RAG] Starting query processing...");
    console.log("[RAG] Incoming query:", userQuery);
    console.log("[RAG] Options:", {
      tableLimit: options?.tableLimit,
      fewShotLimit: options?.fewShotLimit,
      conversationHistoryLength: options?.conversationHistory?.length ?? 0,
    });
    
    const embeddingStart = performance.now();
    const queryEmbedding = await generateEmbeddings(userQuery);
    timings.embedding = performance.now() - embeddingStart;
    console.log(
      `⏱️  [RAG] Embedding generation: ${timings.embedding.toFixed(2)}ms`
    );
    console.log("[RAG] Embedding length:", queryEmbedding.length);
    
    const searchStart = performance.now();
    const [tableResults, fewShotResults] = await Promise.all([
      localSearchTableDetails(userQuery, queryEmbedding, {
        limit: options?.tableLimit ?? 5,
      }),
      localSearchFewShotQueries(userQuery, queryEmbedding, {
        limit: options?.fewShotLimit ?? 5,
      }),
    ]);
    timings.vectorSearch = performance.now() - searchStart;
    console.log(
      `⏱️  [RAG] Vector searches: ${timings.vectorSearch.toFixed(2)}ms`
    );
    console.log("[RAG] TableDetails results:", {
      count: tableResults.length,
      top: tableResults.slice(0, options?.tableLimit ?? 5).map((t) => ({
        id: t.id,
        tableName: t.tableName,
        score: t.score,
      })),
    });
    console.log("[RAG] FewShot results:", {
      count: fewShotResults.length,
      top: fewShotResults.slice(0, options?.fewShotLimit ?? 5).map((f) => ({
        id: f.id,
        query: f.query,
        score: f.score,
      })),
    });

    const tableDetailsText = tableResults
      .map((t) => {
        const firstLine = t.description.split("\n")[0];
        return `- ${t.tableName}: ${firstLine}`;
      })
      .join("\n");

    const extractPrismaCall = (text: string): string => {
      const match = text.match(/`([^`]+)`/);
      return match ? match[1] : text;
    };

    const fewShotExamplesText = fewShotResults
      .map((ex) => extractPrismaCall(ex.sql))
      .join("\n");
    console.log("🚀 [RAG] rag results:", { tableResults, fewShotResults });

    const schema = getPrismaSchema();

    const totalTime = performance.now() - startTime;
    console.log(
      `✅ [RAG] numericalQueryRAG completed in ${totalTime.toFixed(2)}ms`,
      { timings }
    );
    console.log("[RAG] Context lengths:", {
      tableDetailsTextChars: tableDetailsText.length,
      fewShotExamplesTextChars: fewShotExamplesText.length,
      schemaChars: schema.length,
    });

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
