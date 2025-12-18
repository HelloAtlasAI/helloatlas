// Shared type definitions for the application
// These types were previously scattered across multiple files causing circular dependencies

/**
 * AI state for legacy components and simple state tracking
 */
export type AIState = "idle" | "listening" | "thinking" | "speaking";

/**
 * Wake word detection states for the Atlas sphere visualization
 */
export type WakeWordState = 'dormant' | 'passive' | 'activated' | 'listening' | 'thinking' | 'speaking';

/**
 * Citation data for AI responses with source attribution
 */
export interface Citation {
  url: string;
  title?: string;
  snippet?: string;
  domain?: string;
  credibility_score?: number;
  accessed_at?: string;
}

/**
 * Chat message structure used across conversation components
 */
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: Citation[];
}

/**
 * Card focus keywords mapping for AI-driven card highlighting
 */
export const CARD_KEYWORDS: Record<string, string[]> = {
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
