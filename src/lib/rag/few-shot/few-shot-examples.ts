export const fewShotExamples = {
  'Given an asset name like "Gertrudehus", how do I fetch its rent roll, capex, and opex rows together?': [
    '1. Look up the `Asset` row to get its `id`:',
    '   - `SELECT id FROM asset WHERE name = \'Gertrudehus\';`',
    '2. Use that `id` as `assetId` to join the related tables:',
    '   - Rent roll units: `SELECT * FROM rent_roll_unit WHERE assetId = $assetId;`',
    '   - Capex rows: `SELECT * FROM capex WHERE assetId = $assetId;`',
    '   - Opex rows: `SELECT * FROM opex WHERE assetId = $assetId;`',
    '3. In Prisma you would typically do a single relational query:',
    '   - `prisma.asset.findUnique({ where: { name: "Gertrudehus" }, include: { rentRoll: true, capex: true, opex: true } })`.',
  ].join('\n'),

  'How do I get all occupied rent roll units for a given asset and join their opex for 2025?': [
    '1. Look up the asset to get `assetId` from the `asset` table.',
    '2. Fetch occupied units for that asset:',
    '   - `SELECT * FROM rent_roll_unit WHERE assetId = $assetId AND units_status = \'occupied\';`',
    '3. Separately query the `opex` table for the same `assetId` and `opex_year = 2025`:',
    '   - `SELECT * FROM opex WHERE assetId = $assetId AND opex_year = 2025;`',
    '4. Join or merge the results in application code, keyed by `assetId` and `opex_year`.',
  ].join('\n'),

  'What is stored in the `Asset` table and how is it used as a foreign key?': [
    'The `Asset` model is the parent entity:',
    '- Fields: `id` (primary key), `name`, `address`, `city`, `country`, timestamps.',
    '- Relations: one-to-many to `Capex`, `Opex`, and `RentRollUnit` via `assetId`.',
    'Other tables never duplicate the full asset info: they just store `assetId` (and sometimes `asset_name` for readability) and rely on the `asset` table as the single source of truth.',
  ].join('\n'),

  'How would I fetch all assets with their basic rent roll summary?': [
    'Use a relational query that includes the rent roll relation and aggregates by asset:',
    '- Prisma example:',
    '  `prisma.asset.findMany({ include: { rentRoll: true } })`.',
    'In SQL you could join and group:',
    '- `SELECT a.id, a.name, COUNT(r.unit_id) AS unit_count',
    '   FROM asset a',
    '   LEFT JOIN rent_roll_unit r ON r.assetId = a.id',
    '   GROUP BY a.id, a.name;`',
  ].join('\n'),

  'How is `Capex` linked to `Asset`, and how do I ensure one row per asset per year?': [
    'The `Capex` model has:',
    '- `assetId` as a foreign key to `Asset.id`.',
    '- A compound unique constraint `@@unique([assetId, capex_year])`.',
    'This means for each asset and year combination there can be at most one capex record.',
  ].join('\n'),

  'Write a query to fetch 2025 capex for "Emmahus" and include the asset name.': [
    'In SQL:',
    '- `SELECT c.*',
    '     FROM capex c',
    '     JOIN asset a ON c.assetId = a.id',
    '    WHERE a.name = \'Emmahus\' AND c.capex_year = 2025;`',
    'In Prisma:',
    '- `prisma.capex.findFirst({ where: { capex_year: 2025, asset: { name: "Emmahus" } }, include: { asset: true } })`.',
  ].join('\n'),

  'Explain the `Opex` model and how it connects to an asset for a specific year.': [
    'The `Opex` model stores operating expenses per asset and year:',
    '- Foreign key: `assetId` → `Asset.id`.',
    '- Year: `opex_year`.',
    '- Compound unique key `@@unique([assetId, opex_year])` to enforce one opex row per asset and year.',
    'This lets you join opex to assets by `assetId` and filter by `opex_year`.',
  ].join('\n'),

  'How do I list all opex rows with their corresponding asset names and total budget opex?': [
    'In SQL:',
    '- `SELECT a.name, o.opex_year, o.budget_total_opex',
    '     FROM opex o',
    '     JOIN asset a ON o.assetId = a.id',
    '    ORDER BY a.name, o.opex_year;`',
    'The join is always on `o.assetId = a.id`, and `budget_total_opex` is an `Int` representing the total budgeted operating expenses.',
  ].join('\n'),

  'What does each `RentRollUnit` row represent in this schema?': [
    'Each `RentRollUnit` is a single leased (or leasable) unit within an asset:',
    '- It references its parent asset via `assetId` → `Asset.id`.',
    '- Identified by `unit_id` (primary key).',
    '- Stores physical attributes (size, rooms, floor, door), financials (current and budget rent),',
    '  lease dates, tenant names/contact, and the `units_status` enum (occupied, vacant, terminated).',
  ].join('\n'),

  'How can I query all occupied units in "Gertrudehus" with their monthly current rent?': [
    'In SQL:',
    '- `SELECT r.*',
    '     FROM rent_roll_unit r',
    '     JOIN asset a ON r.assetId = a.id',
    '    WHERE a.name = \'Gertrudehus\' AND r.units_status = \'occupied\';`',
    'In Prisma:',
    '- `prisma.rentRollUnit.findMany({ where: { units_status: "occupied", asset: { name: "Gertrudehus" } } })`.',
    'Both queries rely on the foreign key `rent_roll_unit.assetId` pointing to the correct `asset.id`.',
  ].join('\n'),
}
