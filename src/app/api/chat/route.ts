import { numericalQueryRAG } from '@/lib/rag/combinedRAG';
import { type CoreMessage, type UIMessage } from 'ai';
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

    // Convert UIMessages to CoreMessages for conversation history
    // Exclude the current message (we'll add it separately)
    const conversationHistory: CoreMessage[] = messages
      .filter((msg) => {
        // Exclude the latest user message (we'll add it as the current query)
        if (msg === latestUserMessage) return false;
        // Only include user and assistant messages
        return msg.role === 'user' || msg.role === 'assistant';
      })
      .map((msg) => {
        const content = extractTextFromMessage(msg);
        return {
          role: msg.role as 'user' | 'assistant',
          content,
        };
      });

    // Call the combined RAG function with conversation history
    const { response } = await numericalQueryRAG(userQuery, req.signal, {
      tableLimit: 3,
      fewShotLimit: 2,
      conversationHistory,
    });

    // Always return the stream response - errors are handled within the stream
    if (typeof response === 'string') {
      // If response is a string (unexpected), wrap it in a JSON error
      return new Response(
        JSON.stringify({ error: response }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Return the stream response (errors are included in the stream)
    // streamText returns StreamTextResult which has toTextStreamResponse()
    const streamStartTime = performance.now();
    const streamResponse = response.toTextStreamResponse();
    
    // Track first token timing by wrapping the response body
    if (streamResponse.body) {
      const originalReader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let firstTokenLogged = false;
      let buffer = '';
      
      const trackedStream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await originalReader.read();
              if (done) {
                controller.close();
                break;
              }
              
              if (!firstTokenLogged && value) {
                firstTokenLogged = true;
                buffer += decoder.decode(value, { stream: true });
                const firstChar = buffer.trim()[0];
                if (firstChar) {
                  const firstTokenTime = performance.now() - streamStartTime;
                  console.log(`🎯 [API] First token received! Stream delay: ${firstTokenTime.toFixed(2)}ms`);
                }
              }
              
              controller.enqueue(value);
            }
          } catch (error) {
            controller.error(error);
          }
        }
      });
      
      return new Response(trackedStream, {
        status: streamResponse.status,
        statusText: streamResponse.statusText,
        headers: streamResponse.headers,
      });
    }
    
    return streamResponse;
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