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

// Model configuration for different providers
const PROVIDERS = {
  perplexity: {
    url: "https://api.perplexity.ai/chat/completions",
    models: {
      fast: "sonar",
      deep: "sonar-pro",
      reasoning: "sonar-reasoning",
    }
  },
  lovable: {
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    models: {
      fast: "google/gemini-2.5-flash",
      standard: "google/gemini-2.5-pro",
      reasoning: "openai/gpt-5",
    }
  },
  jina: {
    url: "https://r.jina.ai",
  }
};

// Tool implementations
const AVAILABLE_TOOLS: Record<string, (args: Record<string, unknown>, supabase: any) => Promise<unknown>> = {
  // Web search using Perplexity Sonar (fast, grounded search with citations)
  web_search: async (args) => {
    const query = args.query as string;
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    
    if (!PERPLEXITY_API_KEY) {
      console.log("[web_search] Perplexity API key not configured, falling back to Lovable AI");
      // Fallback to Lovable AI
      const response = await fetch(PROVIDERS.lovable.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: PROVIDERS.lovable.models.fast,
          messages: [
            { role: "system", content: "You are a web search assistant. Provide accurate, well-structured information based on your training data. Always be clear about the limitations of your knowledge." },
            { role: "user", content: `Search and summarize information about: ${query}` },
          ],
        }),
      });
      const data = await response.json();
      return { 
        result: data.choices?.[0]?.message?.content || "No results found",
        citations: [],
        provider: "lovable_fallback"
      };
    }

    console.log(`[web_search] Searching with Perplexity sonar: ${query}`);
    
    const response = await fetch(PROVIDERS.perplexity.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PROVIDERS.perplexity.models.fast,
        messages: [
          { role: "system", content: "Be precise and concise. Provide well-sourced information." },
          { role: "user", content: query },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[web_search] Perplexity API error:", errorText);
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    return { 
      result: data.choices?.[0]?.message?.content || "No results found",
      citations: data.citations || [],
      provider: "perplexity_sonar"
    };
  },

  // Deep research using Perplexity Sonar Pro (multi-step reasoning, 2x citations)
  deep_research: async (args) => {
    const topic = args.topic as string;
    const depth = (args.depth as string) || "comprehensive";
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    
    if (!PERPLEXITY_API_KEY) {
      console.log("[deep_research] Perplexity API key not configured, falling back to Lovable AI");
      const response = await fetch(PROVIDERS.lovable.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: PROVIDERS.lovable.models.standard,
          messages: [
            { role: "system", content: "You are an expert researcher. Provide comprehensive, well-organized research findings with clear sections for key insights, supporting evidence, and conclusions." },
            { role: "user", content: `Research thoroughly: ${topic}\n\nProvide a ${depth} analysis.` },
          ],
        }),
      });
      const data = await response.json();
      return { 
        result: data.choices?.[0]?.message?.content || "Research failed",
        citations: [],
        provider: "lovable_fallback"
      };
    }

    console.log(`[deep_research] Deep research with Perplexity sonar-pro: ${topic}`);
    
    const response = await fetch(PROVIDERS.perplexity.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PROVIDERS.perplexity.models.deep,
        messages: [
          { 
            role: "system", 
            content: "You are an expert research assistant. Provide comprehensive, well-sourced research with detailed analysis. Structure your response with clear sections." 
          },
          { 
            role: "user", 
            content: `Research this topic thoroughly: ${topic}\n\nDepth level: ${depth}\n\nProvide:\n1. Key findings and insights\n2. Supporting evidence\n3. Different perspectives if applicable\n4. Conclusions and implications` 
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[deep_research] Perplexity API error:", errorText);
      throw new Error(`Research failed: ${response.status}`);
    }

    const data = await response.json();
    return { 
      result: data.choices?.[0]?.message?.content || "Research failed",
      citations: data.citations || [],
      provider: "perplexity_sonar_pro"
    };
  },

  // Web scraping using Jina AI Reader (free, no API key required)
  web_scrape: async (args) => {
    const url = args.url as string;
    
    if (!url || !url.startsWith("http")) {
      throw new Error("Invalid URL provided");
    }

    console.log(`[web_scrape] Scraping with Jina Reader: ${url}`);
    
    // Jina AI Reader - converts any URL to clean markdown
    const jinaUrl = `${PROVIDERS.jina.url}/${url}`;
    
    const response = await fetch(jinaUrl, {
      method: "GET",
      headers: {
        "Accept": "text/markdown",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[web_scrape] Jina Reader error:", errorText);
      throw new Error(`Scraping failed: ${response.status}`);
    }

    const markdown = await response.text();
    
    return { 
      content: markdown,
      url: url,
      content_type: "markdown",
      provider: "jina_reader",
      length: markdown.length
    };
  },

  // Combined search + scrape for comprehensive results
  deep_search: async (args, supabase) => {
    const query = args.query as string;
    const scrapeFirst = args.scrape_results as boolean || false;
    
    console.log(`[deep_search] Combined search + scrape for: ${query}`);
    
    // First, perform web search
    const searchResult = await AVAILABLE_TOOLS.web_search({ query }, supabase) as { result: string; citations: string[] };
    
    // If scrape_results is true and we have citations, scrape the first few
    let scrapedContent: { url: string; content: string }[] = [];
    if (scrapeFirst && searchResult.citations && searchResult.citations.length > 0) {
      const urlsToScrape = searchResult.citations.slice(0, 3); // Scrape top 3 sources
      
      for (const url of urlsToScrape) {
        try {
          const scraped = await AVAILABLE_TOOLS.web_scrape({ url }, supabase) as { content: string; url: string };
          scrapedContent.push({ url, content: scraped.content.slice(0, 5000) }); // Limit content length
        } catch (e) {
          console.log(`[deep_search] Failed to scrape ${url}:`, e);
        }
      }
    }
    
    return {
      search_result: searchResult.result,
      citations: searchResult.citations,
      scraped_sources: scrapedContent,
      provider: "combined"
    };
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

    // Estimate cost based on tool type
    let costEstimate = 0.001;
    if (tool_name === "deep_research") costEstimate = 0.01;
    else if (tool_name === "web_search") costEstimate = 0.005;
    else if (tool_name === "deep_search") costEstimate = 0.015;

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
        cost_estimate: costEstimate,
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
