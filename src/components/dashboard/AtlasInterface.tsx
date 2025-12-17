import { memo, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtlasCore } from '@/components/atlas';
import { WakeWordState } from '@/hooks/useWakeWordFixed';

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

const getStatusMessage = (state: WakeWordState): string => {
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
  // Dashboard-specific defaults that ensure compact sphere display
  const dashboardDefaults: AtlasSettings = {
    morphProgress: 1.0,       // Always show sphere (not scattered)
    density: 0.98,            // Higher density for fuller 460px sphere
    particleCount: 5200,      // Optimal count for 460px size
    fluidCohesion: 0.4,       // Balanced cohesion for smooth appearance
    particleSize: 0.065,      // Optimized for denser appearance at 460px
  };

  // Load saved settings but prioritize dashboard defaults for critical visual props
  const savedSettings = useMemo<AtlasSettings>(() => {
    try {
      const stored = localStorage.getItem('atlas-demo-settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Dashboard defaults take priority for key visual props
        return {
          ...dashboardDefaults,  // Start with dashboard defaults
          ...parsed,             // Override with saved settings
          // Force these critical values for dashboard display
          morphProgress: 1.0,
          particleCount: Math.max(parsed.particleCount || 0, 3500),
          density: dashboardDefaults.density,
          particleSize: dashboardDefaults.particleSize,
        };
      }
    } catch (e) {
      console.warn('Failed to load Atlas settings:', e);
    }
    return dashboardDefaults;
  }, []);

  // Hide hint after first activation
  useEffect(() => {
    if (state === 'activated' || state === 'listening') {
      setShowHint(false);
    }
  }, [state]);

  return (
    <div className="relative w-full h-full flex items-center justify-center gap-4 px-4">
      {/* Atlas Core Sphere - 460px */}
      <div className="relative flex-shrink-0 w-[460px] h-[460px] z-10">
        <AtlasCore 
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
      </div>

      {/* Status and info - to the right */}
      <div className="flex flex-col items-start justify-center gap-1 flex-1 min-w-0">
        {/* Greeting */}
        {userName && state === 'dormant' && (
          <p className="text-xs text-muted-foreground truncate">
            Hello, {userName}
          </p>
        )}
        
        {/* Status hint */}
        <AnimatePresence mode="wait">
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
