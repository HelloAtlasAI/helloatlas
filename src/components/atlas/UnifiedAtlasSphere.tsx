import { memo, useRef } from 'react';
import { AtlasCore } from '@/components/atlas';
import { WakeWordState } from '@/hooks/useWakeWordFixed';
import { useAtlasSettingsReadOnly } from '@/hooks/useAtlasSettings';
import { useResponsiveAtlas, COMPACT_MODE_OVERRIDES } from '@/hooks/useResponsiveAtlas';
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
 * 
 * When responsive={true} and container is small (<250px), Compact Mode settings are auto-applied.
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
  const { particleMultiplier, particleSizeBoost, useCompactMode } = useResponsiveAtlas(containerRef);
  
  // Apply overrides
  const effectiveState = overrideState ?? state;
  const effectiveMorphProgress = overrideMorphProgress ?? settings.morphProgress;
  
  // When responsive and in compact mode, use compact overrides
  const shouldUseCompact = responsive && useCompactMode;
  
  // Get effective values - compact mode overrides take precedence for small containers
  const getEffective = <T,>(settingValue: T, compactValue: T | undefined): T => {
    return shouldUseCompact && compactValue !== undefined ? compactValue : settingValue;
  };

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
        particleCount={Math.round(settings.particleCount * (responsive ? particleMultiplier : 1))}
        particleSize={settings.particleSize * (responsive ? particleSizeBoost : 1)}
        density={settings.density}
        rotationSpeed={settings.rotationSpeed}
        enableBloom={getEffective(settings.enableBloom, COMPACT_MODE_OVERRIDES.enableBloom)}
        bloomIntensity={getEffective(settings.bloomIntensity, COMPACT_MODE_OVERRIDES.bloomIntensity)}
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
        coreParticleCount={Math.round(settings.coreParticleCount * (responsive ? particleMultiplier : 1))}
        coreDensity={settings.coreDensity}
        coreParticleSize={settings.coreParticleSize * (responsive ? particleSizeBoost : 1)}
        coreIntensity={settings.coreIntensity}
        corePulseSpeed={settings.corePulseSpeed}
        coreRotationOffset={settings.coreRotationOffset}
        fluidCohesion={settings.fluidCohesion}
        surfaceTension={settings.surfaceTension}
        fluidFlow={settings.fluidFlow}
        audioReactivitySpeed={settings.audioReactivitySpeed}
        // Visualization mode
        visualizationMode={settings.visualizationMode}
        // Nebula Flow settings - apply compact overrides when appropriate
        nebulaFlowStrength={getEffective(settings.nebulaFlowStrength, COMPACT_MODE_OVERRIDES.nebulaFlowStrength)}
        nebulaFlowSpeed={getEffective(settings.nebulaFlowSpeed, COMPACT_MODE_OVERRIDES.nebulaFlowSpeed)}
        nebulaBandCount={settings.nebulaBandCount}
        nebulaRimIntensity={getEffective(settings.nebulaRimIntensity, COMPACT_MODE_OVERRIDES.nebulaRimIntensity)}
        nebulaHotSpotIntensity={settings.nebulaHotSpotIntensity}
        nebulaBreathingSpeed={getEffective(settings.nebulaBreathingSpeed, COMPACT_MODE_OVERRIDES.nebulaBreathingSpeed)}
        nebulaBreathingAmount={getEffective(settings.nebulaBreathingAmount, COMPACT_MODE_OVERRIDES.nebulaBreathingAmount)}
        nebulaRadiusNoise={settings.nebulaRadiusNoise}
        nebulaColorStart={settings.nebulaColorStart}
        nebulaColorMid={settings.nebulaColorMid}
        nebulaColorEnd={settings.nebulaColorEnd}
        // Enhanced Nebula settings with compact overrides
        nebulaParticleCount={shouldUseCompact 
          ? COMPACT_MODE_OVERRIDES.nebulaParticleCount 
          : Math.round(settings.nebulaParticleCount * (responsive ? particleMultiplier : 1))}
        nebulaParticleSize={shouldUseCompact 
          ? COMPACT_MODE_OVERRIDES.nebulaParticleSize 
          : settings.nebulaParticleSize * (responsive ? particleSizeBoost : 1)}
        nebulaDensity={settings.nebulaDensity}
        nebulaRotationSpeed={settings.nebulaRotationSpeed}
        nebulaStateReactive={settings.nebulaStateReactive}
        nebulaGlowIntensity={getEffective(settings.nebulaGlowIntensity, COMPACT_MODE_OVERRIDES.nebulaGlowIntensity)}
        nebulaDepthFade={getEffective(settings.nebulaDepthFade, COMPACT_MODE_OVERRIDES.nebulaDepthFade)}
        nebulaCoreGlow={getEffective(settings.nebulaCoreGlow, COMPACT_MODE_OVERRIDES.nebulaCoreGlow)}
        // Solid Surface settings
        nebulaSolidSurface={getEffective(settings.nebulaSolidSurface, COMPACT_MODE_OVERRIDES.nebulaSolidSurface)}
        nebulaSurfaceBlend={getEffective(settings.nebulaSurfaceBlend, COMPACT_MODE_OVERRIDES.nebulaSurfaceBlend)}
        nebulaUniformSize={getEffective(settings.nebulaUniformSize, COMPACT_MODE_OVERRIDES.nebulaUniformSize)}
        nebulaCoherence={getEffective(settings.nebulaCoherence, COMPACT_MODE_OVERRIDES.nebulaCoherence)}
        // State behavior settings
        nebulaThinkingRetraction={settings.nebulaThinkingRetraction}
        nebulaAudioBreathingIntensity={settings.nebulaAudioBreathingIntensity}
        nebulaTransitionSpeed={settings.nebulaTransitionSpeed}
      />
    </div>
  );
};

export const UnifiedAtlasSphere = memo(UnifiedAtlasSphereComponent);
