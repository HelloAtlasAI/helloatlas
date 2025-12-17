import { useRef, useMemo, memo, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WakeWordState } from '@/hooks/useWakeWord';
import { gpuCoreVertexShader, gpuCoreFragmentShader } from '../shaders/particleShaders';
import { STATE_CONFIGS } from '../utils/stateConfigs';

interface GPUCoreSystemProps {
  state: WakeWordState;
  audioLevelRef: MutableRefObject<number>;
  morphProgress: number;
  coreParticleCount?: number;
  coreDensity?: number;
  coreParticleSize?: number;
  coreIntensity?: number;
  corePulseSpeed?: number;
  coreRotationOffset?: number;
}

/**
 * GPU-accelerated core particle system - simplified for performance
 */
export const GPUCoreSystem = memo(({
  state,
  audioLevelRef,
  morphProgress,
  coreParticleCount = 150,
  coreDensity = 0.25,
  coreParticleSize = 0.04,
  coreIntensity = 1.2,
  corePulseSpeed = 1.5,
  coreRotationOffset = -0.5,
}: GPUCoreSystemProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const frameCount = useRef(0);

  const config = STATE_CONFIGS[state];

  const attrs = useMemo(() => {
    const count = coreParticleCount;

    const spherePos = new Float32Array(count * 3);
    const scatteredPos = new Float32Array(count * 3);
    const particleOffset = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const baseR = Math.pow(Math.random(), 0.5);
      const sphereR = baseR * coreDensity * 1.5;

      spherePos[i3] = sphereR * Math.sin(phi) * Math.cos(theta);
      spherePos[i3 + 1] = sphereR * Math.sin(phi) * Math.sin(theta);
      spherePos[i3 + 2] = sphereR * Math.cos(phi);

      const scatterR = (1.5 + Math.random() * 1.5) * coreDensity;
      scatteredPos[i3] = scatterR * Math.sin(phi) * Math.cos(theta);
      scatteredPos[i3 + 1] = scatterR * Math.sin(phi) * Math.sin(theta);
      scatteredPos[i3 + 2] = scatterR * Math.cos(phi);

      particleOffset[i] = Math.random() * 0.4;
    }

    const position = spherePos.slice();

    return { position, spherePos, scatteredPos, particleOffset };
  }, [coreParticleCount, coreDensity]);

  const uniforms = useMemo(() => {
    const initialConfig = STATE_CONFIGS[state];

    return {
      uTime: { value: 0 },
      uMorphProgress: { value: morphProgress },
      uAudioLevel: { value: 0 },
      uPulseSpeed: { value: corePulseSpeed },
      uCoreColor: { value: initialConfig.core.clone() },
      uCoreSize: { value: coreParticleSize },
      uOpacity: { value: 0.7 * coreIntensity },
    };
    // Intentionally initialize once for performance; runtime updates happen in useFrame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    if (!materialRef.current || !pointsRef.current) return;

    frameCount.current++;
    const u = materialRef.current.uniforms;
    const audioLevel = audioLevelRef?.current ?? 0;

    u.uTime.value += delta;
    u.uMorphProgress.value = THREE.MathUtils.lerp(u.uMorphProgress.value, morphProgress, delta * 3);
    u.uAudioLevel.value = audioLevel;
    u.uPulseSpeed.value = corePulseSpeed;
    u.uCoreSize.value = coreParticleSize;
    u.uOpacity.value = (0.6 + audioLevel * 0.3) * coreIntensity;

    // Color lerp - every 3 frames
    if (frameCount.current % 3 === 0) {
      u.uCoreColor.value.lerp(config.core, 0.15);
    }

    // Rotation
    pointsRef.current.rotation.y += delta * coreRotationOffset;
  });

  return (
    <points key={`gpu-core-${coreParticleCount}-${coreDensity}`} ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attrs.position, 3]} />
        <bufferAttribute attach="attributes-spherePos" args={[attrs.spherePos, 3]} />
        <bufferAttribute attach="attributes-scatteredPos" args={[attrs.scatteredPos, 3]} />
        <bufferAttribute attach="attributes-particleOffset" args={[attrs.particleOffset, 1]} />
      </bufferGeometry>

      <shaderMaterial
        ref={materialRef}
        vertexShader={gpuCoreVertexShader}
        fragmentShader={gpuCoreFragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
});

GPUCoreSystem.displayName = 'GPUCoreSystem';

