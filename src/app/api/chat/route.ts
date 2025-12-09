import { openai } from '@ai-sdk/openai';
import { streamText, type UIMessage } from 'ai';
import { createPrismaQueryGenTool } from './tools';

export async function POST(req: Request) {
  try {
    const {
      messages,
    }: {
      messages: UIMessage[];
    } = await req.json();

    const prismaQueryGenTool = createPrismaQueryGenTool(messages);


    const result = streamText({
      model: openai('gpt-5-nano'),
      messages: [
        { role: 'user', content: 'Generate a Prisma query for the user\'s query' },
      ],
      tools: {prismaQueryGenTool},
      toolChoice: 'auto',
    });
    console.log(result.textStream);
    for await (const text of result.textStream) {
      process.stdout.write(text);
    }
    return result
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