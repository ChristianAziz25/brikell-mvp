import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';
import { generateEmbeddings } from '../embedding';
import { tableDetails } from '../promptTemplate';
import { cosineSimilarity } from '../similaritySearch';
import { fewShotExamples } from './fewShotExamples';

const embeddingModel = openai.embedding('text-embedding-3-small');

let cachedKeys: string[] | null = null;
let cachedEmbeddings: number[][] | null = null;
let queryEmbeddingsCache: number[] | null = null;
let cachedTables: string[] | null = null;
let cachedTablesEmbeddings: number[][] | null = null;
const TOP_K = 2;
const NUM_TABLES_CONSIDERED = 3;

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

const getTableEmbeddings = async () => {
  if (cachedTables && cachedTablesEmbeddings) {
    return { tables: cachedTables, embeddings: cachedTablesEmbeddings };
  }

  const tableNames = Object.keys(tableDetails);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: tableNames.map(
      (name) =>
        `${name}: ${tableDetails[name as keyof typeof tableDetails]}`,
    ),
  });

  cachedTables = tableNames;
  cachedTablesEmbeddings = embeddings;

  return { tables: tableNames, embeddings };
};

export const retrieveFewShotExample = async (query: string) => {
  const { keys, embeddings } = await getFewShotEmbeddings();

  if (!queryEmbeddingsCache) {
    queryEmbeddingsCache = await generateEmbeddings(query);
  }

  const scores = embeddings.map((e)=> cosineSimilarity(queryEmbeddingsCache!, e));

  const ranked = scores.map((score,index)=>({score, index}))
        .sort((a,b)=>b.score - a.score)
        .slice(0, TOP_K);

  return ranked.map((item) => ({
    question: keys[item.index],
    answer: fewShotExamples[keys[item.index] as keyof typeof fewShotExamples],
    score: item.score,
  }));
};

export const retrieveTopTables = async (query: string) => {
  const { tables, embeddings } = await getTableEmbeddings();

  if (!queryEmbeddingsCache) {
    queryEmbeddingsCache = await generateEmbeddings(query);
  }

  const scores = embeddings.map((e) =>
    cosineSimilarity(queryEmbeddingsCache!, e),
  );

  const ranked = scores
    .map((score, index) => ({ score, index }))
    .sort((a, b) => b.score - a.score)
    .slice(0, NUM_TABLES_CONSIDERED);

  return ranked.map((item) => ({
    tableName: tables[item.index],
    description: tableDetails[tables[item.index] as keyof typeof tableDetails],
    score: item.score,
  }));
};
