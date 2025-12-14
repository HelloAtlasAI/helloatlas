import { useState, useCallback } from "react";

export type CardId = "email" | "calendar" | "stocks" | "travel" | "documents" | "weather" | "orb" | null;

interface StreamingDataItem {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
}

export const useCardFocus = () => {
  const [focusedCard, setFocusedCardState] = useState<CardId>(null);
  const [streamingData, setStreamingData] = useState<StreamingDataItem[]>([]);

  const setFocusedCard = useCallback((cardId: CardId) => {
    setFocusedCardState(cardId);
    if (cardId) {
      // Start streaming mock data when a card is focused
      setStreamingData([]);
    } else {
      setStreamingData([]);
    }
  }, []);

  const addStreamingData = useCallback((item: StreamingDataItem) => {
    setStreamingData(prev => [...prev, item]);
  }, []);

  const clearStreamingData = useCallback(() => {
    setStreamingData([]);
  }, []);

  return {
    focusedCard,
    setFocusedCard,
    streamingData,
    addStreamingData,
    clearStreamingData,
  };
};
