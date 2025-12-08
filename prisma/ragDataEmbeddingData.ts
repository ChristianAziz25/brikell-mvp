export const tableDetails = {
  Capex: `
  Capex stores capital expenditure per asset and year.
  - id: unique identifier (primary key)
  - asset: relation to the parent Asset
  - asset_name: asset name (denormalized, not unique)
  - capex_year: year the capex relates to
  - common_areas_actuals: actual capex for common areas
  - units_renovations_actuals: actual capex for unit renovations
  - elevator_maintnance_actuals: actual capex for elevator maintenance
  - roof_maintnance_actuals: actual capex for roof maintenance
  - fire_safety_actuals: actual capex for fire‑safety work
  - outdoor_area_actuals: actual capex for outdoor areas
  - common_areas_budget: budgeted capex for common areas
  - units_renovations_budget: budgeted capex for unit renovations
  - elevator_maintnance_budget: budgeted capex for elevator maintenance
  - roof_maintnance_budget: budgeted capex for roof maintenance
  - fire_safety_budget: budgeted capex for fire‑safety work
  - outdoor_area_budget: budgeted capex for outdoor areas
  - created_at: row creation timestamp
  - updated_at: last update timestamp
  - assetId: foreign key to Asset.id
  `.trim(),
  
  Opex: `
  Opex stores operating expenses per asset and year.
  - id: unique identifier (primary key)
  - asset: relation to the parent Asset
  - asset_name: asset name (denormalized, not unique)
  - opex_year: fiscal year of the opex
  - actual_delinquency: realized loss from unpaid rent
  - actual_property_management_fee: actual property management fee
  - actual_leasing_fee: actual leasing/brokerage fees
  - actual_property_taxes: actual property tax payments
  - actual_refuse_collection: actual waste collection costs
  - actual_insurance: actual insurance premiums
  - actual_cleaning: actual cleaning/janitorial expenses
  - actual_facility_management: actual facility management costs
  - actual_service_subscriptions: actual service/subscription expenses
  - actual_common_consumption: actual common‑area utilities
  - actual_home_owner_association: actual HOA/condo fees
  - budget_delinquency: budgeted delinquency
  - budget_property_management_fee: budgeted property management fee
  - budget_leasing_fee: budgeted leasing fees
  - budget_property_taxes: budgeted property tax expense
  - budget_refuse_collection: budgeted refuse collection
  - budget_insurance: budgeted insurance premiums
  - budget_cleaning: budgeted cleaning
  - budget_facility_management: budgeted facility management
  - budget_service_subscriptions: budgeted services/subscriptions
  - budget_common_consumption: budgeted common‑area utilities
  - budget_home_owner_association: budgeted HOA/condo fees
  - created_at: row creation timestamp
  - updated_at: last update timestamp
  - assetId: foreign key to Asset.id
  `.trim(),
  
  RentRollUnit: `
  RentRollUnit stores per‑unit rent and tenancy data.
  - assetId: foreign key to the parent Asset
  - asset: relation to the parent Asset
  - property_build_year: year the building was constructed
  - property_name: property name
  - unit_address: unit street address
  - unit_zipcode: postal/ZIP code
  - utilites_cost: utilities cost for the unit
  - unit_type: unit type (e.g. apartment, retail, office)
  - size_sqm: unit size in square meters
  - rooms_amount: total room count
  - bedrooms_amount: number of bedrooms
  - bathrooms_amount: number of bathrooms
  - rent_current_gri: current gross rent income
  - rent_budget_tri: budgeted rent
  - lease_start: lease start date (string)
  - lease_end: lease end date (string or null)
  - tenant_name1: primary tenant name
  - tenant_name2: secondary tenant name
  - unit_id: unique numeric identifier (primary key)
  - unit_door: door or apartment number
  - unit_floor: floor number
  - tenant_number1: primary tenant phone
  - tenant_number2: secondary tenant phone
  - units_status: lease status (occupied, vacant, terminated)
  - tenant_mail1: primary tenant email
  - tenant_mail2: secondary tenant email
  - created_at: row creation timestamp
  - updated_at: last update timestamp
  `.trim(),
  
  Asset: `
  Asset is the core property table and parent for capex, opex, and rent roll.
  - id: unique identifier (primary key and only unique column)
  - name: human‑readable asset name (NOT unique)
  - address: property street address (optional)
  - city: city of the property (optional)
  - country: country of the property (optional)
  - tri: relation to TheoreticalRentalIncome rows
  - capex: relation to Capex rows
  - opex: relation to Opex rows
  - rentRoll: relation to RentRollUnit rows
  - created_at: row creation timestamp
  - updated_at: last update timestamp

  IMPORTANT PRISMA RULES:
  - Only "id" is unique; "name" is NOT unique in the schema.
  - Do NOT call prisma.asset.findUnique({ where: { name: ... } }) or prisma.asset.findUniqueOrThrow({ where: { name: ... } }).
  - For name filters, use prisma.asset.findFirst or prisma.asset.findMany with a "where" clause on "name".
  `.trim(),

  TheoreticalRentalIncome: `
  TheoreticalRentalIncome is the theoretical rental income for each asset and year. It is used to calculate the theoretical rental income for each asset and year.
  - id: unique identifier for this theoretical rental income record
  - assetId: foreign key linking to the parent Asset row
  - asset: relation to the Asset this theoretical rental income belongs to
  - triYear: fiscal year the theoretical rental income relates to
  - triAmount: theoretical rental income amount
  - vacancyLoss: vacancy loss amount
  - created_at: timestamp when this theoretical rental income row was created
  - updated_at: timestamp of the last update
  `.trim(),
};

export const fewShotQueries = {
    'Show me everything about Gertrudehus - all the units, expenses, and capital expenditures': 
      'Use Prisma\'s include to fetch related data in a single query. Since "name" is not unique on Asset, use findFirst instead of findUnique: `prisma.asset.findFirst({ where: { name: "Gertrudehus" }, include: { rentRoll: true, capex: true, opex: true } })`.',
  
    'What units are currently occupied at Gertrudehus?': 
      'Filter by units_status and use the asset relation: `prisma.rentRollUnit.findMany({ where: { units_status: "occupied", asset: { name: "Gertrudehus" } } })`.',
  
    'Show me all our properties': 
      'Get all assets: `prisma.asset.findMany({ include: { rentRoll: true } })`.',
  
    'What did we spend on capital expenditures for Emmahus in 2025?': 
      'Use nested where and include: `prisma.capex.findFirst({ where: { capex_year: 2025, asset: { name: "Emmahus" } }, include: { asset: { select: { name: true } } } })`.',
  
    'Show me all operating expenses for 2025': 
      'Filter by opex_year: `prisma.opex.findMany({ where: { opex_year: 2025 }, include: { asset: { select: { name: true } } } })`.',
  
    'Which units are vacant right now?': 
      'Filter by units_status: `prisma.rentRollUnit.findMany({ where: { units_status: "vacant" }, include: { asset: { select: { name: true } } } })`.',
  
    'What\'s the rent for all occupied units at Gertrudehus?': 
      'Filter by status and asset name, then select rent fields: `prisma.rentRollUnit.findMany({ where: { units_status: "occupied", asset: { name: "Gertrudehus" } }, select: { unit_id: true, rent_current_gri: true, unit_address: true } })`.',
  
    'Show me all properties in Denmark': 
      'Filter by country field: `prisma.asset.findMany({ where: { country: "Denmark" } })`.',
  
    'What maintenance costs did we have last year across all properties?': 
      'Filter by capex_year: `prisma.capex.findMany({ where: { capex_year: 2025 }, include: { asset: { select: { name: true } } } })`.',
  
    'Which units are generating more than 10,000 in rent?': 
      'Use gte (greater than or equal) filter: `prisma.rentRollUnit.findMany({ where: { rent_current_gri: { gte: 10000 } }, select: { unit_id: true, rent_current_gri: true, asset: { select: { name: true } } } })`.',
  
    'Show me the operating expenses for Gertrudehus over the last two years': 
      'Use in operator for multiple years: `prisma.opex.findMany({ where: { asset: { name: "Gertrudehus" }, opex_year: { in: [2024, 2025] } }, orderBy: { opex_year: "asc" } })`.',
  
    'What two-bedroom units do we have?': 
      'Filter by bedrooms_amount: `prisma.rentRollUnit.findMany({ where: { bedrooms_amount: 2 }, include: { asset: { select: { name: true } } } })`.',
  
    'Show me the theoretical rental income for all properties': 
      'Include the tri relation: `prisma.asset.findMany({ include: { tri: true } })`.',
  
    'What\'s our budget for property taxes, insurance, and cleaning this year?': 
      'Select only budget fields: `prisma.opex.findMany({ where: { opex_year: 2025 }, select: { asset_name: true, opex_year: true, budget_property_taxes: true, budget_insurance: true, budget_cleaning: true } })`.',
  
    'Which leases have been terminated?': 
      'Filter by units_status: `prisma.rentRollUnit.findMany({ where: { units_status: "terminated" }, include: { asset: { select: { name: true } } } })`.',
  
    'Did we go over budget on maintenance at Gertrudehus?': 
      'Select both actual and budget fields: `prisma.capex.findMany({ where: { asset: { name: "Gertrudehus" } }, select: { capex_year: true, common_areas_actuals: true, common_areas_budget: true, units_renovations_actuals: true, units_renovations_budget: true } })`.',
  
    'Show me all expenses for 2025 across all properties': 
      'Include opex filtered by year: `prisma.asset.findMany({ include: { opex: { where: { opex_year: 2025 } } } })`.',
  
    'Which tenants are moving out by the end of this year?': 
      'Filter by lease_end date: `prisma.rentRollUnit.findMany({ where: { lease_end: { lte: "2025-12-31" }, units_status: "occupied" }, include: { asset: { select: { name: true } } } })`.',
  
    'What maintenance costs did we have for Gertrudehus and Emmahus in 2025?': 
      'Use in operator for asset names: `prisma.capex.findMany({ where: { asset: { name: { in: ["Gertrudehus", "Emmahus"] } }, capex_year: 2025 }, include: { asset: { select: { name: true } } } })`.',
  
    'Show me all apartment units': 
      'Filter by unit_type: `prisma.rentRollUnit.findMany({ where: { unit_type: "apartment" }, include: { asset: { select: { name: true } } } })`.',
  
    'What were our actual operating expenses last year?': 
      'Select actual fields: `prisma.opex.findMany({ where: { opex_year: 2025 }, select: { asset_name: true, opex_year: true, actual_property_taxes: true, actual_insurance: true, actual_cleaning: true, actual_delinquency: true } })`.',
  
    'What\'s the theoretical rental income for 2025?': 
      'Filter by triYear: `prisma.theoreticalRentalIncome.findMany({ where: { triYear: 2025 }, include: { asset: { select: { name: true } } } })`.',
  
    'Show me units between 50 and 100 square meters': 
      'Use gte and lte for range: `prisma.rentRollUnit.findMany({ where: { size_sqm: { gte: 50, lte: 100 } }, include: { asset: { select: { name: true } } } })`.',
  
    'What maintenance work have we done over the past few years?': 
      'Use orderBy: `prisma.capex.findMany({ orderBy: { capex_year: "desc" }, include: { asset: { select: { name: true } } } })`.',
  
    'Which properties are in Copenhagen?': 
      'Use nested where: `prisma.opex.findMany({ where: { asset: { city: "Copenhagen" }, opex_year: 2025 }, include: { asset: { select: { name: true, city: true } } } })`.',
  
    'Show me the first 10 occupied units': 
      'Use take: `prisma.rentRollUnit.findMany({ where: { units_status: "occupied" }, take: 10, include: { asset: { select: { name: true } } } })`.',
  
    'How much did we spend on renovations?': 
      'Select specific fields: `prisma.capex.findMany({ select: { asset_name: true, capex_year: true, units_renovations_actuals: true, units_renovations_budget: true } })`.',
  
    'Which leases started this year?': 
      'Filter by lease_start: `prisma.rentRollUnit.findMany({ where: { lease_start: { startsWith: "2025" } }, include: { asset: { select: { name: true } } } })`.',
  
    'Show me the most recent operating expenses for each property': 
      'Include opex ordered by year: `prisma.asset.findMany({ include: { opex: { orderBy: { opex_year: "desc" }, take: 1 } } })`.',
  
    'What units are on the 3rd floor?': 
      'Filter by unit_floor: `prisma.rentRollUnit.findMany({ where: { unit_floor: 3 }, include: { asset: { select: { name: true } } } })`.',
  
    'Show me all expenses for 2025 so I can calculate totals': 
      'Get all opex fields: `prisma.opex.findMany({ where: { opex_year: 2025 }, include: { asset: { select: { name: true } } } })`.',
  
    'Which properties had major maintenance costs over 50,000?': 
      'Filter by capex amount: `prisma.capex.findMany({ where: { common_areas_actuals: { gte: 50000 } }, include: { asset: { select: { name: true } } } })`.',
  
    'Show me all units with their property addresses': 
      'Include asset with address: `prisma.rentRollUnit.findMany({ include: { asset: { select: { name: true, address: true, city: true } } } })`.',
  
    'What units have 2 or more bathrooms?': 
      'Filter by bathrooms_amount: `prisma.rentRollUnit.findMany({ where: { bathrooms_amount: { gte: 2 } }, include: { asset: { select: { name: true } } } })`.',
  
    'What\'s our theoretical rental income and vacancy loss?': 
      'Select tri fields: `prisma.theoreticalRentalIncome.findMany({ select: { triYear: true, triAmount: true, vacancyLoss: true, asset: { select: { name: true } } } })`.',
  
    'Show me all expenses for our Danish properties': 
      'Use nested where: `prisma.opex.findMany({ where: { asset: { country: "Denmark" } }, include: { asset: { select: { name: true, country: true } } } })`.',
  
    'Which units have the highest rent?': 
      'Use orderBy: `prisma.rentRollUnit.findMany({ orderBy: { rent_current_gri: "desc" }, include: { asset: { select: { name: true } } } })`.',
  
    'What maintenance did we do in 2023, 2024, and 2025?': 
      'Use in operator: `prisma.capex.findMany({ where: { capex_year: { in: [2023, 2024, 2025] } }, include: { asset: { select: { name: true } } } })`.',
  
    'Show me all properties with their 2025 expenses and maintenance costs': 
      'Include both relations with where: `prisma.asset.findMany({ include: { capex: { where: { capex_year: 2025 } }, opex: { where: { opex_year: 2025 } } } })`.',
  
    'Which units have high utility costs over 500?': 
      'Filter by utilites_cost: `prisma.rentRollUnit.findMany({ where: { utilites_cost: { gte: 500 } }, include: { asset: { select: { name: true } } } })`.',
  
    'Show me expenses organized by property and year': 
      'Order by year and include asset: `prisma.opex.findMany({ orderBy: { opex_year: "asc" }, include: { asset: { select: { name: true } } } })`.',
  
    'What\'s the occupancy rate at Gertrudehus?': 
      'Get all units to calculate: `prisma.rentRollUnit.findMany({ where: { asset: { name: "Gertrudehus" } }, select: { units_status: true } })`.',
  
    'How much rent are we collecting from occupied units?': 
      'Filter and select rent: `prisma.rentRollUnit.findMany({ where: { units_status: "occupied" }, select: { rent_current_gri: true, asset: { select: { name: true } } } })`.',
  
    'Which properties have the most units?': 
      'Order assets by the number of related rent roll units using the relation aggregate _count on rentRoll: `prisma.asset.findMany({ orderBy: { rentRoll: { _count: "desc" } }, include: { rentRoll: true } })`.',
  
    'What\'s our vacancy rate across all properties?': 
      'Get all units to calculate: `prisma.rentRollUnit.findMany({ select: { units_status: true, asset: { select: { name: true } } } })`.',
  
    'Show me all properties that don\'t have any units yet': 
      'Use none filter: `prisma.asset.findMany({ where: { rentRoll: { none: {} } } })`.',
  
    'What tenants are in our units?': 
      'Filter by tenant_name1 not empty: `prisma.rentRollUnit.findMany({ where: { tenant_name1: { not: "" } }, include: { asset: { select: { name: true } } } })`.',
  
    'Which properties are underperforming on rent collection?': 
      'Get units with rent data: `prisma.rentRollUnit.findMany({ where: { units_status: "occupied" }, select: { rent_current_gri: true, rent_budget_tri: true, asset: { select: { name: true } } } })`.',
  
    'What\'s the average rent per unit?': 
      'Get all occupied units: `prisma.rentRollUnit.findMany({ where: { units_status: "occupied" }, select: { rent_current_gri: true } })`.',
  
    'Show me all the maintenance we planned vs what we actually spent': 
      'Select both actual and budget: `prisma.capex.findMany({ select: { asset_name: true, capex_year: true, common_areas_actuals: true, common_areas_budget: true, units_renovations_actuals: true, units_renovations_budget: true } })`.',
  
    'Which units need attention - leases ending soon or high vacancy?': 
      'Get units with ending leases or vacant: `prisma.rentRollUnit.findMany({ where: { OR: [{ lease_end: { lte: "2025-12-31" }, units_status: "occupied" }, { units_status: "vacant" }] }, include: { asset: { select: { name: true } } } })`.',
  
    'What\'s our total operating expenses this year?': 
      'Get all opex for year: `prisma.opex.findMany({ where: { opex_year: 2025 } })`.',
  
    'Show me properties sorted by how many units they have': 
      'Get all assets with rent roll: `prisma.asset.findMany({ include: { rentRoll: true } })`.',
  
    'What units are in zipcode 2100?': 
      'Filter by unit_zipcode: `prisma.rentRollUnit.findMany({ where: { unit_zipcode: "2100" }, include: { asset: { select: { name: true } } } })`.',
  }
  