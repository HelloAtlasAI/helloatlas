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
  source_url?: string;
}

interface SubTopic {
  topic: string;
  description: string;
  priority: number;
}

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
      tool_calls?: Array<{
        function: {
          arguments: string;
        };
      }>;
    };
  }>;
  citations?: string[];
}

// Provider configuration
const PROVIDERS = {
  perplexity: {
    url: "https://api.perplexity.ai/chat/completions",
    model: "sonar-pro", // Deep research model with 2x citations
  },
  lovable: {
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    model: "google/gemini-2.5-flash",
  },
};

// Perform research using Perplexity or fallback to Lovable AI
async function researchTopic(
  topic: string,
  description: string | null,
  depth: number,
  perplexityKey: string | null,
  lovableKey: string
): Promise<{ findings: ResearchFinding[]; subTopics: SubTopic[]; citations: string[] }> {
  
  // Try Perplexity first for grounded research with real citations
  if (perplexityKey) {
    console.log(`[atlas-research] Using Perplexity sonar-pro for: ${topic}`);
    
    try {
      const response = await fetch(PROVIDERS.perplexity.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${perplexityKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: PROVIDERS.perplexity.model,
          messages: [
            {
              role: "system",
              content: `You are Atlas, an expert research AI. Your task is to research topics deeply and provide comprehensive, well-sourced findings.

When researching:
1. Generate 3-5 key findings with detailed insights
2. Provide specific, factual information with high confidence
3. Identify 2-4 sub-topics that warrant deeper investigation (only if depth < 3)

Current research depth: ${depth} (0 = root topic, higher = more specific)

Be thorough, accurate, and cite specific facts and figures when available.`
            },
            {
              role: "user",
              content: `Research this topic comprehensively: "${topic}"${description ? `\n\nContext: ${description}` : ''}

Provide your findings in this exact JSON format:
{
  "findings": [
    {
      "title": "Finding title",
      "summary": "One-sentence summary",
      "details": "Detailed explanation with specific facts",
      "confidence": 0.85
    }
  ],
  "subTopics": [
    {
      "topic": "Sub-topic to research",
      "description": "Why this is worth exploring",
      "priority": 8
    }
  ]
}

Only include subTopics if depth < 3. Be precise and factual.`
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[atlas-research] Perplexity API error:", errorText);
        throw new Error(`Perplexity API failed: ${response.status}`);
      }

      const data: PerplexityResponse = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const citations = data.citations || [];

      console.log(`[atlas-research] Perplexity response received, citations: ${citations.length}`);

      // Parse the JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Add citations to findings
          const findingsWithSources = (parsed.findings || []).map((f: ResearchFinding, idx: number) => ({
            ...f,
            source_url: citations[idx] || citations[0] || null
          }));

          return {
            findings: findingsWithSources,
            subTopics: depth < 3 ? (parsed.subTopics || []) : [],
            citations
          };
        }
      } catch (parseError) {
        console.error("[atlas-research] Failed to parse Perplexity response:", parseError);
      }

      // If parsing failed, create a single finding from the content
      return {
        findings: [{
          title: topic,
          summary: content.slice(0, 200),
          details: content,
          confidence: 0.8,
          source_url: citations[0] || undefined
        }],
        subTopics: [],
        citations
      };
    } catch (perplexityError) {
      console.error("[atlas-research] Perplexity failed, falling back to Lovable AI:", perplexityError);
    }
  }

  // Fallback to Lovable AI with tool calling
  console.log(`[atlas-research] Using Lovable AI for: ${topic}`);
  
  const response = await fetch(PROVIDERS.lovable.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: PROVIDERS.lovable.model,
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
    console.error("[atlas-research] Lovable AI failed:", errorText);
    throw new Error(`Research failed: ${errorText}`);
  }

  const result = await response.json();
  
  try {
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return {
        findings: parsed.findings || [],
        subTopics: depth < 3 ? (parsed.subTopics || []) : [],
        citations: []
      };
    }
  } catch (e) {
    console.error("[atlas-research] Failed to parse Lovable AI response:", e);
  }

  return { findings: [], subTopics: [], citations: [] };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topicId, action, topic, description, userId, autoDeepen = true, maxDepth = 3 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Log provider being used
    console.log(`[atlas-research] Provider: ${PERPLEXITY_API_KEY ? 'Perplexity sonar-pro' : 'Lovable AI (fallback)'}`);

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

      console.log(`[atlas-research] Starting research on: ${topicData.topic} (depth: ${topicData.depth_level})`);

      // Update status to researching
      await supabase
        .from("atlas_research_topics")
        .update({ status: "researching", updated_at: new Date().toISOString() })
        .eq("id", topicId);

      // Perform research
      const { findings, subTopics, citations } = await researchTopic(
        topicData.topic,
        topicData.description,
        topicData.depth_level,
        PERPLEXITY_API_KEY || null,
        LOVABLE_API_KEY
      );

      console.log(`[atlas-research] Research complete: ${findings.length} findings, ${subTopics.length} sub-topics, ${citations.length} citations`);

      // Update topic with findings and sources
      const { error: updateError } = await supabase
        .from("atlas_research_topics")
        .update({
          status: "completed",
          findings: findings,
          sources: citations.map(url => ({ url, accessed_at: new Date().toISOString() })),
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", topicId);

      if (updateError) {
        console.error("[atlas-research] Failed to update topic:", updateError);
      }

      // Store findings as knowledge entries
      if (findings.length > 0) {
        const knowledgeEntries = findings
          .filter(f => f.confidence >= 0.6)
          .map(f => ({
            user_id: topicData.user_id || null,
            topic: f.title,
            content: { 
              summary: f.summary, 
              details: f.details,
              source_url: f.source_url 
            },
            category: "research_finding",
            source: f.source_url || `research:${topicData.topic}`,
            confidence: f.confidence,
            relevance_score: f.confidence
          }));

        if (knowledgeEntries.length > 0) {
          await supabase.from("atlas_knowledge_entries").insert(knowledgeEntries);
          console.log(`[atlas-research] Stored ${knowledgeEntries.length} knowledge entries`);
        }
      }

      // Store citations as research citations
      if (citations.length > 0) {
        const citationEntries = citations.map(url => ({
          user_id: topicData.user_id || null,
          research_topic_id: topicId,
          url,
          domain: new URL(url).hostname,
          citation_type: "web",
          credibility_score: 0.7, // Default score, could be improved with domain analysis
          accessed_at: new Date().toISOString()
        }));

        const { error: citationError } = await supabase.from("research_citations").insert(citationEntries);
        if (!citationError) {
          console.log(`[atlas-research] Stored ${citationEntries.length} citations`);
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
          console.error("[atlas-research] Failed to create sub-topics:", subError);
        } else if (createdSubTopics) {
          console.log(`[atlas-research] Created ${createdSubTopics.length} sub-topics`);

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
              }).catch(e => console.error("[atlas-research] Sub-topic research failed:", e))
            );
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          findings: findings.length,
          subTopics: subTopics.length,
          citations: citations.length,
          provider: PERPLEXITY_API_KEY ? "perplexity" : "lovable"
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

      console.log(`[atlas-research] Created research topic: ${newTopic.id}`);

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
        }).catch(e => console.error("[atlas-research] Research start failed:", e))
      );

      return new Response(
        JSON.stringify({ success: true, topicId: newTopic.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action or missing parameters");
  } catch (error) {
    console.error("[atlas-research] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
