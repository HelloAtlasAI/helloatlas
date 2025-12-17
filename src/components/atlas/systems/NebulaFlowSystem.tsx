import { useRef, useMemo, memo, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WakeWordState } from '@/hooks/useWakeWord';
import { nebulaFlowVertexShader, nebulaFlowFragmentShader } from '../shaders/nebulaFlowShaders';
import { NEBULA_STATE_CONFIGS } from '../utils/nebulaStateConfigs';

interface NebulaFlowSystemProps {
  state: WakeWordState;
  audioLevelRef: MutableRefObject<number>;
  morphProgress: number;
  particleCount?: number;
  particleSize?: number;
  density?: number;
  rotationSpeed?: number;
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
}

export const NebulaFlowSystem = memo(({
  state,
  audioLevelRef,
  morphProgress,
  particleCount = 8000,
  particleSize = 0.05,
  density = 1.0,
  rotationSpeed = 0.2,
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
    const stateConfig = NEBULA_STATE_CONFIGS[state];
    
    // Exponential easing for smoother transitions
    const baseLerpSpeed = transitionSpeed;
    const smoothLerpSpeed = 1 - Math.pow(1 - Math.min(baseLerpSpeed * delta, 0.99), 2);

    // Update time
    u.uTime.value += delta;
    
    // Update morph progress
    u.uMorphProgress.value = THREE.MathUtils.lerp(u.uMorphProgress.value, morphProgress, delta * 3);
    u.uAudioLevel.value = audioLevel;
    
    // State-reactive interpolation
    if (stateReactive && stateConfig) {
      const current = currentStateRef.current;
      const targets = targetColorsRef.current;
      
      // Set target colors (reuse objects, no allocation)
      targets.start.set(stateConfig.colorStart);
      targets.mid.set(stateConfig.colorMid);
      targets.end.set(stateConfig.colorEnd);
      
      // Interpolate colors toward cached targets
      current.colorStart.lerp(targets.start, smoothLerpSpeed);
      current.colorMid.lerp(targets.mid, smoothLerpSpeed);
      current.colorEnd.lerp(targets.end, smoothLerpSpeed);
      
      u.uColorStart.value.copy(current.colorStart);
      u.uColorMid.value.copy(current.colorMid);
      u.uColorEnd.value.copy(current.colorEnd);
      
      // Interpolate other state values with damping for large changes
      const lerpValue = (currentVal: number, targetVal: number) => {
        const diff = Math.abs(targetVal - currentVal);
        const dampedSpeed = diff > 0.5 ? smoothLerpSpeed * 0.5 : smoothLerpSpeed;
        return THREE.MathUtils.lerp(currentVal, targetVal, dampedSpeed);
      };
      
      current.flowSpeed = lerpValue(current.flowSpeed, stateConfig.flowSpeed);
      current.flowStrength = lerpValue(current.flowStrength, stateConfig.flowStrength);
      current.rimIntensity = lerpValue(current.rimIntensity, stateConfig.rimIntensity);
      current.hotSpotIntensity = lerpValue(current.hotSpotIntensity, stateConfig.hotSpotIntensity);
      current.breathingSpeed = lerpValue(current.breathingSpeed, stateConfig.breathingSpeed);
      current.breathingAmount = lerpValue(current.breathingAmount, stateConfig.breathingAmount);
      current.radiusNoise = lerpValue(current.radiusNoise, stateConfig.radiusNoise);
      current.glowIntensity = lerpValue(current.glowIntensity, stateConfig.glowIntensity);
      
      // Core retraction for thinking state
      const targetRetraction = stateConfig.coreRetraction * thinkingRetraction / 0.25; // Scale by user setting
      current.coreRetraction = lerpValue(current.coreRetraction, targetRetraction);
      
      u.uFlowSpeed.value = current.flowSpeed;
      u.uFlowStrength.value = current.flowStrength;
      u.uRimIntensity.value = current.rimIntensity;
      u.uHotSpotIntensity.value = current.hotSpotIntensity;
      u.uBreathingSpeed.value = current.breathingSpeed;
      u.uBreathingAmount.value = current.breathingAmount;
      u.uRadiusNoise.value = current.radiusNoise;
      u.uGlowIntensity.value = current.glowIntensity;
      u.uCoreRetraction.value = current.coreRetraction;
      
      // Audio reactive mode - instant switch based on state config
      u.uAudioReactive.value = stateConfig.audioReactive ? 1.0 : 0.0;
      
      // Enhanced audio breathing during speaking state
      if (stateConfig.audioReactive) {
        u.uAudioBreathing.value = audioBreathingIntensity + audioLevel * 0.12;
      } else {
        u.uAudioBreathing.value = audioBreathingIntensity;
      }
    } else {
      // Manual mode - use prop values directly
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
    u.uDepthFade.value = depthFade;
    u.uCoreGlow.value = coreGlow;
    
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
