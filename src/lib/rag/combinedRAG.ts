import { executePrismaQueryFromText } from '@/lib/ai/tools/ragUtils';
import { getPrismaSchema } from '@/lib/rag/schema';
import { openai } from '@ai-sdk/openai';
import { generateObject, streamObject } from 'ai';
import { z } from 'zod';
import { generateEmbeddings } from './embedding';
import { embeddingToVector, searchFewShotQueries, searchTableDetails } from './vectorization-service';

export async function numericalQueryRAG(
  userQuery: string,
  options?: {
    tableLimit?: number;
    fewShotLimit?: number;
  }
) {
  try {

    // Generate embedding once and reuse for both searches
    const queryEmbedding = await generateEmbeddings(userQuery);
    const queryEmbeddingVector = embeddingToVector(queryEmbedding);
    
    // Step 1: Parallel retrieval of context
    const [tableResults, fewShotResults] = await Promise.all([
      searchTableDetails(userQuery, queryEmbeddingVector, { limit: options?.tableLimit ?? 5 }),
      searchFewShotQueries(userQuery, queryEmbeddingVector, { limit: options?.fewShotLimit ?? 5 }),
    ]);

    // Format retrieved context
    const tableDetailsText = tableResults
      .map((t) => `- ${t.tableName}: ${t.description}`)
      .join('\n');

    const fewShotExamplesText = fewShotResults
      .map((ex) => `Question: ${ex.query}\nPrismaQuery: ${ex.sql}`)
      .join('\n\n');

    const schema = getPrismaSchema();

    // Step 2: Generate query using structured output
    const { object: queryResult } = await generateObject({
      model: openai('gpt-5-nano'),
      schema: z.object({
        prismaQuery: z.string().describe('The Prisma Client query to execute'),
        explanation: z.string().optional().describe('Brief explanation of the query'),
      }),
      prompt: `You are an expert TypeScript developer. Translate this question into a Prisma Client query.

Schema:
${schema}

Table Details:
${tableDetailsText}

Few-shot Examples:
${fewShotExamplesText}

Question: ${userQuery}

Generate ONLY the Prisma query statement (e.g., "prisma.asset.findMany({ where: { name: "Gertrudehus" } })").
Do NOT wrap in functions, exports, or await keywords.`,
    });

    // Step 3: Execute the query
    let queryData: unknown;
    let queryError: string | null = null;

    try {
      queryData = await executePrismaQueryFromText(queryResult.prismaQuery);
    } catch (error) {
      queryError = error instanceof Error ? error.message : String(error);
    }

    // Step 4: Generate final response in ONE LLM call with all context
    // This single call takes: user query + generated query + query results + retrieved context
    // and generates the final natural language response
    const result = streamObject({
      model: openai('gpt-5-nano'),
      schema: z.object({
        response: z.string().describe('Natural language response to the user question'),
        keyInsights: z.array(z.string()).optional().describe('Key insights or data points from the results'),
      }),
      prompt: `You are a helpful assistant. Answer the user's question based on the database query results.

                User Question: ${userQuery}

                Generated Prisma Query: ${queryResult.prismaQuery}
                ${queryResult.explanation ? `Query Explanation: ${queryResult.explanation}` : ''}

                Query Execution: ${queryError ? `ERROR: ${queryError}` : 'SUCCESS'}

                Query Results:
                ${queryError ? 'No data available due to query error.' : JSON.stringify(queryData, null, 2)}

                Relevant Table Context:
                ${tableDetailsText}

                Relevant Few-shot Examples:
                ${fewShotExamplesText}

                Instructions:
                - If there was a query error, explain what went wrong and suggest how the user might rephrase their question
                - If query succeeded but returned no data, say "No data found" - do not fabricate answers
                - If query succeeded with data, provide a clear, natural language answer based ONLY on the query results
                - Do NOT mention Prisma, queries, databases, or technical details in your answer
                - Use natural language and be conversational
                - Include specific numbers, names, dates, or statuses from the results when relevant`,
    });

    return {
      success: !queryError,
    //   data: queryData,
      response: result,
      error: queryError,
    //   query: queryResult.prismaQuery,
    //   retrievedTables: tableResults.map((t) => t.tableName),
    //   retrievedExamples: fewShotResults.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Return a stream object even for errors to maintain consistent return type
    const errorStream = streamObject({
      model: openai('gpt-5-nano'),
      schema: z.object({
        response: z.string(),
        keyInsights: z.array(z.string()).optional(),
      }),
      prompt: `The user asked: "${userQuery}"

An error occurred while processing this request: ${errorMessage}

Provide a helpful error message explaining what went wrong and suggest how the user might rephrase their question. Be friendly and constructive.`,
    });

    return {
      success: false,
      response: errorStream,
      error: errorMessage,
    };
  }
}

