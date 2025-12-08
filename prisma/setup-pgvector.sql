-- Run this SQL directly in your Supabase SQL editor or via psql
-- This sets up pgvector extension and converts existing columns

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- For few_shot_query table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'few_shot_query'
    ) THEN
        -- Convert column to vector if it exists and isn't already vector
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'few_shot_query' 
            AND column_name = 'embedding'
            AND udt_name != 'vector'
        ) THEN
            -- Drop and recreate as vector (safer than direct conversion)
            ALTER TABLE "few_shot_query" 
            DROP COLUMN IF EXISTS "embedding";
            
            ALTER TABLE "few_shot_query" 
            ADD COLUMN "embedding" vector(1536);
        END IF;
        
        -- Add unique constraint if it doesn't exist (use exception handling)
        BEGIN
            ALTER TABLE "few_shot_query" 
            ADD CONSTRAINT "few_shot_query_query_key" UNIQUE ("query");
        EXCEPTION
            WHEN OTHERS THEN
                -- Error code 42P07 = duplicate_object (constraint already exists)
                IF SQLSTATE = '42P07' THEN
                    NULL; -- Constraint already exists, ignore silently
                ELSE
                    RAISE; -- Re-raise other errors
                END IF;
        END;
    END IF;
END $$;

-- For table_details table
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'table_details'
    ) THEN
        -- Convert column to vector if it exists and isn't already vector
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'table_details' 
            AND column_name = 'embedding'
            AND udt_name != 'vector'
        ) THEN
            -- Drop and recreate as vector (safer than direct conversion)
            ALTER TABLE "table_details" 
            DROP COLUMN IF EXISTS "embedding";
            
            ALTER TABLE "table_details" 
            ADD COLUMN "embedding" vector(1536);
        END IF;
        
        -- Add unique constraint if it doesn't exist (use exception handling)
        BEGIN
            ALTER TABLE "table_details" 
            ADD CONSTRAINT "table_details_tableName_key" UNIQUE ("tableName");
        EXCEPTION
            WHEN OTHERS THEN
                -- Error code 42P07 = duplicate_object (constraint already exists)
                IF SQLSTATE = '42P07' THEN
                    NULL; -- Constraint already exists, ignore silently
                ELSE
                    RAISE; -- Re-raise other errors
                END IF;
        END;
    END IF;
END $$;

-- Create indexes for vector similarity search
DROP INDEX IF EXISTS few_shot_query_embedding_idx;
CREATE INDEX few_shot_query_embedding_idx 
ON "few_shot_query" 
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 10);

DROP INDEX IF EXISTS table_details_embedding_idx;
CREATE INDEX table_details_embedding_idx 
ON "table_details" 
USING ivfflat ("embedding" vector_cosine_ops)
WITH (lists = 10);

