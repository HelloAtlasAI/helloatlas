import { memo, useRef, useState, useEffect } from 'react';
import { AtlasCore } from '@/components/atlas';
import { WakeWordState } from '@/hooks/useWakeWordFixed';
import { useAtlasSettingsReadOnly } from '@/hooks/useAtlasSettings';
import { cn } from '@/lib/utils';

// Canonical render size - all spheres render at this size and scale down via CSS
const CANONICAL_SIZE = 420;

export interface ScaledAtlasSphereProps {
  state: WakeWordState;
  audioLevel: number;
  overrideMorphProgress?: number;
  overrideState?: WakeWordState;
  className?: string;
}

/**
 * ScaledAtlasSphere - Renders the Atlas sphere at full quality (420x420) and uses
 * CSS transform: scale() to fit any container size. This ensures perfect visual
 * consistency across all sizes - the small dashboard sphere is literally a scaled-down
 * version of the large demo sphere.
 */
const ScaledAtlasSphereComponent = ({
  state,
  audioLevel,
  overrideMorphProgress,
  overrideState,
  className,
}: ScaledAtlasSphereProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  // Read settings from localStorage (single source of truth)
  const settings = useAtlasSettingsReadOnly();
  
  // Apply overrides
  const effectiveState = overrideState ?? state;
  const effectiveMorphProgress = overrideMorphProgress ?? settings.morphProgress;

  // Calculate scale based on container size
  useEffect(() => {
    if (!containerRef.current) return;

    const calculateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerSize = Math.min(rect.width, rect.height);
      setScale(containerSize / CANONICAL_SIZE);
    };

    const observer = new ResizeObserver(calculateScale);
    observer.observe(containerRef.current);
    calculateScale();

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={cn("relative w-full h-full overflow-hidden", className)}
    >
      {/* Centered, scaled sphere */}
      <div
        className="absolute"
        style={{
          width: CANONICAL_SIZE,
          height: CANONICAL_SIZE,
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <AtlasCore
          state={effectiveState}
          audioLevel={audioLevel}
          morphProgress={effectiveMorphProgress}
          // Full quality settings - no responsive adjustments
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

export const ScaledAtlasSphere = memo(ScaledAtlasSphereComponent);
