import { memo, useEffect, useRef, useState } from 'react';
import { AtlasCore } from '@/components/atlas';
import { WakeWordState } from '@/hooks/useWakeWordFixed';
import { useAtlasSettingsReadOnly } from '@/hooks/useAtlasSettings';
import { cn } from '@/lib/utils';

// Canonical render size - the WebGL canvas renders at this size and we scale it via CSS.
// This avoids WebGL sizing issues when parent containers animate using CSS transforms
// (e.g., Framer Motion scale animations).
const CANONICAL_SIZE = 520;

export interface ScaledAtlasSphereProps {
  state: WakeWordState;
  audioLevel: number;
  overrideMorphProgress?: number;
  overrideState?: WakeWordState;
  className?: string;
}

/**
 * ScaledAtlasSphere
 * - Renders AtlasCore at a fixed, high-quality size (CANONICAL_SIZE)
 * - Scales it to fit the container using CSS `transform: scale()`
 *
 * Important: We center using flexbox (not translate(-50%, -50%)), because translate
 * percent values are based on the element's pre-transform size and can drift when scaled.
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
      className={cn('relative w-full h-full flex items-center justify-center', className)}
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

export const ScaledAtlasSphere = memo(ScaledAtlasSphereComponent);
