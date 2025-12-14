import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";
import { ParticleTrails } from "../particles/ParticleTrails";

interface MorphingSphereCrystalProps {
  state: AIState;
  audioLevel: number;
  particleDensity?: number;
  trailLength?: number;
  morphIntensity?: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uFacetStrength;
  uniform float uDensityDivisor;
  
  varying float vFacet;
  varying vec3 vNormal;
  varying float vAudioLevel;
  
  // Quantize position to create faceted look
  vec3 quantize(vec3 p, float steps) {
    return floor(p * steps) / steps;
  }
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vAudioLevel = uAudioLevel;
    
    vec3 pos = position;
    
    // Create angular, crystalline deformation
    float angle = atan(pos.y, pos.x);
    float facetAngle = floor(angle * 8.0) / 8.0 * 3.14159 * 2.0;
    
    // Sharp geometric displacement
    float displacement = sin(facetAngle * 3.0 + uTime * 0.5) * uFacetStrength;
    displacement += cos(pos.z * 5.0 + uTime * 0.3) * uFacetStrength * 0.5;
    
    // Audio adds sharpness
    displacement += uAudioLevel * 0.1;
    
    vFacet = displacement;
    pos += normal * displacement;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Dynamic density
    float baseSizeMultiplier = 0.3 + uAudioLevel * 0.15;
    gl_PointSize = baseSizeMultiplier * (uDensityDivisor / -mvPosition.z);
  }
`;

const fragmentShader = `
  varying float vFacet;
  varying vec3 vNormal;
  varying float vAudioLevel;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Crystal color palette - cool blue-white with sharp edges
    vec3 darkBlue = vec3(0.01, 0.02, 0.08);
    vec3 crystalBlue = vec3(0.1, 0.25, 0.4);
    vec3 highlight = vec3(0.4, 0.5, 0.7);
    
    float t = vFacet * 2.0 + 0.5;
    vec3 color = mix(darkBlue, crystalBlue, smoothstep(0.0, 0.5, t));
    color = mix(color, highlight, smoothstep(0.7, 1.0, t) * 0.5);
    
    // Higher alpha for solid crystalline look
    float alpha = 1.0 - smoothstep(0.15, 0.5, dist);
    alpha *= 0.65;
    
    // Edge highlighting
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
    alpha += fresnel * 0.12;
    color += highlight * fresnel * 0.4;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export const MorphingSphereCrystal = ({ 
  state, 
  audioLevel,
  particleDensity = 75,
  trailLength = 6,
  morphIntensity = 50,
}: MorphingSphereCrystalProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothAudioRef = useRef(0);
  const rotationRef = useRef(new THREE.Euler());
  
  // Map morphIntensity (0-100) to facet strength (0.05-0.35)
  const baseFacetStrength = 0.05 + (morphIntensity / 100) * 0.3;
  
  // Map particleDensity (25-100) to divisor
  const densityDivisor = 200 + (particleDensity / 100) * 200;

  const geometry = useMemo(() => {
    // Detail level 9 for ultra-dense sphere (~655k particles)
    const ico = new THREE.IcosahedronGeometry(0.8, 9);
    const positions = ico.attributes.position.array;
    const normals = ico.attributes.normal.array;
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
    
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uFacetStrength: { value: baseFacetStrength },
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
      case "listening": stateMultiplier = 1.3; break;
      case "thinking": stateMultiplier = 2.0; break;
      case "speaking": stateMultiplier = 1.6; break;
    }
    
    const targetFacet = baseFacetStrength * stateMultiplier;

    const uniforms = materialRef.current.uniforms;
    uniforms.uTime.value = time;
    uniforms.uAudioLevel.value = smoothAudioRef.current;
    uniforms.uFacetStrength.value = THREE.MathUtils.lerp(uniforms.uFacetStrength.value, targetFacet, 0.05);
    uniforms.uDensityDivisor.value = THREE.MathUtils.lerp(uniforms.uDensityDivisor.value, densityDivisor, 0.05);

    // Slower, more deliberate rotation
    pointsRef.current.rotation.y += 0.002;
    pointsRef.current.rotation.x = Math.sin(time * 0.05) * 0.1;
    rotationRef.current.copy(pointsRef.current.rotation);
  });

  return (
    <group>
      <points ref={pointsRef} geometry={geometry}>
        <primitive object={material} ref={materialRef} attach="material" />
      </points>
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