import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AIState } from "../AIOrb";

interface QuantumFieldSceneProps {
  state: AIState;
  audioLevel: number;
}

const quantumVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vUncertainty;
  uniform float u_time;
  uniform float u_collapse;
  
  float random(vec3 st) {
    return fract(sin(dot(st, vec3(12.9898, 78.233, 45.543))) * 43758.5453123);
  }
  
  void main() {
    vPosition = position;
    vNormal = normal;
    
    // Quantum uncertainty - position is never fixed
    float uncertainty = 1.0 - u_collapse;
    float noise = random(position + u_time) * uncertainty;
    float wave = sin(position.x * 5.0 + u_time) * sin(position.y * 5.0 + u_time) * sin(position.z * 5.0 + u_time);
    
    vec3 offset = normal * wave * 0.1 * uncertainty;
    offset += vec3(
      random(position + u_time * 1.1) - 0.5,
      random(position + u_time * 1.2) - 0.5,
      random(position + u_time * 1.3) - 0.5
    ) * 0.05 * uncertainty;
    
    vUncertainty = uncertainty;
    
    vec3 newPosition = position + offset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const quantumFragmentShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vUncertainty;
  uniform float u_time;
  uniform float u_collapse;
  
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.0);
    
    // Quantum colors: mint, cyan, soft green
    vec3 mint = vec3(0.0, 1.0, 0.67);
    vec3 cyan = vec3(0.0, 0.87, 1.0);
    vec3 white = vec3(1.0, 1.0, 1.0);
    
    vec3 color = mix(mint, cyan, sin(u_time + vPosition.x * 3.0) * 0.5 + 0.5);
    color = mix(color, white, fresnel * 0.6);
    
    // Collapse flash
    color = mix(color, white, u_collapse * 0.5);
    
    float alpha = 0.3 + fresnel * 0.3 + vUncertainty * 0.2;
    gl_FragColor = vec4(color, alpha);
  }
`;

// Probability Cloud Core
const ProbabilityCloud = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_collapse: { value: 0 },
  }), []);
  
  const collapseRef = useRef(0);
  
  useFrame(({ clock }) => {
    if (!materialRef.current || !meshRef.current) return;
    materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
    
    // Collapse when speaking (decision made)
    const targetCollapse = state === "speaking" ? 0.8 : 0;
    collapseRef.current += (targetCollapse - collapseRef.current) * 0.05;
    materialRef.current.uniforms.u_collapse.value = collapseRef.current;
    
    meshRef.current.rotation.x += 0.002;
    meshRef.current.rotation.y += 0.003;
  });
  
  return (
    <>
      {/* Multiple overlapping layers for fuzzy effect */}
      {[1.0, 0.9, 0.8].map((scale, i) => (
        <mesh key={i} ref={i === 0 ? meshRef : undefined} scale={scale}>
          <icosahedronGeometry args={[1, 4]} />
          <shaderMaterial
            ref={i === 0 ? materialRef : undefined}
            vertexShader={quantumVertexShader}
            fragmentShader={quantumFragmentShader}
            uniforms={uniforms}
            transparent
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
};

// Entangled Particle Pairs
const EntangledPairs = ({ state }: { state: AIState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const pairCount = 20;
  
  const pairs = useMemo(() => {
    return Array.from({ length: pairCount }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2 + Math.random() * 1.5;
      
      return {
        pos1: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ),
        pos2: new THREE.Vector3(
          -r * Math.sin(phi) * Math.cos(theta),
          -r * Math.sin(phi) * Math.sin(theta),
          -r * Math.cos(phi)
        ),
        phase: Math.random() * Math.PI * 2,
      };
    });
  }, []);
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    
    groupRef.current.children.forEach((child, i) => {
      if (i < pairCount * 2) {
        // Particles
        const pairIndex = Math.floor(i / 2);
        const isFirst = i % 2 === 0;
        const pair = pairs[pairIndex];
        
        const spin = t * 0.5 + pair.phase;
        const basePos = isFirst ? pair.pos1 : pair.pos2;
        const wobble = new THREE.Vector3(
          Math.sin(spin) * 0.1,
          Math.cos(spin * 1.3) * 0.1,
          Math.sin(spin * 0.7) * 0.1
        );
        
        child.position.copy(basePos).add(wobble);
        
        // Mirror movement (entanglement)
        if (!isFirst) {
          child.position.x = -groupRef.current.children[i - 1].position.x;
          child.position.y = -groupRef.current.children[i - 1].position.y;
          child.position.z = -groupRef.current.children[i - 1].position.z;
        }
      }
    });
  });
  
  return (
    <group ref={groupRef}>
      {pairs.flatMap((pair, i) => [
        <mesh key={`p1-${i}`} position={pair.pos1}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#00ffaa" transparent opacity={0.8} />
        </mesh>,
        <mesh key={`p2-${i}`} position={pair.pos2}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#00ddff" transparent opacity={0.8} />
        </mesh>,
      ])}
      {/* Connection lines */}
      {pairs.map((pair, i) => (
        <line key={`line-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([
                pair.pos1.x, pair.pos1.y, pair.pos1.z,
                pair.pos2.x, pair.pos2.y, pair.pos2.z
              ]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#88ffcc"
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}
    </group>
  );
};

// Wave Function Ripples
const WaveFunctionRipples = ({ audioLevel }: { audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringCount = 6;
  
  const rings = useRef<{ phase: number; speed: number }[]>(
    Array.from({ length: ringCount }, (_, i) => ({
      phase: (i / ringCount) * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.3,
    }))
  );
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    
    groupRef.current.children.forEach((ring, i) => {
      const data = rings.current[i];
      const wave = Math.sin(t * data.speed + data.phase);
      
      ring.scale.setScalar(1.5 + wave * 0.5 + audioLevel * 0.3);
      (ring as THREE.Mesh).material = new THREE.MeshBasicMaterial({
        color: "#00ffcc",
        transparent: true,
        opacity: 0.1 + (1 - Math.abs(wave)) * 0.2,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
    });
  });
  
  return (
    <group ref={groupRef}>
      {Array.from({ length: ringCount }, (_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, (i / ringCount) * Math.PI]}>
          <ringGeometry args={[1.4, 1.5, 64]} />
          <meshBasicMaterial
            color="#00ffcc"
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

// Superposition Ghost States
const SuperpositionStates = ({ state }: { state: AIState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ghostCount = 3;
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    
    // Ghosts merge when speaking (decision made)
    const merge = state === "speaking" ? 0.1 : 1.0;
    
    groupRef.current.children.forEach((ghost, i) => {
      const angle = (i / ghostCount) * Math.PI * 2 + t * 0.2;
      const offset = Math.sin(t * 0.5 + i) * 0.3 * merge;
      
      ghost.position.x = Math.cos(angle) * offset;
      ghost.position.z = Math.sin(angle) * offset;
      ghost.position.y = Math.sin(t * 0.3 + i * 2) * 0.2 * merge;
      
      // Fade in and out
      const opacity = (Math.sin(t * 2 + i * Math.PI * 0.66) * 0.5 + 0.5) * 0.3 * merge;
      ((ghost as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = opacity;
    });
  });
  
  return (
    <group ref={groupRef}>
      {Array.from({ length: ghostCount }, (_, i) => (
        <mesh key={i}>
          <icosahedronGeometry args={[1, 2]} />
          <meshBasicMaterial
            color="#88ffcc"
            transparent
            opacity={0.2}
            wireframe
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

// Probability Field Particles
const ProbabilityParticles = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 500;
  
  const { positions, originalPositions } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const originalPositions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 1.5 + Math.random() * 2;
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;
    }
    
    return { positions, originalPositions };
  }, []);
  
  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    
    const uncertainty = state === "speaking" ? 0.2 : 1.0;
    
    for (let i = 0; i < count; i++) {
      // Quantum jitter
      const jitter = uncertainty * 0.1;
      posAttr.array[i * 3] = originalPositions[i * 3] + (Math.random() - 0.5) * jitter;
      posAttr.array[i * 3 + 1] = originalPositions[i * 3 + 1] + (Math.random() - 0.5) * jitter;
      posAttr.array[i * 3 + 2] = originalPositions[i * 3 + 2] + (Math.random() - 0.5) * jitter;
      
      // Wave motion
      const wave = Math.sin(t * 2 + i * 0.1) * 0.02;
      posAttr.array[i * 3 + 1] += wave;
    }
    posAttr.needsUpdate = true;
    
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.4 + audioLevel * 0.4;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#aaffdd"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const QuantumFieldScene = ({ state, audioLevel }: QuantumFieldSceneProps) => {
  return (
    <group>
      <ProbabilityCloud state={state} audioLevel={audioLevel} />
      <EntangledPairs state={state} />
      <WaveFunctionRipples audioLevel={audioLevel} />
      <SuperpositionStates state={state} />
      <ProbabilityParticles state={state} audioLevel={audioLevel} />
    </group>
  );
};
