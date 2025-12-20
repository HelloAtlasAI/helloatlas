-- Create session_context table for working memory
CREATE TABLE public.session_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  context_type TEXT NOT NULL, -- 'topic', 'emotion', 'goal', 'reference', 'entity', 'insight'
  content JSONB NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_session_context_user_session ON public.session_context(user_id, session_id);
CREATE INDEX idx_session_context_expires ON public.session_context(expires_at);

-- Enable RLS
ALTER TABLE public.session_context ENABLE ROW LEVEL SECURITY;

-- Users can manage their own session context
CREATE POLICY "Users can manage their own session context"
  ON public.session_context FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own session context"
  ON public.session_context FOR SELECT
  USING (auth.uid() = user_id);

-- Enable realtime for session_context
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_context;