// Provider Routing Utilities
// Budget-aware model selection and auto-switching for Atlas

// Use any for supabase client to avoid version mismatch issues
// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

export type RoutingMode = 'normal' | 'budget_saving' | 'minimal' | 'disabled';

export interface RoutingDecision {
  provider: string;
  model: string;
  reason: 'default' | 'budget_switch' | 'provider_down' | 'rate_limited' | 'disabled';
  routingMode: RoutingMode;
  originalProvider?: string;
  originalModel?: string;
}

export interface RoutingConfig {
  lovableAIEnabled: boolean;
  autoSwitchEnabled: boolean;
  budgetSwitchThresholdPct: number;
  dailyBudgetUsedPct: number;
  preferredCheapProvider: string;
}

// Cost tier definitions with models
const COST_TIERS: Record<string, { providers: string[]; models: Record<string, string> }> = {
  cheap: {
    providers: ['lovable_ai'],
    models: {
      lovable_ai: 'google/gemini-2.5-flash-lite',
    }
  },
  standard: {
    providers: ['lovable_ai', 'perplexity'],
    models: {
      lovable_ai: 'google/gemini-2.5-flash',
      perplexity: 'sonar',
    }
  },
  premium: {
    providers: ['lovable_ai', 'perplexity', 'anthropic', 'openai'],
    models: {
      lovable_ai: 'openai/gpt-5',
      perplexity: 'sonar-pro',
      anthropic: 'claude-sonnet-4-5',
      openai: 'openai/gpt-5',
    }
  }
};

// Task type to preferred cost tier mapping
const TASK_COST_PREFERENCES: Record<string, string> = {
  // High-value tasks that benefit from premium models
  planning: 'premium',
  verification: 'premium',
  complex_reasoning: 'premium',
  memory_synthesis: 'premium',
  
  // Standard tasks
  chat: 'standard',
  research: 'standard',
  knowledge_extraction: 'standard',
  
  // Can use cheaper models
  execution: 'cheap',
  tool_call: 'cheap',
  quick_search: 'cheap',
  validation: 'standard',
};

// Determine routing mode based on budget usage
export function determineRoutingMode(
  config: RoutingConfig
): RoutingMode {
  if (!config.lovableAIEnabled) {
    return 'disabled';
  }
  
  if (!config.autoSwitchEnabled) {
    return 'normal';
  }
  
  if (config.dailyBudgetUsedPct >= 100) {
    return 'disabled';
  }
  
  if (config.dailyBudgetUsedPct >= 90) {
    return 'minimal';
  }
  
  if (config.dailyBudgetUsedPct >= config.budgetSwitchThresholdPct) {
    return 'budget_saving';
  }
  
  return 'normal';
}

// Get the appropriate cost tier for a routing mode
function getCostTierForMode(mode: RoutingMode, preferredTier: string): string {
  switch (mode) {
    case 'disabled':
      return 'blocked';
    case 'minimal':
      return 'cheap';
    case 'budget_saving':
      // Downgrade premium to standard, standard stays standard, cheap stays cheap
      if (preferredTier === 'premium') return 'standard';
      return preferredTier;
    case 'normal':
    default:
      return preferredTier;
  }
}

// Check if a task should be blocked in minimal mode
function shouldBlockInMinimalMode(taskType: string): boolean {
  // Only essential tasks are allowed in minimal mode
  const essentialTasks = ['chat', 'execution', 'tool_call'];
  return !essentialTasks.includes(taskType);
}

// Get routing configuration from database
export async function getRoutingConfig(
  supabase: SupabaseClient
): Promise<RoutingConfig> {
  try {
    // Get system settings
    const { data: settings } = await supabase
      .from('atlas_system_settings')
      .select('lovable_ai_enabled, auto_switch_enabled, budget_switch_threshold_pct, preferred_cheap_provider')
      .limit(1)
      .single();

    // Get budget settings and calculate usage
    const { data: budgetSettings } = await supabase
      .from('atlas_budget_settings')
      .select('daily_budget_usd')
      .limit(1)
      .single();

    // Get today's provider usage to estimate spending
    const { data: providers } = await supabase
      .from('atlas_provider_status')
      .select('provider, successful_calls');

    // Estimate daily spending (rough calculation)
    let dailySpending = 0;
    if (providers) {
      for (const provider of providers) {
        // Rough cost estimate per call
        const costPerCall = provider.provider === 'lovable_ai' ? 0.001 : 0.002;
        dailySpending += (provider.successful_calls || 0) * costPerCall;
      }
    }

    const dailyBudget = budgetSettings?.daily_budget_usd || 5;
    const dailyBudgetUsedPct = dailyBudget > 0 ? (dailySpending / dailyBudget) * 100 : 0;

    return {
      lovableAIEnabled: settings?.lovable_ai_enabled ?? true,
      autoSwitchEnabled: settings?.auto_switch_enabled ?? true,
      budgetSwitchThresholdPct: settings?.budget_switch_threshold_pct ?? 70,
      dailyBudgetUsedPct,
      preferredCheapProvider: settings?.preferred_cheap_provider ?? 'lovable_ai',
    };
  } catch (e) {
    console.error('[providerRouting] Failed to get routing config:', e);
    return {
      lovableAIEnabled: true,
      autoSwitchEnabled: true,
      budgetSwitchThresholdPct: 70,
      dailyBudgetUsedPct: 0,
      preferredCheapProvider: 'lovable_ai',
    };
  }
}

// Check if Lovable AI is enabled
export async function isLovableAIEnabled(
  supabase: SupabaseClient
): Promise<{ enabled: boolean; reason?: string }> {
  try {
    const { data } = await supabase
      .from('atlas_system_settings')
      .select('lovable_ai_enabled, disable_reason')
      .limit(1)
      .single();

    return {
      enabled: data?.lovable_ai_enabled ?? true,
      reason: data?.disable_reason || undefined,
    };
  } catch {
    return { enabled: true };
  }
}

// Disable Lovable AI
export async function disableLovableAI(
  supabase: SupabaseClient,
  reason: string
): Promise<void> {
  try {
    await supabase
      .from('atlas_system_settings')
      .update({
        lovable_ai_enabled: false,
        disable_reason: reason,
        disabled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log(`[providerRouting] Lovable AI disabled: ${reason}`);
  } catch (e) {
    console.error('[providerRouting] Failed to disable Lovable AI:', e);
  }
}

// Enable Lovable AI
export async function enableLovableAI(
  supabase: SupabaseClient
): Promise<void> {
  try {
    await supabase
      .from('atlas_system_settings')
      .update({
        lovable_ai_enabled: true,
        disable_reason: null,
        disabled_at: null,
        updated_at: new Date().toISOString(),
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('[providerRouting] Lovable AI enabled');
  } catch (e) {
    console.error('[providerRouting] Failed to enable Lovable AI:', e);
  }
}

// Main routing function - select optimal provider based on budget and task
export async function selectOptimalProvider(
  supabase: SupabaseClient,
  taskType: string,
  preferredProvider?: string
): Promise<RoutingDecision> {
  const config = await getRoutingConfig(supabase);
  const routingMode = determineRoutingMode(config);
  
  console.log(`[providerRouting] Mode: ${routingMode}, Budget: ${config.dailyBudgetUsedPct.toFixed(1)}%, Task: ${taskType}`);

  // If Lovable AI is disabled, block the request
  if (!config.lovableAIEnabled) {
    return {
      provider: 'blocked',
      model: 'none',
      reason: 'disabled',
      routingMode: 'disabled',
    };
  }

  // Check if task should be blocked in minimal mode
  if (routingMode === 'minimal' && shouldBlockInMinimalMode(taskType)) {
    console.log(`[providerRouting] Blocking non-essential task in minimal mode: ${taskType}`);
    return {
      provider: 'blocked',
      model: 'none',
      reason: 'budget_switch',
      routingMode: 'minimal',
    };
  }

  // Get preferred cost tier for this task
  const preferredTier = TASK_COST_PREFERENCES[taskType] || 'standard';
  const effectiveTier = getCostTierForMode(routingMode, preferredTier);
  
  if (effectiveTier === 'blocked') {
    return {
      provider: 'blocked',
      model: 'none',
      reason: 'disabled',
      routingMode: 'disabled',
    };
  }

  // Get tier configuration
  const tierConfig = COST_TIERS[effectiveTier] || COST_TIERS.standard;
  
  // Select provider and model
  let selectedProvider = preferredProvider || tierConfig.providers[0] || 'lovable_ai';
  let selectedModel = tierConfig.models[selectedProvider] || tierConfig.models.lovable_ai;

  // Check provider health
  const { data: providerStatus } = await supabase
    .from('atlas_provider_status')
    .select('status, is_enabled')
    .eq('provider', selectedProvider)
    .single();

  // If provider is unhealthy, fall back
  if (providerStatus && (providerStatus.status === 'error' || !providerStatus.is_enabled)) {
    const fallbackProvider = tierConfig.providers.find(p => p !== selectedProvider) || 'lovable_ai';
    const originalProvider = selectedProvider;
    const originalModel = selectedModel;
    
    selectedProvider = fallbackProvider;
    selectedModel = tierConfig.models[fallbackProvider] || 'google/gemini-2.5-flash';
    
    return {
      provider: selectedProvider,
      model: selectedModel,
      reason: 'provider_down',
      routingMode,
      originalProvider,
      originalModel,
    };
  }

  // Determine reason for selection
  let reason: RoutingDecision['reason'] = 'default';
  if (routingMode === 'budget_saving' && preferredTier !== effectiveTier) {
    reason = 'budget_switch';
  } else if (routingMode === 'minimal') {
    reason = 'budget_switch';
  }

  return {
    provider: selectedProvider,
    model: selectedModel,
    reason,
    routingMode,
    originalProvider: reason === 'budget_switch' ? preferredProvider : undefined,
    originalModel: reason === 'budget_switch' ? COST_TIERS[preferredTier]?.models[preferredProvider || 'lovable_ai'] : undefined,
  };
}

// Get a simple routing check for edge functions that just need to know if AI is available
export async function canUseAI(
  supabase: SupabaseClient,
  taskType: string = 'chat'
): Promise<{ allowed: boolean; reason?: string; routingMode: RoutingMode }> {
  const decision = await selectOptimalProvider(supabase, taskType);
  
  if (decision.provider === 'blocked') {
    return {
      allowed: false,
      reason: decision.reason === 'disabled' 
        ? 'Lovable AI is disabled' 
        : 'Budget limit reached for non-essential tasks',
      routingMode: decision.routingMode,
    };
  }
  
  return {
    allowed: true,
    routingMode: decision.routingMode,
  };
}
