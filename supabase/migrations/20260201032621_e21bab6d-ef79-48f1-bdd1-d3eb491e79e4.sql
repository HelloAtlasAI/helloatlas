-- Add Lovable AI control and provider routing columns to atlas_system_settings
ALTER TABLE public.atlas_system_settings
ADD COLUMN IF NOT EXISTS lovable_ai_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_switch_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS budget_switch_threshold_pct integer NOT NULL DEFAULT 70,
ADD COLUMN IF NOT EXISTS preferred_cheap_provider text DEFAULT 'lovable_ai',
ADD COLUMN IF NOT EXISTS disable_reason text,
ADD COLUMN IF NOT EXISTS disabled_at timestamp with time zone;

-- Add routing columns to atlas_provider_status
ALTER TABLE public.atlas_provider_status
ADD COLUMN IF NOT EXISTS priority_order integer NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS cost_tier text DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS is_enabled boolean NOT NULL DEFAULT true;

-- Set cost tiers for existing providers
UPDATE public.atlas_provider_status 
SET cost_tier = 'standard', priority_order = 1
WHERE provider = 'lovable_ai';

UPDATE public.atlas_provider_status 
SET cost_tier = 'standard', priority_order = 2
WHERE provider = 'perplexity';

UPDATE public.atlas_provider_status 
SET cost_tier = 'premium', priority_order = 3
WHERE provider = 'anthropic';

UPDATE public.atlas_provider_status 
SET cost_tier = 'cheap', priority_order = 4
WHERE provider = 'jina';

UPDATE public.atlas_provider_status 
SET cost_tier = 'premium', priority_order = 5
WHERE provider = 'openai';

-- Create index for faster routing queries
CREATE INDEX IF NOT EXISTS idx_provider_status_routing ON public.atlas_provider_status (is_enabled, cost_tier, priority_order);