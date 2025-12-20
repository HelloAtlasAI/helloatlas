import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RetrieveRequest {
  query: string;
  userId?: string;
  types?: ("knowledge" | "memory" | "research" | "context")[];
  limit?: number;
  includeUnvalidated?: boolean;
  excludeFake?: boolean;
}

interface StoreRequest {
  type: "knowledge" | "memory" | "research" | "context";
  topic: string;
  content: unknown;
  userId?: string;
  source?: string;
  category?: string;
  confidence?: number;
  triggerValidation?: boolean;
}

interface UnifiedEntry {
  id: string;
  type: "knowledge" | "memory" | "research" | "context";
  topic: string;
  content: unknown;
  category?: string;
  relevanceScore: number;
  isValidated: boolean;
  isFake: boolean;
  validationScore: number;
  source: string;
  createdAt: string;
}

// Calculate text similarity for basic relevance ranking
function calculateSimilarity(query: string, text: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();
  
  let matches = 0;
  for (const term of queryTerms) {
    if (textLower.includes(term)) {
      matches++;
    }
  }
  
  return queryTerms.length > 0 ? matches / queryTerms.length : 0;
}

// Retrieve unified context from all sources
async function retrieveContext(
  supabase: any,
  request: RetrieveRequest
): Promise<UnifiedEntry[]> {
  const {
    query,
    userId,
    types = ["knowledge", "memory", "research", "context"],
    limit = 20,
    includeUnvalidated = true,
    excludeFake = true,
  } = request;

  const results: UnifiedEntry[] = [];
  const queries: Promise<void>[] = [];

  // Query knowledge entries
  if (types.includes("knowledge")) {
    queries.push((async () => {
      let q = supabase
        .from("atlas_knowledge_entries")
        .select("id, topic, content, category, relevance_score, is_validated, is_fake, validation_score, source, created_at")
        .order("relevance_score", { ascending: false })
        .limit(limit);

      if (userId) {
        q = q.or(`user_id.eq.${userId},user_id.is.null`);
      }
      if (excludeFake) {
        q = q.eq("is_fake", false);
      }
      if (!includeUnvalidated) {
        q = q.eq("is_validated", true);
      }

      const { data } = await q;
      if (data) {
        for (const item of data) {
          const textContent = typeof item.content === "string" 
            ? item.content 
            : JSON.stringify(item.content);
          const similarity = calculateSimilarity(query, `${item.topic} ${textContent}`);
          
          results.push({
            id: item.id,
            type: "knowledge",
            topic: item.topic,
            content: item.content,
            category: item.category,
            relevanceScore: (item.relevance_score || 0.5) * (0.5 + similarity * 0.5),
            isValidated: item.is_validated || false,
            isFake: item.is_fake || false,
            validationScore: item.validation_score || 0,
            source: item.source || "unknown",
            createdAt: item.created_at,
          });
        }
      }
    })());
  }

  // Query memories
  if (types.includes("memory")) {
    queries.push((async () => {
      let q = supabase
        .from("ai_memory")
        .select("id, key, value, category, importance, is_validated, is_fake, validation_score, created_at")
        .order("importance", { ascending: false })
        .limit(limit);

      if (userId) {
        q = q.eq("user_id", userId);
      }
      if (excludeFake) {
        q = q.or("is_fake.eq.false,is_fake.is.null");
      }

      const { data } = await q;
      if (data) {
        for (const item of data) {
          const textContent = typeof item.value === "string" 
            ? item.value 
            : JSON.stringify(item.value);
          const similarity = calculateSimilarity(query, `${item.key} ${textContent}`);
          
          results.push({
            id: item.id,
            type: "memory",
            topic: item.key,
            content: item.value,
            category: item.category,
            relevanceScore: ((item.importance || 5) / 10) * (0.5 + similarity * 0.5),
            isValidated: item.is_validated || false,
            isFake: item.is_fake || false,
            validationScore: item.validation_score || 0,
            source: "user_memory",
            createdAt: item.created_at,
          });
        }
      }
    })());
  }

  // Query research topics
  if (types.includes("research")) {
    queries.push((async () => {
      let q = supabase
        .from("atlas_research_topics")
        .select("id, topic, description, findings, sources, status, is_validated, is_fake, validation_score, created_at")
        .eq("status", "completed")
        .order("priority", { ascending: false })
        .limit(limit);

      if (userId) {
        q = q.or(`user_id.eq.${userId},user_id.is.null`);
      }
      if (excludeFake) {
        q = q.or("is_fake.eq.false,is_fake.is.null");
      }

      const { data } = await q;
      if (data) {
        for (const item of data) {
          const textContent = `${item.topic} ${item.description || ""} ${JSON.stringify(item.findings || {})}`;
          const similarity = calculateSimilarity(query, textContent);
          
          results.push({
            id: item.id,
            type: "research",
            topic: item.topic,
            content: {
              description: item.description,
              findings: item.findings,
              sources: item.sources,
            },
            category: "research",
            relevanceScore: 0.7 * (0.5 + similarity * 0.5),
            isValidated: item.is_validated || false,
            isFake: item.is_fake || false,
            validationScore: item.validation_score || 0,
            source: "research",
            createdAt: item.created_at,
          });
        }
      }
    })());
  }

  // Query session context (working memory)
  if (types.includes("context")) {
    queries.push((async () => {
      if (!userId) return;

      const { data } = await supabase
        .from("session_context")
        .select("id, context_type, content, confidence, created_at")
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(limit);

      if (data) {
        for (const item of data) {
          const textContent = JSON.stringify(item.content);
          const similarity = calculateSimilarity(query, textContent);
          
          results.push({
            id: item.id,
            type: "context",
            topic: item.context_type,
            content: item.content,
            category: item.context_type,
            relevanceScore: (item.confidence || 0.8) * (0.5 + similarity * 0.5),
            isValidated: true, // Session context is ephemeral, no validation needed
            isFake: false,
            validationScore: 1,
            source: "session",
            createdAt: item.created_at,
          });
        }
      }
    })());
  }

  // Execute all queries in parallel
  await Promise.all(queries);

  // Sort by relevance and return top results
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, limit);
}

// Store new entry and optionally trigger validation
async function storeEntry(
  supabase: any,
  supabaseUrl: string,
  request: StoreRequest
): Promise<{ id: string; type: string }> {
  const { type, topic, content, userId, source, category, confidence, triggerValidation = true } = request;

  let insertedId: string;

  switch (type) {
    case "knowledge": {
      const { data, error } = await supabase
        .from("atlas_knowledge_entries")
        .insert({
          topic,
          content,
          user_id: userId,
          source: source || "api",
          category: category || "general",
          confidence: confidence || 0.5,
          relevance_score: 0.5,
        })
        .select("id")
        .single();
      
      if (error) throw error;
      insertedId = data.id;
      break;
    }

    case "memory": {
      const { data, error } = await supabase
        .from("ai_memory")
        .insert({
          user_id: userId,
          key: topic,
          value: content,
          category: category || "fact",
          memory_type: "fact",
          importance: Math.round((confidence || 0.5) * 10),
        })
        .select("id")
        .single();
      
      if (error) throw error;
      insertedId = data.id;
      break;
    }

    case "research": {
      const { data, error } = await supabase
        .from("atlas_research_topics")
        .insert({
          topic,
          description: typeof content === "string" ? content : JSON.stringify(content),
          user_id: userId,
          status: "completed",
          findings: typeof content === "object" ? content : { summary: content },
        })
        .select("id")
        .single();
      
      if (error) throw error;
      insertedId = data.id;
      break;
    }

    case "context": {
      const { data, error } = await supabase
        .from("session_context")
        .insert({
          user_id: userId,
          session_id: `api_${Date.now()}`,
          context_type: category || "fact",
          content: typeof content === "object" ? content : { value: content },
          confidence: confidence || 0.8,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        })
        .select("id")
        .single();
      
      if (error) throw error;
      insertedId = data.id;
      break;
    }

    default:
      throw new Error(`Unknown entry type: ${type}`);
  }

  // Trigger validation in background if requested
  if (triggerValidation && type !== "context") {
    try {
      fetch(`${supabaseUrl}/functions/v1/validation-engine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [{
            entryId: insertedId,
            entryType: type,
            topic,
            content: typeof content === "string" ? content : JSON.stringify(content),
            source: source || "api",
            userId,
          }],
          immediate: false, // Background validation
        }),
      }).catch(e => console.log("[knowledge-layer] Validation trigger failed:", e));
    } catch (e) {
      console.log("[knowledge-layer] Could not trigger validation:", e);
    }
  }

  return { id: insertedId, type };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (req.method === "GET" || path === "retrieve") {
      // Handle retrieve request
      let request: RetrieveRequest;
      
      if (req.method === "GET") {
        request = {
          query: url.searchParams.get("query") || "",
          userId: url.searchParams.get("userId") || undefined,
          types: url.searchParams.get("types")?.split(",") as any || undefined,
          limit: parseInt(url.searchParams.get("limit") || "20"),
          includeUnvalidated: url.searchParams.get("includeUnvalidated") !== "false",
          excludeFake: url.searchParams.get("excludeFake") !== "false",
        };
      } else {
        request = await req.json();
      }

      console.log(`[knowledge-layer] Retrieving context for query: "${request.query?.slice(0, 50)}..."`);
      
      const results = await retrieveContext(supabase, request);
      
      console.log(`[knowledge-layer] Found ${results.length} entries`);

      return new Response(
        JSON.stringify({
          success: true,
          count: results.length,
          entries: results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST" && path === "store") {
      // Handle store request
      const request: StoreRequest = await req.json();
      
      console.log(`[knowledge-layer] Storing ${request.type}: "${request.topic}"`);
      
      const result = await storeEntry(supabase, SUPABASE_URL, request);
      
      return new Response(
        JSON.stringify({
          success: true,
          ...result,
          message: `Stored ${result.type} entry`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: retrieve with POST body
    if (req.method === "POST") {
      const body = await req.json();
      
      if (body.action === "store") {
        const result = await storeEntry(supabase, SUPABASE_URL, body);
        return new Response(
          JSON.stringify({ success: true, ...result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results = await retrieveContext(supabase, body);
      return new Response(
        JSON.stringify({ success: true, count: results.length, entries: results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[knowledge-layer] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
