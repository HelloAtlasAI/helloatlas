import { useState, useCallback, useRef, useEffect } from "react";

interface UseStreamingTTSOptions {
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onError?: (error: Error) => void;
}

export const useStreamingTTS = (options: UseStreamingTTSOptions = {}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopPlayback = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsPlaying(false);
    setAudioLevel(0);
  }, []);

  const speak = useCallback(async (text: string, voiceId?: string): Promise<void> => {
    // Stop any existing playback
    stopPlayback();

    try {
      setIsPlaying(true);
      options.onPlaybackStart?.();

      abortControllerRef.current = new AbortController();

      // Fetch streaming audio from edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS failed: ${errorText}`);
      }

      // Create blob from streaming response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Setup audio analysis for visual feedback
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new AudioContext();
      }

      // Wait for audio to be loaded enough to play
      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => reject(new Error("Audio load failed"));
        audio.load();
      });

      // Create analyzer for audio levels
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      analyserRef.current.fftSize = 256;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      let smoothedLevel = 0;

      const updateLevel = () => {
        if (!isPlaying || !analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const targetLevel = average / 255;
        smoothedLevel += (targetLevel - smoothedLevel) * 0.25;
        setAudioLevel(smoothedLevel);
        
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      audio.onplay = () => {
        updateLevel();
      };

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        stopPlayback();
        options.onPlaybackEnd?.();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        stopPlayback();
        options.onError?.(new Error("Audio playback error"));
      };

      await audio.play();
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("[TTS] Playback aborted");
        return;
      }
      console.error("[TTS] Error:", error);
      stopPlayback();
      options.onError?.(error instanceof Error ? error : new Error("TTS failed"));
    }
  }, [stopPlayback, options]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stopPlayback]);

  return {
    isPlaying,
    audioLevel,
    speak,
    stopPlayback,
  };
};
