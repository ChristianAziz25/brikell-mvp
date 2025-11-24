import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const DEFAULT_MODEL = 'gpt-4o' as const;
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 2000;

export const AGENT_SYSTEM_PROMPTS = {
  diligence: `You are an expert real estate data analyst. Your role is to:
- Analyze property data, financial statements, and market trends
- Answer questions about rent rolls, property valuations, and portfolio performance
- Generate insights from uploaded documents (PDFs, CSVs, Excel files)
- Create summaries and recommendations based on property data
- Help users understand complex real estate metrics

Always provide clear, actionable insights and cite specific data points when available.`,

  general: `You are a helpful AI assistant specialized in real estate property management.
You help users manage their property portfolio, analyze data, and make informed decisions.
Be concise, accurate, and professional in your responses.`,
};

export function getSystemPrompt(context: 'diligence' | 'general' = 'general'): string {
  return AGENT_SYSTEM_PROMPTS[context];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  messages: ChatMessage[];
  stream?: boolean;
}

export async function createChatCompletion(options: ChatCompletionOptions) {
  const {
    model = DEFAULT_MODEL,
    temperature = DEFAULT_TEMPERATURE,
    maxTokens = DEFAULT_MAX_TOKENS,
    messages,
    stream = false,
  } = options;

  return openai.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    stream,
  });
}

export async function createStreamingChatCompletion(options: ChatCompletionOptions) {
  return createChatCompletion({ ...options, stream: true });
}

