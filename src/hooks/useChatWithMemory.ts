import { useState, useCallback } from "react";
import { Message, Citation } from "@/components/aria/ConversationPanel";
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

// Extract URLs from text and convert to citations
const extractUrlsAsCitations = (text: string): Citation[] => {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
  const matches = text.match(urlRegex) || [];
  const uniqueUrls = [...new Set(matches)];
  
  return uniqueUrls.map(url => ({
    url,
    domain: (() => {
      try {
        return new URL(url).hostname.replace('www.', '');
      } catch {
        return url;
      }
    })()
  }));
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
    console.log('[Chat] Sending message:', content);
    
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
    let collectedCitations: Citation[] = [];

    const updateAssistantMessage = (chunk: string, citations?: Citation[]) => {
      assistantContent += chunk;
      
      // Extract URLs from content as fallback citations
      const extractedCitations = extractUrlsAsCitations(assistantContent);
      const allCitations = citations?.length ? citations : extractedCitations;
      
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 
              ? { ...m, content: assistantContent, citations: allCitations.length > 0 ? allCitations : undefined } 
              : m
          );
        }
        return [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant" as const,
            content: assistantContent,
            timestamp: new Date(),
            citations: allCitations.length > 0 ? allCitations : undefined,
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

      console.log('[Chat] Making request to backend...');
      
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
          enableTools: true,
        }),
      });

      if (!response.ok) {
        console.error('[Chat] Response not ok:', response.status);
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

      console.log('[Chat] Starting to read stream...');
      setAiState("speaking");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[Chat] Stream done, total chunks:', chunkCount);
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            console.log('[Chat] Received [DONE]');
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            
            // Handle custom citations event (sent first by backend)
            if (parsed.citations) {
              console.log('[Chat] Received citations:', parsed.citations.length);
              collectedCitations = parsed.citations.map((c: string | Citation) => 
                typeof c === 'string' ? { url: c } : c
              );
              continue;
            }
            
            // Handle regular content
            const chunkContent = parsed.choices?.[0]?.delta?.content;
            if (chunkContent) {
              chunkCount++;
              updateAssistantMessage(chunkContent, collectedCitations);
            }
          } catch (parseError) {
            // Put incomplete JSON back in buffer
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Final update with extracted citations if no explicit citations received
      if (collectedCitations.length === 0 && assistantContent) {
        const extractedCitations = extractUrlsAsCitations(assistantContent);
        if (extractedCitations.length > 0) {
          setMessages((prev) => {
            const lastIdx = prev.length - 1;
            if (prev[lastIdx]?.role === "assistant") {
              return prev.map((m, i) =>
                i === lastIdx ? { ...m, citations: extractedCitations } : m
              );
            }
            return prev;
          });
        }
      }

      // Clear card focus after response
      setTimeout(() => onCardFocus?.(null), 3000);

      // Store the last response for TTS
      setLastResponse(assistantContent);
      
      console.log('[Chat] Final response length:', assistantContent.length);
      
      // Return content or a fallback
      if (assistantContent && assistantContent.trim()) {
        return assistantContent;
      }
      
      // If we got no content, return a fallback
      console.warn('[Chat] No content received, returning fallback');
      return "I'm sorry, I couldn't process that request. Please try again.";
    } catch (error) {
      console.error("[Chat] Error:", error);
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
  }, [messages, detectCardFocus, onCardFocus, source]);

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