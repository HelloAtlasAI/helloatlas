import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KnowledgeExtraction {
  topic: string;
  content: Record<string, unknown>;
  category: string;
  confidence: number;
}

// Extract knowledge using AI
async function extractKnowledge(
  conversation: Array<{ role: string; content: string }>,
  apiKey: string
): Promise<KnowledgeExtraction[]> {
  const conversationText = conversation
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

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
          content: `You are a knowledge extraction AI. Analyze conversations and extract valuable information to remember.

Extract these types of knowledge:
1. **user_preference** - User's likes, dislikes, preferences, habits
2. **personal_info** - Names of people, relationships, important dates
3. **learned_fact** - Facts, information, or insights shared
4. **task_context** - Ongoing tasks, projects, goals
5. **emotional_state** - User's feelings, concerns, celebrations

For each piece of knowledge, provide:
- topic: A short descriptive title (2-5 words)
- content: Structured data about the knowledge
- category: One of the types above
- confidence: 0.0-1.0 how confident you are this is worth remembering

Only extract genuinely useful information. Skip generic greetings or trivial exchanges.
Return a JSON array of extractions. If nothing worth extracting, return an empty array.`
        },
        {
          role: "user",
          content: `Extract knowledge from this conversation:\n\n${conversationText}`
        }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "store_knowledge",
            description: "Store extracted knowledge from the conversation",
            parameters: {
              type: "object",
              properties: {
                extractions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      topic: { type: "string", description: "Short descriptive title" },
                      content: { type: "object", description: "Structured knowledge data" },
                      category: { 
                        type: "string", 
                        enum: ["user_preference", "personal_info", "learned_fact", "task_context", "emotional_state"]
                      },
                      confidence: { type: "number", minimum: 0, maximum: 1 }
                    },
                    required: ["topic", "content", "category", "confidence"]
                  }
                }
              },
              required: ["extractions"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "store_knowledge" } }
    }),
  });

  if (!response.ok) {
    console.error("Knowledge extraction failed:", await response.text());
    return [];
  }

  const result = await response.json();
  
  try {
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return parsed.extractions || [];
    }
  } catch (e) {
    console.error("Failed to parse extraction:", e);
  }

  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation, userId, source = "conversation" } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    if (!conversation || !Array.isArray(conversation)) {
      throw new Error("Invalid conversation data");
    }

    console.log("Extracting knowledge from conversation, user:", userId);

    // Extract knowledge using AI
    const extractions = await extractKnowledge(conversation, LOVABLE_API_KEY);
    console.log("Extracted", extractions.length, "knowledge entries");

    if (extractions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, extracted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const entries = extractions
      .filter(e => e.confidence >= 0.5) // Only store confident extractions
      .map(e => ({
        user_id: userId || null,
        topic: e.topic,
        content: e.content,
        category: e.category,
        source: source,
        confidence: e.confidence,
        relevance_score: e.confidence,
      }));

    if (entries.length > 0) {
      const { error } = await supabase
        .from("atlas_knowledge_entries")
        .insert(entries);

      if (error) {
        console.error("Failed to store knowledge:", error);
        throw new Error("Failed to store knowledge");
      }

      console.log("Stored", entries.length, "knowledge entries");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        extracted: extractions.length,
        stored: entries.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Knowledge extraction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
