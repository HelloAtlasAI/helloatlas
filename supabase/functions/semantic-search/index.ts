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

  // Use Gemini to create a semantic representation, then hash it to a fixed-size vector
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
          content: text.slice(0, 2000) // Limit text length
        }
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Embedding generation failed:", error);
    throw new Error(`Embedding generation failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  try {
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }
    const embedding = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(embedding) || embedding.length !== 768) {
      throw new Error(`Invalid embedding length: ${embedding.length}`);
    }
    
    return embedding;
  } catch (e) {
    console.error("Failed to parse embedding:", content.slice(0, 500));
    // Fallback: generate deterministic embedding from text hash
    return generateFallbackEmbedding(text);
  }
}

// Fallback embedding generator using text hashing
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
  
  // Normalize
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
    const { query, threshold = 0.3, limit = 20, userId } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Semantic search for: "${query.slice(0, 100)}..."`);

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Search for similar vectors using RPC
    const { data: vectorResults, error: vectorError } = await supabase.rpc(
      "match_brain_vectors",
      {
        query_embedding: `[${queryEmbedding.join(",")}]`,
        match_threshold: threshold,
        match_count: limit,
        p_user_id: userId || null,
      }
    );

    if (vectorError) {
      console.error("Vector search error:", vectorError);
      // Return empty results if RPC fails (e.g., no embeddings yet)
      return new Response(
        JSON.stringify({ 
          results: [], 
          message: "No embeddings indexed yet. Run generate-embeddings first.",
          query 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vectorResults || vectorResults.length === 0) {
      return new Response(
        JSON.stringify({ results: [], query }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch full details for matched vectors
    const knowledgeIds = vectorResults
      .filter((v: any) => v.knowledge_entry_id)
      .map((v: any) => v.knowledge_entry_id);

    const memoryIds = vectorResults
      .filter((v: any) => v.memory_item_id)
      .map((v: any) => v.memory_item_id);

    // Fetch knowledge entries and memory items in parallel
    const [knowledgeResult, memoryResult] = await Promise.all([
      knowledgeIds.length > 0
        ? supabase
            .from("atlas_knowledge_entries")
            .select("*")
            .in("id", knowledgeIds)
        : { data: [], error: null },
      memoryIds.length > 0
        ? supabase
            .from("ai_memory")
            .select("*")
            .in("id", memoryIds)
        : { data: [], error: null },
    ]);

    // Build lookup maps
    const knowledgeMap = new Map(
      (knowledgeResult.data || []).map((k: any) => [k.id, k])
    );
    const memoryMap = new Map(
      (memoryResult.data || []).map((m: any) => [m.id, m])
    );

    // Combine results with similarity scores
    const enrichedResults = vectorResults.map((v: any) => {
      if (v.knowledge_entry_id && knowledgeMap.has(v.knowledge_entry_id)) {
        const knowledge = knowledgeMap.get(v.knowledge_entry_id);
        return {
          id: knowledge.id,
          type: "knowledge" as const,
          title: knowledge.topic,
          preview: typeof knowledge.content === "object" 
            ? JSON.stringify(knowledge.content).slice(0, 200)
            : String(knowledge.content).slice(0, 200),
          category: knowledge.category,
          confidence: knowledge.confidence,
          similarity: v.similarity,
          createdAt: knowledge.created_at,
          source: "semantic",
          metadata: {
            source: knowledge.source,
            accessCount: knowledge.access_count,
            relevanceScore: knowledge.relevance_score,
          },
        };
      }
      
      if (v.memory_item_id && memoryMap.has(v.memory_item_id)) {
        const memory = memoryMap.get(v.memory_item_id);
        return {
          id: memory.id,
          type: "memory" as const,
          title: memory.key,
          preview: typeof memory.value === "object"
            ? JSON.stringify(memory.value).slice(0, 200)
            : String(memory.value).slice(0, 200),
          category: memory.category,
          confidence: (memory.validation_score || 0.5),
          similarity: v.similarity,
          createdAt: memory.created_at,
          source: "semantic",
          metadata: {
            memoryType: memory.memory_type,
            importance: memory.importance,
          },
        };
      }

      // Fallback for vectors without linked entries
      return {
        id: v.id,
        type: "vector" as const,
        title: "Indexed Content",
        preview: v.chunk_text?.slice(0, 200) || "",
        similarity: v.similarity,
        createdAt: new Date().toISOString(),
        source: "semantic",
        metadata: {},
      };
    }).filter((r: any) => r.preview); // Filter out empty results

    console.log(`Found ${enrichedResults.length} semantic matches`);

    return new Response(
      JSON.stringify({ results: enrichedResults, query }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Semantic search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
