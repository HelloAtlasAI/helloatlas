-- Enable pgvector extension for semantic memory
CREATE EXTENSION IF NOT EXISTS vector;

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create model_tier enum for multi-model orchestration
CREATE TYPE public.model_tier AS ENUM ('planner', 'worker', 'reasoner');

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Model configurations for multi-tier architecture
CREATE TABLE public.model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tier model_tier NOT NULL,
  model_name TEXT NOT NULL,
  max_tokens INTEGER DEFAULT 4096,
  temperature NUMERIC(3,2) DEFAULT 0.7,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, tier, is_default)
);

-- Memory vectors for semantic recall
CREATE TABLE public.memory_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  memory_item_id UUID REFERENCES public.ai_memory(id) ON DELETE CASCADE,
  knowledge_entry_id UUID REFERENCES public.atlas_knowledge_entries(id) ON DELETE CASCADE,
  embedding vector(1536),
  chunk_text TEXT NOT NULL,
  source_ref_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Memory policies for "what to remember" rules
CREATE TABLE public.memory_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  policy_name TEXT NOT NULL,
  category TEXT NOT NULL,
  should_remember BOOLEAN DEFAULT true,
  retention_days INTEGER,
  importance_threshold INTEGER DEFAULT 5,
  auto_prune BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agents table with model configuration
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  model_config_json JSONB DEFAULT '{"planner": "openai/gpt-5", "worker": "google/gemini-2.5-flash", "reasoner": "openai/gpt-5"}'::jsonb,
  enabled_tools_json JSONB DEFAULT '[]'::jsonb,
  risky_tools_json JSONB DEFAULT '["file_write", "shell_exec", "api_call"]'::jsonb,
  max_steps INTEGER DEFAULT 20,
  daily_budget_limit NUMERIC(10,2) DEFAULT 5.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Runs table for agent execution tracking
CREATE TABLE public.runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'planning', 'running', 'verifying', 'completed', 'failed', 'cancelled')),
  goal_text TEXT NOT NULL,
  plan_json JSONB,
  result_json JSONB,
  verification_json JSONB,
  tokens_planner INTEGER DEFAULT 0,
  tokens_worker INTEGER DEFAULT 0,
  tokens_reasoner INTEGER DEFAULT 0,
  cost_estimate NUMERIC(10,4) DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Run steps for step-by-step execution
CREATE TABLE public.run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE NOT NULL,
  step_index INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('planning', 'thinking', 'tool_call', 'tool_result', 'response', 'verification', 'error')),
  model_tier model_tier,
  model_used TEXT,
  input_json JSONB,
  output_json JSONB,
  tokens_used INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tool calls audit log
CREATE TABLE public.tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES public.runs(id) ON DELETE SET NULL,
  step_id UUID REFERENCES public.run_steps(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  tool_name TEXT NOT NULL,
  args_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_approval', 'approved', 'rejected', 'running', 'completed', 'failed')),
  requires_approval BOOLEAN DEFAULT false,
  sandboxed BOOLEAN DEFAULT false,
  cost_estimate NUMERIC(10,4) DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Approvals workflow
CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  run_id UUID REFERENCES public.runs(id) ON DELETE CASCADE,
  tool_call_id UUID REFERENCES public.tool_calls(id) ON DELETE CASCADE NOT NULL,
  action_summary TEXT NOT NULL,
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  reason TEXT,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Schedules for cron jobs
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cron_expression TEXT NOT NULL,
  payload_json JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_run_status TEXT,
  last_run_id UUID REFERENCES public.runs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events inbox for triggers
CREATE TABLE public.events_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  payload_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  run_id UUID REFERENCES public.runs(id) ON DELETE SET NULL,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Research citations with credibility
CREATE TABLE public.research_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  run_id UUID REFERENCES public.runs(id) ON DELETE SET NULL,
  research_topic_id UUID REFERENCES public.atlas_research_topics(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT,
  snippet TEXT,
  domain TEXT,
  credibility_score NUMERIC(3,2) DEFAULT 0.5,
  citation_type TEXT DEFAULT 'web' CHECK (citation_type IN ('web', 'academic', 'news', 'documentation', 'social')),
  raw_json JSONB,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workspace settings for budgets and limits
CREATE TABLE public.workspace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  daily_budget_limit NUMERIC(10,2) DEFAULT 10.00,
  daily_run_limit INTEGER DEFAULT 100,
  daily_tool_call_limit INTEGER DEFAULT 500,
  require_approval_for_risky BOOLEAN DEFAULT true,
  auto_approve_low_risk BOOLEAN DEFAULT true,
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_memory_vectors_user ON public.memory_vectors(user_id);
CREATE INDEX idx_memory_vectors_embedding ON public.memory_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_agents_user_active ON public.agents(user_id, is_active);
CREATE INDEX idx_runs_user_created ON public.runs(user_id, created_at DESC);
CREATE INDEX idx_runs_status ON public.runs(status);
CREATE INDEX idx_run_steps_run ON public.run_steps(run_id, step_index);
CREATE INDEX idx_tool_calls_run ON public.tool_calls(run_id, created_at);
CREATE INDEX idx_tool_calls_user_status ON public.tool_calls(user_id, status);
CREATE INDEX idx_approvals_user_status ON public.approvals(user_id, status);
CREATE INDEX idx_schedules_user_enabled ON public.schedules(user_id, enabled);
CREATE INDEX idx_events_inbox_status ON public.events_inbox(status, created_at);
CREATE INDEX idx_research_citations_run ON public.research_citations(run_id);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for model_configs
CREATE POLICY "Users can view their own model configs" ON public.model_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own model configs" ON public.model_configs FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for memory_vectors
CREATE POLICY "Users can view their own memory vectors" ON public.memory_vectors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own memory vectors" ON public.memory_vectors FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for memory_policies
CREATE POLICY "Users can view their own memory policies" ON public.memory_policies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own memory policies" ON public.memory_policies FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for agents
CREATE POLICY "Users can view their own agents" ON public.agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own agents" ON public.agents FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for runs
CREATE POLICY "Users can view their own runs" ON public.runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own runs" ON public.runs FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for run_steps
CREATE POLICY "Users can view steps from their runs" ON public.run_steps FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.runs WHERE runs.id = run_steps.run_id AND runs.user_id = auth.uid())
);
CREATE POLICY "Users can insert steps to their runs" ON public.run_steps FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.runs WHERE runs.id = run_steps.run_id AND runs.user_id = auth.uid())
);

-- RLS Policies for tool_calls
CREATE POLICY "Users can view their own tool calls" ON public.tool_calls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own tool calls" ON public.tool_calls FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for approvals
CREATE POLICY "Users can view their own approvals" ON public.approvals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own approvals" ON public.approvals FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for schedules
CREATE POLICY "Users can view their own schedules" ON public.schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own schedules" ON public.schedules FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for events_inbox
CREATE POLICY "Users can view their own events" ON public.events_inbox FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own events" ON public.events_inbox FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for research_citations
CREATE POLICY "Users can view their own citations" ON public.research_citations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own citations" ON public.research_citations FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for workspace_settings
CREATE POLICY "Users can view their own settings" ON public.workspace_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own settings" ON public.workspace_settings FOR ALL USING (auth.uid() = user_id);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.run_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tool_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.approvals;

-- Trigger for updated_at timestamps
CREATE TRIGGER update_model_configs_updated_at BEFORE UPDATE ON public.model_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workspace_settings_updated_at BEFORE UPDATE ON public.workspace_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_inbox_updated_at BEFORE UPDATE ON public.events_inbox FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();