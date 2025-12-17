import { useRef, useMemo, memo, useEffect, MutableRefObject } from 'react';
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

  // Create geometry
  const geometry = useMemo(() => {
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

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(spherePos.slice(), 3));
    geo.setAttribute('spherePos', new THREE.BufferAttribute(spherePos, 3));
    geo.setAttribute('scatteredPos', new THREE.BufferAttribute(scatteredPos, 3));
    geo.setAttribute('particleOffset', new THREE.BufferAttribute(particleOffset, 1));
    
    return geo;
  }, [coreParticleCount, coreDensity]);

  // Cleanup geometry on unmount or change
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  // Shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: gpuCoreVertexShader,
      fragmentShader: gpuCoreFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: morphProgress },
        uAudioLevel: { value: 0 },
        uPulseSpeed: { value: corePulseSpeed },
        uCoreColor: { value: config.core.clone() },
        uCoreSize: { value: coreParticleSize },
        uOpacity: { value: 0.7 * coreIntensity },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // Cleanup material on unmount
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame((_, delta) => {
    if (!materialRef.current || !pointsRef.current) return;
    
    frameCount.current++;
    const uniforms = materialRef.current.uniforms;
    const audioLevel = audioLevelRef?.current ?? 0;
    
    uniforms.uTime.value += delta;
    uniforms.uMorphProgress.value = THREE.MathUtils.lerp(
      uniforms.uMorphProgress.value,
      morphProgress,
      delta * 3
    );
    uniforms.uAudioLevel.value = audioLevel;
    uniforms.uPulseSpeed.value = corePulseSpeed;
    uniforms.uCoreSize.value = coreParticleSize;
    uniforms.uOpacity.value = (0.6 + audioLevel * 0.3) * coreIntensity;
    
    // Color lerp - every 3 frames
    if (frameCount.current % 3 === 0) {
      uniforms.uCoreColor.value.lerp(config.core, 0.15);
    }
    
    // Rotation
    pointsRef.current.rotation.y += delta * coreRotationOffset;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
});

GPUCoreSystem.displayName = 'GPUCoreSystem';
