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

// NOTE: This hook is intentionally in a new module to force a clean Fast Refresh boundary.
// If hooks were added/removed during HMR, React can get into an invalid hook queue state.
export const useRealtimeScribeStable = (options: UseRealtimeScribeOptions = {}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasConnected, setHasConnected] = useState(false);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connectingRef = useRef(false);
  const lastConnectAttemptRef = useRef(0);

  // Track if user is speaking
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use ElevenLabs official useScribe hook with VAD for automatic speech-end detection
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: "vad" as CommitStrategy,
    onPartialTranscript: (data) => {
      console.log("[Scribe] Partial:", data.text);
      optionsRef.current.onPartialTranscript?.(data.text || "");

      if (!isSpeaking && data.text) {
        setIsSpeaking(true);
        optionsRef.current.onSpeechStart?.();
      }

      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    },
    onCommittedTranscript: (data) => {
      console.log("[Scribe] Final:", data.text);
      optionsRef.current.onFinalTranscript?.(data.text || "");
      setIsSpeaking(false);
      optionsRef.current.onSpeechEnd?.();
    },
  });

  // Store scribe in ref to avoid dependency issues
  const scribeRef = useRef(scribe);
  scribeRef.current = scribe;

  const CONNECT_COOLDOWN_MS = 3000;

  const connect = useCallback(async () => {
    const now = Date.now();

    if (now - lastConnectAttemptRef.current < CONNECT_COOLDOWN_MS) {
      console.log("[Scribe] Connect called too soon, throttling...");
      return false;
    }

    if (connectingRef.current || scribeRef.current.isConnected) {
      console.log("[Scribe] Already connecting or connected, skipping...");
      return scribeRef.current.isConnected;
    }

    lastConnectAttemptRef.current = now;
    connectingRef.current = true;
    setIsConnecting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to enable voice.");
      }

      console.log("[Scribe] Getting token...");
      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");

      if (error) {
        const details =
          (error as any)?.context || (error as any)?.details || (error as any)?.hint || "";
        console.error("[Scribe] Token request error:", error, details);
        throw new Error(details ? `${error.message}: ${details}` : error.message);
      }

      if (!data?.token) {
        throw new Error("No token received from token service");
      }

      console.log("[Scribe] Token received, connecting...");

      await scribeRef.current.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log("[Scribe] Connected successfully");
      setHasConnected(true);
      return true;
    } catch (e) {
      console.error("[Scribe] Connection error:", e);
      optionsRef.current.onError?.(e instanceof Error ? e : new Error("Connection failed"));
      return false;
    } finally {
      setIsConnecting(false);
      connectingRef.current = false;
    }
  }, []);

  const disconnect = useCallback(() => {
    console.log("[Scribe] Disconnecting...");
    scribeRef.current.disconnect();
    setHasConnected(false);
  }, []);

  const isListening = scribe.isConnected && isSpeaking;

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
    finalTranscript:
      scribe.committedTranscripts?.[scribe.committedTranscripts.length - 1]?.text || "",
    connect,
    disconnect,
    hasConnected,
  };
};
