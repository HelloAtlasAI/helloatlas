-- =============================================
-- Validation Logs Table for Multi-Model Fact Checking
-- =============================================
CREATE TABLE public.validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL,
  entry_type TEXT NOT NULL, -- 'knowledge', 'research', 'memory', 'context'
  validator_model TEXT NOT NULL,
  verdict TEXT NOT NULL, -- 'valid', 'suspicious', 'fake'
  confidence FLOAT NOT NULL DEFAULT 0.5,
  reasoning TEXT,
  sources_checked JSONB DEFAULT '[]'::jsonb,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.validation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for validation_logs
CREATE POLICY "Anyone can insert validation logs"
  ON public.validation_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view validation logs"
  ON public.validation_logs FOR SELECT
  USING (true);

-- Index for fast lookups
CREATE INDEX idx_validation_logs_entry ON public.validation_logs(entry_id, entry_type);
CREATE INDEX idx_validation_logs_verdict ON public.validation_logs(verdict);
CREATE INDEX idx_validation_logs_created ON public.validation_logs(created_at DESC);

-- =============================================
-- Add validation columns to atlas_knowledge_entries
-- =============================================
ALTER TABLE public.atlas_knowledge_entries
  ADD COLUMN IF NOT EXISTS is_fake BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS validation_score FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS validation_consensus JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

-- Index for filtering out fake knowledge
CREATE INDEX idx_knowledge_validated ON public.atlas_knowledge_entries(is_validated, is_fake);

-- =============================================
-- Add validation columns to ai_memory
-- =============================================
ALTER TABLE public.ai_memory
  ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_fake BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS validation_score FLOAT DEFAULT 0;

-- Index for filtering validated memories
CREATE INDEX idx_memory_validated ON public.ai_memory(is_validated, is_fake);

-- =============================================
-- Add validation columns to atlas_research_topics
-- =============================================
ALTER TABLE public.atlas_research_topics
  ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_fake BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS validation_score FLOAT DEFAULT 0;

-- =============================================
-- Memory Synthesis Logs Table
-- =============================================
CREATE TABLE public.memory_synthesis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  operation_type TEXT NOT NULL, -- 'consolidate', 'prune', 'insight', 'conflict_resolution'
  input_count INTEGER DEFAULT 0,
  output_count INTEGER DEFAULT 0,
  conflicts_resolved INTEGER DEFAULT 0,
  insights_extracted INTEGER DEFAULT 0,
  duration_ms INTEGER,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.memory_synthesis_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own synthesis logs"
  ON public.memory_synthesis_logs FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert synthesis logs"
  ON public.memory_synthesis_logs FOR INSERT
  WITH CHECK (true);

-- Index for filtering
CREATE INDEX idx_synthesis_logs_user ON public.memory_synthesis_logs(user_id);
CREATE INDEX idx_synthesis_logs_operation ON public.memory_synthesis_logs(operation_type);
CREATE INDEX idx_synthesis_logs_created ON public.memory_synthesis_logs(created_at DESC);