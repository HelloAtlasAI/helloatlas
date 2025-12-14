import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface ParticleTrailsProps {
  state: AIState;
  audioLevel: number;
  sphereGeometry: THREE.BufferGeometry;
  sphereRotation: THREE.Euler;
}

const trailVertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uTrailLength;
  
  attribute float aTrailIndex;
  attribute float aRandomSeed;
  
  varying float vTrailFade;
  varying float vAudioLevel;
  
  void main() {
    vAudioLevel = uAudioLevel;
    
    // Trail fade based on position in trail (0 = newest, 1 = oldest)
    vTrailFade = 1.0 - aTrailIndex;
    
    vec3 pos = position;
    
    // Add slight dispersion to older trail particles
    float dispersion = aTrailIndex * 0.15 * (1.0 + uAudioLevel);
    pos += vec3(
      sin(aRandomSeed * 10.0 + uTime) * dispersion,
      cos(aRandomSeed * 8.0 + uTime * 1.2) * dispersion,
      sin(aRandomSeed * 6.0 + uTime * 0.8) * dispersion
    );
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Shrinking size for older trails
    float sizeMultiplier = vTrailFade * (0.3 + uAudioLevel * 0.2);
    gl_PointSize = sizeMultiplier * (80.0 / -mvPosition.z);
  }
`;

const trailFragmentShader = `
  varying float vTrailFade;
  varying float vAudioLevel;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Trail colors - fade from cyan to deep blue
    vec3 trailStart = vec3(0.0, 0.4, 0.6);
    vec3 trailEnd = vec3(0.02, 0.05, 0.15);
    vec3 color = mix(trailEnd, trailStart, vTrailFade);
    
    // Add glow for newer particles
    color += vec3(0.05, 0.1, 0.15) * vTrailFade * vAudioLevel;
    
    float alpha = (1.0 - smoothstep(0.1, 0.5, dist)) * vTrailFade * 0.5;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

const TRAIL_HISTORY_LENGTH = 6;

export const ParticleTrails = ({ state, audioLevel, sphereGeometry, sphereRotation }: ParticleTrailsProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const historyRef = useRef<Float32Array[]>([]);
  const frameCountRef = useRef(0);

  const { geometry, particleCount } = useMemo(() => {
    const sourcePositions = sphereGeometry.attributes.position.array as Float32Array;
    const count = sourcePositions.length / 3;
    const totalParticles = count * TRAIL_HISTORY_LENGTH;
    
    const positions = new Float32Array(totalParticles * 3);
    const trailIndices = new Float32Array(totalParticles);
    const randomSeeds = new Float32Array(totalParticles);
    
    // Initialize positions and attributes
    for (let trail = 0; trail < TRAIL_HISTORY_LENGTH; trail++) {
      for (let i = 0; i < count; i++) {
        const idx = (trail * count + i) * 3;
        const srcIdx = i * 3;
        
        positions[idx] = sourcePositions[srcIdx];
        positions[idx + 1] = sourcePositions[srcIdx + 1];
        positions[idx + 2] = sourcePositions[srcIdx + 2];
        
        trailIndices[trail * count + i] = trail / TRAIL_HISTORY_LENGTH;
        randomSeeds[trail * count + i] = Math.random();
      }
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aTrailIndex", new THREE.BufferAttribute(trailIndices, 1));
    geo.setAttribute("aRandomSeed", new THREE.BufferAttribute(randomSeeds, 1));
    
    return { geometry: geo, particleCount: count };
  }, [sphereGeometry]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: trailVertexShader,
      fragmentShader: trailFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uTrailLength: { value: TRAIL_HISTORY_LENGTH },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((frameState) => {
    if (!materialRef.current || !pointsRef.current) return;

    const time = frameState.clock.elapsedTime;
    frameCountRef.current++;

    // Update every 3rd frame for performance
    if (frameCountRef.current % 3 === 0) {
      const sourcePositions = sphereGeometry.attributes.position.array as Float32Array;
      const positions = geometry.attributes.position.array as Float32Array;
      
      // Shift history back
      for (let trail = TRAIL_HISTORY_LENGTH - 1; trail > 0; trail--) {
        for (let i = 0; i < particleCount; i++) {
          const dstIdx = (trail * particleCount + i) * 3;
          const srcIdx = ((trail - 1) * particleCount + i) * 3;
          
          positions[dstIdx] = positions[srcIdx];
          positions[dstIdx + 1] = positions[srcIdx + 1];
          positions[dstIdx + 2] = positions[srcIdx + 2];
        }
      }
      
      // Apply rotation to newest positions
      const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(sphereRotation);
      
      for (let i = 0; i < particleCount; i++) {
        const srcIdx = i * 3;
        const dstIdx = i * 3;
        
        const vec = new THREE.Vector3(
          sourcePositions[srcIdx],
          sourcePositions[srcIdx + 1],
          sourcePositions[srcIdx + 2]
        );
        vec.applyMatrix4(rotationMatrix);
        
        positions[dstIdx] = vec.x;
        positions[dstIdx + 1] = vec.y;
        positions[dstIdx + 2] = vec.z;
      }
      
      geometry.attributes.position.needsUpdate = true;
    }

    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uAudioLevel.value = audioLevel;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
};