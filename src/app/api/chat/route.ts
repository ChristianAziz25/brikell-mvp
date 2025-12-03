import { getSystemPrompt } from '@/lib/openai/config';
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages, context }: { messages: UIMessage[]; context?: 'capex' | 'opex' | 'all' | 'general' } = await req.json();

    console.log(context)

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = getSystemPrompt(context);
    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: openai('gpt-5-nano'),
      system: systemPrompt,
      messages: modelMessages,
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