import { NextRequest } from 'next/server';
import {
  openai,
  getSystemPrompt,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
} from '@/lib/openai/config';
import type { AgentMessage } from '@/lib/openai/types';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const {
      messages,
      context = 'general',
      model = DEFAULT_MODEL,
      temperature = DEFAULT_TEMPERATURE,
      maxTokens = DEFAULT_MAX_TOKENS,
      systemPrompt,
    }: {
      messages: AgentMessage[];
      context?: 'diligence' | 'general';
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userMessages = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    const systemPromptText = systemPrompt || getSystemPrompt(context);

    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPromptText },
      ...userMessages,
    ];

    const stream = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: chatMessages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error('OpenAI streaming error:', error);

    const errorObj = error as { message?: string };
    return new Response(
      JSON.stringify({
        error: errorObj?.message || 'Failed to process streaming chat request',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

