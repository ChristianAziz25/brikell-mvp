import { numericalQueryRAG } from '@/lib/rag/combinedRAG';
import { type UIMessage } from 'ai';
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

    // Find the latest user message
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

    // Call the combined RAG function
    const { success, response, error } = await numericalQueryRAG(userQuery, {
      tableLimit: 5,
      fewShotLimit: 5,
    });

    if (!success) {
      return new Response(
        JSON.stringify({ error: error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Return the stream response (response is always StreamObjectResult now)
    return response.toTextStreamResponse();
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