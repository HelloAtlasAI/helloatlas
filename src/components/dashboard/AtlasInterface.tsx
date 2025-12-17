import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnifiedAtlasSphere } from '@/components/atlas/UnifiedAtlasSphere';
import { WakeWordState } from '@/hooks/useWakeWordFixed';

interface AtlasInterfaceProps {
  state: WakeWordState;
  audioLevel: number;
  userName?: string;
  transcript?: string;
  lastMessage?: string;
  lastResponse?: string;
  isSupported?: boolean;
  onManualActivate?: () => void;
}

const getStatusMessage = (state: WakeWordState): string | null => {
  const messages: Record<WakeWordState, string | null> = {
    dormant: null,
    passive: null,
    activated: 'Atlas activated',
    listening: 'Listening...',
    thinking: 'Processing...',
    speaking: 'Speaking...',
  };
  return messages[state];
};

const AtlasInterfaceComponent = ({
  state,
  audioLevel,
  userName,
  transcript,
  lastMessage,
  lastResponse,
  isSupported = true,
  onManualActivate,
}: AtlasInterfaceProps) => {
  const [showHint, setShowHint] = useState(true);

  // Hide hint after first activation
  useEffect(() => {
    if (state === 'activated' || state === 'listening') {
      setShowHint(false);
    }
  }, [state]);

  return (
    <div className="relative w-full h-full flex items-center justify-center gap-4 px-4 overflow-hidden">
      {/* Atlas Core Sphere - responsive sizing with particle optimization */}
      <UnifiedAtlasSphere 
        state={state}
        audioLevel={audioLevel}
        overrideMorphProgress={1.0} // Always show sphere shape on dashboard
        responsive={true} // Enable dynamic particle scaling
        className="relative flex-shrink-0 w-full h-full max-w-[420px] max-h-[420px] aspect-square z-10"
      />

      {/* Status and info - to the right */}
      <div className="flex flex-col items-start justify-center gap-1 flex-1 min-w-0">
        {/* Greeting */}
        {userName && state === 'dormant' && (
          <p className="text-xs text-muted-foreground truncate">
            Hello, {userName}
          </p>
        )}
        
        {/* Status hint - only show when active */}
        <AnimatePresence mode="wait">
          {getStatusMessage(state) && (
            <motion.div
              key={state}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate">{getStatusMessage(state)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live transcript - compact */}
        <AnimatePresence>
          {transcript && state === 'listening' && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-foreground/80 bg-background/50 backdrop-blur-sm rounded px-2 py-1 truncate max-w-full"
            >
              "{transcript}"
            </motion.p>
          )}
        </AnimatePresence>

        {/* Last conversation - compact */}
        {(lastMessage || lastResponse) && state === 'dormant' && (
          <div className="text-xs text-muted-foreground/70 space-y-0.5 max-w-full">
            {lastMessage && (
              <p className="truncate">
                <span className="text-foreground/60">You:</span> {lastMessage}
              </p>
            )}
            {lastResponse && (
              <p className="truncate">
                <span className="text-primary/60">Atlas:</span> {lastResponse}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const AtlasInterface = memo(AtlasInterfaceComponent);
