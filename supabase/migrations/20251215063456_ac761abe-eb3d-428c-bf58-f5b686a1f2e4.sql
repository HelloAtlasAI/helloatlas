-- Atlas Knowledge Bank - stores learned information
CREATE TABLE public.atlas_knowledge_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  topic TEXT NOT NULL,
  content JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'conversation',
  confidence FLOAT NOT NULL DEFAULT 0.5,
  relevance_score FLOAT NOT NULL DEFAULT 0.5,
  last_accessed TIMESTAMP WITH TIME ZONE,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Atlas Error Logs - tracks errors and issues
CREATE TABLE public.atlas_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  severity TEXT NOT NULL DEFAULT 'error',
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Atlas Research Topics - autonomous research tracking
CREATE TABLE public.atlas_research_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.atlas_research_topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  depth_level INTEGER NOT NULL DEFAULT 0,
  findings JSONB DEFAULT '[]'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  priority INTEGER NOT NULL DEFAULT 5,
  auto_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Atlas Health Metrics - system health tracking
CREATE TABLE public.atlas_health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  value FLOAT NOT NULL,
  context JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Atlas Learning Sessions - learning mode sessions
CREATE TABLE public.atlas_learning_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'explore',
  status TEXT NOT NULL DEFAULT 'active',
  discoveries JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.atlas_knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_research_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_learning_sessions ENABLE ROW LEVEL SECURITY;

-- Knowledge entries policies - users can see their own + system entries
CREATE POLICY "Users can view their own knowledge and system knowledge" 
ON public.atlas_knowledge_entries FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create knowledge entries" 
ON public.atlas_knowledge_entries FOR INSERT 
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own knowledge entries" 
ON public.atlas_knowledge_entries FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own knowledge entries" 
ON public.atlas_knowledge_entries FOR DELETE 
USING (user_id = auth.uid());

-- Error logs policies - users see their errors, admins see all
CREATE POLICY "Users can view their own error logs" 
ON public.atlas_error_logs FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anyone can create error logs" 
ON public.atlas_error_logs FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own error logs" 
ON public.atlas_error_logs FOR UPDATE 
USING (user_id = auth.uid());

-- Research topics policies
CREATE POLICY "Users can view their own research and system research" 
ON public.atlas_research_topics FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create research topics" 
ON public.atlas_research_topics FOR INSERT 
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own research topics" 
ON public.atlas_research_topics FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own research topics" 
ON public.atlas_research_topics FOR DELETE 
USING (user_id = auth.uid());

-- Health metrics - read-only for users, insert from backend
CREATE POLICY "Anyone can view health metrics" 
ON public.atlas_health_metrics FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert health metrics" 
ON public.atlas_health_metrics FOR INSERT 
WITH CHECK (true);

-- Learning sessions policies
CREATE POLICY "Users can view their own learning sessions" 
ON public.atlas_learning_sessions FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create learning sessions" 
ON public.atlas_learning_sessions FOR INSERT 
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own learning sessions" 
ON public.atlas_learning_sessions FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own learning sessions" 
ON public.atlas_learning_sessions FOR DELETE 
USING (user_id = auth.uid());

-- Add updated_at triggers
CREATE TRIGGER update_atlas_knowledge_entries_updated_at
BEFORE UPDATE ON public.atlas_knowledge_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_atlas_research_topics_updated_at
BEFORE UPDATE ON public.atlas_research_topics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.atlas_knowledge_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.atlas_error_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.atlas_research_topics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.atlas_health_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.atlas_learning_sessions;