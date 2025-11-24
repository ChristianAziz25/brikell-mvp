export interface AgentMessage {
  id?: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface AgentResponse {
  message: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AgentError {
  error: string;
  code?: string;
  details?: unknown;
}

export type AgentContext = 'diligence' | 'general';

export interface AgentConfig {
  context?: AgentContext;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

