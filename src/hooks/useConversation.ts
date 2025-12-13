import { useState, useCallback } from "react";
import { Message } from "@/components/aria/ConversationPanel";
import { AIState } from "@/components/aria/AIOrb";

// Simple mock responses for demo
const mockResponses = [
  "I've found 3 important emails in your inbox that need attention. Would you like me to summarize them?",
  "Your flight to Paris on December 20th is confirmed. The current weather forecast shows partly cloudy skies with temperatures around 8°C.",
  "Apple stock is currently trading at $195.42, up 2.4% today. Would you like a detailed analysis?",
  "I've created a new document titled 'Meeting Notes' in your Google Drive. Ready for you to add content.",
  "Based on your calendar, you have 3 meetings scheduled for tomorrow. The earliest is at 9 AM with the marketing team.",
];

export const useConversation = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiState, setAiState] = useState<AIState>("idle");

  const sendMessage = useCallback(async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI thinking
    setAiState("thinking");
    
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate AI speaking
    setAiState("speaking");
    
    // Get mock response
    const responseContent = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: responseContent,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, assistantMessage]);

    // Simulate speaking duration
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setAiState("idle");
  }, []);

  const toggleListening = useCallback(() => {
    setAiState((prev) => (prev === "listening" ? "idle" : "listening"));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    aiState,
    sendMessage,
    toggleListening,
    clearMessages,
  };
};
