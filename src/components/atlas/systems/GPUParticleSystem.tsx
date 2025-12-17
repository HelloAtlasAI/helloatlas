import { useRef, useMemo, memo, useEffect, MutableRefObject } from 'react';
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
  enableMouseInteraction?: boolean;
  mouseMode?: 'attract' | 'repulse';
  mouseStrength?: number;
  mouseInfluenceRadius?: number;
  mousePosition: MutableRefObject<{ x: number; y: number; active: boolean }>;
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
  enableMouseInteraction = true,
  mouseMode = 'attract',
  mouseStrength = 0.5,
  mouseInfluenceRadius = 2.5,
  mousePosition
}: GPUParticleSystemProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const frameCount = useRef(0);
  
  const config = STATE_CONFIGS[state];

  // Create geometry - only recreate on significant changes
  const geometry = useMemo(() => {
    const count = particleCount;
    const spherePos = new Float32Array(count * 3);
    const scatteredPos = new Float32Array(count * 3);
    const particleOffset = new Float32Array(count);
    const randomSeed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const sphereR = (1.8 * density) + (Math.random() - 0.5) * 0.4;
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

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(spherePos.slice(), 3));
    geo.setAttribute('spherePos', new THREE.BufferAttribute(spherePos, 3));
    geo.setAttribute('scatteredPos', new THREE.BufferAttribute(scatteredPos, 3));
    geo.setAttribute('particleOffset', new THREE.BufferAttribute(particleOffset, 1));
    geo.setAttribute('randomSeed', new THREE.BufferAttribute(randomSeed, 1));
    
    return geo;
  }, [particleCount, density]);

  // Cleanup geometry on unmount or change
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  // Shader material - create once, update uniforms in frame loop
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: gpuParticleVertexShader,
      fragmentShader: gpuParticleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: morphProgress },
        uAudioLevel: { value: 0 },
        uAudioMultiplier: { value: 1.0 },
        uParticleSize: { value: particleSize },
        uDensity: { value: density },
        uTurbulenceAmplitude: { value: turbulenceAmplitude },
        uEnableTurbulence: { value: enableTurbulence ? 1.0 : 0.0 },
        uMousePos: { value: new THREE.Vector3(0, 0, 0) },
        uMouseActive: { value: 0.0 },
        uMouseStrength: { value: mouseStrength },
        uMouseRadius: { value: mouseInfluenceRadius },
        uMouseMode: { value: mouseMode === 'attract' ? 1.0 : -1.0 },
        uColor: { value: config.primary.clone() },
        uOpacity: { value: 0.85 }
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

  // Optimized animation - reads audioLevel from ref (no re-renders)
  useFrame((_, delta) => {
    if (!materialRef.current || !pointsRef.current) return;
    
    frameCount.current++;
    const uniforms = materialRef.current.uniforms;
    const audioLevel = audioLevelRef?.current ?? 0;
    
    // Always update time and morph
    uniforms.uTime.value += delta;
    uniforms.uMorphProgress.value = THREE.MathUtils.lerp(
      uniforms.uMorphProgress.value,
      morphProgress,
      delta * 3
    );
    uniforms.uAudioLevel.value = audioLevel;
    uniforms.uAudioMultiplier.value = state === 'speaking' ? 2.0 : 1.0;
    
    // Update prop-driven uniforms dynamically
    uniforms.uParticleSize.value = particleSize;
    uniforms.uDensity.value = density;
    uniforms.uTurbulenceAmplitude.value = turbulenceAmplitude;
    uniforms.uEnableTurbulence.value = enableTurbulence ? 1.0 : 0.0;
    uniforms.uMouseStrength.value = mouseStrength;
    uniforms.uMouseRadius.value = mouseInfluenceRadius;
    uniforms.uMouseMode.value = mouseMode === 'attract' ? 1.0 : -1.0;
    
    // Mouse - update every frame when active
    if (enableMouseInteraction && mousePosition?.current?.active) {
      uniforms.uMousePos.value.set(
        mousePosition.current.x * 4,
        mousePosition.current.y * 4,
        0
      );
      uniforms.uMouseActive.value = 1.0;
    } else {
      uniforms.uMouseActive.value = 0.0;
    }
    
    // Color lerp - every 3 frames
    if (frameCount.current % 3 === 0) {
      uniforms.uColor.value.lerp(config.primary, 0.15);
    }
    
    // Rotation and scale
    const audioBoost = state === 'speaking' ? 1 + audioLevel : 1;
    pointsRef.current.rotation.y += delta * rotationSpeed * 0.3 * audioBoost;
    
    // Simple breathing
    const breathe = Math.sin(uniforms.uTime.value * 0.8) * 0.02;
    const audioScale = 1 + audioLevel * 0.15;
    pointsRef.current.scale.setScalar((1 + breathe) * audioScale);
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
});

GPUParticleSystem.displayName = 'GPUParticleSystem';
