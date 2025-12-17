import { memo, useRef } from 'react';
import { AtlasCore } from '@/components/atlas';
import { WakeWordState } from '@/hooks/useWakeWordFixed';
import { useAtlasSettingsReadOnly } from '@/hooks/useAtlasSettings';
import { useResponsiveAtlas } from '@/hooks/useResponsiveAtlas';
import { cn } from '@/lib/utils';

export interface UnifiedAtlasSphereProps {
  // Required - these come from runtime state
  state: WakeWordState;
  audioLevel: number;
  
  // Optional overrides - for dashboard or specific use cases
  overrideMorphProgress?: number;
  overrideState?: WakeWordState;
  
  // Responsive mode - when true, scales particles based on container size
  responsive?: boolean;
  
  // Style
  className?: string;
}

/**
 * UnifiedAtlasSphere - A self-contained sphere component that reads settings from localStorage.
 * This ensures the dashboard and demo page always display identical spheres.
 * 
 * Usage:
 * - AtlasDemo: Uses this with full control panel to edit settings
 * - Dashboard: Uses this with overrideMorphProgress={1.0} and responsive={true}
 */
const UnifiedAtlasSphereComponent = ({
  state,
  audioLevel,
  overrideMorphProgress,
  overrideState,
  responsive = false,
  className,
}: UnifiedAtlasSphereProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Read settings from localStorage (single source of truth)
  const settings = useAtlasSettingsReadOnly();
  
  // Get responsive scaling if enabled
  const { particleMultiplier, particleSizeBoost } = useResponsiveAtlas(containerRef);
  
  // Apply overrides
  const effectiveState = overrideState ?? state;
  const effectiveMorphProgress = overrideMorphProgress ?? settings.morphProgress;
  
  // Scale particles based on container size when responsive
  const scaleParticles = responsive ? particleMultiplier : 1;
  const scaleSize = responsive ? particleSizeBoost : 1;

  return (
    <div ref={containerRef} className={cn("w-full h-full", className)}>
      <AtlasCore
        state={effectiveState}
        audioLevel={audioLevel}
        morphProgress={effectiveMorphProgress}
        // Classic mode settings
        enableTrails={settings.enableTrails}
        trailLength={settings.trailLength}
        trailOpacity={settings.trailOpacity}
        trailColorGradient={settings.trailColorGradient}
        trailStartColor={settings.trailStartColor}
        trailEndColor={settings.trailEndColor}
        particleCount={Math.round(settings.particleCount * scaleParticles)}
        particleSize={settings.particleSize * scaleSize}
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
        coreParticleCount={Math.round(settings.coreParticleCount * scaleParticles)}
        coreDensity={settings.coreDensity}
        coreParticleSize={settings.coreParticleSize * scaleSize}
        coreIntensity={settings.coreIntensity}
        corePulseSpeed={settings.corePulseSpeed}
        coreRotationOffset={settings.coreRotationOffset}
        fluidCohesion={settings.fluidCohesion}
        surfaceTension={settings.surfaceTension}
        fluidFlow={settings.fluidFlow}
        audioReactivitySpeed={settings.audioReactivitySpeed}
        // Visualization mode
        visualizationMode={settings.visualizationMode}
        // Nebula Flow settings
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
        // Enhanced Nebula settings
        nebulaParticleCount={Math.round(settings.nebulaParticleCount * scaleParticles)}
        nebulaParticleSize={settings.nebulaParticleSize * scaleSize}
        nebulaDensity={settings.nebulaDensity}
        nebulaRotationSpeed={settings.nebulaRotationSpeed}
        nebulaStateReactive={settings.nebulaStateReactive}
        nebulaGlowIntensity={settings.nebulaGlowIntensity}
        nebulaDepthFade={settings.nebulaDepthFade}
        nebulaCoreGlow={settings.nebulaCoreGlow}
        // Solid Surface settings
        nebulaSolidSurface={settings.nebulaSolidSurface}
        nebulaSurfaceBlend={settings.nebulaSurfaceBlend}
        nebulaUniformSize={settings.nebulaUniformSize}
        nebulaCoherence={settings.nebulaCoherence}
        // State behavior settings
        nebulaThinkingRetraction={settings.nebulaThinkingRetraction}
        nebulaAudioBreathingIntensity={settings.nebulaAudioBreathingIntensity}
        nebulaTransitionSpeed={settings.nebulaTransitionSpeed}
      />
    </div>
  );
};

export const UnifiedAtlasSphere = memo(UnifiedAtlasSphereComponent);
