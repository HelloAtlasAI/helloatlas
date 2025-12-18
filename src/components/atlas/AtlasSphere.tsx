import { memo, useEffect, useRef, useState } from 'react';
import { AtlasCore } from './AtlasCore';
import { useAtlasSettingsReadOnly } from '@/hooks/useAtlasSettings';
import { cn } from '@/lib/utils';
import type { WakeWordState, AIState } from '@/types';

// Canonical render size - the WebGL canvas renders at this size and we scale it via CSS.
const CANONICAL_SIZE = 520;

/**
 * Context presets for different usage scenarios.
 * Each preset configures camera distance and other optimizations for its context.
 */
export type AtlasSphereContext = 'dashboard' | 'core' | 'teach' | 'demo' | 'legacy' | 'mini';

interface ContextPreset {
  /** Camera Z distance - larger = more headroom for bloom */
  cameraZ: number;
  /** Whether to force morphProgress to 1.0 */
  forceMorph: boolean;
  /** Description for debugging */
  description: string;
}

const CONTEXT_PRESETS: Record<AtlasSphereContext, ContextPreset> = {
  dashboard: {
    cameraZ: 10.0, // Far back for 140px container - prevents bloom clipping
    forceMorph: true,
    description: 'Dashboard AI card (140px)',
  },
  core: {
    cameraZ: 9.0, // Medium distance for 200px container
    forceMorph: false,
    description: 'Atlas Core health dashboard (200px)',
  },
  teach: {
    cameraZ: 7.5, // Standard distance for 400px container
    forceMorph: false,
    description: 'Atlas Teach page (400px)',
  },
  demo: {
    cameraZ: 7.5, // Standard distance, may vary by size
    forceMorph: false,
    description: 'Atlas Demo page (variable sizes)',
  },
  legacy: {
    cameraZ: 7.5, // Standard distance for legacy fullscreen
    forceMorph: false,
    description: 'Legacy Index page (60vmin)',
  },
  mini: {
    cameraZ: 12.0, // Very far back for tiny containers (48-80px)
    forceMorph: true,
    description: 'Mini AI card (48-80px)',
  },
};

// Helper to convert AIState to WakeWordState
const aiStateToWakeWord = (state: AIState): WakeWordState => {
  const stateMap: Record<AIState, WakeWordState> = {
    'idle': 'passive',
    'listening': 'listening',
    'thinking': 'thinking',
    'speaking': 'speaking',
  };
  return stateMap[state] || 'passive';
};

export interface AtlasSphereProps {
  /** AI state - accepts both WakeWordState and AIState */
  state: WakeWordState | AIState;
  /** Audio level 0-1 */
  audioLevel: number;
  /** Context preset - determines camera distance and optimizations */
  context?: AtlasSphereContext;
  /** Override morph progress (0-1) */
  overrideMorphProgress?: number;
  /** Override state for demo purposes */
  overrideState?: WakeWordState;
  /** Custom camera Z (overrides context preset) */
  cameraZ?: number;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AtlasSphere - Unified sphere component with context-aware presets.
 * 
 * Renders AtlasCore at a fixed CANONICAL_SIZE and scales via CSS transform
 * to fit the container. This prevents WebGL resize issues during animations.
 * 
 * @example
 * // Dashboard usage (140px container)
 * <AtlasSphere state={state} audioLevel={level} context="dashboard" />
 * 
 * @example
 * // Teach page (400px container)
 * <AtlasSphere state={state} audioLevel={level} context="teach" />
 * 
 * @example
 * // Demo with custom settings
 * <AtlasSphere state={state} audioLevel={level} context="demo" overrideState="listening" />
 */
const AtlasSphereComponent = ({
  state,
  audioLevel,
  context = 'demo',
  overrideMorphProgress,
  overrideState,
  cameraZ: customCameraZ,
  onClick,
  className,
}: AtlasSphereProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Read settings from localStorage (single source of truth)
  const settings = useAtlasSettingsReadOnly();

  // Get context preset
  const preset = CONTEXT_PRESETS[context];

  // Normalize state to WakeWordState
  const normalizedState: WakeWordState = ['idle', 'listening', 'thinking', 'speaking'].includes(state)
    ? aiStateToWakeWord(state as AIState)
    : state as WakeWordState;

  // Apply overrides
  const effectiveState = overrideState ?? normalizedState;
  const effectiveMorphProgress = preset.forceMorph 
    ? 1.0 
    : (overrideMorphProgress ?? settings.morphProgress);

  // Camera Z: custom > scale-based > preset
  // For very small containers, move camera further back to avoid bloom clipping
  const scaledCameraZ = scale < 0.3 ? 10.0 : scale < 0.4 ? 9.0 : preset.cameraZ;
  const finalCameraZ = customCameraZ ?? scaledCameraZ;

  useEffect(() => {
    if (!containerRef.current) return;

    const calculateScale = () => {
      if (!containerRef.current) return;
      const containerSize = Math.min(
        containerRef.current.offsetWidth,
        containerRef.current.offsetHeight
      );
      if (containerSize > 0) setScale(containerSize / CANONICAL_SIZE);
    };

    const observer = new ResizeObserver(calculateScale);
    observer.observe(containerRef.current);
    calculateScale();

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full flex items-center justify-center cursor-pointer', className)}
      onClick={onClick}
    >
      <div
        style={{
          width: CANONICAL_SIZE,
          height: CANONICAL_SIZE,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        <AtlasCore
          state={effectiveState}
          audioLevel={audioLevel}
          cameraZ={finalCameraZ}
          morphProgress={effectiveMorphProgress}
          enableTrails={settings.enableTrails}
          trailLength={settings.trailLength}
          trailOpacity={settings.trailOpacity}
          trailColorGradient={settings.trailColorGradient}
          trailStartColor={settings.trailStartColor}
          trailEndColor={settings.trailEndColor}
          particleCount={settings.particleCount}
          particleSize={settings.particleSize}
          density={settings.density}
          rotationSpeed={settings.rotationSpeed}
          enableBloom={settings.enableBloom}
          bloomIntensity={settings.bloomIntensity}
          morphSpeed={settings.morphSpeed}
          enableRipples={settings.enableRipples}
          rippleSpeed={settings.rippleSpeed}
          rippleCount={settings.rippleCount}
          enableTurbulence={settings.enableTurbulence}
          turbulenceFrequency={settings.turbulenceFrequency}
          turbulenceAmplitude={settings.turbulenceAmplitude}
          turbulenceSpeed={settings.turbulenceSpeed}
          enableMouseInteraction={settings.enableMouseInteraction}
          mouseMode={settings.mouseMode}
          mouseStrength={settings.mouseStrength}
          mouseInfluenceRadius={settings.mouseInfluenceRadius}
          enableCore={settings.enableCore}
          coreParticleCount={settings.coreParticleCount}
          coreDensity={settings.coreDensity}
          coreParticleSize={settings.coreParticleSize}
          coreIntensity={settings.coreIntensity}
          corePulseSpeed={settings.corePulseSpeed}
          coreRotationOffset={settings.coreRotationOffset}
          fluidCohesion={settings.fluidCohesion}
          surfaceTension={settings.surfaceTension}
          fluidFlow={settings.fluidFlow}
          audioReactivitySpeed={settings.audioReactivitySpeed}
          visualizationMode={settings.visualizationMode}
          nebulaFlowStrength={settings.nebulaFlowStrength}
          nebulaFlowSpeed={settings.nebulaFlowSpeed}
          nebulaBandCount={settings.nebulaBandCount}
          nebulaRimIntensity={settings.nebulaRimIntensity}
          nebulaHotSpotIntensity={settings.nebulaHotSpotIntensity}
          nebulaBreathingSpeed={settings.nebulaBreathingSpeed}
          nebulaBreathingAmount={settings.nebulaBreathingAmount}
          nebulaRadiusNoise={settings.nebulaRadiusNoise}
          nebulaColorStart={settings.nebulaColorStart}
          nebulaColorMid={settings.nebulaColorMid}
          nebulaColorEnd={settings.nebulaColorEnd}
          nebulaParticleCount={settings.nebulaParticleCount}
          nebulaParticleSize={settings.nebulaParticleSize}
          nebulaDensity={settings.nebulaDensity}
          nebulaRotationSpeed={settings.nebulaRotationSpeed}
          nebulaStateReactive={settings.nebulaStateReactive}
          nebulaGlowIntensity={settings.nebulaGlowIntensity}
          nebulaDepthFade={settings.nebulaDepthFade}
          nebulaCoreGlow={settings.nebulaCoreGlow}
          nebulaSolidSurface={settings.nebulaSolidSurface}
          nebulaSurfaceBlend={settings.nebulaSurfaceBlend}
          nebulaUniformSize={settings.nebulaUniformSize}
          nebulaCoherence={settings.nebulaCoherence}
          nebulaThinkingRetraction={settings.nebulaThinkingRetraction}
          nebulaAudioBreathingIntensity={settings.nebulaAudioBreathingIntensity}
          nebulaTransitionSpeed={settings.nebulaTransitionSpeed}
        />
      </div>
    </div>
  );
};

export const AtlasSphere = memo(AtlasSphereComponent);
