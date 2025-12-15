import { useState, useCallback, useRef, useEffect } from 'react';

export type WakeWordState = 'dormant' | 'passive' | 'activated' | 'listening' | 'thinking' | 'speaking';

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

export const useWakeWordFixed = (options: UseWakeWordOptions = {}) => {
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
      retryCountRef.current = 0; // Reset retry count on successful start
      setState('passive');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const latestResult = results[results.length - 1];
      
      if (latestResult) {
        const text = latestResult[0].transcript.toLowerCase();
        setTranscript(text);
        
        // Check for wake word
        if (text.includes(keyword.toLowerCase())) {
          setState((currentState) => {
            if (currentState !== 'activated' && currentState !== 'listening' && currentState !== 'thinking' && currentState !== 'speaking') {
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
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setPermissionDenied(true);
        setIsSupported(false);
        shouldRestartRef.current = false;
        return;
      }
      
      // For other errors, try to restart with exponential backoff
      if (event.error === 'network' || event.error === 'service-not-allowed') {
        shouldRestartRef.current = false;
        return;
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      
      // Only restart if we should be listening and haven't exceeded retry limit
      if (shouldRestartRef.current && !permissionDenied && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        
        // Exponential backoff: 500ms, 1s, 2s
        const delay = Math.min(500 * Math.pow(2, retryCountRef.current - 1), 4000);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (shouldRestartRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.warn('Failed to restart recognition:', e);
            }
          }
        }, delay);
      } else if (retryCountRef.current >= maxRetries) {
        console.warn('Max retries reached for speech recognition');
        setState('dormant');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      cleanup();
      shouldRestartRef.current = false;
      try {
        recognition.stop();
      } catch (e) {
        // Already stopped
      }
    };
  }, [keyword, onWakeWordDetected, onTimeout, timeoutDuration, cleanup, maxRetries, permissionDenied]);

  const startPassiveListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported || permissionDenied) return;
    
    shouldRestartRef.current = true;
    retryCountRef.current = 0;
    
    try {
      if (!isListeningRef.current) {
        recognitionRef.current.start();
      }
      setState('passive');
    } catch (e) {
      console.error('Failed to start passive listening:', e);
    }
  }, [isSupported, permissionDenied]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
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
    setState('passive');
    setTranscript('');
    
    // Restart recognition if supported
    if (recognitionRef.current && isSupported && !permissionDenied) {
      shouldRestartRef.current = true;
      retryCountRef.current = 0;
      
      try {
        if (!isListeningRef.current) {
          recognitionRef.current.start();
        }
      } catch (e) {
        // Already started or other error
      }
    }
  }, [isSupported, permissionDenied]);

  // Auto-start if enabled (but only after user interaction in most browsers)
  useEffect(() => {
    if (autoStart && isSupported && !permissionDenied) {
      // Delay slightly to allow for browser readiness
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
  };
};

export default useWakeWordFixed;
