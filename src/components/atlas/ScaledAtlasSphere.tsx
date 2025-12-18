import { memo } from 'react';
import { AtlasCore } from '@/components/atlas';
import { WakeWordState } from '@/hooks/useWakeWordFixed';
import { useAtlasSettingsReadOnly } from '@/hooks/useAtlasSettings';
import { cn } from '@/lib/utils';

export interface ScaledAtlasSphereProps {
  state: WakeWordState;
  audioLevel: number;
  overrideMorphProgress?: number;
  overrideState?: WakeWordState;
  className?: string;
}

/**
 * ScaledAtlasSphere - Renders the Atlas sphere at native container size.
 * The Canvas automatically fills its container and handles aspect ratio.
 */
const ScaledAtlasSphereComponent = ({
  state,
  audioLevel,
  overrideMorphProgress,
  overrideState,
  className,
}: ScaledAtlasSphereProps) => {
  // Read settings from localStorage (single source of truth)
  const settings = useAtlasSettingsReadOnly();
  
  // Apply overrides
  const effectiveState = overrideState ?? state;
  const effectiveMorphProgress = overrideMorphProgress ?? settings.morphProgress;

  return (
    <div className={cn("relative w-full h-full", className)}>
      <AtlasCore
        state={effectiveState}
        audioLevel={audioLevel}
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
  );
};

export const ScaledAtlasSphere = memo(ScaledAtlasSphereComponent);
