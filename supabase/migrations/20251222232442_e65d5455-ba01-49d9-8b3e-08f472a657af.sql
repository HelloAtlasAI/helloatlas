-- Create research priority queue table
CREATE TABLE public.atlas_research_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  description TEXT,
  priority_score NUMERIC DEFAULT 0.5,
  source TEXT NOT NULL DEFAULT 'manual', -- 'news_pulse', 'topic_discovery', 'user_request', 'auto_deepen'
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.atlas_research_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can insert to research queue"
ON public.atlas_research_queue
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view research queue"
ON public.atlas_research_queue
FOR SELECT
USING (true);

CREATE POLICY "Anyone can update research queue"
ON public.atlas_research_queue
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete from research queue"
ON public.atlas_research_queue
FOR DELETE
USING (true);

-- Create index for efficient queue processing
CREATE INDEX idx_research_queue_status_priority ON public.atlas_research_queue (status, priority_score DESC, scheduled_for);
CREATE INDEX idx_research_queue_source ON public.atlas_research_queue (source);

-- Create atlas_brain_runs table to track brain activity
CREATE TABLE public.atlas_brain_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type TEXT NOT NULL, -- 'full', 'news_pulse', 'topic_discovery', 'validation_batch'
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metrics JSONB DEFAULT '{}',
  error_message TEXT,
  news_collected INTEGER DEFAULT 0,
  topics_generated INTEGER DEFAULT 0,
  research_completed INTEGER DEFAULT 0,
  entries_validated INTEGER DEFAULT 0
);

-- Enable RLS for brain runs
ALTER TABLE public.atlas_brain_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view brain runs"
ON public.atlas_brain_runs
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert brain runs"
ON public.atlas_brain_runs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update brain runs"
ON public.atlas_brain_runs
FOR UPDATE
USING (true);

-- Add root_topic_context column to atlas_research_topics if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'atlas_research_topics' AND column_name = 'root_topic_context'
  ) THEN
    ALTER TABLE public.atlas_research_topics ADD COLUMN root_topic_context JSONB;
  END IF;
END $$;

-- Enable realtime for research queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.atlas_research_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.atlas_brain_runs;