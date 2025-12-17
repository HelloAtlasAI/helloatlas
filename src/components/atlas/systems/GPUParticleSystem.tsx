import { useRef, useMemo, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WakeWordState } from '@/hooks/useWakeWord';
import { gpuParticleVertexShader, gpuParticleFragmentShader } from '../shaders/particleShaders';
import { STATE_CONFIGS } from '../utils/stateConfigs';
import { generateCircleTexture } from '../utils/textureGenerators';

interface GPUParticleSystemProps {
  state: WakeWordState;
  audioLevel: number;
  morphProgress: number;
  particleCount?: number;
  particleSize?: number;
  density?: number;
  rotationSpeed?: number;
  morphSpeed?: number;
  enableTurbulence?: boolean;
  turbulenceFrequency?: number;
  turbulenceAmplitude?: number;
  turbulenceSpeed?: number;
  enableMouseInteraction?: boolean;
  mouseMode?: 'attract' | 'repulse';
  mouseStrength?: number;
  mouseInfluenceRadius?: number;
  fluidCohesion?: number;
  surfaceTension?: number;
  fluidFlow?: number;
  audioReactivitySpeed?: number;
  mousePosition: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
}

export const GPUParticleSystem = memo(({
  state,
  audioLevel,
  morphProgress,
  particleCount = 5000,
  particleSize = 0.08,
  density = 1.0,
  rotationSpeed = 0.5,
  morphSpeed = 1.5,
  enableTurbulence = true,
  turbulenceFrequency = 0.5,
  turbulenceAmplitude = 0.08,
  turbulenceSpeed = 0.3,
  enableMouseInteraction = true,
  mouseMode = 'attract',
  mouseStrength = 0.5,
  mouseInfluenceRadius = 2.5,
  fluidCohesion = 0,
  surfaceTension = 0.5,
  fluidFlow = 0.3,
  audioReactivitySpeed = 1.0,
  mousePosition
}: GPUParticleSystemProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const currentMorphRef = useRef(morphProgress);
  
  const config = STATE_CONFIGS[state];
  const circleTexture = useMemo(() => generateCircleTexture(), []);

  // Create geometry with all attributes for GPU calculations
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
      
      const sphereR = (1.8 * density) + (Math.random() - 0.5) * 0.4 * density;
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

  // Shader material with all uniforms
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: gpuParticleVertexShader,
      fragmentShader: gpuParticleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: morphProgress },
        uAudioLevel: { value: 0 },
        uAudioMultiplier: { value: 1.0 },
        uAudioReactivitySpeed: { value: audioReactivitySpeed },
        uParticleSize: { value: particleSize },
        uDensity: { value: density },
        uFluidCohesion: { value: fluidCohesion },
        uSurfaceTension: { value: surfaceTension },
        uFluidFlow: { value: fluidFlow },
        uTurbulenceFrequency: { value: turbulenceFrequency },
        uTurbulenceAmplitude: { value: turbulenceAmplitude },
        uTurbulenceSpeed: { value: turbulenceSpeed },
        uEnableTurbulence: { value: enableTurbulence ? 1.0 : 0.0 },
        uMousePos: { value: new THREE.Vector3(0, 0, 0) },
        uMouseActive: { value: 0.0 },
        uMouseStrength: { value: mouseStrength },
        uMouseRadius: { value: mouseInfluenceRadius },
        uMouseMode: { value: mouseMode === 'attract' ? 1.0 : -1.0 },
        uColor: { value: config.primary.clone() },
        uTexture: { value: circleTexture },
        uOpacity: { value: 0.85 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      alphaTest: 0.01
    });
  }, []);

  const targetMorph = morphProgress;

  // Animation loop - only updates uniforms
  useFrame((_, delta) => {
    if (!materialRef.current) return;
    
    const uniforms = materialRef.current.uniforms;
    
    uniforms.uTime.value += delta;
    
    currentMorphRef.current = THREE.MathUtils.lerp(
      currentMorphRef.current,
      targetMorph,
      delta * morphSpeed * 2
    );
    uniforms.uMorphProgress.value = currentMorphRef.current;
    
    uniforms.uAudioLevel.value = audioLevel;
    uniforms.uAudioMultiplier.value = state === 'speaking' ? 2.5 : (state === 'thinking' ? 1.5 : 1.0);
    uniforms.uAudioReactivitySpeed.value = audioReactivitySpeed;
    
    uniforms.uFluidCohesion.value = fluidCohesion;
    uniforms.uSurfaceTension.value = surfaceTension;
    uniforms.uFluidFlow.value = fluidFlow;
    
    uniforms.uEnableTurbulence.value = enableTurbulence ? 1.0 : 0.0;
    uniforms.uTurbulenceFrequency.value = turbulenceFrequency;
    uniforms.uTurbulenceAmplitude.value = turbulenceAmplitude;
    uniforms.uTurbulenceSpeed.value = turbulenceSpeed;
    
    if (enableMouseInteraction && mousePosition.current.active) {
      uniforms.uMousePos.value.set(
        mousePosition.current.x * 4,
        mousePosition.current.y * 4,
        0
      );
      uniforms.uMouseActive.value = 1.0;
    } else {
      uniforms.uMouseActive.value = 0.0;
    }
    uniforms.uMouseStrength.value = mouseStrength;
    uniforms.uMouseRadius.value = mouseInfluenceRadius;
    uniforms.uMouseMode.value = mouseMode === 'attract' ? 1.0 : -1.0;
    
    uniforms.uColor.value.lerp(config.primary, 0.08);
    uniforms.uParticleSize.value = particleSize;
    
    if (pointsRef.current) {
      const time = uniforms.uTime.value;
      const audioRotationBoost = state === 'speaking' ? 1 + audioLevel * 2 : 1;
      pointsRef.current.rotation.y += delta * rotationSpeed * 0.3 * audioRotationBoost;
      pointsRef.current.rotation.x += delta * rotationSpeed * 0.05 * audioRotationBoost;
      
      // Breathing animation
      const breathingSpeed = state === 'dormant' ? 0.8 : 
                            state === 'listening' ? 1.2 : 
                            state === 'speaking' ? 1.5 : 1.0;
      
      const breathe1 = Math.sin(time * breathingSpeed) * 0.03;
      const breathe2 = Math.sin(time * breathingSpeed * 0.7 + 0.5) * 0.015;
      const breathe3 = Math.sin(time * 3.5) * 0.005;
      
      const breathingScale = 1 + breathe1 + breathe2 + breathe3;
      const audioScaleMultiplier = state === 'speaking' ? 0.4 : 0.15;
      const audioScale = 1 + audioLevel * audioScaleMultiplier;
      
      pointsRef.current.scale.setScalar(breathingScale * audioScale);
      
      // Position bobbing
      pointsRef.current.position.y = Math.sin(time * 0.5) * 0.03;
      pointsRef.current.position.x = Math.sin(time * 0.3) * 0.015;
      pointsRef.current.position.z = Math.cos(time * 0.4) * 0.01;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
});

GPUParticleSystem.displayName = 'GPUParticleSystem';
