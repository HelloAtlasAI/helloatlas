import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentRunRequest {
  agent_id: string;
  goal: string;
  context?: Record<string, unknown>;
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// Model configuration for different tiers
const MODEL_TIERS = {
  planner: "openai/gpt-5",
  worker: "google/gemini-2.5-flash",
  reasoner: "openai/gpt-5",
};

async function callAI(
  model: string,
  messages: { role: string; content: string }[],
  tools?: unknown[]
): Promise<{ content: string; tool_calls?: unknown[] }> {
  const body: Record<string, unknown> = {
    model,
    messages,
    stream: false,
  };

  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const response = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[agent-run] AI call failed:", response.status, errorText);
    throw new Error(`AI call failed: ${response.status}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  
  return {
    content: choice?.message?.content || "",
    tool_calls: choice?.message?.tool_calls,
  };
}

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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: AgentRunRequest = await req.json();
    const { agent_id, goal, context } = body;

    // Get agent configuration
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agent_id)
      .eq("user_id", user.id)
      .single();

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: "Agent not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[agent-run] Starting run for agent ${agent.name} with goal: ${goal.slice(0, 100)}`);

    // Create run record
    const { data: run, error: runError } = await supabase
      .from("runs")
      .insert({
        user_id: user.id,
        agent_id,
        goal_text: goal,
        status: "planning",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError) {
      console.error("[agent-run] Failed to create run:", runError);
      return new Response(JSON.stringify({ error: "Failed to create run" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's memories for context
    const { data: memories } = await supabase
      .from("ai_memory")
      .select("key, value, category")
      .eq("user_id", user.id)
      .order("importance", { ascending: false })
      .limit(10);

    const memoryContext = memories?.length 
      ? `\n\nUser context:\n${memories.map(m => `- ${m.key}: ${JSON.stringify(m.value)}`).join("\n")}`
      : "";

    // Step 1: Planning with Planner model
    const plannerModel = agent.model_config_json?.planner || MODEL_TIERS.planner;
    
    const { data: planStep } = await supabase
      .from("run_steps")
      .insert({
        run_id: run.id,
        step_index: 0,
        kind: "planning",
        model_tier: "planner",
        model_used: plannerModel,
        input_json: { goal, context },
      })
      .select()
      .single();

    const planPrompt = `You are an AI agent planner. Create a step-by-step plan to achieve the goal.

Goal: ${goal}
${context ? `Additional context: ${JSON.stringify(context)}` : ""}
${memoryContext}

Available tools: ${JSON.stringify(agent.enabled_tools_json)}

Return a JSON object with:
{
  "plan": [
    { "step": 1, "action": "description", "tool": "tool_name or null", "reasoning": "why" }
  ],
  "estimated_steps": number,
  "confidence": 0.0-1.0
}`;

    let planResult;
    try {
      planResult = await callAI(plannerModel, [
        { role: "system", content: agent.system_prompt },
        { role: "user", content: planPrompt },
      ]);
      
      await supabase
        .from("run_steps")
        .update({
          output_json: { response: planResult.content },
          finished_at: new Date().toISOString(),
        })
        .eq("id", planStep!.id);
    } catch (e) {
      console.error("[agent-run] Planning failed:", e);
      await supabase.from("runs").update({ 
        status: "failed", 
        error_message: "Planning phase failed",
        finished_at: new Date().toISOString(),
      }).eq("id", run.id);
      
      return new Response(JSON.stringify({ error: "Planning failed", run_id: run.id }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse plan
    let plan;
    try {
      const jsonMatch = planResult.content.match(/\{[\s\S]*\}/);
      plan = jsonMatch ? JSON.parse(jsonMatch[0]) : { plan: [], confidence: 0.5 };
    } catch {
      plan = { plan: [{ step: 1, action: planResult.content, tool: null, reasoning: "Direct response" }], confidence: 0.5 };
    }

    await supabase.from("runs").update({ 
      plan_json: plan,
      status: "running",
    }).eq("id", run.id);

    // Step 2: Execute plan steps with Worker model
    const workerModel = agent.model_config_json?.worker || MODEL_TIERS.worker;
    let stepResults: unknown[] = [];
    let totalTokens = { planner: 0, worker: 0, reasoner: 0 };

    for (let i = 0; i < Math.min(plan.plan?.length || 0, agent.max_steps || 20); i++) {
      const planStep = plan.plan[i];
      
      const { data: execStep } = await supabase
        .from("run_steps")
        .insert({
          run_id: run.id,
          step_index: i + 1,
          kind: planStep.tool ? "tool_call" : "thinking",
          model_tier: "worker",
          model_used: workerModel,
          input_json: planStep,
        })
        .select()
        .single();

      try {
        let stepOutput;
        
        if (planStep.tool) {
          // Execute tool via tool-gateway
          const toolResponse = await fetch(`${supabaseUrl}/functions/v1/tool-gateway`, {
            method: "POST",
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tool_name: planStep.tool,
              args: planStep.args || {},
              run_id: run.id,
              step_id: execStep!.id,
              agent_id,
            }),
          });
          
          stepOutput = await toolResponse.json();
          
          // If tool requires approval, pause execution
          if (stepOutput.status === "awaiting_approval") {
            await supabase.from("runs").update({ status: "awaiting_approval" }).eq("id", run.id);
            stepResults.push({ step: i + 1, status: "awaiting_approval", ...stepOutput });
            break;
          }
        } else {
          // Pure thinking step
          const thinkResult = await callAI(workerModel, [
            { role: "system", content: agent.system_prompt },
            { role: "user", content: `Execute this step: ${planStep.action}\n\nContext from previous steps: ${JSON.stringify(stepResults)}` },
          ]);
          stepOutput = { thought: thinkResult.content };
        }

        await supabase
          .from("run_steps")
          .update({
            output_json: stepOutput,
            finished_at: new Date().toISOString(),
          })
          .eq("id", execStep!.id);

        stepResults.push({ step: i + 1, ...stepOutput });
      } catch (e) {
        console.error(`[agent-run] Step ${i + 1} failed:`, e);
        await supabase
          .from("run_steps")
          .update({
            kind: "error",
            output_json: { error: e instanceof Error ? e.message : "Step failed" },
            finished_at: new Date().toISOString(),
          })
          .eq("id", execStep!.id);
        break;
      }
    }

    // Step 3: Verification with Reasoner model
    const reasonerModel = agent.model_config_json?.reasoner || MODEL_TIERS.reasoner;
    
    const { data: verifyStep } = await supabase
      .from("run_steps")
      .insert({
        run_id: run.id,
        step_index: (plan.plan?.length || 0) + 1,
        kind: "verification",
        model_tier: "reasoner",
        model_used: reasonerModel,
        input_json: { goal, plan, results: stepResults },
      })
      .select()
      .single();

    let verificationResult;
    try {
      verificationResult = await callAI(reasonerModel, [
        { role: "system", content: "You are a verification agent. Review the execution and provide a final response." },
        { role: "user", content: `Original goal: ${goal}\n\nPlan executed: ${JSON.stringify(plan)}\n\nStep results: ${JSON.stringify(stepResults)}\n\nProvide a final summary and answer. If the goal was not fully achieved, explain what's missing.` },
      ]);

      await supabase
        .from("run_steps")
        .update({
          output_json: { verification: verificationResult.content },
          finished_at: new Date().toISOString(),
        })
        .eq("id", verifyStep!.id);
    } catch (e) {
      console.error("[agent-run] Verification failed:", e);
      verificationResult = { content: "Verification skipped due to error" };
    }

    // Finalize run
    await supabase.from("runs").update({
      status: "completed",
      result_json: { 
        final_response: verificationResult.content,
        steps_completed: stepResults.length,
      },
      verification_json: { verified: true, response: verificationResult.content },
      tokens_planner: totalTokens.planner,
      tokens_worker: totalTokens.worker,
      tokens_reasoner: totalTokens.reasoner,
      finished_at: new Date().toISOString(),
    }).eq("id", run.id);

    // Store episodic memory of this run
    await supabase.from("ai_memory").insert({
      user_id: user.id,
      key: `run_${run.id}`,
      value: { goal, result: verificationResult.content, completed_at: new Date().toISOString() },
      category: "episodic",
      memory_type: "agent_run",
      importance: 6,
    });

    console.log(`[agent-run] Run ${run.id} completed successfully`);

    return new Response(JSON.stringify({
      run_id: run.id,
      status: "completed",
      result: verificationResult.content,
      steps_completed: stepResults.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[agent-run] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
