import { useState, useCallback, useRef, useEffect } from 'react';

export type WakeWordState = 'dormant' | 'passive' | 'activated' | 'listening' | 'thinking' | 'speaking';

interface UseWakeWordOptions {
  keyword?: string;
  onWakeWordDetected?: () => void;
  onTimeout?: () => void;
  timeoutDuration?: number;
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
  } = options;

  const [state, setState] = useState<WakeWordState>('dormant');
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef(false);

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
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
      if (event.error === 'not-allowed') {
        setIsSupported(false);
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      // Restart if we should still be listening
      if (state === 'passive' || state === 'dormant') {
        try {
          recognition.start();
        } catch (e) {
          // Already started
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      try {
        recognition.stop();
      } catch (e) {
        // Already stopped
      }
    };
  }, [keyword, onWakeWordDetected, onTimeout, timeoutDuration, state]);

  const startPassiveListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) return;
    
    try {
      if (!isListeningRef.current) {
        recognitionRef.current.start();
      }
      setState('passive');
    } catch (e) {
      console.error('Failed to start passive listening:', e);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (e) {
      // Already stopped
    }
    setState('dormant');
  }, []);

  const setWakeWordState = useCallback((newState: WakeWordState) => {
    setState(newState);
  }, []);

  const resetToPassive = useCallback(() => {
    setState('passive');
    setTranscript('');
    
    // Restart recognition
    if (recognitionRef.current && isSupported) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already started
      }
    }
  }, [isSupported]);

  return {
    state,
    setState: setWakeWordState,
    transcript,
    isSupported,
    startPassiveListening,
    stopListening,
    resetToPassive,
  };
};
