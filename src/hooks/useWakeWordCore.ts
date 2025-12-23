import { useState, useCallback, useRef, useEffect } from 'react';
import type { WakeWordState } from '@/types';

export type { WakeWordState };

interface UseWakeWordOptions {
  keyword?: string;
  onWakeWordDetected?: () => void;
  onTimeout?: () => void;
  timeoutDuration?: number;
  maxRetries?: number;
  autoStart?: boolean;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export const useWakeWord = (options: UseWakeWordOptions = {}) => {
  const {
    keyword = 'atlas',
    onWakeWordDetected,
    onTimeout,
    timeoutDuration = 5000,
    maxRetries = 3,
    autoStart = false,
  } = options;

  const [state, setState] = useState<WakeWordState>('dormant');
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isListeningRef = useRef(false);
  const shouldRestartRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false); // Track if paused for recording/TTS

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Safe start function that checks current state
  const safeStart = useCallback((recognition: any) => {
    if (isPausedRef.current) {
      console.log('[WakeWord] Skipping start - paused for recording/TTS');
      return;
    }
    if (isListeningRef.current) {
      console.log('[WakeWord] Skipping start - already listening');
      return;
    }
    try {
      recognition.start();
    } catch (e: any) {
      // Only log if it's not the "already started" error
      if (!e.message?.includes('already started')) {
        console.warn('[WakeWord] Failed to start:', e.message);
      }
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListeningRef.current = true;
      retryCountRef.current = 0;
      if (!isPausedRef.current) {
        setState('passive');
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (isPausedRef.current) return; // Ignore results while paused
      
      const results = Array.from(event.results);
      const latestResult = results[results.length - 1];
      
      if (latestResult) {
        const text = latestResult[0].transcript.toLowerCase();
        setTranscript(text);
        
        // Check for wake word
        if (text.includes(keyword.toLowerCase())) {
          setState((currentState) => {
            if (currentState !== 'activated' && currentState !== 'listening' && currentState !== 'thinking' && currentState !== 'speaking') {
              console.log('[WakeWord] Wake word detected!');
              onWakeWordDetected?.();
              
              // Set timeout to return to passive if no further action
              cleanup();
              timeoutRef.current = setTimeout(() => {
                setState('passive');
                onTimeout?.();
              }, timeoutDuration);
              
              return 'activated';
            }
            return currentState;
          });
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // Ignore errors while paused
      if (isPausedRef.current) return;
      
      // Don't log no-speech - it's normal
      if (event.error === 'no-speech') {
        return;
      }
      
      // Don't spam logs with aborted errors
      if (event.error === 'aborted') {
        // Only restart if not paused
        if (shouldRestartRef.current && !permissionDenied && !isPausedRef.current) {
          retryTimeoutRef.current = setTimeout(() => {
            safeStart(recognition);
          }, 200);
        }
        return;
      }
      
      console.error('[WakeWord] Error:', event.error);
      
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setPermissionDenied(true);
        setIsSupported(false);
        shouldRestartRef.current = false;
        return;
      }
      
      if (event.error === 'network' || event.error === 'service-not-allowed') {
        shouldRestartRef.current = false;
        return;
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      
      // Don't restart if paused
      if (isPausedRef.current) {
        console.log('[WakeWord] Ended while paused, not restarting');
        return;
      }
      
      // Only restart if we should be listening
      if (shouldRestartRef.current && !permissionDenied && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        const delay = Math.min(500 * Math.pow(2, retryCountRef.current - 1), 4000);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (shouldRestartRef.current && !isPausedRef.current) {
            safeStart(recognition);
          }
        }, delay);
      } else if (retryCountRef.current >= maxRetries) {
        console.warn('[WakeWord] Max retries reached');
        setState('dormant');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      cleanup();
      shouldRestartRef.current = false;
      isPausedRef.current = false;
      try {
        recognition.stop();
      } catch (e) {
        // Already stopped
      }
    };
  }, [keyword, onWakeWordDetected, onTimeout, timeoutDuration, cleanup, maxRetries, permissionDenied, safeStart]);

  // Pause wake word detection (for recording/TTS)
  const pauseListening = useCallback(() => {
    console.log('[WakeWord] Pausing for recording/TTS');
    isPausedRef.current = true;
    cleanup();
    
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }
  }, [cleanup]);

  // Resume wake word detection after recording/TTS
  const resumeListening = useCallback(() => {
    console.log('[WakeWord] Resuming after recording/TTS');
    isPausedRef.current = false;
    retryCountRef.current = 0;
    
    if (recognitionRef.current && isSupported && !permissionDenied && shouldRestartRef.current) {
      // Small delay to avoid conflicts
      retryTimeoutRef.current = setTimeout(() => {
        if (!isPausedRef.current) {
          safeStart(recognitionRef.current);
          setState('passive');
        }
      }, 300);
    }
  }, [isSupported, permissionDenied, safeStart]);

  const startPassiveListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported || permissionDenied) return;
    
    console.log('[WakeWord] Starting passive listening');
    shouldRestartRef.current = true;
    isPausedRef.current = false;
    retryCountRef.current = 0;
    
    safeStart(recognitionRef.current);
    setState('passive');
  }, [isSupported, permissionDenied, safeStart]);

  const stopListening = useCallback(() => {
    console.log('[WakeWord] Stopping listening');
    shouldRestartRef.current = false;
    isPausedRef.current = false;
    cleanup();
    
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (e) {
      // Already stopped
    }
    setState('dormant');
  }, [cleanup]);

  const setWakeWordState = useCallback((newState: WakeWordState) => {
    setState(newState);
  }, []);

  const resetToPassive = useCallback(() => {
    console.log('[WakeWord] Resetting to passive');
    setState('passive');
    setTranscript('');
    isPausedRef.current = false;
    
    // Restart recognition if supported
    if (recognitionRef.current && isSupported && !permissionDenied) {
      shouldRestartRef.current = true;
      retryCountRef.current = 0;
      
      // Small delay before restarting
      retryTimeoutRef.current = setTimeout(() => {
        if (!isPausedRef.current && !isListeningRef.current) {
          safeStart(recognitionRef.current);
        }
      }, 300);
    }
  }, [isSupported, permissionDenied, safeStart]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && isSupported && !permissionDenied) {
      const timer = setTimeout(() => {
        startPassiveListening();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoStart, isSupported, permissionDenied, startPassiveListening]);

  return {
    state,
    setState: setWakeWordState,
    transcript,
    isSupported,
    permissionDenied,
    startPassiveListening,
    stopListening,
    resetToPassive,
    pauseListening,
    resumeListening,
  };
};

export default useWakeWord;
