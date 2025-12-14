import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { AIState } from "./AIOrb";

interface NeuralCore3DProps {
  state: AIState;
  audioLevel?: number;
  className?: string;
}

// Neural node that pulses and connects
const NeuralNode = ({ 
  position, 
  state, 
  index, 
  totalNodes 
}: { 
  position: [number, number, number]; 
  state: AIState; 
  index: number;
  totalNodes: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialPos = useRef(position);
  
  const baseIntensity = useMemo(() => {
    switch (state) {
      case "thinking": return 2.5;
      case "speaking": return 1.8;
      case "listening": return 1.2;
      default: return 0.6;
    }
  }, [state]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    
    // Organic movement
    const speed = state === "thinking" ? 3 : state === "speaking" ? 2 : 1;
    const amplitude = state === "thinking" ? 0.15 : 0.05;
    
    meshRef.current.position.x = initialPos.current[0] + Math.sin(t * speed + index) * amplitude;
    meshRef.current.position.y = initialPos.current[1] + Math.cos(t * speed * 0.7 + index * 0.5) * amplitude;
    meshRef.current.position.z = initialPos.current[2] + Math.sin(t * speed * 0.5 + index * 0.3) * amplitude;
    
    // Pulsing scale
    const pulse = 1 + Math.sin(t * 4 + index * 0.2) * 0.3 * baseIntensity;
    meshRef.current.scale.setScalar(pulse * 0.08);
  });

  // Color based on position (creates gradient effect)
  const color = useMemo(() => {
    const dist = Math.sqrt(position[0] ** 2 + position[1] ** 2 + position[2] ** 2);
    const hue = 180 + (dist * 30); // Cyan to purple gradient
    return new THREE.Color(`hsl(${hue}, 100%, 70%)`);
  }, [position]);

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
};

// Synaptic connections between nodes
const SynapticConnections = ({ 
  nodes, 
  state 
}: { 
  nodes: [number, number, number][]; 
  state: AIState;
}) => {
  const linesRef = useRef<THREE.Group>(null);
  
  // Create connections between nearby nodes
  const connections = useMemo(() => {
    const conns: { start: number; end: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.sqrt(
          (nodes[i][0] - nodes[j][0]) ** 2 +
          (nodes[i][1] - nodes[j][1]) ** 2 +
          (nodes[i][2] - nodes[j][2]) ** 2
        );
        if (dist < 0.8) {
          conns.push({ start: i, end: j });
        }
      }
    }
    return conns;
  }, [nodes]);

  useFrame(({ clock }) => {
    if (!linesRef.current) return;
    const t = clock.getElapsedTime();
    
    linesRef.current.children.forEach((line, idx) => {
      if (line instanceof THREE.Line) {
        const material = line.material as THREE.LineBasicMaterial;
        const intensity = state === "thinking" 
          ? 0.4 + Math.sin(t * 5 + idx * 0.3) * 0.4
          : state === "speaking"
          ? 0.3 + Math.sin(t * 3 + idx * 0.2) * 0.2
          : 0.15;
        material.opacity = intensity;
      }
    });
  });

  return (
    <group ref={linesRef}>
      {connections.map((conn, idx) => {
        const points = [
          new THREE.Vector3(...nodes[conn.start]),
          new THREE.Vector3(...nodes[conn.end]),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: "#00d4ff", transparent: true, opacity: 0.2 });
        
        return (
          <primitive key={idx} object={new THREE.Line(geometry, material)} />
        );
      })}
    </group>
  );
};

// Energy core at the center
const EnergyCore = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const coreIntensity = useMemo(() => {
    switch (state) {
      case "thinking": return 1.5;
      case "speaking": return 1.2;
      case "listening": return 0.9;
      default: return 0.6;
    }
  }, [state]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    if (coreRef.current) {
      const breathe = 1 + Math.sin(t * 2) * 0.1 * coreIntensity;
      const audioBoost = 1 + audioLevel * 0.3;
      coreRef.current.scale.setScalar(0.35 * breathe * audioBoost);
      coreRef.current.rotation.y = t * 0.5;
      coreRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
    
    if (glowRef.current) {
      const glowScale = 0.5 + Math.sin(t * 3) * 0.1 * coreIntensity;
      glowRef.current.scale.setScalar(glowScale);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + coreIntensity * 0.15;
    }

    if (pulseRef.current && state === "thinking") {
      const pulseScale = 0.4 + ((t * 2) % 2) * 0.8;
      pulseRef.current.scale.setScalar(pulseScale);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.5 - ((t * 2) % 2) * 0.3);
    }
  });

  return (
    <group>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.15} />
      </mesh>
      
      {/* Core sphere */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#00d4ff"
          emissiveIntensity={coreIntensity}
          metalness={0.8}
          roughness={0.2}
          wireframe
        />
      </mesh>

      {/* Inner bright core */}
      <mesh scale={0.15}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Thinking pulse ring */}
      {state === "thinking" && (
        <mesh ref={pulseRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1, 32]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

// Orbiting energy rings
const EnergyRings = ({ state }: { state: AIState }) => {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  const speed = state === "thinking" ? 3 : state === "speaking" ? 2 : 1;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * speed * 0.5;
      ring1Ref.current.rotation.y = t * speed * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = t * speed * 0.3;
      ring2Ref.current.rotation.z = t * speed * 0.4;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = t * speed * 0.6;
      ring3Ref.current.rotation.z = t * speed * 0.2;
    }
  });

  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.7, 0.01, 16, 100]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.4} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[0.85, 0.008, 16, 100]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.3} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[1.0, 0.006, 16, 100]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.25} />
      </mesh>
    </group>
  );
};

// Particle field surrounding the core
const ParticleField = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 500;

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.8 + Math.random() * 1.2;
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  const originalPositions = useMemo(() => new Float32Array(positions), [positions]);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    const t = clock.getElapsedTime();
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    // Pull particles toward center when thinking
    const pullStrength = state === "thinking" ? 0.3 : 0;
    const speed = state === "thinking" ? 2 : state === "speaking" ? 1.5 : 0.5;
    
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const origX = originalPositions[idx];
      const origY = originalPositions[idx + 1];
      const origZ = originalPositions[idx + 2];
      
      // Distance from center
      const dist = Math.sqrt(origX ** 2 + origY ** 2 + origZ ** 2);
      
      // Spiral motion
      const angle = t * speed + i * 0.1;
      const spiralX = Math.cos(angle) * 0.1;
      const spiralY = Math.sin(angle * 0.7) * 0.1;
      
      // Pull toward center when thinking
      const targetDist = dist * (1 - pullStrength);
      const scale = targetDist / dist;
      
      posArray[idx] = origX * scale + spiralX;
      posArray[idx + 1] = origY * scale + spiralY;
      posArray[idx + 2] = origZ * scale;
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.rotation.y = t * 0.1;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#00d4ff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

// Main Neural Core Scene
const NeuralCoreScene = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  // Generate neural node positions
  const nodes = useMemo(() => {
    const nodePositions: [number, number, number][] = [];
    const nodeCount = 60;
    
    for (let i = 0; i < nodeCount; i++) {
      // Create a shell of nodes around the core
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.5 + Math.random() * 0.4;
      
      nodePositions.push([
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      ]);
    }
    return nodePositions;
  }, []);

  return (
    <>
      {/* Ambient and point lights */}
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#00d4ff" distance={5} />
      <pointLight position={[2, 2, 2]} intensity={0.5} color="#a855f7" />
      <pointLight position={[-2, -2, 2]} intensity={0.3} color="#ec4899" />

      {/* Main energy core */}
      <EnergyCore state={state} audioLevel={audioLevel} />
      
      {/* Orbiting rings */}
      <EnergyRings state={state} />
      
      {/* Neural nodes */}
      {nodes.map((pos, idx) => (
        <NeuralNode 
          key={idx} 
          position={pos} 
          state={state} 
          index={idx}
          totalNodes={nodes.length}
        />
      ))}
      
      {/* Synaptic connections */}
      <SynapticConnections nodes={nodes} state={state} />
      
      {/* Particle field */}
      <ParticleField state={state} audioLevel={audioLevel} />

      <Environment preset="night" />
    </>
  );
};

export const NeuralCore3D = ({ state, audioLevel = 0, className = "" }: NeuralCore3DProps) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <NeuralCoreScene state={state} audioLevel={audioLevel} />
      </Canvas>
    </div>
  );
};
