import { useState, useCallback } from "react";
import { Message } from "@/components/aria/ConversationPanel";
import { AIState } from "@/components/aria/AIOrb";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-memory`;

interface UseChatWithMemoryOptions {
  onCardFocus?: (cardIds: string[] | null) => void;
  source?: 'text_chat' | 'voice_chat';
}

// Keyword mappings for multi-card detection
const CARD_KEYWORDS: Record<string, string[]> = {
  email: ['email', 'mail', 'inbox', 'message', 'messages'],
  calendar: ['calendar', 'meeting', 'schedule', 'event', 'appointment'],
  stocks: ['stock', 'market', 'investment', 'portfolio', 'trading'],
  travel: ['travel', 'flight', 'trip', 'vacation', 'booking'],
  documents: ['document', 'file', 'doc', 'pdf', 'folder'],
  weather: ['weather', 'temperature', 'forecast', 'rain', 'sunny'],
  tasks: ['task', 'todo', 'to-do', 'reminder', 'deadline'],
  notes: ['note', 'notes', 'memo', 'jot'],
  news: ['news', 'headline', 'article', 'breaking'],
};

export const useChatWithMemory = ({ onCardFocus, source = 'text_chat' }: UseChatWithMemoryOptions = {}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiState, setAiState] = useState<AIState>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>("");

  // Detect multiple card focuses from message content
  const detectCardFocus = useCallback((content: string) => {
    const lowerContent = content.toLowerCase();
    const matchedCards: string[] = [];

    Object.entries(CARD_KEYWORDS).forEach(([cardId, keywords]) => {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        matchedCards.push(cardId);
      }
    });

    if (matchedCards.length > 0) {
      onCardFocus?.(matchedCards);
    }
  }, [onCardFocus]);

  const sendMessage = useCallback(async (content: string): Promise<string | null> => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setAiState("thinking");
    setIsLoading(true);

    // Detect what card might be relevant
    detectCardFocus(content);

    let assistantContent = "";

    const updateAssistantMessage = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant" as const,
            content: assistantContent,
            timestamp: new Date(),
          },
        ];
      });
    };

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const chatMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: chatMessages,
          userId: user.id,
          source,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
          throw new Error("Rate limit exceeded");
        }
        if (response.status === 402) {
          toast.error("Usage limit reached. Please add credits.");
          throw new Error("Payment required");
        }
        throw new Error("Failed to get response");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      setAiState("speaking");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const chunkContent = parsed.choices?.[0]?.delta?.content;
            if (chunkContent) {
              updateAssistantMessage(chunkContent);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Clear card focus after response (3 seconds for multi-card)
      setTimeout(() => onCardFocus?.(null), 3000);

      // Store the last response for optional TTS
      setLastResponse(assistantContent);
      
      return assistantContent;
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
      setMessages((prev) => {
        if (prev[prev.length - 1]?.role === "assistant" && !prev[prev.length - 1]?.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      onCardFocus?.(null);
      return null;
    } finally {
      setAiState("idle");
      setIsLoading(false);
    }
  }, [messages, detectCardFocus, onCardFocus]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    aiState,
    setAiState,
    isLoading,
    sendMessage,
    clearMessages,
    lastResponse,
  };
};