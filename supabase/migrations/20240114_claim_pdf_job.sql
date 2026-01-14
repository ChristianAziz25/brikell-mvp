-- Function to atomically claim a pending PDF job for processing
-- Uses FOR UPDATE SKIP LOCKED to prevent race conditions

CREATE OR REPLACE FUNCTION claim_pdf_job(p_processor_id TEXT DEFAULT NULL)
RETURNS SETOF pdf_job AS $$
BEGIN
  RETURN QUERY
  UPDATE pdf_job
  SET
    status = 'processing',
    started_at = COALESCE(started_at, NOW()),
    updated_at = NOW()
  WHERE id = (
    SELECT id FROM pdf_job
    WHERE
      status = 'pending'
      OR (
        status = 'failed'
        AND retry_count < max_retries
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
      )
    ORDER BY
      CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
      created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated and service_role
GRANT EXECUTE ON FUNCTION claim_pdf_job(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_pdf_job(TEXT) TO service_role;
