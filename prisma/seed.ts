import prisma from "@/lib/prisma/client";
import { generateEmbeddings } from "@/lib/rag/embedding";
import { fewShotQueries, tableDetails } from "./ragDataEmbeddingData";

/**
 * Setup database schema for hybrid search (FTS columns, indexes, triggers)
 * This is idempotent - safe to run multiple times
 */
async function setupHybridSearchSchema() {
  console.log("Setting up hybrid search schema...");

  // Enable extensions
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

  // Set memory for operations
  await prisma.$executeRawUnsafe(`SET maintenance_work_mem = '128MB';`);

  // Add FTS column to table_details
  await prisma.$executeRawUnsafe(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'table_details' 
        AND column_name = 'fts'
      ) THEN
        ALTER TABLE table_details ADD COLUMN fts TSVECTOR;
        UPDATE table_details 
        SET fts = to_tsvector('english', COALESCE(description, ''))
        WHERE fts IS NULL;
        ALTER TABLE table_details DROP COLUMN fts;
        ALTER TABLE table_details 
        ADD COLUMN fts TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', description)) STORED;
      END IF;
    END $$;
  `);

  // Add FTS column to few_shot_query
  await prisma.$executeRawUnsafe(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'few_shot_query' 
        AND column_name = 'fts'
      ) THEN
        ALTER TABLE few_shot_query ADD COLUMN fts TSVECTOR;
        UPDATE few_shot_query 
        SET fts = to_tsvector('english', COALESCE(query, ''))
        WHERE fts IS NULL;
        ALTER TABLE few_shot_query DROP COLUMN fts;
        ALTER TABLE few_shot_query 
        ADD COLUMN fts TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', query)) STORED;
      END IF;
    END $$;
  `);

  // Reset memory
  await prisma.$executeRawUnsafe(`RESET maintenance_work_mem;`);

  // Create FTS indexes
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_table_details_fts ON table_details USING gin(fts);`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS idx_few_shot_query_fts ON few_shot_query USING gin(fts);`
  );

  // Create vector indexes (HNSW)
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'table_details' 
        AND indexname = 'idx_table_details_embedding'
      ) THEN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes i
          JOIN pg_class c ON i.indexname = c.relname
          WHERE i.schemaname = 'public'
          AND i.tablename = 'table_details'
          AND i.indexname = 'idx_table_details_embedding'
          AND c.relam = (SELECT oid FROM pg_am WHERE amname = 'hnsw')
        ) THEN
          DROP INDEX IF EXISTS idx_table_details_embedding;
          CREATE INDEX idx_table_details_embedding ON table_details
            USING hnsw (embedding vector_cosine_ops)
            WITH (m = 16, ef_construction = 64);
        END IF;
      ELSE
        CREATE INDEX idx_table_details_embedding ON table_details
          USING hnsw (embedding vector_cosine_ops)
          WITH (m = 16, ef_construction = 64);
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'few_shot_query' 
        AND indexname = 'idx_few_shot_query_embedding'
      ) THEN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes i
          JOIN pg_class c ON i.indexname = c.relname
          WHERE i.schemaname = 'public'
          AND i.tablename = 'few_shot_query'
          AND i.indexname = 'idx_few_shot_query_embedding'
          AND c.relam = (SELECT oid FROM pg_am WHERE amname = 'hnsw')
        ) THEN
          DROP INDEX IF EXISTS idx_few_shot_query_embedding;
          CREATE INDEX idx_few_shot_query_embedding ON few_shot_query
            USING hnsw (embedding vector_cosine_ops)
            WITH (m = 16, ef_construction = 64);
        END IF;
      ELSE
        CREATE INDEX idx_few_shot_query_embedding ON few_shot_query
          USING hnsw (embedding vector_cosine_ops)
          WITH (m = 16, ef_construction = 64);
      END IF;
    END $$;
  `);

  // Create trigger function
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Create triggers
  await prisma.$executeRawUnsafe(
    `DROP TRIGGER IF EXISTS update_table_details_updated_at ON table_details;`
  );
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER update_table_details_updated_at
      BEFORE UPDATE ON table_details
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `);

  await prisma.$executeRawUnsafe(
    `DROP TRIGGER IF EXISTS update_few_shot_query_updated_at ON few_shot_query;`
  );
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER update_few_shot_query_updated_at
      BEFORE UPDATE ON few_shot_query
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `);

  console.log("✅ Hybrid search schema setup complete!");
}

async function main() {
  // Setup database schema first (before seeding data)
  await setupHybridSearchSchema();
  // // Clear existing data in correct FK order
  // await prisma.rentRollUnit.deleteMany();
  // await prisma.capex.deleteMany();
  // await prisma.opex.deleteMany();
  // await prisma.asset.deleteMany();

  // const assetIdByName = new Map<string, string>();

  // // Seed assets + rent roll
  // for (const unit of rentRollData) {
  //   const propertyName = unit.property_name;

  //   if (!assetIdByName.has(propertyName)) {
  //     const createdAsset = await prisma.asset.create({
  //       data: {
  //         name: propertyName,
  //         address: unit.unit_address,
  //         city: null,
  //         country: "Denmark",
  //       },
  //     });

  //     assetIdByName.set(propertyName, createdAsset.id);
  //   }

  //   const assetId = assetIdByName.get(propertyName)!;

  //   await prisma.rentRollUnit.create({
  //     data: {
  //       assetId,
  //       property_build_year: unit.property_build_year,
  //       property_name: unit.property_name,
  //       unit_address: unit.unit_address,
  //       unit_zipcode: String(unit.unit_zipcode),
  //       utilites_cost: unit.utilites_cost,
  //       unit_type: unit.unit_type,
  //       size_sqm: unit.size_sqm,
  //       rooms_amount: unit.rooms_amount,
  //       bedrooms_amount: unit.bedrooms_amount,
  //       bathrooms_amount: unit.bathrooms_amount,
  //       rent_current_gri: unit.rent_current_gri,
  //       rent_budget_tri: unit.rent_budget_tri,
  //       lease_start: unit.lease_start,
  //       lease_end: unit.lease_end || null,
  //       tenant_name1: unit.tenant_name1,
  //       tenant_name2: unit.tenant_name2,
  //       unit_id: unit.unit_id,
  //       unit_door: unit.unit_door,
  //       unit_floor: unit.unit_floor,
  //       tenant_number1: unit.tenant_number1,
  //       tenant_number2: unit.tenant_number2,
  //       units_status: unit.units_status as RentStatus,
  //       tenant_mail1: unit.tenant_mail1,
  //       tenant_mail2: unit.tenant_mail2,
  //     },
  //   });
  // }

  // // Ensure assets exist for capex / opex only names
  // for (const row of capexData) {
  //   if (!assetIdByName.has(row.asset_name)) {
  //     const createdAsset = await prisma.asset.create({
  //       data: {
  //         name: row.asset_name,
  //         address: null,
  //         city: null,
  //         country: "Denmark",
  //       },
  //     });
  //     assetIdByName.set(row.asset_name, createdAsset.id);
  //   }
  // }

  // for (const row of opexData) {
  //   if (!assetIdByName.has(row.asset_name)) {
  //     const createdAsset = await prisma.asset.create({
  //       data: {
  //         name: row.asset_name,
  //         address: null,
  //         city: null,
  //         country: "Denmark",
  //       },
  //     });
  //     assetIdByName.set(row.asset_name, createdAsset.id);
  //   }
  // }

  // // Seed Capex
  // for (const row of capexData) {
  //   const assetId = assetIdByName.get(row.asset_name);
  //   if (!assetId) continue;

  //   await prisma.capex.create({
  //     data: {
  //       assetId,
  //       asset_name: row.asset_name,
  //       capex_year: row.capex_year,
  //       common_areas_actuals: row.common_areas_actuals,
  //       units_renovations_actuals: row.units_renovations_actuals,
  //       elevator_maintnance_actuals: row.elevator_maintnance_actuals,
  //       roof_maintnance_actuals: row.roof_maintnance_actuals,
  //       fire_safety_actuals: row.fire_safety_actuals,
  //       outdoor_area_actuals: row.outdoor_area_actuals,
  //       common_areas_budget: row.common_areas_budget,
  //       units_renovations_budget: row.units_renovations_budget,
  //       elevator_maintnance_budget: row.elevator_maintnance_budget,
  //       roof_maintnance_budget: row.roof_maintnance_budget,
  //       fire_safety_budget: row.fire_safety_budget,
  //       outdoor_area_budget: row.outdoor_area_budget,
  //     },
  //   });
  // }

  // // Seed Opex
  // for (const row of opexData) {
  //   const assetId = assetIdByName.get(row.asset_name);
  //   if (!assetId) continue;

  //   await prisma.opex.create({
  //     data: {
  //       assetId,
  //       asset_name: row.asset_name,
  //       opex_year: row.opex_year,
  //       actual_delinquency: row.actual_delinquency,
  //       actual_property_management_fee: row.actual_property_management_fee,
  //       actual_leasing_fee: row.actual_leasing_fee,
  //       actual_property_taxes: row.actual_property_taxes,
  //       actual_refuse_collection: row.actual_refuse_collection,
  //       actual_insurance: row.actual_insurance,
  //       actual_cleaning: row.actual_cleaning,
  //       actual_facility_management: row.actual_facility_management,
  //       actual_service_subscriptions: row.actual_service_subscriptions,
  //       actual_common_consumption: row.actual_common_consumption,
  //       actual_home_owner_association: row.actual_home_owner_association,
  //       budget_delinquency: row.budget_delinquency,
  //       budget_property_management_fee: row.budget_property_management_fee,
  //       budget_leasing_fee: row.budget_leasing_fee,
  //       budget_property_taxes: row.budget_property_taxes,
  //       budget_refuse_collection: row.budget_refuse_collection,
  //       budget_insurance: row.budget_insurance,
  //       budget_cleaning: row.budget_cleaning,
  //       budget_facility_management: row.budget_facility_management,
  //       budget_service_subscriptions: row.budget_service_subscriptions,
  //       budget_common_consumption: row.budget_common_consumption,
  //       budget_home_owner_association: row.budget_home_owner_association,
  //     },
  //   });
  // }

  // // Seed Theoretical Rental Income (TRI) using the static fake data
  // // The data in `theoreticalRentalIncData` is already varied to look realistic,
  // // so we just insert it as-is.
  // for (const row of theoreticalRentalIncData) {
  //   const assetId = assetIdByName.get(row.asset_name);
  //   if (!assetId) continue;

  //   await prisma.theoreticalRentalIncome.create({
  //     data: {
  //       assetId,
  //       triYear: row.tri_year,
  //       triAmount: row.tri_amount,
  //       vacancyLoss: row.vacancy_loss,
  //     },
  //   });
  // }

  for (const[tableName, description] of Object.entries(tableDetails)) {
    const embeddings = await generateEmbeddings(description);
    const embeddingArray = JSON.stringify(embeddings);
    await prisma.$executeRaw`
        INSERT INTO table_details (id, "tableName", description, embedding, metadata, created_at, updated_at)
        VALUES (gen_random_uuid()::text, ${tableName}, ${description}, ${embeddingArray}::vector, '{}'::jsonb, NOW(), NOW())
        ON CONFLICT ("tableName") 
        DO UPDATE SET 
          description = EXCLUDED.description,
          embedding = EXCLUDED.embedding,
          updated_at = NOW()
      `;
  }
  
  for (const [question, query] of Object.entries(fewShotQueries)) {
    const embeddings = await generateEmbeddings(question);
    const embeddingArray = JSON.stringify(embeddings);
    await prisma.$executeRaw`
        INSERT INTO few_shot_query (id, query, sql, embedding, metadata, created_at, updated_at)
        VALUES (gen_random_uuid()::text, ${question}, ${query}, ${embeddingArray}::vector, '{}'::jsonb, NOW(), NOW())
        ON CONFLICT (query) 
        DO UPDATE SET 
          sql = EXCLUDED.sql,
          embedding = EXCLUDED.embedding,
          updated_at = NOW()
      `;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


