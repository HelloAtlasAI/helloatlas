import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";
import { ParticleTrails } from "../particles/ParticleTrails";
import { NebulaBackground } from "../particles/NebulaBackground";

interface MorphingSphereNebulaProps {
  state: AIState;
  audioLevel: number;
  particleDensity?: number;
  trailLength?: number;
  morphIntensity?: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uDispersion;
  uniform float uDensityDivisor;
  
  attribute float aRandomness;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float time = uTime * 0.2;
    
    vec3 pos = position;
    
    // Gaseous dispersion
    float disperseAmount = uDispersion * (0.5 + aRandomness);
    pos += normal * sin(time + aRandomness * 10.0) * disperseAmount;
    pos += vec3(
      sin(time * 0.7 + aRandomness * 5.0),
      cos(time * 0.5 + aRandomness * 7.0),
      sin(time * 0.3 + aRandomness * 3.0)
    ) * disperseAmount * 0.5;
    
    // Audio reactivity - gentle expansion
    pos *= 1.0 + uAudioLevel * 0.1;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Dynamic density
    float size = 0.4 + aRandomness * 0.6;
    gl_PointSize = size * (uDensityDivisor / -mvPosition.z);
    
    // Distance-based alpha
    float dist = length(pos);
    vAlpha = 0.5 * (1.0 - smoothstep(0.5, 1.5, dist));
    
    // Soft purple-blue nebula colors
    vColor = mix(
      vec3(0.02, 0.03, 0.12),
      vec3(0.15, 0.03, 0.25),
      aRandomness
    );
    vColor += vec3(0.0, 0.1, 0.15) * uAudioLevel;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Very soft falloff for cloud effect
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vAlpha;
    alpha = pow(alpha, 0.7); // Softer edges
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export const MorphingSphereNebula = ({ 
  state, 
  audioLevel,
  particleDensity = 75,
  trailLength = 6,
  morphIntensity = 50,
}: MorphingSphereNebulaProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothAudioRef = useRef(0);
  const rotationRef = useRef(new THREE.Euler());
  
  // Map morphIntensity (0-100) to dispersion (0.1-0.8)
  const baseDispersion = 0.1 + (morphIntensity / 100) * 0.7;
  
  // Map particleDensity (25-100) to divisor
  const densityDivisor = 150 + (particleDensity / 100) * 200;

  const geometry = useMemo(() => {
    // OPTIMIZED: Reduced from 400k to 80k particles
    const count = 80000;
    const positions = new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);
    const randomness = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Spherical distribution - SMALLER sphere (0.55 vs 0.8)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.55 * Math.pow(Math.random(), 0.35);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      // Normals pointing outward
      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      normals[i3] = x / len;
      normals[i3 + 1] = y / len;
      normals[i3 + 2] = z / len;
      
      randomness[i] = Math.random();
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geo.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 1));
    
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uDispersion: { value: baseDispersion },
        uDensityDivisor: { value: densityDivisor },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((frameState) => {
    if (!materialRef.current || !pointsRef.current) return;

    const time = frameState.clock.elapsedTime;
    smoothAudioRef.current = THREE.MathUtils.lerp(smoothAudioRef.current, audioLevel, 0.1);

    // State-based modifiers
    let stateMultiplier = 1.0;
    switch (state) {
      case "listening": stateMultiplier = 1.2; break;
      case "thinking": stateMultiplier = 1.8; break;
      case "speaking": stateMultiplier = 1.5; break;
    }
    
    const targetDispersion = baseDispersion * stateMultiplier;

    const uniforms = materialRef.current.uniforms;
    uniforms.uTime.value = time;
    uniforms.uAudioLevel.value = smoothAudioRef.current;
    uniforms.uDispersion.value = THREE.MathUtils.lerp(uniforms.uDispersion.value, targetDispersion, 0.03);
    uniforms.uDensityDivisor.value = THREE.MathUtils.lerp(uniforms.uDensityDivisor.value, densityDivisor, 0.05);

    pointsRef.current.rotation.y += 0.0005;
    rotationRef.current.copy(pointsRef.current.rotation);
  });

  return (
    <group>
      {/* Immersive nebula background with cosmic gas streams */}
      <NebulaBackground state={state} audioLevel={smoothAudioRef.current} />
      
      {/* Central nebula sphere */}
      <points ref={pointsRef} geometry={geometry}>
        <primitive object={material} ref={materialRef} attach="material" />
      </points>
      
      {/* Particle trails */}
      <ParticleTrails 
        state={state} 
        audioLevel={smoothAudioRef.current} 
        sphereGeometry={geometry}
        sphereRotation={rotationRef.current}
        trailLength={trailLength}
      />
    </group>
  );
};