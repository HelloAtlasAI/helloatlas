import { useRef, useMemo, memo, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WakeWordState } from '@/types';
import { nebulaFlowVertexShader, nebulaFlowFragmentShader } from '../shaders/nebulaFlowShaders';
import { NEBULA_STATE_CONFIGS, NebulaStateConfig } from '../utils/nebulaStateConfigs';

// Per-state customization type
type StateCustomizations = Partial<Record<WakeWordState, Partial<NebulaStateConfig>>>;

interface NebulaFlowSystemProps {
  state: WakeWordState;
  audioLevelRef: MutableRefObject<number>;
  morphProgress: number;
  particleCount?: number;
  particleSize?: number;
  density?: number;
  rotationSpeed?: number;
  // Pixel-stable rendering props
  pixelRatio?: number;
  containerWidth?: number;
  containerHeight?: number;
  // Nebula-specific props
  flowStrength?: number;
  flowSpeed?: number;
  bandCount?: number;
  rimIntensity?: number;
  hotSpotIntensity?: number;
  breathingSpeed?: number;
  breathingAmount?: number;
  radiusNoise?: number;
  colorStart?: string;
  colorMid?: string;
  colorEnd?: string;
  // Enhanced props
  stateReactive?: boolean;
  glowIntensity?: number;
  depthFade?: number;
  coreGlow?: number;
  // Solid Surface props
  solidSurface?: boolean;
  surfaceBlend?: number;
  uniformSize?: number;
  coherence?: number;
  // State behavior props
  thinkingRetraction?: number;
  audioBreathingIntensity?: number;
  transitionSpeed?: number;
  // Per-state customizations
  stateCustomizations?: StateCustomizations;
}

export const NebulaFlowSystem = memo(({
  state,
  audioLevelRef,
  morphProgress,
  particleCount = 8000,
  particleSize = 0.05,
  density = 1.0,
  rotationSpeed = 0.2,
  // Pixel-stable props
  pixelRatio = 1,
  containerWidth = 200,
  containerHeight = 200,
  // Nebula props
  flowStrength = 0.5,
  flowSpeed = 0.5,
  bandCount = 8,
  rimIntensity = 1.2,
  hotSpotIntensity = 0.8,
  breathingSpeed = 0.5,
  breathingAmount = 0.05,
  radiusNoise = 0.15,
  colorStart = '#1a0a3e',
  colorMid = '#8b5cf6',
  colorEnd = '#67e8f9',
  stateReactive = true,
  glowIntensity = 1.0,
  depthFade = 0.3,
  coreGlow = 1.0,
  solidSurface = false,
  surfaceBlend = 1.5,
  uniformSize = 1.8,
  coherence = 0.9,
  thinkingRetraction = 0.25,
  audioBreathingIntensity = 0.15,
  transitionSpeed = 1.5,
  // Per-state customizations
  stateCustomizations = {},
}: NebulaFlowSystemProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Cache target colors to avoid GC pressure - reuse these objects
  const targetColorsRef = useRef({
    start: new THREE.Color(),
    mid: new THREE.Color(),
    end: new THREE.Color()
  });
  
  // Store current interpolated state values
  const currentStateRef = useRef({
    colorStart: new THREE.Color(colorStart),
    colorMid: new THREE.Color(colorMid),
    colorEnd: new THREE.Color(colorEnd),
    flowSpeed: flowSpeed,
    flowStrength: flowStrength,
    rimIntensity: rimIntensity,
    hotSpotIntensity: hotSpotIntensity,
    breathingSpeed: breathingSpeed,
    breathingAmount: breathingAmount,
    radiusNoise: radiusNoise,
    glowIntensity: glowIntensity,
    coreRetraction: 0,
  });

  // Generate particle attributes with flow bands - Fibonacci sphere for solid surface
  const attrs = useMemo(() => {
    const count = particleCount;
    const isSolid = solidSurface;

    const spherePos = new Float32Array(count * 3);
    const bandIndex = new Float32Array(count);
    const flowOffset = new Float32Array(count);
    const randomSeed = new Float32Array(count);

    if (isSolid) {
      // Fibonacci sphere distribution for even spacing (solid surface)
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Fibonacci latitude distribution (even spacing)
        const y = 1 - (i / (count - 1)) * 2; // -1 to 1
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = goldenAngle * i;
        
        // Perfect sphere shell - no thickness variation for solid surface
        const r = 1.8 * density;
        
        spherePos[i3] = r * radiusAtY * Math.cos(theta);
        spherePos[i3 + 1] = r * y;
        spherePos[i3 + 2] = r * radiusAtY * Math.sin(theta);
        
        // Coherent band assignment based on latitude
        bandIndex[i] = (y + 1) * 0.5; // 0-1 based on position
        
        // Minimal random variation in solid surface mode
        flowOffset[i] = i / count;
        randomSeed[i] = (i / count) * 0.1;
      }
    } else {
      // Standard random distribution (particle cloud)
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Distribute particles in bands around the sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        // Assign to a band based on phi (latitude)
        const band = Math.floor((phi / Math.PI) * bandCount);
        bandIndex[i] = band / bandCount;
        
        // Radius with slight variation for shell thickness
        const r = (1.8 + (Math.random() - 0.5) * 0.4) * density;
        
        spherePos[i3] = r * Math.sin(phi) * Math.cos(theta);
        spherePos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        spherePos[i3 + 2] = r * Math.cos(phi);
        
        // Flow offset for variation within bands
        flowOffset[i] = Math.random();
        randomSeed[i] = Math.random();
      }
    }

    const position = spherePos.slice();

    return {
      position,
      spherePos,
      bandIndex,
      flowOffset,
      randomSeed,
    };
  }, [particleCount, density, bandCount, solidSurface]);

  // Uniforms
  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uMorphProgress: { value: morphProgress },
      uAudioLevel: { value: 0 },
      uParticleSize: { value: particleSize },
      uFlowStrength: { value: flowStrength },
      uFlowSpeed: { value: flowSpeed },
      uBreathingSpeed: { value: breathingSpeed },
      uBreathingAmount: { value: breathingAmount },
      uRadiusNoise: { value: radiusNoise },
      uRimIntensity: { value: rimIntensity },
      uHotSpotIntensity: { value: hotSpotIntensity },
      uColorStart: { value: new THREE.Color(colorStart) },
      uColorMid: { value: new THREE.Color(colorMid) },
      uColorEnd: { value: new THREE.Color(colorEnd) },
      uOpacity: { value: 0.9 },
      uGlowIntensity: { value: glowIntensity },
      uDepthFade: { value: depthFade },
      uCoreGlow: { value: coreGlow },
      // Pixel-stable rendering uniforms
      uPixelRatio: { value: pixelRatio },
      uResolution: { value: new THREE.Vector2(containerWidth, containerHeight) },
      uPointSizePx: { value: particleSize * 50 }, // Base point size derived from particleSize prop
      // Solid Surface uniforms
      uSolidSurface: { value: solidSurface ? 1.0 : 0.0 },
      uSurfaceBlend: { value: surfaceBlend },
      uUniformSize: { value: uniformSize },
      uCoherence: { value: coherence },
      // State behavior uniforms
      uCoreRetraction: { value: 0 },
      uAudioReactive: { value: 0 },
      uAudioBreathing: { value: audioBreathingIntensity },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animation loop
  useFrame((_, delta) => {
    if (!materialRef.current || !pointsRef.current) return;

    const u = materialRef.current.uniforms;
    const audioLevel = audioLevelRef?.current ?? 0;
    
    // Get base state config and merge with per-state customizations
    const baseConfig = NEBULA_STATE_CONFIGS[state];
    const customOverrides = stateCustomizations[state] || {};
    const stateConfig = { ...baseConfig, ...customOverrides };
    
    // Frame-rate independent smoothing using exponential decay
    // lambda controls the speed: higher = faster transitions
    const lambda = transitionSpeed * 2;
    
    // Clamp delta to prevent huge jumps on frame drops
    const clampedDelta = Math.min(delta, 0.1);

    // Update time
    u.uTime.value += delta;
    
    // Update morph progress with damp
    u.uMorphProgress.value = THREE.MathUtils.damp(u.uMorphProgress.value, morphProgress, 4, clampedDelta);
    u.uAudioLevel.value = audioLevel;
    
    // State-reactive mode: interpolate toward merged state config (base + customizations)
    if (stateReactive && stateConfig) {
      const current = currentStateRef.current;
      const targets = targetColorsRef.current;
      
      // Use merged state config values as targets
      targets.start.set(stateConfig.colorStart);
      targets.mid.set(stateConfig.colorMid);
      targets.end.set(stateConfig.colorEnd);
      
      // Color interpolation using exponential decay factor
      const colorDecay = 1 - Math.exp(-lambda * clampedDelta);
      current.colorStart.lerp(targets.start, colorDecay);
      current.colorMid.lerp(targets.mid, colorDecay);
      current.colorEnd.lerp(targets.end, colorDecay);
      
      u.uColorStart.value.copy(current.colorStart);
      u.uColorMid.value.copy(current.colorMid);
      u.uColorEnd.value.copy(current.colorEnd);
      
      // Use merged state config for all numeric properties
      const targetFlowSpeed = stateConfig.flowSpeed;
      const targetFlowStrength = stateConfig.flowStrength;
      const targetRimIntensity = stateConfig.rimIntensity;
      const targetHotSpotIntensity = stateConfig.hotSpotIntensity;
      const targetBreathingSpeed = stateConfig.breathingSpeed;
      const targetBreathingAmount = stateConfig.breathingAmount;
      const targetRadiusNoise = stateConfig.radiusNoise;
      const targetGlowIntensity = stateConfig.glowIntensity;
      
      // Smooth interpolation using damp for all numeric values
      current.flowSpeed = THREE.MathUtils.damp(current.flowSpeed, targetFlowSpeed, lambda, clampedDelta);
      current.flowStrength = THREE.MathUtils.damp(current.flowStrength, targetFlowStrength, lambda, clampedDelta);
      current.rimIntensity = THREE.MathUtils.damp(current.rimIntensity, targetRimIntensity, lambda, clampedDelta);
      current.hotSpotIntensity = THREE.MathUtils.damp(current.hotSpotIntensity, targetHotSpotIntensity, lambda, clampedDelta);
      current.breathingSpeed = THREE.MathUtils.damp(current.breathingSpeed, targetBreathingSpeed, lambda, clampedDelta);
      current.breathingAmount = THREE.MathUtils.damp(current.breathingAmount, targetBreathingAmount, lambda, clampedDelta);
      current.radiusNoise = THREE.MathUtils.damp(current.radiusNoise, targetRadiusNoise, lambda, clampedDelta);
      current.glowIntensity = THREE.MathUtils.damp(current.glowIntensity, targetGlowIntensity, lambda, clampedDelta);
      
      // Core retraction for thinking state
      const targetRetraction = stateConfig.coreRetraction * thinkingRetraction / 0.25;
      current.coreRetraction = THREE.MathUtils.damp(current.coreRetraction, targetRetraction, lambda, clampedDelta);
      
      u.uFlowSpeed.value = current.flowSpeed;
      u.uFlowStrength.value = current.flowStrength;
      u.uRimIntensity.value = current.rimIntensity;
      u.uHotSpotIntensity.value = current.hotSpotIntensity;
      u.uBreathingSpeed.value = current.breathingSpeed;
      u.uBreathingAmount.value = current.breathingAmount;
      u.uRadiusNoise.value = current.radiusNoise;
      u.uGlowIntensity.value = current.glowIntensity;
      u.uCoreRetraction.value = current.coreRetraction;
      
      // Audio reactive mode - smooth transition instead of instant
      const targetAudioReactive = stateConfig.audioReactive ? 1.0 : 0.0;
      u.uAudioReactive.value = THREE.MathUtils.damp(u.uAudioReactive.value, targetAudioReactive, lambda * 2, clampedDelta);
      
      // Enhanced audio breathing during speaking state (smooth)
      const targetBreathing = stateConfig.audioReactive 
        ? audioBreathingIntensity + audioLevel * 0.12 
        : audioBreathingIntensity;
      u.uAudioBreathing.value = THREE.MathUtils.damp(u.uAudioBreathing.value, targetBreathing, lambda * 3, clampedDelta);
    } else {
      // Manual mode - use prop values directly (no state config at all)
      u.uFlowStrength.value = flowStrength;
      u.uFlowSpeed.value = flowSpeed;
      u.uBreathingSpeed.value = breathingSpeed;
      u.uBreathingAmount.value = breathingAmount;
      u.uRadiusNoise.value = radiusNoise;
      u.uRimIntensity.value = rimIntensity;
      u.uHotSpotIntensity.value = hotSpotIntensity;
      u.uGlowIntensity.value = glowIntensity;
      u.uCoreRetraction.value = 0;
      u.uAudioReactive.value = 0;
      u.uAudioBreathing.value = audioBreathingIntensity;
      
      u.uColorStart.value.set(colorStart);
      u.uColorMid.value.set(colorMid);
      u.uColorEnd.value.set(colorEnd);
    }
    
    // Always use prop values for these
    u.uParticleSize.value = particleSize;
    u.uPointSizePx.value = particleSize * 50; // Update point size when particleSize changes
    u.uDepthFade.value = depthFade;
    u.uCoreGlow.value = coreGlow;
    
    // Pixel-stable rendering - update every frame
    u.uPixelRatio.value = pixelRatio;
    u.uResolution.value.set(containerWidth, containerHeight);
    
    // Solid surface values
    u.uSolidSurface.value = solidSurface ? 1.0 : 0.0;
    u.uSurfaceBlend.value = surfaceBlend;
    u.uUniformSize.value = uniformSize;
    u.uCoherence.value = coherence;

    // Slow rotation with audio boost
    const audioBoost = state === 'speaking' ? 1 + audioLevel * 0.5 : 1;
    pointsRef.current.rotation.y += delta * rotationSpeed * 0.3 * audioBoost;
    
    // Subtle tilt variation
    pointsRef.current.rotation.x = Math.sin(u.uTime.value * 0.1) * 0.05;

    // Audio-reactive scale
    const audioScale = 1 + audioLevel * 0.1;
    pointsRef.current.scale.setScalar(audioScale);
  });

  return (
    <points key={`nebula-flow-${particleCount}-${density}-${bandCount}-${solidSurface}`} ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attrs.position, 3]} />
        <bufferAttribute attach="attributes-spherePos" args={[attrs.spherePos, 3]} />
        <bufferAttribute attach="attributes-bandIndex" args={[attrs.bandIndex, 1]} />
        <bufferAttribute attach="attributes-flowOffset" args={[attrs.flowOffset, 1]} />
        <bufferAttribute attach="attributes-randomSeed" args={[attrs.randomSeed, 1]} />
      </bufferGeometry>

      <shaderMaterial
        ref={materialRef}
        vertexShader={nebulaFlowVertexShader}
        fragmentShader={nebulaFlowFragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
});

NebulaFlowSystem.displayName = 'NebulaFlowSystem';
