-- Create atlas_usage_history table for tracking daily usage snapshots
CREATE TABLE public.atlas_usage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  provider TEXT NOT NULL,
  total_calls INTEGER NOT NULL DEFAULT 0,
  successful_calls INTEGER NOT NULL DEFAULT 0,
  failed_calls INTEGER NOT NULL DEFAULT 0,
  estimated_cost DECIMAL(10, 4) NOT NULL DEFAULT 0,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, provider)
);

-- Create atlas_budget_settings table for user spending limits
CREATE TABLE public.atlas_budget_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_budget_usd DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
  weekly_budget_usd DECIMAL(10, 2) NOT NULL DEFAULT 25.00,
  alert_threshold_pct INTEGER NOT NULL DEFAULT 80,
  critical_threshold_pct INTEGER NOT NULL DEFAULT 95,
  auto_disable_on_limit BOOLEAN NOT NULL DEFAULT true,
  alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  last_daily_alert_at TIMESTAMP WITH TIME ZONE,
  last_weekly_alert_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.atlas_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_budget_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for atlas_usage_history (read-only for all, system writes)
CREATE POLICY "Anyone can view usage history" 
ON public.atlas_usage_history 
FOR SELECT 
USING (true);

-- RLS policies for atlas_budget_settings
CREATE POLICY "Anyone can view budget settings" 
ON public.atlas_budget_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update budget settings" 
ON public.atlas_budget_settings 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can insert budget settings" 
ON public.atlas_budget_settings 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for updated_at on budget settings
CREATE TRIGGER update_atlas_budget_settings_updated_at
BEFORE UPDATE ON public.atlas_budget_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default budget settings row
INSERT INTO public.atlas_budget_settings (id) VALUES (gen_random_uuid());

-- Function to record daily usage snapshot from provider status
CREATE OR REPLACE FUNCTION public.record_daily_usage_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider RECORD;
  v_today DATE := CURRENT_DATE;
BEGIN
  FOR v_provider IN SELECT * FROM atlas_provider_status LOOP
    INSERT INTO atlas_usage_history (date, provider, total_calls, successful_calls, failed_calls, estimated_cost)
    VALUES (
      v_today,
      v_provider.provider,
      v_provider.total_calls,
      v_provider.successful_calls,
      v_provider.failed_calls,
      -- Rough cost estimate: $0.001 per call as baseline
      v_provider.successful_calls * 0.001
    )
    ON CONFLICT (date, provider) 
    DO UPDATE SET
      total_calls = EXCLUDED.total_calls,
      successful_calls = EXCLUDED.successful_calls,
      failed_calls = EXCLUDED.failed_calls,
      estimated_cost = EXCLUDED.estimated_cost;
  END LOOP;
END;
$$;