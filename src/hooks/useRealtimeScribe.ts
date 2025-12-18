import { useState, useCallback, useEffect, useRef } from "react";
import { useScribe } from "@elevenlabs/react";
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
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Use ElevenLabs official useScribe hook
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      console.log("[Scribe] Partial:", data.text);
      optionsRef.current.onPartialTranscript?.(data.text || "");
    },
    onCommittedTranscript: (data) => {
      console.log("[Scribe] Final:", data.text);
      optionsRef.current.onFinalTranscript?.(data.text || "");
    },
  });

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      console.log("[Scribe] Getting token...");
      
      // Get token from edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
      
      if (error || !data?.token) {
        throw new Error(error?.message || "Failed to get scribe token");
      }

      console.log("[Scribe] Token received, connecting...");

      // Connect using official SDK
      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log("[Scribe] Connected successfully");
      setIsConnecting(false);
      return true;
    } catch (error) {
      console.error("[Scribe] Connection error:", error);
      setIsConnecting(false);
      optionsRef.current.onError?.(error instanceof Error ? error : new Error("Connection failed"));
      return false;
    }
  }, [scribe]);

  const disconnect = useCallback(() => {
    console.log("[Scribe] Disconnecting...");
    scribe.disconnect();
  }, [scribe]);

  // Track speech activity via transcription state
  const isListening = scribe.isConnected && !!scribe.partialTranscript;

  return {
    isConnected: scribe.isConnected,
    isConnecting,
    isListening,
    partialTranscript: scribe.partialTranscript || "",
    finalTranscript: scribe.committedTranscripts?.[scribe.committedTranscripts.length - 1]?.text || "",
    connect,
    disconnect,
  };
};
