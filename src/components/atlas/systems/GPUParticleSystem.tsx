import { useRef, useMemo, memo, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WakeWordState } from '@/hooks/useWakeWord';
import { gpuParticleVertexShader, gpuParticleFragmentShader } from '../shaders/particleShaders';
import { STATE_CONFIGS } from '../utils/stateConfigs';

interface GPUParticleSystemProps {
  state: WakeWordState;
  audioLevelRef: MutableRefObject<number>;
  morphProgress: number;
  particleCount?: number;
  particleSize?: number;
  density?: number;
  rotationSpeed?: number;
  enableTurbulence?: boolean;
  turbulenceAmplitude?: number;
  turbulenceFrequency?: number;
  turbulenceSpeed?: number;
  enableMouseInteraction?: boolean;
  mouseMode?: 'attract' | 'repulse';
  mouseStrength?: number;
  mouseInfluenceRadius?: number;
  mousePosition: MutableRefObject<{ x: number; y: number; active: boolean }>;
  fluidCohesion?: number;
  surfaceTension?: number;
  fluidFlow?: number;
}

export const GPUParticleSystem = memo(({
  state,
  audioLevelRef,
  morphProgress,
  particleCount = 2000,
  particleSize = 0.08,
  density = 1.0,
  rotationSpeed = 0.5,
  enableTurbulence = true,
  turbulenceAmplitude = 0.08,
  turbulenceFrequency = 0.5,
  turbulenceSpeed = 0.3,
  enableMouseInteraction = true,
  mouseMode = 'attract',
  mouseStrength = 0.5,
  mouseInfluenceRadius = 2.5,
  mousePosition,
  fluidCohesion = 0,
  surfaceTension = 0.5,
  fluidFlow = 0.3,
}: GPUParticleSystemProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const frameCount = useRef(0);

  const config = STATE_CONFIGS[state];

  // Generate attribute arrays; remount points when count/density changes.
  const attrs = useMemo(() => {
    const count = particleCount;

    const spherePos = new Float32Array(count * 3);
    const scatteredPos = new Float32Array(count * 3);
    const particleOffset = new Float32Array(count);
    const randomSeed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const sphereR = 1.8 * density + (Math.random() - 0.5) * 0.4;
      spherePos[i3] = sphereR * Math.sin(phi) * Math.cos(theta);
      spherePos[i3 + 1] = sphereR * Math.sin(phi) * Math.sin(theta);
      spherePos[i3 + 2] = sphereR * Math.cos(phi);

      const scatterR = (3 + Math.random() * 3) * density;
      scatteredPos[i3] = scatterR * Math.sin(phi) * Math.cos(theta);
      scatteredPos[i3 + 1] = scatterR * Math.sin(phi) * Math.sin(theta);
      scatteredPos[i3 + 2] = scatterR * Math.cos(phi);

      particleOffset[i] = Math.random() * 0.4;
      randomSeed[i] = Math.random();
    }

    // Keep a separate copy for the actual draw position.
    const position = spherePos.slice();

    return {
      position,
      spherePos,
      scatteredPos,
      particleOffset,
      randomSeed,
    };
  }, [particleCount, density]);

  // Stable uniforms object; values are updated in the frame loop.
  const uniforms = useMemo(() => {
    const initialConfig = STATE_CONFIGS[state];

    return {
      uTime: { value: 0 },
      uMorphProgress: { value: morphProgress },
      uAudioLevel: { value: 0 },
      uAudioMultiplier: { value: 1.0 },
      uParticleSize: { value: particleSize },
      uDensity: { value: density },
      uTurbulenceAmplitude: { value: turbulenceAmplitude },
      uTurbulenceFrequency: { value: turbulenceFrequency },
      uTurbulenceSpeed: { value: turbulenceSpeed },
      uEnableTurbulence: { value: enableTurbulence ? 1.0 : 0.0 },
      uMousePos: { value: new THREE.Vector3(0, 0, 0) },
      uMouseActive: { value: 0.0 },
      uMouseStrength: { value: mouseStrength },
      uMouseRadius: { value: mouseInfluenceRadius },
      uMouseMode: { value: mouseMode === 'attract' ? 1.0 : -1.0 },
      uColor: { value: initialConfig.primary.clone() },
      uOpacity: { value: 0.85 },
      uFluidCohesion: { value: fluidCohesion },
      uSurfaceTension: { value: surfaceTension },
      uFluidFlow: { value: fluidFlow },
    };
    // Intentionally initialize once for performance; runtime updates happen in useFrame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optimized animation - reads audioLevel from ref (no re-renders)
  useFrame((_, delta) => {
    if (!materialRef.current || !pointsRef.current) return;

    frameCount.current++;
    const u = materialRef.current.uniforms;
    const audioLevel = audioLevelRef?.current ?? 0;

    // Always update time and morph
    u.uTime.value += delta;
    u.uMorphProgress.value = THREE.MathUtils.lerp(u.uMorphProgress.value, morphProgress, delta * 3);
    u.uAudioLevel.value = audioLevel;
    u.uAudioMultiplier.value = state === 'speaking' ? 2.0 : 1.0;

    // Update prop-driven uniforms dynamically
    u.uParticleSize.value = particleSize;
    u.uDensity.value = density;
    u.uTurbulenceAmplitude.value = turbulenceAmplitude;
    u.uTurbulenceFrequency.value = turbulenceFrequency;
    u.uTurbulenceSpeed.value = turbulenceSpeed;
    u.uEnableTurbulence.value = enableTurbulence ? 1.0 : 0.0;
    u.uMouseStrength.value = mouseStrength;
    u.uMouseRadius.value = mouseInfluenceRadius;
    u.uMouseMode.value = mouseMode === 'attract' ? 1.0 : -1.0;
    u.uFluidCohesion.value = fluidCohesion;
    u.uSurfaceTension.value = surfaceTension;
    u.uFluidFlow.value = fluidFlow;

    // Mouse - update every frame when active
    if (enableMouseInteraction && mousePosition?.current?.active) {
      u.uMousePos.value.set(mousePosition.current.x * 4, mousePosition.current.y * 4, 0);
      u.uMouseActive.value = 1.0;
    } else {
      u.uMouseActive.value = 0.0;
    }

    // Color lerp - every 3 frames
    if (frameCount.current % 3 === 0) {
      u.uColor.value.lerp(config.primary, 0.15);
    }

    // Rotation and scale
    const audioBoost = state === 'speaking' ? 1 + audioLevel : 1;
    pointsRef.current.rotation.y += delta * rotationSpeed * 0.3 * audioBoost;

    // Simple breathing
    const breathe = Math.sin(u.uTime.value * 0.8) * 0.02;
    const audioScale = 1 + audioLevel * 0.15;
    pointsRef.current.scale.setScalar((1 + breathe) * audioScale);
  });

  return (
    <points key={`gpu-particles-${particleCount}-${density}`} ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attrs.position, 3]} />
        <bufferAttribute attach="attributes-spherePos" args={[attrs.spherePos, 3]} />
        <bufferAttribute attach="attributes-scatteredPos" args={[attrs.scatteredPos, 3]} />
        <bufferAttribute attach="attributes-particleOffset" args={[attrs.particleOffset, 1]} />
        <bufferAttribute attach="attributes-randomSeed" args={[attrs.randomSeed, 1]} />
      </bufferGeometry>

      <shaderMaterial
        ref={materialRef}
        vertexShader={gpuParticleVertexShader}
        fragmentShader={gpuParticleFragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
});

GPUParticleSystem.displayName = 'GPUParticleSystem';

