import { useState, useCallback, useRef, useMemo } from 'react';
import { Message } from '@/components/aria/ConversationPanel';
import { AIState } from '@/components/aria/AIOrb';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDebouncedCallback } from './useDebouncedValue';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-memory`;

// Response cache for repeated queries
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface UseOptimizedChatOptions {
  onCardFocus?: (cardId: string | null) => void;
}

export const useOptimizedChat = ({ onCardFocus }: UseOptimizedChatOptions = {}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiState, setAiState] = useState<AIState>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  
  // Use refs for values that don't need to trigger re-renders
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageBufferRef = useRef<string>('');

  // Card focus keywords - memoized for performance
  const cardKeywords = useMemo(() => ({
    email: ['email', 'mail', 'inbox'],
    calendar: ['calendar', 'meeting', 'schedule'],
    stocks: ['stock', 'market', 'investment'],
    travel: ['travel', 'flight', 'trip'],
    documents: ['document', 'file', 'doc'],
    weather: ['weather', 'temperature', 'forecast'],
  }), []);

  // Debounced card focus detection
  const detectCardFocus = useDebouncedCallback((content: string) => {
    const lowerContent = content.toLowerCase();
    
    for (const [cardId, keywords] of Object.entries(cardKeywords)) {
      if (keywords.some((keyword) => lowerContent.includes(keyword))) {
        onCardFocus?.(cardId);
        return;
      }
    }
  }, 100);

  // Clear card focus with debounce
  const clearCardFocus = useDebouncedCallback(() => {
    onCardFocus?.(null);
  }, 2000);

  // Optimized message update using RAF batching
  const updateAssistantMessage = useCallback((chunk: string) => {
    messageBufferRef.current += chunk;
    
    // Batch updates with RAF
    requestAnimationFrame(() => {
      const content = messageBufferRef.current;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content } : m
          );
        }
        return [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant' as const,
            content,
            timestamp: new Date(),
          },
        ];
      });
    });
  }, []);

  const sendMessage = useCallback(
    async (content: string): Promise<string | null> => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Check cache first
      const cacheKey = content.toLowerCase().trim();
      const cached = responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [
          ...prev,
          userMessage,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: cached.response,
            timestamp: new Date(),
          },
        ]);
        
        return cached.response;
      }

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setAiState('thinking');
      setIsLoading(true);
      messageBufferRef.current = '';

      // Detect relevant card
      detectCardFocus(content);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not authenticated');
        }

        const chatMessages = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch(CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: chatMessages,
            userId: user.id,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          if (response.status === 429) {
            toast.error('Rate limit exceeded. Please try again later.');
            throw new Error('Rate limit exceeded');
          }
          if (response.status === 402) {
            toast.error('Usage limit reached. Please add credits.');
            throw new Error('Payment required');
          }
          throw new Error('Failed to get response');
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        setAiState('speaking');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const chunkContent = parsed.choices?.[0]?.delta?.content;
              if (chunkContent) {
                updateAssistantMessage(chunkContent);
              }
            } catch {
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }

        // Cache successful response
        const finalResponse = messageBufferRef.current;
        if (finalResponse) {
          responseCache.set(cacheKey, {
            response: finalResponse,
            timestamp: Date.now(),
          });
        }

        clearCardFocus();
        setLastResponse(finalResponse);

        return finalResponse;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return null;
        }
        
        console.error('Chat error:', error);
        toast.error('Failed to get response. Please try again.');
        setMessages((prev) => {
          if (prev[prev.length - 1]?.role === 'assistant' && !prev[prev.length - 1]?.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
        onCardFocus?.(null);
        return null;
      } finally {
        setAiState('idle');
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, detectCardFocus, clearCardFocus, onCardFocus, updateAssistantMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    messageBufferRef.current = '';
  }, []);

  // Cancel pending request on unmount
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    messages,
    aiState,
    setAiState,
    isLoading,
    sendMessage,
    clearMessages,
    lastResponse,
    cancel,
  };
};
