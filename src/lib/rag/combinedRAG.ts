import { executePrismaQueryFromText } from '@/lib/ai/tools/ragUtils';
import { openai } from '@ai-sdk/openai';
import { streamText, type CoreMessage } from 'ai';
import { generateEmbeddings } from './embedding';
import { getPrismaSchema } from './schema';
import { searchFewShotQueries, searchTableDetails } from './vectorization-service';

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
    console.log('🚀 [RAG] Starting query processing...');
    
    // OPTIMIZATION: Start embedding and schema retrieval in parallel
    const embeddingStart = performance.now();
    const queryEmbedding = await generateEmbeddings(userQuery);
    timings.embedding = performance.now() - embeddingStart;
    console.log(`⏱️  [RAG] Embedding generation: ${timings.embedding.toFixed(2)}ms`);
    
    // Parallel retrieval of context
    const searchStart = performance.now();
    const [tableResults, fewShotResults] = await Promise.all([
      searchTableDetails(userQuery, queryEmbedding, { limit: options?.tableLimit ?? 5 }),
      searchFewShotQueries(userQuery, queryEmbedding, { limit: options?.fewShotLimit ?? 5 }),
    ]);
    timings.vectorSearch = performance.now() - searchStart;
    console.log(`⏱️  [RAG] Vector searches: ${timings.vectorSearch.toFixed(2)}ms`);

    // Format retrieved context
    const tableDetailsText = tableResults
      .map((t) => `- ${t.tableName}: ${t.description}`)
      .join('\n');

    const fewShotExamplesText = fewShotResults
      .map((ex) => `Question: ${ex.query}\nPrismaQuery: ${ex.sql}`)
      .join('\n\n');

    const schema = getPrismaSchema();

    // Build conversation messages with system context
    const systemMessage: CoreMessage = {
      role: 'system',
      content: `You are a helpful assistant that answers questions by generating Prisma queries and interpreting their results.`,
    };

    // Build messages array: system message + conversation history
    const messages: CoreMessage[] = [systemMessage];
    
    // Add conversation history if provided
    if (options?.conversationHistory && options.conversationHistory.length > 0) {
      // Filter to only include user and assistant messages, and limit to last 10 for context
      const recentHistory = options.conversationHistory
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-10); // Keep last 10 messages for context
      messages.push(...recentHistory);
    }
    
    console.log(tableDetailsText)
    messages.push({
      role: 'user',
      content: `Answer this question: ${userQuery}

First, generate the Prisma query needed to answer this question. I'll execute it and provide the results for you to interpret.

Database Schema:
${schema}

Table Details:
${tableDetailsText}

Few-shot Examples:
${fewShotExamplesText}

CRITICAL: Asset names are case-sensitive. When filtering by asset.name, you MUST use the exact capitalization as shown. Do NOT convert asset names to lowercase.

Generate ONLY the Prisma query statement (e.g., "prisma.asset.findMany({ where: { name: "Gertrudehus" } })").
Do NOT wrap in functions, exports, or await keywords.
Output ONLY the query, nothing else.`,
    });

    // Single LLM call: First generate the query
    const queryGenStart = performance.now();
    const queryStream = streamText({
      model: openai('gpt-5-nano'),
      messages,
    });
    
    // Read the stream to get the query
    let queryText = '';
    for await (const chunk of queryStream.textStream) {
      queryText += chunk;
    }
    
    // Clean and extract the query
    const cleanedQuery = queryText.trim()
      .replace(/^```(typescript|ts)?/i, '')
      .replace(/```$/i, '')
      .trim();
    
    timings.queryGeneration = performance.now() - queryGenStart;
    console.log(`⏱️  [RAG] Query generation (LLM): ${timings.queryGeneration.toFixed(2)}ms`);
    console.log(`🔍 [RAG] Generated Prisma Query:`, cleanedQuery);

    // Execute query
    const queryExecStart = performance.now();
    let queryData: unknown;
    let queryError: string | null = null;
    try {
      queryData = await executePrismaQueryFromText(cleanedQuery);
      timings.queryExecution = performance.now() - queryExecStart;
      console.log(`⏱️  [RAG] Query execution (DB): ${timings.queryExecution.toFixed(2)}ms`);
    } catch (error) {
      queryError = error instanceof Error ? error.message : String(error);
      timings.queryExecution = performance.now() - queryExecStart;
      console.log(`⏱️  [RAG] Query execution (DB) - ERROR: ${queryError} ${timings.queryExecution.toFixed(2)}ms`);
    }

    console.log(queryData);
 
    return {
      response: queryData,
      tableDetailsText,
      fewShotExamplesText,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const totalTime = performance.now() - startTime;
    
    // Log the full error for debugging
    console.error('❌ [RAG] Error in numericalQueryRAG:', {
      error: errorMessage,
      stack: errorStack,
      userQuery,
      totalTime: `${totalTime.toFixed(2)}ms`,
      timings,
    });
    
    // Return a stream text even for errors to maintain consistent return type
    const errorStream = streamText({
      model: openai('gpt-5-nano'),
      prompt: `The user asked: "${userQuery}"

An error occurred while processing this request: ${errorMessage}

Provide a helpful, user-friendly error message explaining what went wrong. Include:
- A clear explanation of the issue in simple terms
- Suggestions on how the user might rephrase their question or what they can try instead
- Be friendly, constructive, and avoid technical jargon when possible

If the error mentions "vector", "embedding", or "search", explain that there was an issue retrieving relevant information from the knowledge base.`,
    });

    return {
      response: errorStream,
    };
  }
}
