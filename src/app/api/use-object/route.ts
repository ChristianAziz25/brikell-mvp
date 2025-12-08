import { numericalQueryRAG } from '@/lib/rag/combinedRAG';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // useObject sends the input directly as the request body (string)
    const userQuery = await req.text();

    if (!userQuery || !userQuery.trim()) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const { success, response, error } = await numericalQueryRAG(
      userQuery.trim(),
      {
        tableLimit: 5,
        fewShotLimit: 5,
      }
    );

    if (!success) {
      return new Response(
        JSON.stringify({ error: error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (typeof response === 'string') {
      return new Response(
        JSON.stringify({ error: response }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

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