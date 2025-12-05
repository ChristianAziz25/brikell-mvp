import { ragTools } from '@/lib/ai/tools/ragTools';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

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

    // Build system prompt that guides the LLM to use tools in sequence
    const systemPrompt = `You are a helpful database assistant. When a user asks a question about real estate data, follow these steps:

1. First, use similaritySearchQuery to find similar example queries that show how similar questions were answered
2. Then, use similaritySearchTable to find the most relevant database tables for the query
3. Next, use generateQuery to create a Prisma database query using the examples and tables you found
4. Finally, use executeQuery to run the query and get the actual data
5. Once you have the data, provide a clear, natural language answer based on the query results

Important:
- Always follow this sequence: search examples → search tables → generate query → execute query → answer
- Be concise and helpful in your final answer
- If a query execution fails, the tool will attempt a fallback automatically
- Base your answer ONLY on the actual data returned from the query
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
      tools: ragTools,
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