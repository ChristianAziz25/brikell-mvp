/**
 * RAG (Retrieval-Augmented Generation) Tools
 * Tools for similarity search, query generation, and execution
 */

import prisma from '@/lib/prisma/client';
import { getAllAssets } from '@/lib/prisma/models/asset';
import { getAllRentRollUnits } from '@/lib/prisma/models/rentRollUnit';
import {
    retrieveFewShotExample,
    retrieveTopTables,
} from '@/lib/rag/fewShot/fewShotRetriever';
import {
    buildPrismaQueryPrompt,
    buildPrismaResponsePrompt,
    serializeTableDetails,
} from '@/lib/rag/promptTemplate';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { executePrismaQueryFromText } from './ragUtils';

interface BestExample {
  question: string;
  answer: string;
  score: number;
}
interface BestExamplesResult {
  examples: BestExample[];
  count: number;
}

interface BestTable {
  tableName: string;
  description: string;
  score: number;
}

interface BestTablesResult {
  tables: BestTable[];
  count: number;
}

interface QueryResult {
  prismaQuery: string;
  explanation: string | undefined;
}

interface GenerateQueryInput {
  userQuery: string;
  relevantTables: { tableName: string; description: string }[];
  exampleQueries: { question: string; answer: string }[];
}

interface ExecuteQueryInput {
  prismaQuery: string;
  fallbackTables: { tableName: string; description: string }[];
}

interface ExecuteQueryResult {
  success: true;
  data: Record<string, unknown> | unknown;
  error: null;
  usedFallback: false;
}

interface ExecuteQueryError {
  success: false;
  data: Record<string, unknown> | null;
  error: string;
  usedFallback: boolean;
}

interface GenerateResponseInput {
  userQuery: string;
  prismaQuery: string;
  queryData: Record<string, unknown> | unknown;
}

interface ChainFewShotQueryResult {
  success: true;
  data: Record<string, unknown> | unknown;
  response: string;
  error: null;
  usedFallback: false;
}

interface ChainFewShotQueryError {
  success: false;
  data: Record<string, unknown> | null;
  response: string | null;
  error: string;
  usedFallback: boolean;
}

async function searchBestExamples (query: string): Promise<BestExamplesResult> {
    const fewShotResults = await retrieveFewShotExample(query);
    return {
      examples: fewShotResults.map((ex) => ({
        question: ex.question,
        answer: ex.answer,
        score: ex.score,
      })),
      count: fewShotResults.length,
    };
}

async function searchBestTables(query: string): Promise<BestTablesResult> {
  const tableResults = await retrieveTopTables(query);
  return {
    tables: tableResults,
    count: tableResults.length,
  };
}

async function generateQuery(GenerateQueryInput: GenerateQueryInput): Promise<QueryResult> {
    const fullTableDetailsText = serializeTableDetails();
    const { userQuery, relevantTables, exampleQueries } = GenerateQueryInput;

    const schemaText =
      relevantTables.length > 0
        ? relevantTables
            .map((t) => `${t.tableName}:\n${t.description}`)
            .join('\n\n')
        : fullTableDetailsText;

    const fewShotExamplesText =
      exampleQueries.length > 0
        ? exampleQueries
            .map(
              (ex, index) =>
                `${index + 1}.\nQuestion: ${ex.question}\nAnswer:\n${ex.answer}`,
            )
            .join('\n\n')
        : '';

    const prompt = buildPrismaQueryPrompt({
      userQuery,
      schema: schemaText,
      tableDetailsText: fullTableDetailsText,
      fewShotExamplesText,
    });

    const { text } = await generateText({
      model: openai('gpt-5-nano'),
      prompt,
    });

    // Extract PrismaQuery block
    const prismaQueryMatch = text.match(
      /PrismaQuery:\s*([\s\S]*?)(?:\nExplanation:|\n\nExplanation:|$)/,
    );
    const prismaQuery =
      prismaQueryMatch && prismaQueryMatch[1]
        ? prismaQueryMatch[1].trim()
        : text.trim();

    return {
      prismaQuery,
      explanation: text.includes('Explanation:')
        ? text.split('Explanation:')[1]?.trim()
        : undefined,
    };
}


async function executeQuery(ExecuteQueryInput: ExecuteQueryInput): Promise<ExecuteQueryResult | ExecuteQueryError> {
    const { prismaQuery, fallbackTables } = ExecuteQueryInput;
    try {
      const result = await executePrismaQueryFromText(prismaQuery);
      return {
        success: true,
        data: result,
        error: null,
        usedFallback: false,
      };
    } catch (error) {
      console.error('Failed to execute Prisma query:', error);

      // Fallback: fetch context for tables if provided
      if (fallbackTables.length > 0) {
        const context: Record<string, unknown> = {};

        for (const t of fallbackTables) {
          const name = t.tableName;

          if (name === 'Asset' && context.Asset === undefined) {
            context.Asset = await getAllAssets();
          } else if (
            name === 'RentRollUnit' &&
            context.RentRollUnit === undefined
          ) {
            context.RentRollUnit = await getAllRentRollUnits();
          } else if (name === 'Capex' && context.Capex === undefined) {
            context.Capex = await prisma.capex.findMany({
              take: 100,
              orderBy: { capex_year: 'asc' },
            });
          } else if (name === 'Opex' && context.Opex === undefined) {
            context.Opex = await prisma.opex.findMany({
              take: 100,
              orderBy: { opex_year: 'asc' },
            });
          }
        }

        return {
          success: false,
          data: context,
          error: error instanceof Error ? error.message : 'Unknown error',
          usedFallback: true,
        };
      }

      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        usedFallback: false,
      };
    }
}

async function generateResponse(GenerateResponseInput: GenerateResponseInput): Promise<string> {
  const { userQuery, prismaQuery, queryData } = GenerateResponseInput;
  
  // Serialize the query data to a readable string format
  const contextStr = JSON.stringify(queryData, null, 2);
  
  const prompt = buildPrismaResponsePrompt({
    userQuery: userQuery,
    prismaQuery: prismaQuery,
    context: contextStr,
  });

  const { text } = await generateText({
    model: openai('gpt-5-nano'),
    prompt,
  });

  // Extract the response (everything after "Response:")
  const responseMatch = text.match(/Response:\s*([\s\S]*?)$/);
  const response = responseMatch && responseMatch[1]
    ? responseMatch[1].trim()
    : text.trim();

  return response;
}

async function chainFewShotQuery(query: string): Promise<ChainFewShotQueryResult | ChainFewShotQueryError> {
  try {
    const examples = await searchBestExamples(query);
    console.log(examples);
    const tables = await searchBestTables(query);
    console.log(tables);
    console.time("queryResult");
    const queryResult = await generateQuery({ userQuery: query, relevantTables: tables.tables, exampleQueries: examples.examples });
    console.timeEnd("queryResult");
    console.log(queryResult);
    const result = await executeQuery({ prismaQuery: queryResult.prismaQuery, fallbackTables: tables.tables });
    
    console.log(result);
    let response: string;
    
    if (result.success) {
      response = await generateResponse({
        userQuery: query,
        prismaQuery: queryResult.prismaQuery,
        queryData: result.data,
      });
    } else {
      if (result.usedFallback && result.data) {
        response = await generateResponse({
          userQuery: query,
          prismaQuery: queryResult.prismaQuery,
          queryData: result.data,
        });
      } else {
        response = `I encountered an error while processing your query: ${result.error}. Please try rephrasing your question or check if the data you're looking for exists.`;
      }
    }    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        response: response,
        error: null,
        usedFallback: false,
      };
    } else {
      return {
        success: false,
        data: result.data,
        response: response,
        error: result.error,
        usedFallback: result.usedFallback,
      };
    }
  } catch (error) {
    // Catch any unexpected errors in the chain
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('chainFewShotQuery error:', errorMessage);
    return {
      success: false,
      data: null,
      response: `I encountered an error while processing your query: ${errorMessage}. Please try again.`,
      error: `Error processing query: ${errorMessage}`,
      usedFallback: false,
    };
  }
}

// Export all RAG tools as a single object
export const ragTools = {
  chainFewShotQuery: chainFewShotQuery,
};

