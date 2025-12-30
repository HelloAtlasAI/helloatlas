import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, corsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { getSupabaseClient, getSupabaseUrl } from "../_shared/supabase.ts";

interface BrainRunMetrics {
  newsCollected: number;
  topicsGenerated: number;
  researchCompleted: number;
  entriesValidated: number;
  totalDurationMs: number;
  errors: string[];
}

interface QueuedTopic {
  id: string;
  topic: string;
  description: string | null;
  priority_score: number;
  source: string;
  category: string;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const startTime = Date.now();
  const metrics: BrainRunMetrics = {
    newsCollected: 0,
    topicsGenerated: 0,
    researchCompleted: 0,
    entriesValidated: 0,
    totalDurationMs: 0,
    errors: [],
  };

  try {
    const { mode = "full", maxResearchItems = 5, maxValidationItems = 10 } = await req.json().catch(() => ({}));

    const supabase = getSupabaseClient();
    const SUPABASE_URL = getSupabaseUrl();
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    console.log(`[atlas-brain] Starting ${mode} learning cycle...`);

    // Create a brain run record
    const { data: runData, error: runError } = await supabase
      .from("atlas_brain_runs")
      .insert({ run_type: mode, status: "running" })
      .select()
      .single();

    if (runError) {
      console.error("[atlas-brain] Failed to create run record:", runError);
    }

    const runId = runData?.id;

    // Helper to invoke edge functions
    const invokeFunction = async (name: string, body: unknown): Promise<unknown> => {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`${name} failed: ${response.status} - ${text}`);
        }
        return await response.json();
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[atlas-brain] Error invoking ${name}:`, msg);
        metrics.errors.push(`${name}: ${msg}`);
        return null;
      }
    };

    // PHASE 1: Parallel data collection
    console.log("[atlas-brain] Phase 1: Collecting news and discovering topics...");
    
    const phase1Promises: Promise<unknown>[] = [];
    
    if (mode === "full" || mode === "news_pulse") {
      phase1Promises.push(
        invokeFunction("atlas-news-pulse", { categories: ["general", "technology", "science", "business"] })
          .then((result: unknown) => {
            const typedResult = result as { newsCollected?: number } | null;
            if (typedResult?.newsCollected) {
              metrics.newsCollected = typedResult.newsCollected;
              console.log(`[atlas-brain] Collected ${typedResult.newsCollected} news items`);
            }
            return result;
          })
      );
    }

    if (mode === "full" || mode === "topic_discovery") {
      phase1Promises.push(
        invokeFunction("atlas-topic-discovery", { maxTopics: 5 })
          .then((result: unknown) => {
            const typedResult = result as { topicsGenerated?: number } | null;
            if (typedResult?.topicsGenerated) {
              metrics.topicsGenerated = typedResult.topicsGenerated;
              console.log(`[atlas-brain] Generated ${typedResult.topicsGenerated} new topics`);
            }
            return result;
          })
      );
    }

    await Promise.all(phase1Promises);

    // PHASE 2: Process research queue
    console.log("[atlas-brain] Phase 2: Processing research queue...");

    const { data: queuedItems, error: queueError } = await supabase
      .from("atlas_research_queue")
      .select("*")
      .eq("status", "queued")
      .lte("scheduled_for", new Date().toISOString())
      .order("priority_score", { ascending: false })
      .limit(maxResearchItems);

    if (queueError) {
      console.error("[atlas-brain] Error fetching queue:", queueError);
    } else if (queuedItems && queuedItems.length > 0) {
      console.log(`[atlas-brain] Processing ${queuedItems.length} queued research items`);

      await supabase
        .from("atlas_research_queue")
        .update({ 
          status: "processing", 
          processing_started_at: new Date().toISOString(),
        })
        .in("id", queuedItems.map((q: QueuedTopic) => q.id));

      const researchPromises = queuedItems.map(async (item: QueuedTopic) => {
        try {
          const { data: topicData, error: insertError } = await supabase
            .from("atlas_research_topics")
            .insert({
              topic: item.topic,
              description: item.description,
              status: "queued",
              priority: Math.round(item.priority_score * 10),
              auto_generated: true,
              user_id: null,
            })
            .select()
            .single();

          if (insertError) {
            throw new Error(`Failed to create topic: ${insertError.message}`);
          }

          await invokeFunction("atlas-research", {
            topicId: topicData.id,
            action: "start",
            autoDeepen: item.priority_score > 0.7,
            maxDepth: 2,
          });

          await supabase
            .from("atlas_research_queue")
            .update({ 
              status: "completed", 
              completed_at: new Date().toISOString() 
            })
            .eq("id", item.id);

          return { success: true, topic: item.topic };
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          
          await supabase
            .from("atlas_research_queue")
            .update({ 
              status: "failed",
              error_message: msg,
              last_attempt_at: new Date().toISOString(),
            })
            .eq("id", item.id);

          return { success: false, topic: item.topic, error: msg };
        }
      });

      const researchResults = await Promise.all(researchPromises);
      metrics.researchCompleted = researchResults.filter(r => r.success).length;
      console.log(`[atlas-brain] Completed ${metrics.researchCompleted}/${queuedItems.length} research items`);
    }

    // PHASE 3: Batch validation
    if (mode === "full" || mode === "validation_batch") {
      console.log("[atlas-brain] Phase 3: Running batch validation...");

      const { data: unvalidatedKnowledge } = await supabase
        .from("atlas_knowledge_entries")
        .select("id, topic, content, source")
        .eq("is_validated", false)
        .limit(maxValidationItems);

      const { data: unvalidatedResearch } = await supabase
        .from("atlas_research_topics")
        .select("id, topic, findings")
        .eq("is_validated", false)
        .eq("status", "completed")
        .limit(maxValidationItems);

      const validationEntries: Array<{
        entryId: string;
        entryType: string;
        topic: string;
        content: string;
        source: string;
      }> = [];

      if (unvalidatedKnowledge) {
        validationEntries.push(...unvalidatedKnowledge.map((e) => ({
          entryId: e.id,
          entryType: "knowledge",
          topic: e.topic,
          content: typeof e.content === "string" ? e.content : JSON.stringify(e.content),
          source: e.source,
        })));
      }

      if (unvalidatedResearch) {
        validationEntries.push(...unvalidatedResearch.map((e) => ({
          entryId: e.id,
          entryType: "research",
          topic: e.topic,
          content: JSON.stringify(e.findings || []),
          source: "research",
        })));
      }

      if (validationEntries.length > 0) {
        console.log(`[atlas-brain] Validating ${validationEntries.length} entries`);
        
        const validationResult = await invokeFunction("validation-engine", {
          entries: validationEntries,
          immediate: false,
        }) as { queued?: boolean } | null;

        if (validationResult?.queued) {
          metrics.entriesValidated = validationEntries.length;
        }
      }
    }

    // Update brain run record
    metrics.totalDurationMs = Date.now() - startTime;
    
    if (runId) {
      await supabase
        .from("atlas_brain_runs")
        .update({
          status: metrics.errors.length > 0 ? "completed_with_errors" : "completed",
          completed_at: new Date().toISOString(),
          metrics: metrics,
          news_collected: metrics.newsCollected,
          topics_generated: metrics.topicsGenerated,
          research_completed: metrics.researchCompleted,
          entries_validated: metrics.entriesValidated,
        })
        .eq("id", runId);
    }

    console.log(`[atlas-brain] Learning cycle complete in ${metrics.totalDurationMs}ms`);

    return jsonResponse({
      success: true,
      runId,
      mode,
      metrics,
    });
  } catch (error) {
    console.error("[atlas-brain] Fatal error:", error);
    metrics.totalDurationMs = Date.now() - startTime;
    
    return errorResponse(error instanceof Error ? error.message : "Unknown error");
  }
});
