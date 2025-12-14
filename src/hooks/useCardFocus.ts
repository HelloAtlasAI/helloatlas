import { useState, useCallback, useRef, useEffect } from "react";

export type CardId = "email" | "calendar" | "stocks" | "travel" | "documents" | "weather" | null;

export const useCardFocus = () => {
  const [focusedCard, setFocusedCardState] = useState<CardId>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear previous timeout when setting new focus
  const setFocusedCard = useCallback((cardId: CardId, autoClear = true) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setFocusedCardState(cardId);

    // Auto-clear focus after 5 seconds
    if (cardId && autoClear) {
      timeoutRef.current = setTimeout(() => {
        setFocusedCardState(null);
      }, 5000);
    }
  }, []);

  const clearFocus = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setFocusedCardState(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    focusedCard,
    setFocusedCard,
    clearFocus,
    hasFocusedCard: focusedCard !== null,
  };
};
