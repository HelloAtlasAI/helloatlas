import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { AIState } from "./AIOrb";

interface HybridVisualizationProps {
  state: AIState;
  audioLevel?: number;
  isSpeaking?: boolean;
  className?: string;
}

// Miniature face emerging from the digital core
const EmergingFace = ({ 
  state, 
  audioLevel = 0,
  isSpeaking = false
}: { 
  state: AIState; 
  audioLevel: number;
  isSpeaking: boolean;
}) => {
  const faceRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  
  const emergenceLevel = useMemo(() => {
    switch (state) {
      case "speaking": return 1;
      case "thinking": return 0.7;
      case "listening": return 0.8;
      default: return 0.5;
    }
  }, [state]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    if (faceRef.current) {
      // Emergence animation
      const targetZ = -0.2 + emergenceLevel * 0.15;
      faceRef.current.position.z = THREE.MathUtils.lerp(
        faceRef.current.position.z,
        targetZ,
        0.05
      );
      
      // Subtle rotation
      faceRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
      faceRef.current.rotation.x = Math.sin(t * 0.3) * 0.05;
      
      // Opacity based on emergence
      faceRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          if (mat.opacity !== undefined) {
            mat.opacity = THREE.MathUtils.lerp(mat.opacity, emergenceLevel * 0.9, 0.05);
          }
        }
      });
    }

    // Mouth animation
    if (mouthRef.current) {
      const mouthOpen = isSpeaking 
        ? 0.2 + audioLevel * 0.5 + Math.sin(t * 15) * 0.08 * audioLevel
        : 0.05;
      mouthRef.current.scale.y = 0.5 + mouthOpen * 2;
    }
  });

  return (
    <group ref={faceRef} position={[0, 0, -0.2]} scale={0.4}>
      {/* Face outline */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} />
      </mesh>
      
      {/* Left eye */}
      <mesh ref={leftEyeRef} position={[-0.12, 0.05, 0.4]}>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.8} />
      </mesh>
      
      {/* Right eye */}
      <mesh ref={rightEyeRef} position={[0.12, 0.05, 0.4]}>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.8} />
      </mesh>
      
      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, -0.12, 0.4]}>
        <capsuleGeometry args={[0.02, 0.06, 8, 16]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.7} />
      </mesh>

      {/* Glow aura */}
      <mesh scale={0.6}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.1} />
      </mesh>
    </group>
  );
};

// Digital core surrounding the face
const DigitalShell = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const shellRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  const intensity = useMemo(() => {
    switch (state) {
      case "thinking": return 2;
      case "speaking": return 1.5;
      case "listening": return 1.2;
      default: return 0.8;
    }
  }, [state]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 2 : 1;
    
    if (shellRef.current) {
      shellRef.current.rotation.y = t * 0.1 * speed;
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.5 * speed;
      ring1Ref.current.rotation.z = t * 0.3 * speed;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -t * 0.4 * speed;
      ring2Ref.current.rotation.y = t * 0.6 * speed;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = t * 0.7 * speed;
      ring3Ref.current.rotation.z = -t * 0.2 * speed;
    }
  });

  return (
    <group ref={shellRef}>
      {/* Outer icosahedron shell */}
      <mesh scale={0.6}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.3} />
      </mesh>

      {/* Orbiting rings */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.5, 0.008, 16, 64]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.5} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[0.55, 0.006, 16, 64]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.4} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[0.6, 0.004, 16, 64]} />
        <meshBasicMaterial color="#6b21a8" transparent opacity={0.3} />
      </mesh>

      {/* Energy glow core */}
      <mesh scale={0.15 + audioLevel * 0.05}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>

      {/* Ambient glow */}
      <mesh scale={0.3}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.15 * intensity} />
      </mesh>
    </group>
  );
};

// Floating circuit nodes
const CircuitNodes = ({ state, count = 80 }: { state: AIState; count?: number }) => {
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const nodeData = useMemo(() => {
    return Array.from({ length: count }, () => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1),
      radius: 0.7 + Math.random() * 0.5,
      speed: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (!nodesRef.current) return;
    const t = clock.getElapsedTime();
    const speedMult = state === "thinking" ? 2 : 1;
    
    for (let i = 0; i < count; i++) {
      const node = nodeData[i];
      const angle = node.theta + t * node.speed * speedMult * 0.3;
      
      dummy.position.set(
        node.radius * Math.sin(node.phi) * Math.cos(angle),
        node.radius * Math.sin(node.phi) * Math.sin(angle),
        node.radius * Math.cos(node.phi)
      );
      
      const pulse = 1 + Math.sin(t * 4 + node.phase) * 0.3;
      dummy.scale.setScalar(0.012 * pulse);
      dummy.updateMatrix();
      nodesRef.current.setMatrixAt(i, dummy.matrix);
    }
    nodesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={nodesRef} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.7} />
    </instancedMesh>
  );
};

// Particle streams connecting core to outer shell
const EnergyStreams = ({ state }: { state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 300;
  
  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const phs = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 0.2 + Math.random() * 0.5;
      
      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.6;
      pos[i * 3 + 2] = Math.sin(theta) * r;
      
      phs[i] = Math.random() * Math.PI * 2;
    }
    
    return { positions: pos, phases: phs };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    const speed = state === "thinking" ? 3 : state === "speaking" ? 2 : 1;
    
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const phase = phases[i];
      
      // Spiral outward motion
      const currentR = Math.sqrt(posArray[idx] ** 2 + posArray[idx + 2] ** 2);
      const angle = Math.atan2(posArray[idx + 2], posArray[idx]) + 0.02 * speed;
      const newR = 0.2 + ((currentR - 0.2 + 0.01 * speed) % 0.5);
      
      posArray[idx] = Math.cos(angle) * newR;
      posArray[idx + 2] = Math.sin(angle) * newR;
      posArray[idx + 1] += Math.sin(t + phase) * 0.002;
      
      // Keep y bounded
      if (Math.abs(posArray[idx + 1]) > 0.3) {
        posArray[idx + 1] *= 0.99;
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#00d4ff"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Main Hybrid Scene
const HybridScene = ({ 
  state, 
  audioLevel = 0,
  isSpeaking = false
}: { 
  state: AIState; 
  audioLevel: number;
  isSpeaking: boolean;
}) => {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 2]} intensity={1.5} color="#00d4ff" />
      <pointLight position={[-1, 1, 1]} intensity={0.5} color="#00ff88" />
      <pointLight position={[1, -1, 1]} intensity={0.3} color="#6b21a8" />

      <DigitalShell state={state} audioLevel={audioLevel} />
      <EmergingFace 
        state={state} 
        audioLevel={audioLevel}
        isSpeaking={isSpeaking}
      />
      <CircuitNodes state={state} count={80} />
      <EnergyStreams state={state} />

      <Environment preset="night" />
    </>
  );
};

export const HybridVisualization = ({ 
  state, 
  audioLevel = 0,
  isSpeaking = false,
  className = "" 
}: HybridVisualizationProps) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <HybridScene 
          state={state} 
          audioLevel={audioLevel}
          isSpeaking={isSpeaking}
        />
      </Canvas>
    </div>
  );
};