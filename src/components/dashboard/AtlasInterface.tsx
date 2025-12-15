import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtlasCoreFixed } from './AtlasCoreFixed';
import { AmbientAudioVisualizer } from './effects/AmbientAudioVisualizer';
import { WakeWordState } from '@/hooks/useWakeWordFixed';
import { Mic, MicOff } from 'lucide-react';

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

const getStatusMessage = (state: WakeWordState, isSupported: boolean): string => {
  if (!isSupported) return 'Tap to activate';
  
  const messages: Record<WakeWordState, string> = {
    dormant: "Say 'Atlas' to begin...",
    passive: "Listening for 'Atlas'...",
    activated: 'Atlas activated',
    listening: 'Listening...',
    thinking: 'Processing...',
    speaking: 'Speaking...',
  };
  return messages[state];
};

const getStatusColor = (state: WakeWordState): string => {
  const colors: Record<WakeWordState, string> = {
    dormant: 'bg-muted-foreground/30',
    passive: 'bg-amber-500/50',
    activated: 'bg-amber-400',
    listening: 'bg-cyan-400',
    thinking: 'bg-purple-400',
    speaking: 'bg-amber-400',
  };
  return colors[state];
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
    <div className="relative w-full h-full min-h-[280px] flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-xl border border-border/30">
      {/* Background glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, hsl(30, 100%, 50%, ${0.1 + audioLevel * 0.15}) 0%, transparent 60%)`,
          }}
          animate={{
            opacity: state === 'dormant' ? 0.3 : 1,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Status ring around sphere area */}
      <motion.div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border-2 ${getStatusColor(state)}`}
        style={{ borderStyle: state === 'passive' ? 'dashed' : 'solid' }}
        animate={{
          scale: state === 'activated' ? [1, 1.1, 1] : 1,
          opacity: state === 'dormant' ? 0.3 : 0.6,
        }}
        transition={{
          scale: { duration: 0.5, repeat: state === 'activated' ? 2 : 0 },
          opacity: { duration: 0.3 },
        }}
      />

      {/* Atlas Core Sphere */}
      <div className="relative w-[220px] h-[220px] z-10">
        <AtlasCoreFixed state={state} audioLevel={audioLevel} />
        
        {/* Manual activate button for unsupported browsers */}
        {!isSupported && (
          <button
            onClick={onManualActivate}
            className="absolute inset-0 flex items-center justify-center bg-transparent cursor-pointer group"
          >
            <motion.div
              className="p-4 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 group-hover:bg-primary/30 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Mic className="w-6 h-6 text-primary" />
            </motion.div>
          </button>
        )}
      </div>

      {/* Ambient Audio Visualizer */}
      <div className="absolute bottom-16 left-0 right-0 h-8">
        <AmbientAudioVisualizer 
          audioLevel={audioLevel} 
          isActive={state !== 'dormant'} 
          state={state}
        />
      </div>

      {/* Status hint */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute bottom-6 left-0 right-0 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            {!isSupported && <MicOff className="w-4 h-4" />}
            <span>{getStatusMessage(state, isSupported)}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Greeting */}
      {userName && state === 'dormant' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 left-0 right-0 text-center"
        >
          <p className="text-xs text-muted-foreground">
            Hello, {userName}
          </p>
        </motion.div>
      )}

      {/* Live transcript */}
      <AnimatePresence>
        {transcript && state === 'listening' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 left-4 right-4 text-center"
          >
            <p className="text-sm text-foreground/80 bg-background/50 backdrop-blur-sm rounded-lg px-3 py-2">
              "{transcript}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation history - compact */}
      {(lastMessage || lastResponse) && state === 'dormant' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-16 left-4 right-4 max-w-full"
        >
          <div className="text-xs text-muted-foreground/70 space-y-1 bg-background/30 backdrop-blur-sm rounded-lg p-2">
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
        </motion.div>
      )}
    </div>
  );
};

export const AtlasInterface = memo(AtlasInterfaceComponent);
