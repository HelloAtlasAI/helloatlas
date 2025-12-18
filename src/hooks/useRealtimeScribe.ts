import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseRealtimeScribeOptions {
  onPartialTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onError?: (error: Error) => void;
}

export const useRealtimeScribe = (options: UseRealtimeScribeOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const cleanup = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
  }, []);

  const connect = useCallback(async () => {
    try {
      cleanup();
      
      console.log("[Scribe] Getting token...");
      
      // Get token from edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
      
      if (error || !data?.token) {
        throw new Error(error?.message || "Failed to get scribe token");
      }

      console.log("[Scribe] Token received, connecting WebSocket...");

      // Connect to ElevenLabs Scribe WebSocket
      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id=scribe_v2_realtime&token=${data.token}`
      );

      ws.onopen = () => {
        console.log("[Scribe] WebSocket connected");
        setIsConnected(true);
        
        // Send initial config with VAD enabled
        ws.send(JSON.stringify({
          type: "configure",
          transcription_config: {
            language_code: "en",
            sample_rate: 16000,
            encoding: "pcm_s16le",
          },
          vad_config: {
            use_vad: true,
            silence_duration_ms: 700, // Shorter silence = faster response
            speech_threshold: 0.5,
          },
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("[Scribe] Message:", message.type);
          
          switch (message.type) {
            case "transcription":
              if (message.is_final) {
                const text = message.text?.trim();
                if (text) {
                  setFinalTranscript(text);
                  setPartialTranscript("");
                  options.onFinalTranscript?.(text);
                }
              } else {
                const text = message.text?.trim() || "";
                setPartialTranscript(text);
                options.onPartialTranscript?.(text);
              }
              break;
              
            case "speech_started":
              console.log("[Scribe] Speech started");
              setIsListening(true);
              options.onSpeechStart?.();
              break;
              
            case "speech_ended":
              console.log("[Scribe] Speech ended");
              setIsListening(false);
              options.onSpeechEnd?.();
              break;
              
            case "error":
              console.error("[Scribe] Error:", message);
              options.onError?.(new Error(message.message || "Scribe error"));
              break;
          }
        } catch (e) {
          console.error("[Scribe] Parse error:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("[Scribe] WebSocket error:", error);
        options.onError?.(new Error("WebSocket connection error"));
      };

      ws.onclose = () => {
        console.log("[Scribe] WebSocket closed");
        setIsConnected(false);
        setIsListening(false);
      };

      wsRef.current = ws;

      // Start microphone capture
      console.log("[Scribe] Starting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Create audio context for processing
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert Float32 to Int16
          const int16Array = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          // Send as base64
          const uint8Array = new Uint8Array(int16Array.buffer);
          let binary = "";
          const chunkSize = 0x8000;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
            binary += String.fromCharCode.apply(null, Array.from(chunk));
          }
          const base64 = btoa(binary);
          
          wsRef.current.send(JSON.stringify({
            type: "audio",
            audio: base64,
          }));
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      console.log("[Scribe] Audio pipeline ready");
      return true;
    } catch (error) {
      console.error("[Scribe] Connection error:", error);
      cleanup();
      options.onError?.(error instanceof Error ? error : new Error("Connection failed"));
      return false;
    }
  }, [cleanup, options]);

  const disconnect = useCallback(() => {
    console.log("[Scribe] Disconnecting...");
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isConnected,
    isListening,
    partialTranscript,
    finalTranscript,
    connect,
    disconnect,
  };
};
