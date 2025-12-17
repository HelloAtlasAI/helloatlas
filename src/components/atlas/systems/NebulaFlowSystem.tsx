import { useRef, useMemo, memo, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WakeWordState } from '@/hooks/useWakeWord';
import { nebulaFlowVertexShader, nebulaFlowFragmentShader } from '../shaders/nebulaFlowShaders';

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
}

export const NebulaFlowSystem = memo(({
  state,
  audioLevelRef,
  morphProgress,
  particleCount = 3000,
  particleSize = 0.06,
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
}: NebulaFlowSystemProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Generate particle attributes with flow bands
  const attrs = useMemo(() => {
    const count = particleCount;

    const spherePos = new Float32Array(count * 3);
    const bandIndex = new Float32Array(count);
    const flowOffset = new Float32Array(count);
    const randomSeed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Distribute particles in bands around the sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Assign to a band based on phi (latitude)
      const band = Math.floor((phi / Math.PI) * bandCount);
      bandIndex[i] = band / bandCount;
      
      // Radius with slight variation for shell thickness
      const r = (1.8 + (Math.random() - 0.5) * 0.3) * density;
      
      spherePos[i3] = r * Math.sin(phi) * Math.cos(theta);
      spherePos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      spherePos[i3 + 2] = r * Math.cos(phi);
      
      // Flow offset for variation within bands
      flowOffset[i] = Math.random();
      randomSeed[i] = Math.random();
    }

    const position = spherePos.slice();

    return {
      position,
      spherePos,
      bandIndex,
      flowOffset,
      randomSeed,
    };
  }, [particleCount, density, bandCount]);

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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animation loop
  useFrame((_, delta) => {
    if (!materialRef.current || !pointsRef.current) return;

    const u = materialRef.current.uniforms;
    const audioLevel = audioLevelRef?.current ?? 0;

    // Update time
    u.uTime.value += delta;
    
    // Update uniforms from props
    u.uMorphProgress.value = THREE.MathUtils.lerp(u.uMorphProgress.value, morphProgress, delta * 3);
    u.uAudioLevel.value = audioLevel;
    u.uParticleSize.value = particleSize;
    u.uFlowStrength.value = flowStrength;
    u.uFlowSpeed.value = flowSpeed;
    u.uBreathingSpeed.value = breathingSpeed;
    u.uBreathingAmount.value = breathingAmount;
    u.uRadiusNoise.value = radiusNoise;
    u.uRimIntensity.value = rimIntensity;
    u.uHotSpotIntensity.value = hotSpotIntensity;
    
    // Update colors
    u.uColorStart.value.set(colorStart);
    u.uColorMid.value.set(colorMid);
    u.uColorEnd.value.set(colorEnd);

    // Slow rotation
    const audioBoost = state === 'speaking' ? 1 + audioLevel : 1;
    pointsRef.current.rotation.y += delta * rotationSpeed * 0.3 * audioBoost;
    
    // Subtle tilt variation
    pointsRef.current.rotation.x = Math.sin(u.uTime.value * 0.1) * 0.05;

    // Audio-reactive scale
    const audioScale = 1 + audioLevel * 0.1;
    pointsRef.current.scale.setScalar(audioScale);
  });

  return (
    <points key={`nebula-flow-${particleCount}-${density}-${bandCount}`} ref={pointsRef}>
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
