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

  IMPORTANT SQL RULES:
  - All tables are in the "public" schema, so qualify table names as public.asset, public.capex, etc.
  - Only "id" is unique; "name" is NOT unique in the Asset table.
  - Use ILIKE for case-insensitive text matching (e.g., WHERE name ILIKE '%gertrudehus%')
  - Always use LIMIT clauses to prevent excessive data retrieval
  - Use proper JOINs to relate tables via foreign keys (assetId)
  - Column names use snake_case (created_at, asset_name, etc.)
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
      'Use JOINs to fetch related data. Query: `SELECT a.*, c.*, o.*, r.* FROM public.asset a LEFT JOIN public.capex c ON a.id = c."assetId" LEFT JOIN public.opex o ON a.id = o."assetId" LEFT JOIN public."RentRollUnit" r ON a.id = r."assetId" WHERE a.name ILIKE \'%Gertrudehus%\' LIMIT 100`',
  
    'What units are currently occupied at gertrudehus?': 
      'Filter by units_status and join with asset: `SELECT r.* FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.units_status = \'occupied\' AND a.name ILIKE \'%gertrudehus%\' LIMIT 50`',
  
    'Show me all our properties': 
      'Get all assets: `SELECT * FROM public.asset LIMIT 100`',
  
    'What did we spend on capital expenditures for emmahus in 2025?': 
      'Join capex with asset and filter: `SELECT c.*, a.name FROM public.capex c JOIN public.asset a ON c."assetId" = a.id WHERE c.capex_year = 2025 AND a.name ILIKE \'%emmahus%\' LIMIT 10`',
  
    'Show me all operating expenses for 2025': 
      'Filter by opex_year and include asset name: `SELECT o.*, a.name FROM public.opex o JOIN public.asset a ON o."assetId" = a.id WHERE o.opex_year = 2025 LIMIT 50`',
  
    'Which units are vacant right now?': 
      'Filter by units_status: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.units_status = \'vacant\' LIMIT 50`',
  
    'What\'s the rent for all occupied units at Gertrudehus?': 
      'Filter by status and join with asset: `SELECT r.unit_id, r.rent_current_gri, r.unit_address FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.units_status = \'occupied\' AND a.name ILIKE \'%Gertrudehus%\' LIMIT 50`',
  
    'Show me all properties in Denmark': 
      'Filter by country: `SELECT * FROM public.asset WHERE country = \'Denmark\' LIMIT 100`',
  
    'What maintenance costs did we have last year across all properties?': 
      'Filter by capex_year: `SELECT c.*, a.name FROM public.capex c JOIN public.asset a ON c."assetId" = a.id WHERE c.capex_year = 2025 LIMIT 50`',
  
    'Which units are generating more than 10,000 in rent?': 
      'Use comparison operator: `SELECT r.unit_id, r.rent_current_gri, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.rent_current_gri >= 10000 LIMIT 50`',
  
    'Show me the operating expenses for Gertrudehus over the last two years': 
      'Use IN for multiple years: `SELECT o.* FROM public.opex o JOIN public.asset a ON o."assetId" = a.id WHERE a.name ILIKE \'%Gertrudehus%\' AND o.opex_year IN (2024, 2025) ORDER BY o.opex_year ASC LIMIT 10`',
  
    'What two-bedroom units do we have?': 
      'Filter by bedrooms_amount: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.bedrooms_amount = 2 LIMIT 50`',
  
    'Show me the theoretical rental income for all properties': 
      'Join asset with theoretical rental income: `SELECT a.*, t.* FROM public.asset a LEFT JOIN public."TheoreticalRentalIncome" t ON a.id = t."assetId" LIMIT 100`',
  
    'What\'s our budget for property taxes, insurance, and cleaning this year?': 
      'Select specific budget columns: `SELECT asset_name, opex_year, budget_property_taxes, budget_insurance, budget_cleaning FROM public.opex WHERE opex_year = 2025 LIMIT 50`',
  
    'Which leases have been terminated?': 
      'Filter by units_status: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.units_status = \'terminated\' LIMIT 50`',
  
    'Did we go over budget on maintenance at Gertrudehus?': 
      'Compare actuals vs budget: `SELECT c.capex_year, c.common_areas_actuals, c.common_areas_budget, c.units_renovations_actuals, c.units_renovations_budget FROM public.capex c JOIN public.asset a ON c."assetId" = a.id WHERE a.name ILIKE \'%Gertrudehus%\' LIMIT 10`',
  
    'Show me all expenses for 2025 across all properties': 
      'Get all opex for the year: `SELECT a.name, o.* FROM public.asset a LEFT JOIN public.opex o ON a.id = o."assetId" WHERE o.opex_year = 2025 LIMIT 100`',
  
    'Which tenants are moving out by the end of this year?': 
      'Filter by lease_end date: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.lease_end <= \'2025-12-31\' AND r.units_status = \'occupied\' LIMIT 50`',
  
    'What maintenance costs did we have for Gertrudehus and Emmahus in 2025?': 
      'Use IN for multiple asset names: `SELECT c.*, a.name FROM public.capex c JOIN public.asset a ON c."assetId" = a.id WHERE a.name IN (\'Gertrudehus\', \'Emmahus\') AND c.capex_year = 2025 LIMIT 20`',
  
    'Show me all apartment units': 
      'Filter by unit_type: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.unit_type = \'apartment\' LIMIT 100`',
  
    'What were our actual operating expenses last year?': 
      'Select actual expense columns: `SELECT asset_name, opex_year, actual_property_taxes, actual_insurance, actual_cleaning, actual_delinquency FROM public.opex WHERE opex_year = 2025 LIMIT 50`',
  
    'What\'s the theoretical rental income for 2025?': 
      'Filter by triYear: `SELECT t.*, a.name FROM public."TheoreticalRentalIncome" t JOIN public.asset a ON t."assetId" = a.id WHERE t."triYear" = 2025 LIMIT 50`',
  
    'Show me units between 50 and 100 square meters': 
      'Use BETWEEN for range: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.size_sqm BETWEEN 50 AND 100 LIMIT 50`',
  
    'What maintenance work have we done over the past few years?': 
      'Order by year descending: `SELECT c.*, a.name FROM public.capex c JOIN public.asset a ON c."assetId" = a.id ORDER BY c.capex_year DESC LIMIT 100`',
  
    'Which properties are in Copenhagen?': 
      'Join and filter by city: `SELECT DISTINCT a.name, a.city, o.* FROM public.asset a JOIN public.opex o ON a.id = o."assetId" WHERE a.city = \'Copenhagen\' AND o.opex_year = 2025 LIMIT 50`',
  
    'Show me the first 10 occupied units': 
      'Use LIMIT for pagination: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.units_status = \'occupied\' LIMIT 10`',
  
    'How much did we spend on renovations?': 
      'Select renovation columns: `SELECT asset_name, capex_year, units_renovations_actuals, units_renovations_budget FROM public.capex LIMIT 50`',
  
    'Which leases started this year?': 
      'Filter by lease_start with LIKE: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.lease_start LIKE \'2025%\' LIMIT 50`',
  
    'Show me the most recent operating expenses for each property': 
      'Use window function or subquery: `SELECT DISTINCT ON (a.id) a.*, o.* FROM public.asset a LEFT JOIN public.opex o ON a.id = o."assetId" ORDER BY a.id, o.opex_year DESC LIMIT 100`',
  
    'What units are on the 3rd floor?': 
      'Filter by unit_floor: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.unit_floor = 3 LIMIT 50`',
  
    'Show me all expenses for 2025 so I can calculate totals': 
      'Get all opex for calculations: `SELECT o.*, a.name FROM public.opex o JOIN public.asset a ON o."assetId" = a.id WHERE o.opex_year = 2025 LIMIT 100`',
  
    'Which properties had major maintenance costs over 50,000?': 
      'Filter by capex amount: `SELECT c.*, a.name FROM public.capex c JOIN public.asset a ON c."assetId" = a.id WHERE c.common_areas_actuals >= 50000 LIMIT 50`',
  
    'Show me all units with their property addresses': 
      'Join units with asset details: `SELECT r.*, a.name, a.address, a.city FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id LIMIT 100`',
  
    'What units have 2 or more bathrooms?': 
      'Filter by bathrooms_amount: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.bathrooms_amount >= 2 LIMIT 50`',
  
    'What\'s our theoretical rental income and vacancy loss?': 
      'Select TRI columns: `SELECT t."triYear", t."triAmount", t."vacancyLoss", a.name FROM public."TheoreticalRentalIncome" t JOIN public.asset a ON t."assetId" = a.id LIMIT 50`',
  
    'Show me all expenses for our Danish properties': 
      'Filter by country in join: `SELECT o.*, a.name, a.country FROM public.opex o JOIN public.asset a ON o."assetId" = a.id WHERE a.country = \'Denmark\' LIMIT 100`',
  
    'Which units have the highest rent?': 
      'Order by rent descending: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id ORDER BY r.rent_current_gri DESC LIMIT 20`',
  
    'What maintenance did we do in 2023, 2024, and 2025?': 
      'Use IN for multiple years: `SELECT c.*, a.name FROM public.capex c JOIN public.asset a ON c."assetId" = a.id WHERE c.capex_year IN (2023, 2024, 2025) LIMIT 100`',
  
    'Show me all properties with their 2025 expenses and maintenance costs': 
      'Multiple joins with year filter: `SELECT a.*, c.* AS capex_data, o.* AS opex_data FROM public.asset a LEFT JOIN public.capex c ON a.id = c."assetId" AND c.capex_year = 2025 LEFT JOIN public.opex o ON a.id = o."assetId" AND o.opex_year = 2025 LIMIT 50`',
  
    'Which units have high utility costs over 500?': 
      'Filter by utilites_cost: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.utilites_cost >= 500 LIMIT 50`',
  
    'Show me expenses organized by property and year': 
      'Order by asset and year: `SELECT o.*, a.name FROM public.opex o JOIN public.asset a ON o."assetId" = a.id ORDER BY a.name, o.opex_year ASC LIMIT 100`',
  
    'What\'s the occupancy rate at Gertrudehus?': 
      'Get unit statuses for calculation: `SELECT r.units_status FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE a.name ILIKE \'%Gertrudehus%\' LIMIT 100`',
  
    'How much rent are we collecting from occupied units?': 
      'Select rent from occupied units: `SELECT r.rent_current_gri, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.units_status = \'occupied\' LIMIT 100`',
  
    'Which properties have the most units?': 
      'Count units per property: `SELECT a.*, COUNT(r.unit_id) as unit_count FROM public.asset a LEFT JOIN public."RentRollUnit" r ON a.id = r."assetId" GROUP BY a.id ORDER BY unit_count DESC LIMIT 20`',
  
    'What\'s our vacancy rate across all properties?': 
      'Get all unit statuses: `SELECT r.units_status, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id LIMIT 500`',
  
    'Show me all properties that don\'t have any units yet': 
      'Left join to find assets without units: `SELECT a.* FROM public.asset a LEFT JOIN public."RentRollUnit" r ON a.id = r."assetId" WHERE r.unit_id IS NULL LIMIT 50`',
  
    'What tenants are in our units?': 
      'Filter for non-empty tenant names: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.tenant_name1 IS NOT NULL AND r.tenant_name1 != \'\' LIMIT 100`',
  
    'Which properties are underperforming on rent collection?': 
      'Compare current vs budget rent: `SELECT r.rent_current_gri, r.rent_budget_tri, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.units_status = \'occupied\' AND r.rent_current_gri < r.rent_budget_tri LIMIT 50`',
  
    'What\'s the average rent per unit?': 
      'Use AVG aggregation: `SELECT AVG(rent_current_gri) as average_rent FROM public."RentRollUnit" WHERE units_status = \'occupied\'`',
  
    'Show me all the maintenance we planned vs what we actually spent': 
      'Compare actuals vs budgets: `SELECT asset_name, capex_year, common_areas_actuals, common_areas_budget, units_renovations_actuals, units_renovations_budget FROM public.capex LIMIT 100`',
  
    'Which units need attention - leases ending soon or high vacancy?': 
      'Use OR condition for multiple criteria: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE (r.lease_end <= \'2025-12-31\' AND r.units_status = \'occupied\') OR r.units_status = \'vacant\' LIMIT 50`',
  
    'What\'s our total operating expenses this year?': 
      'Sum all opex columns: `SELECT SUM(actual_property_taxes + actual_insurance + actual_cleaning + actual_delinquency + actual_property_management_fee) as total_opex FROM public.opex WHERE opex_year = 2025`',
  
    'Show me properties sorted by how many units they have': 
      'Count and sort by units: `SELECT a.*, COUNT(r.unit_id) as unit_count FROM public.asset a LEFT JOIN public."RentRollUnit" r ON a.id = r."assetId" GROUP BY a.id ORDER BY unit_count DESC LIMIT 50`',
  
    'What units are in zipcode 2100?': 
      'Filter by zipcode: `SELECT r.*, a.name FROM public."RentRollUnit" r JOIN public.asset a ON r."assetId" = a.id WHERE r.unit_zipcode = \'2100\' LIMIT 50`',
  }
  