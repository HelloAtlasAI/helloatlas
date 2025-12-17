import { memo, useState, useEffect, useCallback } from 'react';
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

  const canActivate = state === 'dormant' || state === 'passive';

  const handleClick = useCallback(() => {
    if (canActivate && onManualActivate) {
      onManualActivate();
    }
  }, [canActivate, onManualActivate]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Atlas Core Sphere - centered container with overflow visible for glow */}
      <motion.div 
        className={`relative flex-shrink-0 w-[140px] h-[140px] z-10 ${canActivate ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
        whileHover={canActivate ? { scale: 1.05 } : {}}
        whileTap={canActivate ? { scale: 0.95 } : {}}
      >
        {/* Extended canvas wrapper - 200% size, centered, for glow room */}
        <div 
          className="absolute"
          style={{
            width: '200%',
            height: '200%',
            left: '-50%',
            top: '-50%',
            // Radial mask to fade edges
            maskImage: 'radial-gradient(ellipse 60% 60% at center, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 60% at center, black 30%, transparent 70%)',
          }}
        >
          <UnifiedAtlasSphere 
            state={state}
            audioLevel={audioLevel}
            overrideMorphProgress={1.0}
            responsive={true}
            className="w-full h-full"
          />
        </div>
      </motion.div>

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
