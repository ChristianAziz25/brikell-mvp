export const tableDetails = {
    Capex: `
  Capex is the capital expenditures table for each real-estate asset and year. It captures one‑off or infrequent investment costs that improve or extend the life of the property.
  - id: unique identifier for this capex record
  - asset: relation to the Asset this capex belongs to
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
  - asset: relation to the Asset this opex belongs to
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
  - unit_id: unique numeric identifier for the unit (primary key)
  - unit_door: door or apartment number
  - unit_floor: floor number of the unit
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
  - tri: relation to the TheoreticalRentalIncome row for this asset
  - capex: relation to all Capex rows for this asset
  - opex: relation to all Opex rows for this asset
  - rentRoll: relation to all RentRollUnit rows for this asset
  - created_at: timestamp when the asset was created
  - updated_at: timestamp of the last update
  `.trim(),
};

export const fewShotQueries = {
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
  
  