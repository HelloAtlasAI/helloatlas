-- Expand profiles table with personal fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS communication_style TEXT DEFAULT 'casual';

-- Create ai_memory table for persistent memories
CREATE TABLE IF NOT EXISTS public.ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL, -- 'preference', 'fact', 'relationship', 'habit', 'inside_joke', 'life_event'
  category TEXT NOT NULL, -- 'personal', 'work', 'family', 'health', 'interests', 'routines'
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  last_mentioned TIMESTAMPTZ,
  mention_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_life_events table
CREATE TABLE IF NOT EXISTS public.user_life_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'birthday', 'wedding', 'new_job', 'surgery', 'travel', 'promotion', 'baby', 'loss', 'anniversary'
  event_date DATE NOT NULL,
  description TEXT NOT NULL,
  people_involved JSONB,
  should_follow_up BOOLEAN DEFAULT true,
  follow_up_after DATE,
  is_recurring BOOLEAN DEFAULT false,
  sentiment TEXT DEFAULT 'neutral', -- 'positive', 'neutral', 'difficult'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ai_insights table for proactive notifications
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'follow_up', 'birthday', 'reminder', 'pattern', 'urgent'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  related_event_id UUID REFERENCES public.user_life_events(id),
  priority INTEGER DEFAULT 5,
  is_read BOOLEAN DEFAULT false,
  is_spoken BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create data_sources table for connected sources
CREATE TABLE IF NOT EXISTS public.data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'email', 'calendar', 'stocks', 'travel', 'documents'
  source_name TEXT NOT NULL,
  config JSONB,
  is_active BOOLEAN DEFAULT true,
  last_synced TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_life_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_memory
CREATE POLICY "Users can view their own memories" ON public.ai_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own memories" ON public.ai_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own memories" ON public.ai_memory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own memories" ON public.ai_memory FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_life_events
CREATE POLICY "Users can view their own life events" ON public.user_life_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own life events" ON public.user_life_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own life events" ON public.user_life_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own life events" ON public.user_life_events FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for ai_insights
CREATE POLICY "Users can view their own insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own insights" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own insights" ON public.ai_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own insights" ON public.ai_insights FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for data_sources
CREATE POLICY "Users can view their own data sources" ON public.data_sources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own data sources" ON public.data_sources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own data sources" ON public.data_sources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own data sources" ON public.data_sources FOR DELETE USING (auth.uid() = user_id);

-- Trigger for ai_memory updated_at
CREATE TRIGGER update_ai_memory_updated_at
BEFORE UPDATE ON public.ai_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for insights (for proactive notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_insights;