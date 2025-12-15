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
  knowledgeBank: KnowledgeEntry[]
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
- Research and deep learning on topics

## Memory Instructions
Pay attention to personal details mentioned:
1. Names of family, friends, colleagues
2. Important dates (birthdays, anniversaries)
3. Preferences and habits
4. Life events and milestones
5. Inside jokes or shared references

Be genuine, warm, and personable. You're not just an assistant - you're a friend who genuinely cares.`;
}

// Trigger knowledge extraction asynchronously
async function triggerKnowledgeExtraction(
  supabaseUrl: string,
  conversation: Array<{ role: string; content: string }>,
  userId: string | null,
  source: string
) {
  try {
    // Fire and forget - don't await
    fetch(`${supabaseUrl}/functions/v1/atlas-knowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conversation, userId, source }),
    }).catch(e => console.log("Knowledge extraction trigger failed:", e));
  } catch (e) {
    console.log("Could not trigger knowledge extraction:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId, source = "text_chat" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
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

    console.log("Processing chat with memory for user:", userId);
    console.log("Profile:", profile?.first_name);
    console.log("Memories count:", memories.length);
    console.log("Knowledge bank count:", knowledgeBank.length);

    const systemPrompt = buildPersonalizedPrompt(profile, memories, upcomingEvents, recentEvents, knowledgeBank);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trigger knowledge extraction asynchronously (fire and forget)
    // Only extract if we have enough conversation context
    if (messages.length >= 2 && SUPABASE_URL) {
      triggerKnowledgeExtraction(SUPABASE_URL, messages, userId, source);
    }

    console.log("Streaming response from AI gateway");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat with memory error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
