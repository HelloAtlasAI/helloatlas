import { useState, useCallback, useEffect, useRef } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";

interface UseRealtimeScribeOptions {
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onError?: (error: Error) => void;
}

export const useRealtimeScribe = (options: UseRealtimeScribeOptions = {}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasConnected, setHasConnected] = useState(false);
  const optionsRef = useRef(options);
  const connectingRef = useRef(false);
  optionsRef.current = options;

  // Track if user is speaking
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use ElevenLabs official useScribe hook with VAD for automatic speech-end detection
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: "vad" as CommitStrategy, // Automatically detect when user stops speaking
    onPartialTranscript: (data) => {
      console.log("[Scribe] Partial:", data.text);
      optionsRef.current.onPartialTranscript?.(data.text || "");
      
      // User started speaking
      if (!isSpeaking && data.text) {
        setIsSpeaking(true);
        optionsRef.current.onSpeechStart?.();
      }
      
      // Reset timeout on each partial (they're still speaking)
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    },
    onCommittedTranscript: (data) => {
      console.log("[Scribe] Final:", data.text);
      optionsRef.current.onFinalTranscript?.(data.text || "");
      
      // User finished speaking - VAD detected end of speech
      setIsSpeaking(false);
      optionsRef.current.onSpeechEnd?.();
    },
  });

  // Store scribe in ref to avoid dependency issues
  const scribeRef = useRef(scribe);
  scribeRef.current = scribe;

  const connect = useCallback(async () => {
    // Prevent multiple simultaneous connection attempts
    if (connectingRef.current || scribeRef.current.isConnected) {
      console.log("[Scribe] Already connecting or connected, skipping...");
      return scribeRef.current.isConnected;
    }
    
    try {
      connectingRef.current = true;
      setIsConnecting(true);
      
      console.log("[Scribe] Getting token...");
      
      // Get token from edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
      
      if (error || !data?.token) {
        throw new Error(error?.message || "Failed to get scribe token");
      }

      console.log("[Scribe] Token received, connecting...");

      // Connect using official SDK
      await scribeRef.current.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log("[Scribe] Connected successfully");
      setIsConnecting(false);
      setHasConnected(true);
      connectingRef.current = false;
      return true;
    } catch (error) {
      console.error("[Scribe] Connection error:", error);
      setIsConnecting(false);
      connectingRef.current = false;
      optionsRef.current.onError?.(error instanceof Error ? error : new Error("Connection failed"));
      return false;
    }
  }, []); // No dependencies - uses refs

  const disconnect = useCallback(() => {
    console.log("[Scribe] Disconnecting...");
    scribeRef.current.disconnect();
    setHasConnected(false);
  }, []);

  // Track speech activity via our speaking state (more accurate than partial transcript)
  const isListening = scribe.isConnected && isSpeaking;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected: scribe.isConnected,
    isConnecting,
    isListening,
    isSpeaking,
    partialTranscript: scribe.partialTranscript || "",
    finalTranscript: scribe.committedTranscripts?.[scribe.committedTranscripts.length - 1]?.text || "",
    connect,
    disconnect,
  };
};
