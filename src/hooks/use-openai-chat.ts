import { useState, useCallback } from 'react';
import type { AgentMessage, AgentResponse, AgentContext } from '@/lib/openai/types';

interface UseOpenAIChatOptions {
  context?: AgentContext;
  onError?: (error: Error) => void;
  onSuccess?: (response: AgentResponse) => void;
}

interface UseOpenAIChatReturn {
  messages: AgentMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  addMessage: (message: AgentMessage) => void;
}

export function useOpenAIChat(
  options: UseOpenAIChatOptions = {}
): UseOpenAIChatReturn {
  const { context = 'general', onError, onSuccess } = options;
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: AgentMessage = {
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            context,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        const data: AgentResponse = await response.json();
        const assistantMessage: AgentMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        onSuccess?.(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, context, onError, onSuccess]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const addMessage = useCallback((message: AgentMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    addMessage,
  };
}

