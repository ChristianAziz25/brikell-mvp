import { ragTools } from '@/lib/ai/tools/ragTools';
import { generateEmbeddings } from '@/lib/rag/embedding';
import { openai } from '@ai-sdk/openai';
import { type UIMessage, streamText, tool } from 'ai';
import { z } from 'zod';
import { extractTextFromMessage } from './utils/extractLatestMesaage';

export async function POST(req: Request) {
  try {
    const {
      messages,
    }: {
      messages: UIMessage[];
    } = await req.json();


    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Find the latest user message content to drive retrieval
    // Iterate backwards to find the most recent user message
    let latestUserMessage: UIMessage | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'user') {
        latestUserMessage = messages[i];
        break;
      }
    }

    if (!latestUserMessage) {
      return new Response(
        JSON.stringify({ error: 'No user message found in request' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const userQuery = extractTextFromMessage(latestUserMessage);

    if (!userQuery.trim()) {
      return new Response(
        JSON.stringify({ error: 'Empty user query' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const embeddedUserQuery = await generateEmbeddings(userQuery);

    // Build system prompt that guides the LLM to use tools appropriately
    const systemPrompt = `You are a helpful assistant. You can answer general questions directly, but when a user asks about real estate data (properties, rent rolls, units, financials, etc.), you should use the chainFewShotQuery tool to query the database.

Important:
- Answer general questions, greetings, and non-database queries directly without using any tools
- ONLY use the chainFewShotQuery tool when the user is asking about real estate data that requires querying the database
- Examples that require the tool: "What properties do we have?", "Show me rent roll data", "What's the occupancy rate?", "List all units"
- Examples that do NOT require the tool: "Hello", "What is NOI?", "Explain what a rent roll is", general real estate concepts
- When you do use the tool, provide a clear, natural language answer based on the query results
- If a tool returns an error (success: false), explain to the user that there was an issue processing their request and provide helpful guidance
- Always provide a response to the user, even if tool execution fails
- Do not mention Prisma, queries, or databases in your final answer - just provide the information naturally`;

    // Convert messages to the format expected by streamText
    const formattedMessages = messages
      .map((m) => ({
        role:
          m.role === 'assistant' || m.role === 'system' || m.role === 'user'
            ? (m.role as 'assistant' | 'system' | 'user')
            : 'user',
        content: extractTextFromMessage(m),
      }))
      .filter(
        (m) => typeof m.content === 'string' && m.content.trim().length > 0,
      );

    if (formattedMessages.length === 0) {
      formattedMessages.push({
        role: 'user',
        content: userQuery,
      });
    }

    // Use streamText with tools - the LLM will decide when to call each tool
    const result = streamText({
      model: openai('gpt-5-nano'),
      system: systemPrompt,
      messages: formattedMessages,
      tools: {
        chainFewShotQuery: tool({
          description: 'ONLY use this tool when the user is asking a specific question about real estate data that requires querying the database (e.g., "What properties do we have?", "Show me rent roll units", "What is the occupancy rate for Property X?"). Do NOT use this tool for general questions, greetings, explanations of concepts, or questions that don\'t require database queries.',
          inputSchema: z.object({
            query: z.string().describe('The user\'s question about real estate data that requires a database query'),
          }),
          execute: async ({ query }) => {
            try {
              const result = await ragTools.chainFewShotQuery(query);
              return result.response;
            } catch (error) {
              // Ensure errors are properly caught and returned as a structured response
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error('Tool execution error:', errorMessage);
              return {
                success: false,
                data: null,
                error: `Failed to execute query: ${errorMessage}`,
                usedFallback: false,
              };
            }
          },
        }),
      },
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