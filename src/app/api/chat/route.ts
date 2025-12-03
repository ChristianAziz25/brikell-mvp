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
import { type CoreMessage, generateText, streamText } from 'ai';

type BasicMessagePart =
  | string
  | {
      type?: string;
      text?: string;
      [key: string]: unknown;
    };

type BasicMessage = {
  role?: string;
  content?: string | BasicMessagePart[];
  parts?: BasicMessagePart[];
  [key: string]: unknown;
};

function extractTextFromMessage(message: BasicMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) =>
        typeof part === 'string'
          ? part
          : typeof part.text === 'string'
            ? part.text
            : '',
      )
      .join(' ')
      .trim();
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .map((part) =>
        typeof part === 'string'
          ? part
          : typeof part.text === 'string'
            ? part.text
            : '',
      )
      .join(' ')
      .trim();
  }

  return '';
}

async function fetchContextForTables(
  tableResults: Awaited<ReturnType<typeof retrieveTopTables>>,
) {
  const context: Record<string, unknown> = {};

  for (const t of tableResults) {
    const name = t.tableName;

    if (name === 'Asset' && context.Asset === undefined) {
      context.Asset = await getAllAssets();
    } else if (name === 'RentRollUnit' && context.RentRollUnit === undefined) {
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

  return context;
}

function cleanPrismaCodeBlock(raw: string): string {
  let code = raw.trim();

  // If the model wrapped the query in a fenced code block, extract the inner content
  const fenceMatch = code.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  if (fenceMatch && fenceMatch[1]) {
    code = fenceMatch[1].trim();
  }

  // Drop a leading comment line like "// TypeScript / Prisma Client code here"
  code = code.replace(/^\/\/.*$/m, '').trim();

  return code;
}

async function executePrismaQueryFromText(
  prismaQuery: string,
): Promise<unknown> {
  const code = cleanPrismaCodeBlock(prismaQuery).trim();

  let body: string;

  if (/\breturn\b/.test(code)) {
    body = code;
  } else {
    const constMatch = code.match(/^const\s+(\w+)\s*=/);
    if (constMatch) {
      const varName = constMatch[1];
      body = `${code}\nreturn ${varName};`;
    } else if (/^prisma\./.test(code)) {
      body = `return await (${code});`;
    } else {
      body = `return await (${code});`;
    }
  }

  const wrapped = `"use strict"; return (async (prisma) => { ${body} })(prisma);`;
  console.log('wrappy', wrapped)
  const fn = new Function('prisma', wrapped);
  return await fn(prisma);
}

export async function POST(req: Request) {
  try {
    const {
      messages,
    }: {
      messages: BasicMessage[];
    } = await req.json();


    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Find the latest user message content to drive retrieval
    const latestUserMessageIndex = [...messages]
      .map((m, idx) => ({ m, idx }))
      .reverse()
      .find(({ m }) => m.role === 'user')?.idx;

    if (latestUserMessageIndex === undefined) {
      return new Response(
        JSON.stringify({ error: 'No user message found in request' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const latestUserMessage = messages[latestUserMessageIndex];
    const userQuery = extractTextFromMessage(latestUserMessage);

    if (!userQuery.trim()) {
      return new Response(
        JSON.stringify({ error: 'Empty user query' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Stage 1: retrieve few-shot examples + top tables, build Prisma prompt, and generate PrismaQuery text
    const [fewShotResults, tableResults] = await Promise.all([
      retrieveFewShotExample(userQuery),
      retrieveTopTables(userQuery),
    ]);

    const fullTableDetailsText = serializeTableDetails();

    const schemaText =
      tableResults.length > 0
        ? tableResults
            .map(
              (t) =>
                `${t.tableName}:\n${t.description}`,
            )
            .join('\n\n')
        : fullTableDetailsText;

    const fewShotExamplesText =
      fewShotResults.length > 0
        ? fewShotResults
            .map(
              (ex, index) =>
                `${index + 1}.\nQuestion: ${ex.question}\nAnswer:\n${ex.answer}`,
            )
            .join('\n\n')
        : '';

    const stage1SystemPrompt = buildPrismaQueryPrompt({
      userQuery,
      schema: schemaText,
      tableDetailsText: fullTableDetailsText,
      fewShotExamplesText,
    });

    const { text: stage1Text } = await generateText({
      model: openai('gpt-5-nano'),
      prompt: stage1SystemPrompt,
    });

    // Try to extract only the PrismaQuery block (excluding the Explanation section)
    const prismaQueryMatch = stage1Text.match(
      /PrismaQuery:\s*([\s\S]*?)(?:\nExplanation:|\n\nExplanation:|$)/,
    );
    const prismaQuery =
      prismaQueryMatch && prismaQueryMatch[1]
        ? prismaQueryMatch[1].trim()
        : stage1Text.trim();

    let contextData: unknown;
    try {
      contextData = await executePrismaQueryFromText(prismaQuery);
    } catch (execError) {
      console.error('Failed to execute Prisma query from LLM:', execError);
      contextData = await fetchContextForTables(tableResults);
    }

    const contextStr = JSON.stringify(contextData, null, 2);

    const stage2SystemPrompt = buildPrismaResponsePrompt({
      userQuery,
      prismaQuery,
      context: contextStr,
    });

    // Build chat messages for stage 2 from the original request,
    // falling back to a single user message with the extracted query.
    const stage2Messages: CoreMessage[] = messages
      .map((m): CoreMessage => ({
        role:
          m.role === 'assistant' || m.role === 'system' || m.role === 'user'
            ? (m.role as 'assistant' | 'system' | 'user')
            : 'user',
        content: extractTextFromMessage(m),
      }))
      .filter((m) => typeof m.content === 'string' && m.content.trim().length > 0);

    if (stage2Messages.length === 0) {
      stage2Messages.push({
        role: 'user',
        content: userQuery,
      });
    }

    const result = streamText({
      model: openai('gpt-5-nano'),
      system: stage2SystemPrompt,
      messages: stage2Messages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    const errorObj = error as { message?: string };
    return new Response(
      JSON.stringify({
        error: errorObj?.message || 'Failed to process chat request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}