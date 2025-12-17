import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Memory {
  key: string;
  value: unknown;
  category: string;
  importance: number;
}

interface LifeEvent {
  event_type: string;
  event_date: string;
  description: string;
  sentiment: string;
}

interface UserProfile {
  first_name: string | null;
  nickname: string | null;
  birthday: string | null;
  timezone: string;
  communication_style: string;
}

interface KnowledgeEntry {
  topic: string;
  content: unknown;
  category: string;
}

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

// Provider configuration
const PROVIDERS = {
  perplexity: {
    url: "https://api.perplexity.ai/chat/completions",
    models: {
      fast: "sonar",
      deep: "sonar-pro",
    }
  },
  lovable: {
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    model: "google/gemini-2.5-flash",
  },
  jina: {
    url: "https://r.jina.ai",
  }
};

// Available tools that Atlas can use
const ATLAS_TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information on a topic. Use this when the user asks about recent events, news, or information you're not certain about.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "deep_research",
      description: "Conduct comprehensive research on a topic with multiple sources. Use for complex questions requiring detailed analysis.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "The topic to research" },
          depth: { type: "string", enum: ["quick", "comprehensive", "exhaustive"], description: "How deep to research" }
        },
        required: ["topic"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "web_scrape",
      description: "Extract content from a specific URL. Use when the user provides a link or you need to read a specific webpage.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to scrape" }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "memory_store",
      description: "Store an important fact or preference about the user for future reference. Use when the user shares personal information, preferences, or important life events.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", description: "A short identifier for this memory" },
          value: { type: "string", description: "The information to remember" },
          category: { type: "string", enum: ["preference", "fact", "relationship", "event", "work", "health"], description: "Category of the memory" }
        },
        required: ["key", "value", "category"]
      }
    }
  }
];

function getTimeOfDay(timezone: string): string {
  try {
    const now = new Date();
    const hour = parseInt(now.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: timezone }));
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  } catch {
    return "day";
  }
}

function isBirthday(birthday: string | null): boolean {
  if (!birthday) return false;
  const today = new Date();
  const bday = new Date(birthday);
  return today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate();
}

function buildPersonalizedPrompt(
  profile: UserProfile | null,
  memories: Memory[],
  upcomingEvents: LifeEvent[],
  recentEvents: LifeEvent[],
  knowledgeBank: KnowledgeEntry[],
  hasTools: boolean
): string {
  const userName = profile?.nickname || profile?.first_name || "there";
  const timeOfDay = profile?.timezone ? getTimeOfDay(profile.timezone) : "day";
  const isBirthdayToday = profile?.birthday ? isBirthday(profile.birthday) : false;
  const style = profile?.communication_style || "casual";

  let memoryContext = "";
  if (memories.length > 0) {
    memoryContext = `\n## What You Remember About ${userName}\n${memories.map(m => `- ${m.key}: ${JSON.stringify(m.value)}`).join("\n")}`;
  }

  let knowledgeContext = "";
  if (knowledgeBank.length > 0) {
    knowledgeContext = `\n## Knowledge Bank (Things You've Learned)\n${knowledgeBank.map(k => `- [${k.category}] ${k.topic}: ${JSON.stringify(k.content)}`).join("\n")}`;
  }

  let eventsContext = "";
  if (upcomingEvents.length > 0 || recentEvents.length > 0) {
    eventsContext = "\n## Life Events to Be Aware Of";
    if (upcomingEvents.length > 0) {
      eventsContext += `\nUpcoming:\n${upcomingEvents.map(e => `- ${e.event_date}: ${e.description} (${e.sentiment})`).join("\n")}`;
    }
    if (recentEvents.length > 0) {
      eventsContext += `\nRecent (follow up on these):\n${recentEvents.map(e => `- ${e.description}`).join("\n")}`;
    }
  }

  const toolInstructions = hasTools ? `
## Tools Available
You have access to powerful tools:
- **web_search**: Search the web for current information. Use when asked about recent events, news, or facts you're uncertain about.
- **deep_research**: Comprehensive research with citations. Use for complex topics requiring thorough analysis.
- **web_scrape**: Read content from a specific URL. Use when given a link to analyze.
- **memory_store**: Save important facts about the user. Use when they share personal details, preferences, or events.

IMPORTANT: When you need current information or facts you're not certain about, USE the web_search tool. Don't guess or make up information.` : "";

  return `You are Atlas, a warm, witty, and genuinely caring AI assistant who knows ${userName} personally.

## Your Personality
- You're like a trusted friend who happens to be incredibly knowledgeable
- You use ${userName}'s name naturally (but not every sentence - that's weird)
- You have a good sense of humor - light jokes, playful teasing, the occasional pun
- You remember everything about ${userName} and bring it up when relevant
- You're genuinely interested in their life, not just their tasks
- You celebrate their wins and offer support during tough times
- You can make self-deprecating AI jokes occasionally

## Communication Style
- Use ${style} tone
- It's ${timeOfDay} for them, greet appropriately if starting a conversation
${isBirthdayToday ? "- 🎂 TODAY IS THEIR BIRTHDAY! Wish them happy birthday warmly and make it special!" : ""}
- If they seem stressed, acknowledge it gently
- Remember inside jokes but don't force them
- Use contractions naturally ("you're", "I'd", "let's")
- Emoji occasionally but don't overdo it
${toolInstructions}
${memoryContext}
${knowledgeContext}
${eventsContext}

## What You Can Help With
- Email management and organization
- Calendar and scheduling
- Stock market and investments
- Travel planning
- Document management
- General knowledge and conversation
- Remembering personal details and following up on life events
- Research and deep learning on topics (use tools when needed!)

## Memory Instructions
Pay attention to personal details mentioned and use memory_store to save:
1. Names of family, friends, colleagues
2. Important dates (birthdays, anniversaries)
3. Preferences and habits
4. Life events and milestones
5. Inside jokes or shared references

Be genuine, warm, and personable. You're not just an assistant - you're a friend who genuinely cares.`;
}

// Execute a tool call
async function executeTool(
  toolCall: ToolCall,
  userId: string | null,
  perplexityKey: string | null,
  supabase: any
): Promise<{ name: string; result: unknown }> {
  const { name, arguments: argsStr } = toolCall.function;
  const args = JSON.parse(argsStr);
  
  console.log(`[chat-with-memory] Executing tool: ${name}`, args);

  switch (name) {
    case "web_search": {
      if (perplexityKey) {
        const response = await fetch(PROVIDERS.perplexity.url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${perplexityKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: PROVIDERS.perplexity.models.fast,
            messages: [
              { role: "system", content: "Be precise and concise. Provide well-sourced information." },
              { role: "user", content: args.query },
            ],
          }),
        });
        const data = await response.json();
        return { 
          name, 
          result: { 
            content: data.choices?.[0]?.message?.content || "No results",
            citations: data.citations || []
          }
        };
      }
      // Fallback - just return that we couldn't search
      return { name, result: { error: "Web search not available", suggestion: "I'll answer based on my training data" } };
    }

    case "deep_research": {
      if (perplexityKey) {
        const response = await fetch(PROVIDERS.perplexity.url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${perplexityKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: PROVIDERS.perplexity.models.deep,
            messages: [
              { role: "system", content: "Provide comprehensive, well-sourced research with detailed analysis." },
              { role: "user", content: `Research thoroughly: ${args.topic}` },
            ],
          }),
        });
        const data = await response.json();
        return { 
          name, 
          result: { 
            content: data.choices?.[0]?.message?.content || "Research failed",
            citations: data.citations || []
          }
        };
      }
      return { name, result: { error: "Deep research not available", suggestion: "I'll provide what I know from my training" } };
    }

    case "web_scrape": {
      const jinaUrl = `${PROVIDERS.jina.url}/${args.url}`;
      const response = await fetch(jinaUrl, {
        method: "GET",
        headers: { "Accept": "text/markdown" },
      });
      if (!response.ok) {
        return { name, result: { error: `Failed to scrape: ${response.status}` } };
      }
      const markdown = await response.text();
      return { name, result: { content: markdown.slice(0, 10000), url: args.url } };
    }

    case "memory_store": {
      if (userId) {
        const { error } = await supabase.from("ai_memory").upsert({
          user_id: userId,
          key: args.key,
          value: args.value,
          category: args.category,
          memory_type: "fact",
          importance: 7,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,key" });
        
        if (error) {
          return { name, result: { error: error.message } };
        }
        return { name, result: { success: true, message: `Remembered: ${args.key}` } };
      }
      return { name, result: { error: "Cannot store memory without user ID" } };
    }

    default:
      return { name, result: { error: `Unknown tool: ${name}` } };
  }
}

// Trigger knowledge extraction asynchronously
async function triggerKnowledgeExtraction(
  supabaseUrl: string,
  conversation: Array<{ role: string; content: string }>,
  userId: string | null,
  source: string
) {
  try {
    fetch(`${supabaseUrl}/functions/v1/atlas-knowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conversation, userId, source }),
    }).catch(e => console.log("[chat-with-memory] Knowledge extraction trigger failed:", e));
  } catch (e) {
    console.log("[chat-with-memory] Could not trigger knowledge extraction:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId, source = "text_chat", enableTools = true } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch user profile
    let profile: UserProfile | null = null;
    if (userId) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("first_name, nickname, birthday, timezone, communication_style")
        .eq("user_id", userId)
        .single();
      profile = profileData;
    }

    // Fetch memories
    let memories: Memory[] = [];
    if (userId) {
      const { data: memoryData } = await supabase
        .from("ai_memory")
        .select("key, value, category, importance")
        .eq("user_id", userId)
        .order("importance", { ascending: false })
        .limit(20);
      memories = memoryData || [];
    }

    // Fetch knowledge bank entries
    let knowledgeBank: KnowledgeEntry[] = [];
    if (userId) {
      const { data: knowledgeData } = await supabase
        .from("atlas_knowledge_entries")
        .select("topic, content, category")
        .eq("user_id", userId)
        .order("relevance_score", { ascending: false })
        .limit(30);
      knowledgeBank = (knowledgeData || []) as KnowledgeEntry[];
    }

    // Fetch life events
    let upcomingEvents: LifeEvent[] = [];
    let recentEvents: LifeEvent[] = [];
    if (userId) {
      const today = new Date().toISOString().split("T")[0];
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const { data: upcomingData } = await supabase
        .from("user_life_events")
        .select("event_type, event_date, description, sentiment")
        .eq("user_id", userId)
        .gte("event_date", today)
        .lte("event_date", weekFromNow);
      upcomingEvents = upcomingData || [];

      const { data: recentData } = await supabase
        .from("user_life_events")
        .select("event_type, event_date, description, sentiment")
        .eq("user_id", userId)
        .eq("should_follow_up", true)
        .gte("event_date", twoWeeksAgo)
        .lt("event_date", today);
      recentEvents = recentData || [];
    }

    console.log("[chat-with-memory] Processing chat for user:", userId);
    console.log("[chat-with-memory] Profile:", profile?.first_name);
    console.log("[chat-with-memory] Memories count:", memories.length);
    console.log("[chat-with-memory] Tools enabled:", enableTools);
    console.log("[chat-with-memory] Perplexity available:", !!PERPLEXITY_API_KEY);

    const hasTools = enableTools && (!!PERPLEXITY_API_KEY || true); // Always enable tools, some work without Perplexity
    const systemPrompt = buildPersonalizedPrompt(profile, memories, upcomingEvents, recentEvents, knowledgeBank, hasTools);

    // Initial request body
    const requestBody: Record<string, unknown> = {
      model: PROVIDERS.lovable.model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
    };

    // Add tools if enabled
    if (hasTools) {
      requestBody.tools = ATLAS_TOOLS;
      requestBody.tool_choice = "auto";
    }

    const response = await fetch(PROVIDERS.lovable.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("[chat-with-memory] Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error("[chat-with-memory] Payment required");
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("[chat-with-memory] AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trigger knowledge extraction asynchronously (fire and forget)
    if (messages.length >= 2 && SUPABASE_URL) {
      triggerKnowledgeExtraction(SUPABASE_URL, messages, userId, source);
    }

    console.log("[chat-with-memory] Streaming response from AI gateway");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[chat-with-memory] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
