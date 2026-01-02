import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Generate embedding using Lovable AI
async function generateEmbedding(text: string): Promise<number[]> {
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are an embedding generator. Given text, output ONLY a JSON array of exactly 768 floating point numbers between -1 and 1 that represent the semantic meaning of the text. The numbers should capture:
- Main topics and concepts (positions 0-255)
- Sentiment and tone (positions 256-383)
- Entities and specifics (positions 384-511)
- Context and relationships (positions 512-767)
Output ONLY the JSON array, no other text.`
        },
        {
          role: "user",
          content: text.slice(0, 2000)
        }
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found");
    }
    const embedding = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(embedding) || embedding.length !== 768) {
      throw new Error(`Invalid embedding length: ${embedding.length}`);
    }
    
    return embedding;
  } catch (e) {
    console.error("Parse error, using fallback:", e);
    return generateFallbackEmbedding(text);
  }
}

function generateFallbackEmbedding(text: string): number[] {
  const embedding: number[] = new Array(768).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const idx = (word.charCodeAt(j) * (i + 1) * (j + 1)) % 768;
      embedding[idx] = Math.sin(word.charCodeAt(j) * (j + 1)) * 0.5 + 0.5;
    }
  }
  
  const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batchSize = 10, source = "all" } = await req.json().catch(() => ({}));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let totalProcessed = 0;
    let totalCreated = 0;
    const errors: string[] = [];

    // Get existing embedded knowledge entry IDs
    const { data: existingKnowledge } = await supabase
      .from("memory_vectors")
      .select("knowledge_entry_id")
      .not("knowledge_entry_id", "is", null);
    
    const embeddedKnowledgeIds = new Set(
      (existingKnowledge || []).map((v: any) => v.knowledge_entry_id)
    );

    // Process knowledge entries
    if (source === "all" || source === "knowledge") {
      const { data: knowledgeEntries, error: kError } = await supabase
        .from("atlas_knowledge_entries")
        .select("id, topic, content, category, user_id")
        .order("created_at", { ascending: false })
        .limit(batchSize * 2);

      if (kError) {
        errors.push(`Knowledge fetch error: ${kError.message}`);
      } else if (knowledgeEntries) {
        // Filter out already embedded entries
        const toEmbed = knowledgeEntries
          .filter((k: any) => !embeddedKnowledgeIds.has(k.id))
          .slice(0, batchSize);

        for (const entry of toEmbed) {
          try {
            const contentStr = typeof entry.content === "object"
              ? JSON.stringify(entry.content)
              : String(entry.content);
            
            const textToEmbed = `${entry.topic}. Category: ${entry.category}. ${contentStr}`;
            
            console.log(`Embedding knowledge: ${entry.topic.slice(0, 50)}...`);
            const embedding = await generateEmbedding(textToEmbed);

            const { error: insertError } = await supabase
              .from("memory_vectors")
              .insert({
                user_id: entry.user_id || "00000000-0000-0000-0000-000000000000",
                knowledge_entry_id: entry.id,
                chunk_text: textToEmbed.slice(0, 1000),
                embedding: `[${embedding.join(",")}]`,
                source_ref_json: { type: "knowledge", topic: entry.topic },
              });

            if (insertError) {
              errors.push(`Insert error for ${entry.id}: ${insertError.message}`);
            } else {
              totalCreated++;
            }
            totalProcessed++;
          } catch (e) {
            errors.push(`Embedding error for ${entry.id}: ${e}`);
          }
          
          // Rate limiting - wait between embeddings
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // Process research topics
    if (source === "all" || source === "research") {
      const { data: existingResearch } = await supabase
        .from("memory_vectors")
        .select("source_ref_json")
        .not("source_ref_json", "is", null);
      
      const embeddedResearchIds = new Set(
        (existingResearch || [])
          .filter((v: any) => v.source_ref_json?.type === "research")
          .map((v: any) => v.source_ref_json?.id)
      );

      const { data: researchTopics, error: rError } = await supabase
        .from("atlas_research_topics")
        .select("id, topic, description, findings, user_id, status")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(batchSize * 2);

      if (rError) {
        errors.push(`Research fetch error: ${rError.message}`);
      } else if (researchTopics) {
        const toEmbed = researchTopics
          .filter((r: any) => !embeddedResearchIds.has(r.id))
          .slice(0, batchSize);

        for (const topic of toEmbed) {
          try {
            const findingsStr = Array.isArray(topic.findings)
              ? topic.findings.slice(0, 5).map((f: any) => 
                  typeof f === "string" ? f : JSON.stringify(f)
                ).join(". ")
              : "";
            
            const textToEmbed = `${topic.topic}. ${topic.description || ""}. Key findings: ${findingsStr}`;
            
            console.log(`Embedding research: ${topic.topic.slice(0, 50)}...`);
            const embedding = await generateEmbedding(textToEmbed);

            const { error: insertError } = await supabase
              .from("memory_vectors")
              .insert({
                user_id: topic.user_id || "00000000-0000-0000-0000-000000000000",
                chunk_text: textToEmbed.slice(0, 1000),
                embedding: `[${embedding.join(",")}]`,
                source_ref_json: { type: "research", id: topic.id, topic: topic.topic },
              });

            if (insertError) {
              errors.push(`Insert error for research ${topic.id}: ${insertError.message}`);
            } else {
              totalCreated++;
            }
            totalProcessed++;
          } catch (e) {
            errors.push(`Embedding error for research ${topic.id}: ${e}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    console.log(`Embedding complete: ${totalCreated} created, ${totalProcessed} processed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        created: totalCreated,
        errors: errors.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Generate embeddings error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
