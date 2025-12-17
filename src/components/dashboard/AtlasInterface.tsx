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
        className={`relative flex-shrink-0 w-[140px] h-[140px] z-10 overflow-hidden ${canActivate ? 'cursor-pointer' : ''}`}
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
          }}
        >
          <UnifiedAtlasSphere 
            state={state}
            audioLevel={audioLevel}
            overrideMorphProgress={1.0}
            responsive={false}
            className="w-full h-full"
          />
        </div>
      </motion.div>
    </div>
  );
};

export const AtlasInterface = memo(AtlasInterfaceComponent);
