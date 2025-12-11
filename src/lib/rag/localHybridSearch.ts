import { generateEmbeddings } from "./embedding";
import {
    fewShotEmbeddings,
    tableDetailEmbeddings,
    type FewShotEmbedding,
    type TableDetailEmbedding,
} from "./localRagEmbeddings.generated";

type HybridSearchOptions = {
  limit?: number;
  fullTextWeight?: number;
  semanticWeight?: number;
  rrfK?: number;
};

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function lexicalScore(query: string, text: string): number {
  const qTokens = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length >= 3);

  if (!qTokens.length) return 0;

  const lowerText = text.toLowerCase();
  let matches = 0;

  for (const token of qTokens) {
    if (lowerText.includes(token)) {
      matches += 1;
    }
  }

  return matches / qTokens.length;
}

function applyHybridRanking<T extends { id: string }>(
  items: T[],
  getEmbedding: (item: T) => number[],
  getLexicalText: (item: T) => string,
  query: string,
  queryEmbedding: number[],
  {
    limit = 5,
    fullTextWeight = 1.0,
    semanticWeight = 1.0,
    rrfK = 50,
  }: HybridSearchOptions = {}
): Array<{ item: T; score: number }> {
  if (!items.length) return [];

  const semanticScores = new Map<string, number>();
  const lexicalScores = new Map<string, number>();

  // Compute raw scores
  for (const item of items) {
    const emb = getEmbedding(item);
    semanticScores.set(item.id, cosineSimilarity(queryEmbedding, emb));
    lexicalScores.set(item.id, lexicalScore(query, getLexicalText(item)));
  }

  // Compute ranks (higher score -> better rank, i.e., rank 1 is best)
  const semanticRanks = new Map<string, number>();
  const lexicalRanks = new Map<string, number>();

  const bySemantic = [...items].sort((a, b) => {
    return (
      (semanticScores.get(b.id) ?? 0) - (semanticScores.get(a.id) ?? 0)
    );
  });
  bySemantic.forEach((item, idx) => {
    semanticRanks.set(item.id, idx + 1);
  });

  const byLexical = [...items].sort((a, b) => {
    return (lexicalScores.get(b.id) ?? 0) - (lexicalScores.get(a.id) ?? 0);
  });
  byLexical.forEach((item, idx) => {
    lexicalRanks.set(item.id, idx + 1);
  });

  // Apply Reciprocal Rank Fusion-style combination
  const scored: Array<{ item: T; score: number }> = [];
  for (const item of items) {
    const sRank = semanticRanks.get(item.id);
    const fRank = lexicalRanks.get(item.id);

    const semScore =
      sRank != null ? semanticWeight * (1.0 / (rrfK + sRank)) : 0;
    const ftScore =
      fRank != null ? fullTextWeight * (1.0 / (rrfK + fRank)) : 0;

    scored.push({ item, score: semScore + ftScore });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export async function localSearchTableDetails(
  queryText: string,
  queryEmbedding?: number[],
  options?: HybridSearchOptions
): Promise<
  Array<{
    id: string;
    tableName: string;
    description: string;
    metadata: Record<string, unknown>;
    score: number;
  }>
> {
  const embedding =
    queryEmbedding ?? (await generateEmbeddings(queryText));

  const ranked = applyHybridRanking<TableDetailEmbedding>(
    tableDetailEmbeddings,
    (item) => item.embedding,
    (item) => `${item.name}\n${item.description}`,
    queryText,
    embedding,
    options
  );

  return ranked.map(({ item, score }) => ({
    id: item.id,
    tableName: item.name,
    description: item.description,
    metadata: {},
    score,
  }));
}

export async function localSearchFewShotQueries(
  queryText: string,
  queryEmbedding?: number[],
  options?: HybridSearchOptions
): Promise<
  Array<{
    id: string;
    query: string;
    sql: string;
    metadata: Record<string, unknown>;
    score: number;
  }>
> {
  const embedding =
    queryEmbedding ?? (await generateEmbeddings(queryText));

  const ranked = applyHybridRanking<FewShotEmbedding>(
    fewShotEmbeddings,
    (item) => item.embedding,
    (item) => `${item.query}\n${item.answer}`,
    queryText,
    embedding,
    options
  );

  return ranked.map(({ item, score }) => ({
    id: item.id,
    query: item.query,
    sql: item.answer,
    metadata: {},
    score,
  }));
}


