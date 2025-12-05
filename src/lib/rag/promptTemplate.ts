export const tableDetails = {
  Capex: `
Capex is the capital expenditures table for each real-estate asset and year. It captures one‑off or infrequent investment costs that improve or extend the life of the property.
- id: unique identifier for this capex record
- asset_name: human‑readable name of the related asset
- capex_year: fiscal year the capex relates to
- common_areas_actuals: actual capex spent on common areas
- units_renovations_actuals: actual capex spent on unit renovations
- elevator_maintnance_actuals: actual capex spent on elevator maintenance
- roof_maintnance_actuals: actual capex spent on roof maintenance
- fire_safety_actuals: actual capex spent on fire‑safety improvements
- outdoor_area_actuals: actual capex spent on outdoor areas
- common_areas_budget: budgeted capex for common areas
- units_renovations_budget: budgeted capex for unit renovations
- elevator_maintnance_budget: budgeted capex for elevator maintenance
- roof_maintnance_budget: budgeted capex for roof maintenance
- fire_safety_budget: budgeted capex for fire‑safety work
- outdoor_area_budget: budgeted capex for outdoor areas
- created_at: timestamp when this capex row was created
- updated_at: timestamp of the last update
- assetId: foreign key linking to the parent Asset row
`.trim(),

  Opex: `
Opex is the operating expenses table for each asset and year. It tracks recurring costs required to operate the property on an ongoing basis.
- id: unique identifier for this opex record
- asset_name: human‑readable name of the related asset
- opex_year: fiscal year the opex relates to
- actual_delinquency: realized loss from unpaid rent and delinquencies
- actual_property_management_fee: actual fee paid to the property manager
- actual_leasing_fee: actual leasing and brokerage fees
- actual_property_taxes: actual property tax payments
- actual_refuse_collection: actual waste and refuse collection costs
- actual_insurance: actual insurance premiums paid
- actual_cleaning: actual cleaning and janitorial expenses
- actual_facility_management: actual facility management costs
- actual_service_subscriptions: actual service and subscription expenses
- actual_common_consumption: actual costs for common‑area utilities
- actual_home_owner_association: actual HOA or condo association fees
- budget_delinquency: budgeted delinquency amount
- budget_property_management_fee: budgeted property management fee
- budget_leasing_fee: budgeted leasing fees
- budget_property_taxes: budgeted property tax expense
- budget_refuse_collection: budgeted refuse collection costs
- budget_insurance: budgeted insurance premiums
- budget_cleaning: budgeted cleaning expense
- budget_facility_management: budgeted facility management costs
- budget_service_subscriptions: budgeted service and subscription costs
- budget_common_consumption: budgeted common‑area utility costs
- budget_home_owner_association: budgeted HOA or condo association fees
- created_at: timestamp when this opex row was created
- updated_at: timestamp of the last update
- assetId: foreign key linking to the parent Asset row
`.trim(),

  RentRollUnit: `
RentRollUnit represents a single residential or commercial unit in an income‑producing asset. It combines physical attributes, tenancy details, and rent data for each unit.
- assetId: foreign key linking this unit to its parent Asset
- asset: relation to the Asset this unit belongs to
- property_build_year: year the building was constructed
- property_name: marketing or legal name of the property
- unit_address: street address of the unit
- unit_zipcode: postal or ZIP code of the unit
- utilites_cost: utilities cost attributable to this unit
- unit_type: type of unit (e.g. apartment, retail, office)
- size_sqm: unit size in square meters
- rooms_amount: total number of rooms
- bedrooms_amount: number of bedrooms
- bathrooms_amount: number of bathrooms
- rent_current_gri: current gross rent income for the unit
- rent_budget_tri: budgeted rent for the unit
- lease_start: lease start date (string representation)
- lease_end: lease end date (string or null if open‑ended)
- tenant_name1: primary tenant name
- tenant_name2: secondary tenant name (if any)
- unit_id: unique numeric identifier for the unit (primary key)
- unit_door: door or apartment number
- unit_floor: floor number of the unit
- tenant_number1: primary tenant phone number
- tenant_number2: secondary tenant phone number
- units_status: lease status (occupied, vacant, or terminated)
- tenant_mail1: primary tenant email
- tenant_mail2: secondary tenant email
- created_at: timestamp when this unit row was created
- updated_at: timestamp of the last update
`.trim(),

  Asset: `
Asset is the core property table. Each row represents a single real‑estate asset in the portfolio and acts as the parent for capex, opex, and rent roll data.
- id: unique identifier for the asset
- name: asset name used across capex, opex, and rent roll tables
- address: street address of the property (optional)
- city: city where the property is located (optional)
- country: country where the property is located (optional)
- capex: relation to all Capex rows for this asset
- opex: relation to all Opex rows for this asset
- rentRoll: relation to all RentRollUnit rows for this asset
- created_at: timestamp when the asset was created
- updated_at: timestamp of the last update
`.trim(),
};

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

export function serializeTableDetails(): string {
  return Object.entries(tableDetails)
    .map(([name, description]) => `${name}:\n${description}`)
    .join('\n\n');
}

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