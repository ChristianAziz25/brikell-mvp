import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';

const embeddingModel = openai.embedding('text-embedding-3-small');

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split('.')
    .filter(i => i !== '');
};

export const generateEmbeddings = async (
  value: string,
): Promise<number[]> => {
  // For short queries, don't chunk
  if (value.length < 500) {
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: [value],
    });
    return embeddings[0];
  }

  // Only chunk for longer text
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings[0];
};