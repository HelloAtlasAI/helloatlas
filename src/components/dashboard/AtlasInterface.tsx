import { memo, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtlasCoreFixed } from './AtlasCoreFixed';
import { WakeWordState } from '@/hooks/useWakeWordFixed';
import { Mic, MicOff } from 'lucide-react';

// Settings interface matching AtlasDemo
interface AtlasSettings {
  morphProgress?: number;
  enableTrails?: boolean;
  trailLength?: number;
  trailOpacity?: number;
  particleCount?: number;
  particleSize?: number;
  density?: number;
  rotationSpeed?: number;
  enableBloom?: boolean;
  bloomIntensity?: number;
  morphSpeed?: number;
  enableRipples?: boolean;
  rippleSpeed?: number;
  rippleCount?: number;
  enableTurbulence?: boolean;
  turbulenceFrequency?: number;
  turbulenceAmplitude?: number;
  turbulenceSpeed?: number;
  enableMouseInteraction?: boolean;
  mouseMode?: 'attract' | 'repulse';
  mouseStrength?: number;
  mouseInfluenceRadius?: number;
  enableCore?: boolean;
  coreParticleCount?: number;
  coreDensity?: number;
  coreParticleSize?: number;
  coreIntensity?: number;
  corePulseSpeed?: number;
  coreRotationOffset?: number;
  fluidCohesion?: number;
  surfaceTension?: number;
  fluidFlow?: number;
}

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

  // Load saved Atlas settings from localStorage
  const savedSettings = useMemo<AtlasSettings>(() => {
    try {
      const stored = localStorage.getItem('atlas-demo-settings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load Atlas settings:', e);
    }
    return {};
  }, []);

  // Hide hint after first activation
  useEffect(() => {
    if (state === 'activated' || state === 'listening') {
      setShowHint(false);
    }
  }, [state]);

  return (
    <div className="relative w-full h-full min-h-[280px] flex flex-col items-center justify-center">
      {/* Atlas Core Sphere - using saved settings from AtlasDemo */}
      <div className="relative w-[220px] h-[220px] z-10">
        <AtlasCoreFixed 
          state={state} 
          audioLevel={audioLevel}
          morphProgress={savedSettings.morphProgress}
          enableTrails={savedSettings.enableTrails}
          trailLength={savedSettings.trailLength}
          trailOpacity={savedSettings.trailOpacity}
          particleCount={savedSettings.particleCount}
          particleSize={savedSettings.particleSize}
          density={savedSettings.density}
          rotationSpeed={savedSettings.rotationSpeed}
          enableBloom={savedSettings.enableBloom}
          bloomIntensity={savedSettings.bloomIntensity}
          morphSpeed={savedSettings.morphSpeed}
          enableRipples={savedSettings.enableRipples}
          rippleSpeed={savedSettings.rippleSpeed}
          rippleCount={savedSettings.rippleCount}
          enableTurbulence={savedSettings.enableTurbulence}
          turbulenceFrequency={savedSettings.turbulenceFrequency}
          turbulenceAmplitude={savedSettings.turbulenceAmplitude}
          turbulenceSpeed={savedSettings.turbulenceSpeed}
          enableMouseInteraction={savedSettings.enableMouseInteraction}
          mouseMode={savedSettings.mouseMode}
          mouseStrength={savedSettings.mouseStrength}
          mouseInfluenceRadius={savedSettings.mouseInfluenceRadius}
          enableCore={savedSettings.enableCore}
          coreParticleCount={savedSettings.coreParticleCount}
          coreDensity={savedSettings.coreDensity}
          coreParticleSize={savedSettings.coreParticleSize}
          coreIntensity={savedSettings.coreIntensity}
          corePulseSpeed={savedSettings.corePulseSpeed}
          coreRotationOffset={savedSettings.coreRotationOffset}
          fluidCohesion={savedSettings.fluidCohesion}
          surfaceTension={savedSettings.surfaceTension}
          fluidFlow={savedSettings.fluidFlow}
        />
        
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
