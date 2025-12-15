import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// Declare EdgeRuntime for background tasks
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResearchFinding {
  title: string;
  summary: string;
  details: string;
  confidence: number;
}

interface SubTopic {
  topic: string;
  description: string;
  priority: number;
}

// Perform AI-powered research on a topic
async function researchTopic(
  topic: string,
  description: string | null,
  depth: number,
  apiKey: string
): Promise<{ findings: ResearchFinding[]; subTopics: SubTopic[] }> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are Atlas, an autonomous research AI. Your task is to research topics deeply and thoroughly.

When researching a topic:
1. Generate 3-5 key findings with detailed insights
2. Identify 2-4 sub-topics that warrant deeper investigation
3. Be thorough, accurate, and cite your reasoning

Current research depth: ${depth} (0 = root, higher = more specific)
Maximum useful depth is typically 3-4 levels.

Provide structured research output that adds genuine value and knowledge.`
        },
        {
          role: "user",
          content: `Research this topic: "${topic}"${description ? `\n\nContext: ${description}` : ''}

Provide:
1. Key findings (facts, insights, important information)
2. Sub-topics for deeper research (if depth < 3)`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_research",
            description: "Submit research findings and suggested sub-topics",
            parameters: {
              type: "object",
              properties: {
                findings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Finding title" },
                      summary: { type: "string", description: "Brief summary (1-2 sentences)" },
                      details: { type: "string", description: "Detailed explanation" },
                      confidence: { type: "number", minimum: 0, maximum: 1 }
                    },
                    required: ["title", "summary", "details", "confidence"]
                  }
                },
                subTopics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      topic: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "number", minimum: 1, maximum: 10 }
                    },
                    required: ["topic", "description", "priority"]
                  }
                }
              },
              required: ["findings", "subTopics"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "submit_research" } }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Research API failed:", errorText);
    throw new Error(`Research failed: ${errorText}`);
  }

  const result = await response.json();
  
  try {
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return {
        findings: parsed.findings || [],
        subTopics: parsed.subTopics || []
      };
    }
  } catch (e) {
    console.error("Failed to parse research:", e);
  }

  return { findings: [], subTopics: [] };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topicId, action, topic, description, userId, autoDeepen = true, maxDepth = 3 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle different actions
    if (action === "start" || action === "resume") {
      // Get the topic from database
      const { data: topicData, error: fetchError } = await supabase
        .from("atlas_research_topics")
        .select("*")
        .eq("id", topicId)
        .single();

      if (fetchError || !topicData) {
        throw new Error("Topic not found");
      }

      console.log(`Starting research on: ${topicData.topic} (depth: ${topicData.depth_level})`);

      // Update status to researching
      await supabase
        .from("atlas_research_topics")
        .update({ status: "researching", updated_at: new Date().toISOString() })
        .eq("id", topicId);

      // Perform research
      const { findings, subTopics } = await researchTopic(
        topicData.topic,
        topicData.description,
        topicData.depth_level,
        LOVABLE_API_KEY
      );

      console.log(`Research complete: ${findings.length} findings, ${subTopics.length} sub-topics`);

      // Update topic with findings
      const { error: updateError } = await supabase
        .from("atlas_research_topics")
        .update({
          status: "completed",
          findings: findings,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", topicId);

      if (updateError) {
        console.error("Failed to update topic:", updateError);
      }

      // Store findings as knowledge entries
      if (findings.length > 0) {
        const knowledgeEntries = findings
          .filter(f => f.confidence >= 0.6)
          .map(f => ({
            user_id: topicData.user_id || null,
            topic: f.title,
            content: { summary: f.summary, details: f.details },
            category: "research_finding",
            source: `research:${topicData.topic}`,
            confidence: f.confidence,
            relevance_score: f.confidence
          }));

        if (knowledgeEntries.length > 0) {
          await supabase.from("atlas_knowledge_entries").insert(knowledgeEntries);
          console.log(`Stored ${knowledgeEntries.length} knowledge entries`);
        }
      }

      // Create sub-topics if auto-deepen is enabled and within depth limit
      if (autoDeepen && topicData.depth_level < maxDepth && subTopics.length > 0) {
        const subTopicEntries = subTopics.map(st => ({
          parent_id: topicId,
          user_id: topicData.user_id || null,
          topic: st.topic,
          description: st.description,
          status: "queued",
          depth_level: topicData.depth_level + 1,
          priority: st.priority,
          auto_generated: true,
          findings: [],
          sources: []
        }));

        const { data: createdSubTopics, error: subError } = await supabase
          .from("atlas_research_topics")
          .insert(subTopicEntries)
          .select();

        if (subError) {
          console.error("Failed to create sub-topics:", subError);
        } else if (createdSubTopics) {
          console.log(`Created ${createdSubTopics.length} sub-topics`);

          // Queue up research for sub-topics (process top priority first)
          for (const subTopic of createdSubTopics.slice(0, 2)) {
            // Only auto-research top 2 priority sub-topics to avoid explosion
            EdgeRuntime.waitUntil(
              fetch(`${SUPABASE_URL}/functions/v1/atlas-research`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                },
                body: JSON.stringify({
                  topicId: subTopic.id,
                  action: "start",
                  autoDeepen: true,
                  maxDepth
                })
              }).catch(e => console.error("Sub-topic research failed:", e))
            );
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          findings: findings.length,
          subTopics: subTopics.length
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new research topic
    if (action === "create" || (!action && topic)) {
      const { data: newTopic, error: createError } = await supabase
        .from("atlas_research_topics")
        .insert({
          user_id: userId || null,
          topic: topic,
          description: description || null,
          status: "queued",
          depth_level: 0,
          priority: 5,
          auto_generated: false,
          findings: [],
          sources: []
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create topic: ${createError.message}`);
      }

      console.log(`Created research topic: ${newTopic.id}`);

      // Start researching immediately
      EdgeRuntime.waitUntil(
        fetch(`${SUPABASE_URL}/functions/v1/atlas-research`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            topicId: newTopic.id,
            action: "start",
            autoDeepen,
            maxDepth
          })
        }).catch(e => console.error("Research start failed:", e))
      );

      return new Response(
        JSON.stringify({ success: true, topicId: newTopic.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action or missing parameters");
  } catch (error) {
    console.error("Atlas research error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
