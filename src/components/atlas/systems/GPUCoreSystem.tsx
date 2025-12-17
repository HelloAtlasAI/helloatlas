import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WakeWordState } from '@/hooks/useWakeWord';
import { gpuCoreVertexShader, gpuCoreFragmentShader } from '../shaders/particleShaders';
import { STATE_CONFIGS } from '../utils/stateConfigs';

interface GPUCoreSystemProps {
  state: WakeWordState;
  audioLevel: number;
  morphProgress: number;
  coreParticleCount?: number;
  coreDensity?: number;
  coreParticleSize?: number;
  coreIntensity?: number;
  corePulseSpeed?: number;
  coreRotationOffset?: number;
  fluidCohesion?: number;
  surfaceTension?: number;
  fluidFlow?: number;
}

/**
 * GPU-accelerated core particle system
 * All calculations happen in the vertex shader
 */
export const GPUCoreSystem = memo(({
  state,
  audioLevel,
  morphProgress,
  coreParticleCount = 400,
  coreDensity = 0.25,
  coreParticleSize = 0.04,
  coreIntensity = 1.2,
  corePulseSpeed = 1.5,
  coreRotationOffset = -0.5,
  fluidCohesion = 0,
  surfaceTension = 0.5,
  fluidFlow = 0.3,
}: GPUCoreSystemProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const currentMorphRef = useRef(morphProgress);
  
  const config = STATE_CONFIGS[state];

  // Create geometry with attributes for GPU
  const geometry = useMemo(() => {
    const count = coreParticleCount;
    const spherePos = new Float32Array(count * 3);
    const scatteredPos = new Float32Array(count * 3);
    const particleOffset = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Sphere state - dense core with exponential distribution
      const baseR = Math.pow(Math.random(), 0.5);
      const sphereR = baseR * coreDensity * 1.5;
      
      spherePos[i3] = sphereR * Math.sin(phi) * Math.cos(theta);
      spherePos[i3 + 1] = sphereR * Math.sin(phi) * Math.sin(theta);
      spherePos[i3 + 2] = sphereR * Math.cos(phi);
      
      // Scattered state
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

  // Shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: gpuCoreVertexShader,
      fragmentShader: gpuCoreFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: morphProgress },
        uAudioLevel: { value: 0 },
        uCoreDensity: { value: coreDensity },
        uPulseSpeed: { value: corePulseSpeed },
        uFluidCohesion: { value: fluidCohesion },
        uSurfaceTension: { value: surfaceTension },
        uFluidFlow: { value: fluidFlow },
        uCoreColor: { value: config.core.clone() },
        uCoreSize: { value: coreParticleSize },
        uOpacity: { value: 0.7 * coreIntensity },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((_, delta) => {
    if (!materialRef.current || !pointsRef.current) return;
    
    const uniforms = materialRef.current.uniforms;
    
    uniforms.uTime.value += delta;
    
    // Smooth morph interpolation
    currentMorphRef.current = THREE.MathUtils.lerp(
      currentMorphRef.current,
      morphProgress,
      delta * 3
    );
    uniforms.uMorphProgress.value = currentMorphRef.current;
    
    uniforms.uAudioLevel.value = audioLevel;
    uniforms.uFluidCohesion.value = fluidCohesion;
    uniforms.uSurfaceTension.value = surfaceTension;
    uniforms.uFluidFlow.value = fluidFlow;
    uniforms.uPulseSpeed.value = corePulseSpeed;
    uniforms.uCoreSize.value = coreParticleSize;
    uniforms.uOpacity.value = (0.6 + audioLevel * 0.3) * coreIntensity;
    
    // Color lerp
    uniforms.uCoreColor.value.lerp(config.core, 0.1);
    
    // Counter-rotate core
    pointsRef.current.rotation.y += delta * coreRotationOffset;
    pointsRef.current.rotation.z += delta * 0.1;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
});

GPUCoreSystem.displayName = 'GPUCoreSystem';
