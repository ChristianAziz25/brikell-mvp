import {
    createChatCompletion,
    DEFAULT_MAX_TOKENS,
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    getSystemPrompt
} from '@/lib/openai/config';
import type { AgentMessage } from '@/lib/openai/types';
import { NextRequest, NextResponse } from 'next/server';
import type { ChatCompletion } from 'openai/resources/chat/completions';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
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
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const userMessages = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    const systemPromptText =
      systemPrompt || getSystemPrompt(context);

    const chatMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPromptText },
      ...userMessages,
    ];

    if (process.env.NODE_ENV === 'development') {
      console.log('System prompt included:', {
        context,
        systemPromptLength: systemPromptText.length,
        totalMessages: chatMessages.length,
      });
    }

    const completion = await createChatCompletion({
      model,
      temperature,
      maxTokens,
      messages: chatMessages,
      stream: false,
    }) as ChatCompletion;

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: assistantMessage,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
    });
  } catch (error: unknown) {
    console.error('OpenAI API error:', error);

    const errorObj = error as { status?: number; message?: string };

    if (errorObj?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 401 }
      );
    }

    if (errorObj?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: errorObj?.message || 'Failed to process chat request',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

