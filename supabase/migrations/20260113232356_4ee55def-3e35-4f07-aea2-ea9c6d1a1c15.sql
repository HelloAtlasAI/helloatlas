-- =====================================================
-- Atlas Learning Control & Provider Status System
-- =====================================================

-- Create atlas_system_settings table for learning control
CREATE TABLE IF NOT EXISTS public.atlas_system_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    learning_enabled boolean NOT NULL DEFAULT false,
    learning_mode text NOT NULL DEFAULT 'on_demand' CHECK (learning_mode IN ('on_demand', 'scheduled', 'disabled')),
    max_topics_per_session integer NOT NULL DEFAULT 3,
    max_research_depth integer NOT NULL DEFAULT 2,
    auto_validation boolean NOT NULL DEFAULT false,
    auto_knowledge_extraction boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.atlas_system_settings (learning_enabled, learning_mode, max_topics_per_session, max_research_depth, auto_validation, auto_knowledge_extraction)
VALUES (false, 'on_demand', 3, 2, false, false)
ON CONFLICT DO NOTHING;

-- Create atlas_provider_status table for tracking AI provider health
CREATE TABLE IF NOT EXISTS public.atlas_provider_status (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider text NOT NULL UNIQUE CHECK (provider IN ('lovable_ai', 'perplexity', 'anthropic', 'jina', 'openai')),
    status text NOT NULL DEFAULT 'unknown' CHECK (status IN ('healthy', 'degraded', 'error', 'rate_limited', 'credits_exhausted', 'unknown')),
    last_success timestamp with time zone,
    last_error text,
    error_count integer NOT NULL DEFAULT 0,
    rate_limit_until timestamp with time zone,
    total_calls integer NOT NULL DEFAULT 0,
    successful_calls integer NOT NULL DEFAULT 0,
    failed_calls integer NOT NULL DEFAULT 0,
    avg_response_time_ms integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default provider statuses
INSERT INTO public.atlas_provider_status (provider, status) VALUES
    ('lovable_ai', 'unknown'),
    ('perplexity', 'unknown'),
    ('anthropic', 'unknown'),
    ('jina', 'unknown'),
    ('openai', 'unknown')
ON CONFLICT (provider) DO NOTHING;

-- Create atlas_learning_sessions for tracking learning requests
CREATE TABLE IF NOT EXISTS public.atlas_learning_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid,
    user_id uuid,
    trigger_type text NOT NULL CHECK (trigger_type IN ('voice', 'text', 'manual', 'scheduled')),
    intent_detected text,
    topic_requested text,
    topics_learned integer NOT NULL DEFAULT 0,
    max_topics_allowed integer NOT NULL DEFAULT 3,
    status text NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'learning', 'completed', 'stopped', 'error')),
    error_message text,
    provider_errors jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    completed_at timestamp with time zone
);

-- Enable RLS on all new tables
ALTER TABLE public.atlas_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_provider_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_learning_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for atlas_system_settings (admin-only write, all read)
CREATE POLICY "Anyone can read system settings"
    ON public.atlas_system_settings FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify system settings"
    ON public.atlas_system_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Create policies for atlas_provider_status (public read, service role write)
CREATE POLICY "Anyone can read provider status"
    ON public.atlas_provider_status FOR SELECT
    USING (true);

-- Create policies for atlas_learning_logs
CREATE POLICY "Users can read their own learning logs"
    ON public.atlas_learning_logs FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create learning logs"
    ON public.atlas_learning_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for status tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.atlas_provider_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.atlas_system_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.atlas_learning_logs;

-- Create updated_at trigger for atlas_system_settings
CREATE TRIGGER update_atlas_system_settings_updated_at
    BEFORE UPDATE ON public.atlas_system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for atlas_provider_status
CREATE TRIGGER update_atlas_provider_status_updated_at
    BEFORE UPDATE ON public.atlas_provider_status
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();