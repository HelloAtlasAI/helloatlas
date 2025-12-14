import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";
import { ParticlePool } from "../particles/useParticlePool";
import { ParticleTrails } from "../particles/ParticleTrails";
import { DataStreamNetwork } from "../particles/DataStreamNetwork";

interface MorphingSphereDataFlowProps {
  state: AIState;
  audioLevel: number;
  pool?: ParticlePool;
  hudVisible?: boolean;
  particleDensity?: number;
  trailLength?: number;
  morphIntensity?: number;
}

// Core sphere shader with morphing
const coreVertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uMorphStrength;
  uniform float uDensityDivisor;
  
  varying float vDisplacement;
  varying vec3 vNormal;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    
    vec3 pos = position;
    
    // Dynamic morphing based on intensity
    float displacement = sin(pos.x * 5.0 + uTime) * cos(pos.y * 5.0 + uTime * 0.7) * uMorphStrength;
    displacement += uAudioLevel * uMorphStrength * 1.5;
    
    vDisplacement = displacement;
    pos += normal * displacement;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = (0.3 + uAudioLevel * 0.15) * (uDensityDivisor / -mvPosition.z);
  }
`;

const coreFragmentShader = `
  varying float vDisplacement;
  varying vec3 vNormal;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    vec3 core = vec3(0.01, 0.02, 0.08);
    vec3 glow = vec3(0.0, 0.3, 0.5);
    
    float t = vDisplacement * 5.0 + 0.5;
    vec3 color = mix(core, glow, smoothstep(0.3, 0.7, t));
    
    float alpha = (1.0 - smoothstep(0.1, 0.5, dist)) * 0.7;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export const MorphingSphereDataFlow = ({ 
  state, 
  audioLevel, 
  pool, 
  hudVisible,
  particleDensity = 75,
  trailLength = 6,
  morphIntensity = 50,
}: MorphingSphereDataFlowProps) => {
  const coreRef = useRef<THREE.Points>(null);
  const coreMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothAudioRef = useRef(0);
  const rotationRef = useRef(new THREE.Euler());

  // Map morphIntensity (0-100) to morph strength
  const baseMorphStrength = 0.02 + (morphIntensity / 100) * 0.1;
  
  // Map particleDensity (25-100) to divisor
  const densityDivisor = 180 + (particleDensity / 100) * 150;

  const coreGeometry = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(0.5, 9);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(ico.attributes.position.array), 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(ico.attributes.normal.array), 3));
    return geo;
  }, []);

  const coreMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uMorphStrength: { value: baseMorphStrength },
        uDensityDivisor: { value: densityDivisor },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((frameState) => {
    if (!coreMaterialRef.current || !coreRef.current) return;

    const time = frameState.clock.elapsedTime;
    smoothAudioRef.current = THREE.MathUtils.lerp(smoothAudioRef.current, audioLevel, 0.1);

    // State-based modifiers
    let stateMultiplier = 1.0;
    switch (state) {
      case "listening": stateMultiplier = 1.2; break;
      case "thinking": stateMultiplier = 1.8; break;
      case "speaking": stateMultiplier = 1.4; break;
    }

    const targetMorphStrength = baseMorphStrength * stateMultiplier;

    const uniforms = coreMaterialRef.current.uniforms;
    uniforms.uTime.value = time;
    uniforms.uAudioLevel.value = smoothAudioRef.current;
    uniforms.uMorphStrength.value = THREE.MathUtils.lerp(uniforms.uMorphStrength.value, targetMorphStrength, 0.05);
    uniforms.uDensityDivisor.value = THREE.MathUtils.lerp(uniforms.uDensityDivisor.value, densityDivisor, 0.05);

    coreRef.current.rotation.y += 0.002;
    rotationRef.current.copy(coreRef.current.rotation);
  });

  return (
    <group>
      {/* Immersive data stream network (replaces orbital rings) */}
      <DataStreamNetwork state={state} audioLevel={smoothAudioRef.current} />
      
      {/* Central core */}
      <points ref={coreRef} geometry={coreGeometry}>
        <primitive object={coreMaterial} ref={coreMaterialRef} attach="material" />
      </points>
      
      {/* Particle trails */}
      <ParticleTrails 
        state={state} 
        audioLevel={smoothAudioRef.current} 
        sphereGeometry={coreGeometry}
        sphereRotation={rotationRef.current}
        trailLength={trailLength}
      />
    </group>
  );
};