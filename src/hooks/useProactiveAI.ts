import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AIInsight {
  id: string;
  insight_type: string;
  title: string;
  content: string;
  priority: number;
  is_read: boolean;
  is_spoken: boolean;
  created_at: string;
}

export const useProactiveAI = () => {
  const [currentInsight, setCurrentInsight] = useState<AIInsight | null>(null);

  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to new insights
      const channel = supabase
        .channel("ai-insights")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ai_insights",
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            const newInsight = payload.new as AIInsight;
            if (!newInsight.is_spoken) {
              setCurrentInsight(newInsight);
              
              // Mark as spoken
              await supabase
                .from("ai_insights")
                .update({ is_spoken: true })
                .eq("id", newInsight.id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, []);

  const clearInsight = useCallback(() => {
    setCurrentInsight(null);
  }, []);

  return currentInsight;
};
