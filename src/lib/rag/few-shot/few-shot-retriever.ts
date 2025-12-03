import { embedMany } from 'ai';
import { generateEmbeddings } from '../embedding';
import { fewShotExamples } from './few-shot-examples';

const embeddingModel = 'openai/text-embedding-3-small';

let cachedKeys: string[] | null = null;
let cachedEmbeddings: number[][] | null = null;
const TOP_K = 3;

const getFewShotEmbeddings = async () => {
  if (cachedKeys && cachedEmbeddings) {
    return { keys: cachedKeys, embeddings: cachedEmbeddings };
  }

  const keys = Object.keys(fewShotExamples);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: keys,
  });

  cachedKeys = keys;
  cachedEmbeddings = embeddings;

  return { keys, embeddings };
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const retrieveFewShotExample = async (query: string) => {
  const { keys, embeddings } = await getFewShotEmbeddings();

  const queryEmbedding = await generateEmbeddings(query);

  const scores = embeddings.map((e)=> cosineSimilarity(queryEmbedding, e));
  
  const ranked = scores.map((score,index)=>({score, index}))
        .sort((a,b)=>b.score - a.score)
        .slice(0, TOP_K);

  return ranked.map((item) => ({
    question: keys[item.index],
    answer: fewShotExamples[keys[item.index] as keyof typeof fewShotExamples],
    score: item.score,
  }));
};
