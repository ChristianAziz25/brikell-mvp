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
    serializeTableDetails,
} from '@/lib/rag/promptTemplate';
import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { executePrismaQueryFromText } from './ragUtils';

// Tool 1: Similarity Search for Query Examples
export const similaritySearchQueryTool = tool({
  description:
    'Search for similar example queries and their answers to help understand how to answer the current question. Use this first to find relevant examples.',
  inputSchema: z.object({
    query: z.string().describe('The user query to find similar examples for'),
  }),
  execute: async ({ query }) => {
    const fewShotResults = await retrieveFewShotExample(query);
    return {
      examples: fewShotResults.map((ex) => ({
        question: ex.question,
        answer: ex.answer,
        score: ex.score,
      })),
      count: fewShotResults.length,
    };
  },
});

// Tool 2: Similarity Search for Relevant Tables
export const similaritySearchTableTool = tool({
  description:
    'Find the most relevant database tables for answering the query. Use this to identify which tables contain the data needed.',
  inputSchema: z.object({
    query: z.string().describe('The user query to find relevant tables for'),
  }),
  execute: async ({ query }) => {
    const tableResults = await retrieveTopTables(query);
    return {
      tables: tableResults.map((t) => ({
        tableName: t.tableName,
        description: t.description,
        score: t.score,
      })),
      count: tableResults.length,
    };
  },
});

// Tool 3: Generate Prisma Query
export const generateQueryTool = tool({
  description:
    'Generate a Prisma database query based on the user question, relevant tables, and example queries. Use this after finding examples and tables.',
  inputSchema: z.object({
    userQuery: z.string().describe('The original user question'),
    relevantTables: z
      .array(
        z.object({
          tableName: z.string(),
          description: z.string(),
        }),
      )
      .describe('The relevant database tables identified'),
    exampleQueries: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .optional()
      .describe('Similar example queries and their answers'),
  }),
  execute: async ({ userQuery, relevantTables, exampleQueries = [] }) => {
    const fullTableDetailsText = serializeTableDetails();

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
  },
});

// Tool 4: Execute Prisma Query
export const executeQueryTool = tool({
  description:
    'Execute a Prisma query and return the results. Use this after generating a query to get the actual data.',
  inputSchema: z.object({
    prismaQuery: z.string().describe('The Prisma query code to execute'),
    fallbackTables: z
      .array(
        z.object({
          tableName: z.string(),
          description: z.string(),
        }),
      )
      .optional()
      .describe('Fallback tables to query if execution fails'),
  }),
  execute: async ({ prismaQuery, fallbackTables = [] }) => {
    try {
      const result = await executePrismaQueryFromText(prismaQuery);
      return {
        success: true,
        data: result,
        error: null,
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
  },
});

// Export all RAG tools as a single object
export const ragTools = {
  similaritySearchQuery: similaritySearchQueryTool,
  similaritySearchTable: similaritySearchTableTool,
  generateQuery: generateQueryTool,
  executeQuery: executeQueryTool,
};

