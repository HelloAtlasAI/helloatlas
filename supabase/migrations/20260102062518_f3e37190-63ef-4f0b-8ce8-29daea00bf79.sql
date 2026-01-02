-- Create a function to search brain vectors by semantic similarity
CREATE OR REPLACE FUNCTION match_brain_vectors(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 20,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  knowledge_entry_id uuid,
  memory_item_id uuid,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mv.id,
    mv.chunk_text,
    mv.knowledge_entry_id,
    mv.memory_item_id,
    1 - (mv.embedding <=> query_embedding) AS similarity
  FROM memory_vectors mv
  WHERE 
    mv.embedding IS NOT NULL
    AND (p_user_id IS NULL OR mv.user_id = p_user_id)
    AND 1 - (mv.embedding <=> query_embedding) > match_threshold
  ORDER BY mv.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create index on embedding column for faster vector search (if not exists)
CREATE INDEX IF NOT EXISTS idx_memory_vectors_embedding 
ON memory_vectors 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);