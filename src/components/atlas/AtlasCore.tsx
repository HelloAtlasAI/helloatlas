import { useRef, memo, forwardRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { WakeWordState } from '@/hooks/useWakeWord';
import { GPUParticleSystem, GPUCoreSystem, TrailSystem, RippleSystem } from './systems';
import { STATE_CONFIGS } from './utils/stateConfigs';

export interface AtlasCoreProps {
  state: WakeWordState;
  audioLevel: number;
  morphProgress?: number;
  enableTrails?: boolean;
  trailLength?: number;
  trailOpacity?: number;
  trailColorGradient?: boolean;
  trailStartColor?: string;
  trailEndColor?: string;
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
  audioReactivitySpeed?: number;
}

// Bloom wrapper - lower quality for performance
const BloomEffect = memo(({ intensity }: { intensity: number }) => (
  <EffectComposer multisampling={0}>
    <Bloom
      intensity={intensity}
      luminanceThreshold={0.2}
      luminanceSmoothing={0.9}
      radius={0.8}
      mipmapBlur
    />
  </EffectComposer>
));

BloomEffect.displayName = 'BloomEffect';

// CSS Fallback orb
const CSSFallbackOrb = memo(({ state, audioLevel }: { state: WakeWordState; audioLevel: number }) => {
  const config = STATE_CONFIGS[state];
  const colorHex = '#' + config.primary.getHexString();
  const coreHex = '#' + config.core.getHexString();
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div 
        className="relative w-32 h-32 rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${coreHex}, ${colorHex} 50%, transparent 70%)`,
          boxShadow: `0 0 ${30 + audioLevel * 50}px ${colorHex}, inset 0 0 20px ${coreHex}`,
          transform: `scale(${1 + audioLevel * 0.2})`,
          transition: 'all 0.3s ease-out',
        }}
      >
        <div 
          className="absolute inset-2 rounded-full opacity-60"
          style={{
            background: `radial-gradient(circle at 40% 40%, white 0%, ${coreHex} 30%, transparent 60%)`,
          }}
        />
      </div>
    </div>
  );
});

CSSFallbackOrb.displayName = 'CSSFallbackOrb';

// ParticleSystem - orchestrates all systems
const ParticleSystem = memo(({
  state,
  audioLevel,
  morphProgress = 1,
  enableTrails = false,
  trailLength = 4,
  trailOpacity = 0.4,
  trailColorGradient = true,
  trailStartColor = '#ff9500',
  trailEndColor = '#1a0a2e',
  particleCount = 1500,
  particleSize = 0.08,
  density = 1.0,
  rotationSpeed = 0.5,
  enableRipples = true,
  rippleSpeed = 1.5,
  rippleCount = 2,
  enableTurbulence = true,
  turbulenceAmplitude = 0.06,
  enableMouseInteraction = true,
  mouseMode = 'attract' as const,
  mouseStrength = 0.4,
  mouseInfluenceRadius = 2.0,
  enableCore = true,
  coreParticleCount = 120,
  coreDensity = 0.25,
  coreParticleSize = 0.04,
  coreIntensity = 1.0,
  corePulseSpeed = 1.5,
  coreRotationOffset = -0.5,
  mousePosition
}: AtlasCoreProps & { mousePosition: React.MutableRefObject<{ x: number; y: number; active: boolean }> }) => {
  const trailGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const config = STATE_CONFIGS[state];

  return (
    <group>
      {/* Ring ripples on state change */}
      <RippleSystem
        state={state}
        enabled={enableRipples}
        rippleSpeed={rippleSpeed}
        rippleCount={rippleCount}
      />
      
      {/* Particle trails - disabled by default for performance */}
      {enableTrails && trailLength > 0 && (
        <TrailSystem
          particleCount={Math.min(particleCount, 1000)}
          trailLength={trailLength}
          trailOpacity={trailOpacity}
          colorStart={trailColorGradient ? new THREE.Color(trailStartColor) : config.secondary}
          colorEnd={trailColorGradient ? new THREE.Color(trailEndColor) : config.secondary}
          enableGradient={trailColorGradient}
          geometryRef={trailGeometryRef}
        />
      )}
      
      {/* GPU-based main particle cloud */}
      <GPUParticleSystem
        state={state}
        audioLevel={audioLevel}
        morphProgress={morphProgress}
        particleCount={particleCount}
        particleSize={particleSize}
        density={density}
        rotationSpeed={rotationSpeed}
        enableTurbulence={enableTurbulence}
        turbulenceAmplitude={turbulenceAmplitude}
        enableMouseInteraction={enableMouseInteraction}
        mouseMode={mouseMode}
        mouseStrength={mouseStrength}
        mouseInfluenceRadius={mouseInfluenceRadius}
        mousePosition={mousePosition}
      />

      {/* GPU-based core system */}
      {enableCore && (
        <GPUCoreSystem
          state={state}
          audioLevel={audioLevel}
          morphProgress={morphProgress}
          coreParticleCount={coreParticleCount}
          coreDensity={coreDensity}
          coreParticleSize={coreParticleSize}
          coreIntensity={coreIntensity}
          corePulseSpeed={corePulseSpeed}
          coreRotationOffset={coreRotationOffset}
        />
      )}
    </group>
  );
});

ParticleSystem.displayName = 'ParticleSystem';

/**
 * AtlasCore - Optimized Atlas sphere visualization
 * - Reduced default particle counts
 * - Simplified shaders
 * - Lower DPR for performance
 * - Trails disabled by default
 */
export const AtlasCore = memo(forwardRef<HTMLDivElement, AtlasCoreProps>(({ 
  state, 
  audioLevel, 
  morphProgress = 1.0,
  enableTrails = false,
  trailLength = 4,
  trailOpacity = 0.4,
  trailColorGradient = true,
  trailStartColor = '#ff9500',
  trailEndColor = '#1a0a2e',
  particleCount = 1500,
  particleSize = 0.08,
  density = 1.0,
  rotationSpeed = 0.5,
  enableBloom = true,
  bloomIntensity = 0.6,
  morphSpeed = 1.5,
  enableRipples = true,
  rippleSpeed = 1.5,
  rippleCount = 2,
  enableTurbulence = true,
  turbulenceFrequency = 0.5,
  turbulenceAmplitude = 0.06,
  turbulenceSpeed = 0.3,
  enableMouseInteraction = true,
  mouseMode = 'attract',
  mouseStrength = 0.4,
  mouseInfluenceRadius = 2.0,
  enableCore = true,
  coreParticleCount = 120,
  coreDensity = 0.25,
  coreParticleSize = 0.04,
  coreIntensity = 1.0,
  corePulseSpeed = 1.5,
  coreRotationOffset = -0.5,
  fluidCohesion = 0,
  surfaceTension = 0.5,
  fluidFlow = 0.3,
  audioReactivitySpeed = 1.0
}, ref) => {
  const mousePositionRef = useRef({ x: 0, y: 0, active: false });
  
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mousePositionRef.current = { x, y, active: true };
  };
  
  const handlePointerLeave = () => {
    mousePositionRef.current.active = false;
  };

  return (
    <div 
      ref={ref} 
      className="w-full h-full"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ 
          antialias: false,
          alpha: true,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        fallback={<CSSFallbackOrb state={state} audioLevel={audioLevel} />}
      >
        <ParticleSystem 
          state={state} 
          audioLevel={audioLevel} 
          morphProgress={morphProgress}
          enableTrails={enableTrails}
          trailLength={trailLength}
          trailOpacity={trailOpacity}
          trailColorGradient={trailColorGradient}
          trailStartColor={trailStartColor}
          trailEndColor={trailEndColor}
          particleCount={particleCount}
          particleSize={particleSize}
          density={density}
          rotationSpeed={rotationSpeed}
          morphSpeed={morphSpeed}
          enableRipples={enableRipples}
          rippleSpeed={rippleSpeed}
          rippleCount={rippleCount}
          enableTurbulence={enableTurbulence}
          turbulenceAmplitude={turbulenceAmplitude}
          enableMouseInteraction={enableMouseInteraction}
          mouseMode={mouseMode}
          mouseStrength={mouseStrength}
          mouseInfluenceRadius={mouseInfluenceRadius}
          enableCore={enableCore}
          coreParticleCount={coreParticleCount}
          coreDensity={coreDensity}
          coreParticleSize={coreParticleSize}
          coreIntensity={coreIntensity}
          corePulseSpeed={corePulseSpeed}
          coreRotationOffset={coreRotationOffset}
          mousePosition={mousePositionRef}
        />
        
        {enableBloom && <BloomEffect intensity={bloomIntensity} />}
      </Canvas>
    </div>
  );
}));

AtlasCore.displayName = 'AtlasCore';

export default AtlasCore;
