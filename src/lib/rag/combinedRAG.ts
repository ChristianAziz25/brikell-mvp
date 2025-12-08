import { executePrismaQueryFromText } from '@/lib/ai/tools/ragUtils';
import { getPrismaSchema } from '@/lib/rag/schema';
import { openai } from '@ai-sdk/openai';
import { streamText, type CoreMessage } from 'ai';
import { generateEmbeddings } from './embedding';
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
    const [queryEmbedding, schema] = await Promise.all([
      generateEmbeddings(userQuery),
      Promise.resolve(getPrismaSchema()),
    ]);
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

    const queryGenStart = performance.now();
    const queryStream = streamText({
      model: openai('gpt-5-nano'),
      prompt: `You are an expert TypeScript developer. Translate this question into a Prisma Client query.

Schema:
${schema}

Table Details:
${tableDetailsText}

Few-shot Examples:
${fewShotExamplesText}

Question: ${userQuery}

Generate ONLY the Prisma query statement (e.g., "prisma.asset.findMany({ where: { name: "Gertrudehus" } })").
Do NOT wrap in functions, exports, or await keywords.
Output ONLY the query, nothing else.`,
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
    
    const queryResult = {
      prismaQuery: cleanedQuery,
      explanation: undefined as string | undefined,
    };
    
    timings.queryGeneration = performance.now() - queryGenStart;
    console.log(`⏱️  [RAG] Query generation (LLM): ${timings.queryGeneration.toFixed(2)}ms`);
    console.log(`🔍 [RAG] Generated Prisma Query:`, queryResult.prismaQuery);

    // Execute query in parallel while preparing to stream
    const queryExecStart = performance.now();
    let queryData: unknown;
    let queryError: string | null = null;
    const queryExecutionPromise = executePrismaQueryFromText(queryResult.prismaQuery)
      .then((data) => {
        queryData = data;
        timings.queryExecution = performance.now() - queryExecStart;
        console.log(`⏱️  [RAG] Query execution (DB): ${timings.queryExecution.toFixed(2)}ms`);
      })
      .catch((error) => {
        queryError = error instanceof Error ? error.message : String(error);
        timings.queryExecution = performance.now() - queryExecStart;
        console.log(`⏱️  [RAG] Query execution (DB) - ERROR: ${timings.queryExecution.toFixed(2)}ms`);
      });

    // Build conversation messages with system context
    const systemMessage: CoreMessage = {
      role: 'system',
      content: `You are a helpful assistant. Answer the user's question based on database query results.`,
    };

    // Build messages array: system message + conversation history + current user query
    const messages: CoreMessage[] = [systemMessage];
    
    // Add conversation history if provided (excluding the current message)
    if (options?.conversationHistory && options.conversationHistory.length > 0) {
      // Filter to only include user and assistant messages, and limit to last 10 for context
      const recentHistory = options.conversationHistory
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(-10); // Keep last 10 messages for context
      messages.push(...recentHistory);
    }
    
    // Add current user query
    messages.push({
      role: 'user',
      content: userQuery,
    });

    // Wait for query execution to complete, then stream response with data
    await queryExecutionPromise;

    // Stream response with query results - no tools needed, pure text stream
    const streamStart = performance.now();
    timings.preStream = performance.now() - startTime;
    console.log(`⏱️  [RAG] Pre-stream setup: ${timings.preStream.toFixed(2)}ms`);
    console.log(`📊 [RAG] Breakdown: Embedding(${timings.embedding.toFixed(0)}ms) + Search(${timings.vectorSearch.toFixed(0)}ms) + QueryGen(${timings.queryGeneration.toFixed(0)}ms) + QueryExec(${timings.queryExecution.toFixed(0)}ms)`);
    
    const result = streamText({
      model: openai('gpt-5-nano'),
      messages,
      system: `You are a helpful assistant. Answer the user's question based on the database query results.

Database Schema:
${schema}

Available Tables:
${tableDetailsText}

Generated Prisma Query: ${queryResult.prismaQuery}
${queryResult.explanation ? `Query Explanation: ${queryResult.explanation}` : ''}

Query Execution: ${queryError ? `ERROR: ${queryError}` : 'SUCCESS'}

Query Results:
${queryError ? 'No data available due to query error.' : JSON.stringify(queryData, null, 2)}

Instructions:
- If there was a query error, explain what went wrong and suggest how the user might rephrase their question
- If query succeeded but returned no data, say "No data found" - do not fabricate answers
- If query succeeded with data, provide a clear, natural language answer based ONLY on the query results
- Do NOT mention Prisma, queries, databases, or technical details in your answer
- Use natural language and be conversational
- Include specific numbers, names, dates, or statuses from the results when relevant
- If the user references previous messages, use the conversation history to understand the context`,
    });

    // Return streamText result - use toTextStreamResponse() in route handlers
    timings.streamStart = performance.now() - streamStart;
    timings.total = performance.now() - startTime;
    console.log(`✅ [RAG] StreamText created! Total time: ${timings.total.toFixed(2)}ms`);
    console.log(`📊 [RAG] Breakdown: Embedding(${timings.embedding.toFixed(0)}ms) + Search(${timings.vectorSearch.toFixed(0)}ms) + QueryGen(${timings.queryGeneration.toFixed(0)}ms) + QueryExec(${timings.queryExecution.toFixed(0)}ms)`);
    
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
    });

    return {
      response: errorStream,
    };
  }
}
