-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- For few_shot_query table: Convert Float[] to vector(1536)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'few_shot_query'
    ) THEN
        -- Check current column type and convert accordingly
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'few_shot_query' 
            AND column_name = 'embedding'
            AND udt_name = 'vector'
        ) THEN
            -- Already vector type, just ensure dimension is correct
            RAISE NOTICE 'embedding already is vector type';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'few_shot_query' 
            AND column_name = 'embedding'
        ) THEN
            -- Convert from Float[] or other type to vector
            ALTER TABLE "few_shot_query" 
            ALTER COLUMN "embedding" TYPE vector(1536) 
            USING CASE 
                WHEN "embedding" IS NULL THEN NULL
                ELSE "embedding"::text::vector
            END;
        END IF;
        
        -- Add unique constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'few_shot_query_query_key'
        ) THEN
            ALTER TABLE "few_shot_query" ADD CONSTRAINT "few_shot_query_query_key" UNIQUE ("query");
        END IF;
    END IF;
END $$;

-- For table_details table: Convert Float[] to vector(1536)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'table_details'
    ) THEN
        -- Check current column type and convert accordingly
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'table_details' 
            AND column_name = 'embedding'
            AND udt_name = 'vector'
        ) THEN
            -- Already vector type, just ensure dimension is correct
            RAISE NOTICE 'embedding already is vector type';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'table_details' 
            AND column_name = 'embedding'
        ) THEN
            -- Convert from Float[] or other type to vector
            ALTER TABLE "table_details" 
            ALTER COLUMN "embedding" TYPE vector(1536) 
            USING CASE 
                WHEN "embedding" IS NULL THEN NULL
                ELSE "embedding"::text::vector
            END;
        END IF;
        
        -- Add unique constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'table_details_tableName_key'
        ) THEN
            ALTER TABLE "table_details" ADD CONSTRAINT "table_details_tableName_key" UNIQUE ("tableName");
        END IF;
    END IF;
END $$;

-- Create indexes for vector similarity search (drop existing if needed)
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

