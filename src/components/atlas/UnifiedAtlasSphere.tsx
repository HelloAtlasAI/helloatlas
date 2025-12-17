import { memo, useMemo } from 'react';
import { AtlasCore } from '@/components/atlas';
import { WakeWordState } from '@/hooks/useWakeWordFixed';
import { useAtlasSettingsReadOnly, AtlasSettings } from '@/hooks/useAtlasSettings';

export interface UnifiedAtlasSphereProps {
  // Required - these come from runtime state
  state: WakeWordState;
  audioLevel: number;
  
  // Optional overrides - for dashboard or specific use cases
  overrideMorphProgress?: number;
  overrideState?: WakeWordState;
  
  // Style
  className?: string;
}

/**
 * UnifiedAtlasSphere - A self-contained sphere component that reads settings from localStorage.
 * This ensures the dashboard and demo page always display identical spheres.
 * 
 * Usage:
 * - AtlasDemo: Uses this with full control panel to edit settings
 * - Dashboard: Uses this with overrideMorphProgress={1.0} to always show sphere shape
 */
const UnifiedAtlasSphereComponent = ({
  state,
  audioLevel,
  overrideMorphProgress,
  overrideState,
  className,
}: UnifiedAtlasSphereProps) => {
  // Read settings from localStorage (single source of truth)
  const settings = useAtlasSettingsReadOnly();
  
  // Apply overrides
  const effectiveState = overrideState ?? state;
  const effectiveMorphProgress = overrideMorphProgress ?? settings.morphProgress;

  return (
    <div className={className}>
      <AtlasCore 
        state={effectiveState}
        audioLevel={audioLevel}
        morphProgress={effectiveMorphProgress}
        enableTrails={settings.enableTrails}
        trailLength={settings.trailLength}
        trailOpacity={settings.trailOpacity}
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
      />
    </div>
  );
};

export const UnifiedAtlasSphere = memo(UnifiedAtlasSphereComponent);
