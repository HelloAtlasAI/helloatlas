-- Add missing columns to atlas_knowledge_entries for research integration
ALTER TABLE public.atlas_knowledge_entries 
ADD COLUMN IF NOT EXISTS research_topic_id uuid REFERENCES public.atlas_research_topics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS relevance_to_root double precision,
ADD COLUMN IF NOT EXISTS root_topic_context jsonb;

-- Add missing column to atlas_research_topics for learning session tracking
ALTER TABLE public.atlas_research_topics 
ADD COLUMN IF NOT EXISTS learning_session_id uuid REFERENCES public.atlas_learning_sessions(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_research_topic ON public.atlas_knowledge_entries(research_topic_id);
CREATE INDEX IF NOT EXISTS idx_research_learning_session ON public.atlas_research_topics(learning_session_id);