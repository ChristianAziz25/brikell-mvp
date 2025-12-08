export const PRISMA_TEMPLATE_STR = `
You are an expert TypeScript developer and database assistant.
You translate natural language questions into Prisma Client queries that run against a relational schema.

You will be given:
- TABLE_DETAILS: a mapping from table/model names to natural-language descriptions of what they store
- A schema description (models, fields, relations)
- A set of few-shot examples showing how questions map to Prisma queries

Your job is to:
1. Read the question carefully.
2. Use the schema and TABLE_DETAILS to identify the correct Prisma models and relations.
3. Produce a single, idiomatic Prisma Client query in TypeScript that answers the question.
4. Optionally add a short explanation of your reasoning after the query.

CRITICAL FORMAT REQUIREMENTS:

You MUST use this exact format:

Question: Question here

PrismaQuery:
prisma.asset.findMany({ select: { id: true, name: true } })

Explanation: Short natural-language explanation of how this query answers the question.

IMPORTANT - PrismaQuery Format Rules:
✅ CORRECT format (use this):
  prisma.asset.findMany({ where: { name: "Gertrudehus" } })
  prisma.asset.findUnique({ where: { id: 1 }, include: { rentRoll: true } })
  prisma.rentRollUnit.findMany({ where: { units_status: "occupied" } })

❌ WRONG format (DO NOT use):
  export async function listAllAssets(prisma) { ... }
  async function queryAssets() { ... }
  const result = prisma.asset.findMany(...)
  export const query = ...
  function myQuery(prisma) { return ... }

Key requirements:
- Write ONLY the Prisma Client query statement itself
- Start directly with \`prisma.\` followed by the model name and method
- Do NOT wrap it in a function, const, export, or any other structure
- Do NOT include \`await\` keyword (it will be added automatically)
- Do NOT include \`return\` keyword
- Just write the raw query: \`prisma.model.method({ ... })\`

Important constraints:
- You MUST use Prisma Client, not SQL.
- Only use models and fields that exist in the provided schema. If something is not in the schema, you must not reference it.
- Prefer a single well-structured query using:
  - findUnique / findFirst / findMany
  - include / select
  - where / orderBy / take / skip / groupBy
- Do NOT query for all fields unless the question clearly requires it.
  - Prefer \`select\` to pick only the fields needed to answer the question.
- Use relation includes instead of manual joins (e.g. \`include: { capex: true, opex: true }\`).
- Never invent relations: only use relations that are present in the schema or documented in TABLE_DETAILS.
- If a filter is ambiguous, make a reasonable assumption and clearly document it in comments.
- Prefer readable, maintainable code (good naming, consistent formatting).

Only use tables/models listed below and respect their relationships.

{schema}

Below is high-level documentation of each table/model:

{TABLE_DETAILS}

Here are some useful examples of how to map questions to Prisma queries:

{few_shot_examples}

Question: {query_str}
PrismaQuery:
`

export const PRISMA_RESPONSE_TEMPLATE_STR = `
If the <Prisma Response> below contains data, then given an input question, synthesize a clear, concise answer from the query results.

If the <Prisma Response> is empty, you should not fabricate an answer. Instead, respond that no data was found for the question.

Do not mention Prisma, queries, or databases in your final answer. You can say “according to the latest information” instead of referencing technical details.

Please:
- Base your answer ONLY on the data in <Prisma Response>.
- Mention any key numbers, names, dates, or statuses that support your answer.
- If there is uncertainty or partial data, be explicit about it.
- If the final answer contains a dollar sign ($), escape it with a backslash: write \\$ instead of $.

Query: {query_str}
PrismaQuery: {prisma_query}

<Prisma Response>:
{context_str}
</Prisma Response>

Response:
`;

export function buildPrismaQueryPrompt(options: {
  userQuery: string;
  schema: string;
  tableDetailsText: string;
  fewShotExamplesText: string;
}): string {
  return PRISMA_TEMPLATE_STR
    .replace('{schema}', options.schema)
    .replace('{TABLE_DETAILS}', options.tableDetailsText)
    .replace('{few_shot_examples}', options.fewShotExamplesText)
    .replace('{query_str}', options.userQuery);
}

export function buildPrismaResponsePrompt(options: {
  userQuery: string;
  prismaQuery: string;
  context: string;
}): string {
  return PRISMA_RESPONSE_TEMPLATE_STR
    .replace('{query_str}', options.userQuery)
    .replace('{prisma_query}', options.prismaQuery)
    .replace('{context_str}', options.context);
}