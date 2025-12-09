import { executePrismaQueryFromText } from '@/lib/ai/tools/ragUtils';
import { openai } from '@ai-sdk/openai';
import { streamText, type CoreMessage } from 'ai';
import { generateEmbeddings } from './embedding';
import { getPrismaSchema } from './schema';
import { searchFewShotQueries, searchTableDetails } from './vectorization-service';

export async function numericalQueryRAG(
  userQuery: string,
  abortSignal: AbortSignal,
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

    /**
     * STEP 2: Generate final natural-language answer
     *
     * IMPORTANT FOR LATENCY:
     * - We intentionally start a NEW, much smaller message array for the answer step
     * - This avoids re-sending the full schema, table details, and few-shot examples,
     *   which dramatically reduces tokens and "time to first token" for streaming.
     */

    const answerSystemMessage: CoreMessage = {
      role: 'system',
      content:
        'You are a helpful data analyst. You answer questions based ONLY on the provided query results. Do not mention databases, queries, or Prisma. Speak in clear, concise natural language.',
    };

    const answerMessages: CoreMessage[] = [answerSystemMessage];

    // Optionally add a trimmed conversation history for tone/continuity (without schema/few-shot noise)
    if (options?.conversationHistory && options.conversationHistory.length > 0) {
      const recentHistory = options.conversationHistory
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .slice(-5); // keep last 5 just for light context
      answerMessages.push(...recentHistory);
    }


    answerMessages.push({
      role: 'user',
      content: `The user asked: "${userQuery}"

Here is the Prisma query that was executed to answer this question:
${cleanedQuery}

Execution status: ${queryError ? `ERROR: ${queryError}` : 'SUCCESS'}

Query results (JSON):
${queryError ? 'No data available due to query error.' : JSON.stringify(queryData, null, 2)}

Now provide a clear, natural language answer to the original question: "${userQuery}"

Instructions:
- If there was a query error, explain what went wrong and suggest how the user might rephrase their question
- If query succeeded but returned no data, say "No data found" - do not fabricate answers
- If query succeeded with data, provide a clear, natural language answer based ONLY on the query results
- Do NOT mention Prisma, queries, databases, or technical details in your answer
- Use natural language and be conversational
- Include specific numbers, names, dates, or statuses from the results when relevant`,
    });

    // Continue with a new, compact conversation to generate the final answer
    const streamStart = performance.now();
    timings.preStream = performance.now() - startTime;
    console.log(`⏱️  [RAG] Pre-stream setup: ${timings.preStream.toFixed(2)}ms`);
    console.log(`📊 [RAG] Breakdown: Embedding(${timings.embedding.toFixed(0)}ms) + Search(${timings.vectorSearch.toFixed(0)}ms) + QueryGen(${timings.queryGeneration.toFixed(0)}ms) + QueryExec(${timings.queryExecution.toFixed(0)}ms)`);
    
    const result = streamText({
      model: openai('gpt-5-nano'),
      messages: answerMessages,
    });

    // Return streamText result - use toTextStreamResponse() in route handlers
    timings.streamStart = performance.now() - streamStart;
    timings.total = performance.now() - startTime;    
    return {
      response: result,
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
    abortSignal: abortSignal,
    onAbort: ({ steps }) => {
      // Handle cleanup when stream is aborted
      console.log('Stream aborted after', steps.length, 'steps');
      // Persist partial results to database
    },
    });

    return {
      response: errorStream,
    };
  }
}
