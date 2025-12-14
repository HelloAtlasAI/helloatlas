import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ParticlePool, ParticleState } from "./useParticlePool";

interface ParticleUniverseSystemProps {
  pool: ParticlePool;
  audioLevel: number;
}

const universeVertexShader = `
  attribute float aAlpha;
  attribute float aState;
  attribute vec3 aTarget;
  attribute vec3 aColor;
  
  varying float vAlpha;
  varying vec3 vColor;
  varying float vState;
  
  uniform float uTime;
  uniform float uFormationProgress;
  
  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    vState = aState;
    
    vec3 pos = position;
    
    // If HUD state, interpolate toward target
    if (aState > 1.5) {
      pos = mix(position, aTarget, uFormationProgress);
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size based on state and distance - smaller for massive particle count
    float baseSize = aState < 0.5 ? 0.8 : (aState < 1.5 ? 1.2 : 1.5);
    gl_PointSize = baseSize * (80.0 / -mvPosition.z);
  }
`;

const universeFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vState;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - smoothstep(0.2, 0.5, dist)) * vAlpha;
    
    // Dim universe particles more
    if (vState < 0.5) {
      alpha *= 0.4;
    }
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export const ParticleUniverseSystem = ({ pool, audioLevel }: ParticleUniverseSystemProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    geo.setAttribute("position", new THREE.BufferAttribute(pool.positions, 3));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(pool.alphas, 1));
    geo.setAttribute("aState", new THREE.BufferAttribute(pool.states, 1));
    geo.setAttribute("aTarget", new THREE.BufferAttribute(pool.targets, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(pool.colors, 3));
    
    return geo;
  }, [pool]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: universeVertexShader,
      fragmentShader: universeFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uFormationProgress: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((state, delta) => {
    if (!materialRef.current || !pointsRef.current) return;
    
    const time = state.clock.elapsedTime;
    materialRef.current.uniforms.uTime.value = time;
    
    // Update particle positions based on state
    const positions = geometry.attributes.position.array as Float32Array;
    const velocities = pool.velocities;
    const states = pool.states;
    const targets = pool.targets;
    
    for (let i = 0; i < pool.count; i++) {
      const i3 = i * 3;
      
      if (states[i] === ParticleState.UNIVERSE) {
        // Gentle drift with slight orbital motion
        const x = positions[i3];
        const y = positions[i3 + 1];
        const z = positions[i3 + 2];
        
        const dist = Math.sqrt(x * x + y * y + z * z);
        
        // Add slight orbital velocity
        const orbitalSpeed = 0.001;
        positions[i3] += velocities[i3] + (-y * orbitalSpeed);
        positions[i3 + 1] += velocities[i3 + 1] + (x * orbitalSpeed);
        positions[i3 + 2] += velocities[i3 + 2];
        
        // Dampen velocities
        velocities[i3] *= 0.99;
        velocities[i3 + 1] *= 0.99;
        velocities[i3 + 2] *= 0.99;
        
        // Keep within bounds
        if (dist > 15) {
          const scale = 14 / dist;
          positions[i3] *= scale;
          positions[i3 + 1] *= scale;
          positions[i3 + 2] *= scale;
        }
      } else if (states[i] === ParticleState.HUD) {
        // Attract toward target
        const dx = targets[i3] - positions[i3];
        const dy = targets[i3 + 1] - positions[i3 + 1];
        const dz = targets[i3 + 2] - positions[i3 + 2];
        
        positions[i3] += dx * 0.05;
        positions[i3 + 1] += dy * 0.05;
        positions[i3 + 2] += dz * 0.05;
      }
    }
    
    geometry.attributes.position.needsUpdate = true;
    (geometry.attributes.aState as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
};
