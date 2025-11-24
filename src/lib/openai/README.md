# OpenAI Agent API Configuration

This module provides a complete setup for integrating OpenAI's API as an AI agent in your Next.js application.

## Setup

### 1. Install Dependencies

The OpenAI SDK is already installed. If you need to reinstall:

```bash
npm install openai
```

### 2. Environment Variables

Create a `.env.local` file in the root of your project:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

You can get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

### 3. Usage

#### Using the React Hook (Recommended)

```tsx
import { useOpenAIChat } from '@/hooks/use-openai-chat';

function MyComponent() {
  const { messages, isLoading, sendMessage, clearMessages } = useOpenAIChat({
    context: 'diligence', // or 'general'
    onError: (error) => console.error(error),
    onSuccess: (response) => console.log(response),
  });

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}
      <button onClick={() => sendMessage('Hello!')} disabled={isLoading}>
        Send
      </button>
    </div>
  );
}
```

#### Using the API Route Directly

```tsx
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'What is the total rent income?' }
    ],
    context: 'diligence',
  }),
});

const data = await response.json();
console.log(data.message);
```

#### Using Streaming (for real-time responses)

```tsx
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }],
    context: 'general',
  }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.content) {
        console.log(data.content); // Streamed content
      }
    }
  }
}
```

#### Using the Config Directly (Server-side)

```tsx
import { createChatCompletion, getSystemPrompt } from '@/lib/openai/config';

const completion = await createChatCompletion({
  messages: [
    { role: 'system', content: getSystemPrompt('diligence') },
    { role: 'user', content: 'Analyze this property data...' },
  ],
  model: 'gpt-4o',
  temperature: 0.7,
});
```

## API Routes

### POST `/api/chat`

Standard chat completion endpoint.

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Your message here" }
  ],
  "context": "diligence" | "general",
  "model": "gpt-4o" (optional),
  "temperature": 0.7 (optional),
  "maxTokens": 2000 (optional)
}
```

**Response:**
```json
{
  "message": "Assistant response",
  "usage": {
    "promptTokens": 100,
    "completionTokens": 50,
    "totalTokens": 150
  }
}
```

### POST `/api/chat/stream`

Streaming chat completion endpoint (Server-Sent Events).

**Request Body:** Same as `/api/chat`

**Response:** Text stream with `data: { "content": "..." }` chunks

## Configuration

### Models

Default model is `gpt-4o`. You can override it in the API request:

- `gpt-4o` - Latest and most capable
- `gpt-4-turbo` - Fast and efficient
- `gpt-3.5-turbo` - Cost-effective

### Contexts

Two predefined contexts with specialized system prompts:

- **`diligence`**: Real estate data analyst focused on property analysis
- **`general`**: General-purpose assistant for property management

You can customize system prompts in `src/lib/openai/config.ts`.

### Parameters

- **temperature**: 0.0-2.0 (default: 0.7) - Controls randomness
- **maxTokens**: 1-4096 (default: 2000) - Maximum response length

## Error Handling

The API routes handle common errors:

- **401**: Invalid API key
- **429**: Rate limit exceeded
- **500**: Server error

All errors return a JSON response with an `error` field.

## Security Notes

- Never expose your API key in client-side code
- All API calls go through Next.js API routes (server-side)
- Consider implementing rate limiting for production
- Monitor API usage to control costs

## Example Integration

See `src/app/diligence/page.tsx` for a complete example of integrating the chat agent into a UI component.

