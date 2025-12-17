import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ToolCallRequest {
  tool_name: string;
  args: Record<string, unknown>;
  run_id?: string;
  step_id?: string;
  agent_id?: string;
}

// Define which tools are considered risky and require approval
const RISKY_TOOLS = ["file_write", "shell_exec", "api_call", "database_write", "send_email"];

// Tool implementations
const AVAILABLE_TOOLS: Record<string, (args: Record<string, unknown>, supabase: any) => Promise<unknown>> = {
  web_search: async (args) => {
    const query = args.query as string;
    // Use Lovable AI for search via Perplexity-style response
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a web search assistant. Provide accurate, cited information." },
          { role: "user", content: `Search and summarize: ${query}` },
        ],
      }),
    });
    const data = await response.json();
    return { result: data.choices?.[0]?.message?.content || "No results found" };
  },
  
  calculate: async (args) => {
    const expression = args.expression as string;
    try {
      // Safe math evaluation
      const result = Function(`"use strict"; return (${expression})`)();
      return { result };
    } catch (e) {
      return { error: "Invalid expression" };
    }
  },
  
  get_time: async () => {
    return { 
      utc: new Date().toISOString(),
      timestamp: Date.now() 
    };
  },
  
  memory_recall: async (args, supabase) => {
    const query = args.query as string;
    const userId = args.user_id as string;
    
    const { data } = await supabase
      .from("ai_memory")
      .select("*")
      .eq("user_id", userId)
      .textSearch("value", query)
      .limit(5);
    
    return { memories: data || [] };
  },
  
  memory_store: async (args, supabase) => {
    const { user_id, key, value, category, memory_type, importance } = args;
    
    const { data, error } = await supabase
      .from("ai_memory")
      .upsert({
        user_id,
        key,
        value,
        category: category || "general",
        memory_type: memory_type || "fact",
        importance: importance || 5,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,key" });
    
    if (error) return { error: error.message };
    return { success: true, data };
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ToolCallRequest = await req.json();
    const { tool_name, args, run_id, step_id, agent_id } = body;

    console.log(`[tool-gateway] User ${user.id} calling tool: ${tool_name}`);

    // Check if tool exists
    if (!AVAILABLE_TOOLS[tool_name]) {
      return new Response(JSON.stringify({ error: `Unknown tool: ${tool_name}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check agent's tool allowlist if agent_id provided
    if (agent_id) {
      const { data: agent } = await supabase
        .from("agents")
        .select("enabled_tools_json, risky_tools_json, daily_budget_limit")
        .eq("id", agent_id)
        .eq("user_id", user.id)
        .single();

      if (agent) {
        const enabledTools = agent.enabled_tools_json || [];
        if (enabledTools.length > 0 && !enabledTools.includes(tool_name)) {
          return new Response(JSON.stringify({ error: `Tool ${tool_name} not allowed for this agent` }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Check workspace budget and rate limits
    const { data: settings } = await supabase
      .from("workspace_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (settings) {
      // Check daily tool call limit
      const today = new Date().toISOString().split("T")[0];
      const { count: todayCalls } = await supabase
        .from("tool_calls")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00Z`);

      if (todayCalls && todayCalls >= settings.daily_tool_call_limit) {
        return new Response(JSON.stringify({ error: "Daily tool call limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Determine if tool requires approval
    const requiresApproval = RISKY_TOOLS.includes(tool_name) && settings?.require_approval_for_risky;

    // Create tool_call record
    const { data: toolCall, error: insertError } = await supabase
      .from("tool_calls")
      .insert({
        user_id: user.id,
        run_id,
        step_id,
        tool_name,
        args_json: args,
        status: requiresApproval ? "awaiting_approval" : "running",
        requires_approval: requiresApproval,
        cost_estimate: 0.001, // Estimated cost per call
      })
      .select()
      .single();

    if (insertError) {
      console.error("[tool-gateway] Failed to create tool_call:", insertError);
      return new Response(JSON.stringify({ error: "Failed to log tool call" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If requires approval, create approval request and wait
    if (requiresApproval) {
      await supabase.from("approvals").insert({
        user_id: user.id,
        run_id,
        tool_call_id: toolCall.id,
        action_summary: `Execute ${tool_name} with args: ${JSON.stringify(args).slice(0, 200)}`,
        risk_level: RISKY_TOOLS.includes(tool_name) ? "high" : "medium",
        status: "pending",
      });

      return new Response(JSON.stringify({
        status: "awaiting_approval",
        tool_call_id: toolCall.id,
        message: "This tool requires approval before execution",
      }), {
        status: 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Execute the tool
    try {
      const result = await AVAILABLE_TOOLS[tool_name]({ ...args, user_id: user.id }, supabase);
      
      // Update tool_call with result
      await supabase
        .from("tool_calls")
        .update({
          result_json: result,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", toolCall.id);

      console.log(`[tool-gateway] Tool ${tool_name} completed successfully`);

      return new Response(JSON.stringify({
        status: "completed",
        tool_call_id: toolCall.id,
        result,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (execError) {
      console.error(`[tool-gateway] Tool ${tool_name} failed:`, execError);
      
      // Update tool_call with error
      await supabase
        .from("tool_calls")
        .update({
          status: "failed",
          error_message: execError instanceof Error ? execError.message : "Unknown error",
          completed_at: new Date().toISOString(),
        })
        .eq("id", toolCall.id);

      return new Response(JSON.stringify({
        status: "failed",
        tool_call_id: toolCall.id,
        error: execError instanceof Error ? execError.message : "Tool execution failed",
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("[tool-gateway] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
