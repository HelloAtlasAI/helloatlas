-- Phase 5: Full Data Persistence Tables

-- Notes table
CREATE TABLE public.user_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  color TEXT DEFAULT 'amber',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes
CREATE POLICY "Users can view their own notes" ON public.user_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.user_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.user_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.user_notes FOR DELETE USING (auth.uid() = user_id);

-- Tasks table
CREATE TABLE public.user_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks" ON public.user_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tasks" ON public.user_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.user_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.user_tasks FOR DELETE USING (auth.uid() = user_id);

-- Calendar events table
CREATE TABLE public.user_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  event_type TEXT DEFAULT 'meeting',
  attendees JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Users can view their own events" ON public.user_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own events" ON public.user_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON public.user_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON public.user_events FOR DELETE USING (auth.uid() = user_id);

-- User stock watchlist
CREATE TABLE public.user_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Enable RLS
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for watchlist
CREATE POLICY "Users can view their own watchlist" ON public.user_watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their own watchlist" ON public.user_watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from their own watchlist" ON public.user_watchlist FOR DELETE USING (auth.uid() = user_id);

-- User weather preferences (location)
CREATE TABLE public.user_weather_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  city TEXT DEFAULT 'San Francisco',
  country_code TEXT DEFAULT 'US',
  lat DECIMAL(10, 7),
  lon DECIMAL(10, 7),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_weather_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weather settings
CREATE POLICY "Users can view their own weather settings" ON public.user_weather_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own weather settings" ON public.user_weather_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own weather settings" ON public.user_weather_settings FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_user_notes_updated_at BEFORE UPDATE ON public.user_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_tasks_updated_at BEFORE UPDATE ON public.user_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_events_updated_at BEFORE UPDATE ON public.user_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_weather_settings_updated_at BEFORE UPDATE ON public.user_weather_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();