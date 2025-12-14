import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface NeuralPathwaysSceneProps {
  state: AIState;
  audioLevel?: number;
}

// Neuron cluster nodes
const NeuronNodes = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  
  const nodeCount = 35;
  const nodeData = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const scales: number[] = [];
    const phases: number[] = [];
    
    // Create organic cluster distribution
    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2 + Math.random() * 3;
      
      positions.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * radius,
        Math.sin(phi) * Math.sin(theta) * radius * 0.7,
        Math.cos(phi) * radius
      ));
      scales.push(0.15 + Math.random() * 0.25);
      phases.push(Math.random() * Math.PI * 2);
    }
    
    return { positions, scales, phases };
  }, []);
  
  useFrame((rootState) => {
    if (!nodesRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.5 : state === "speaking" ? 1.2 : 0.8;
    
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < nodeCount; i++) {
      const pos = nodeData.positions[i];
      const baseScale = nodeData.scales[i];
      const phase = nodeData.phases[i];
      
      // Organic pulsing
      const pulse = 1 + Math.sin(time * 2 + phase) * 0.15 * activity;
      const audioBoost = 1 + audioLevel * 0.3;
      
      dummy.position.copy(pos);
      dummy.position.y += Math.sin(time * 0.5 + phase) * 0.1;
      dummy.scale.setScalar(baseScale * pulse * audioBoost);
      dummy.updateMatrix();
      nodesRef.current.setMatrixAt(i, dummy.matrix);
    }
    nodesRef.current.instanceMatrix.needsUpdate = true;
    
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.02;
    }
  });
  
  return (
    <group ref={groupRef}>
      <instancedMesh ref={nodesRef} args={[undefined, undefined, nodeCount]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#7c3aed"
          emissiveIntensity={1.5}
          transparent
          opacity={0.9}
        />
      </instancedMesh>
    </group>
  );
};

// Synaptic connections with traveling data pulses
const SynapticConnections = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const linesRef = useRef<THREE.Group>(null);
  const pulsesRef = useRef<THREE.InstancedMesh>(null);
  
  const connectionData = useMemo(() => {
    const curves: THREE.CatmullRomCurve3[] = [];
    const pulseData: { curveIndex: number; speed: number; offset: number }[] = [];
    
    // Create organic curved connections
    for (let i = 0; i < 25; i++) {
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 6
      );
      const end = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 6
      );
      
      // Create curved path through middle point
      const mid = start.clone().lerp(end, 0.5);
      mid.x += (Math.random() - 0.5) * 2;
      mid.y += (Math.random() - 0.5) * 2;
      
      curves.push(new THREE.CatmullRomCurve3([start, mid, end]));
      
      // Multiple pulses per connection
      const pulseCount = 1 + Math.floor(Math.random() * 2);
      for (let j = 0; j < pulseCount; j++) {
        pulseData.push({
          curveIndex: i,
          speed: 0.3 + Math.random() * 0.4,
          offset: Math.random()
        });
      }
    }
    
    return { curves, pulseData };
  }, []);
  
  useFrame((rootState) => {
    if (!pulsesRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 2 : state === "speaking" ? 1.5 : 1;
    
    const dummy = new THREE.Object3D();
    
    connectionData.pulseData.forEach((pulse, i) => {
      const curve = connectionData.curves[pulse.curveIndex];
      const t = ((time * pulse.speed * activity + pulse.offset) % 1);
      const pos = curve.getPoint(t);
      
      dummy.position.copy(pos);
      const scale = 0.08 + audioLevel * 0.04;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      pulsesRef.current!.setMatrixAt(i, dummy.matrix);
    });
    pulsesRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <group ref={linesRef}>
      {/* Connection lines */}
      {connectionData.curves.map((curve, i) => {
        const points = curve.getPoints(30);
        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={points.length}
                array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#ec4899" transparent opacity={0.3} />
          </line>
        );
      })}
      
      {/* Traveling pulses */}
      <instancedMesh ref={pulsesRef} args={[undefined, undefined, connectionData.pulseData.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.9} />
      </instancedMesh>
    </group>
  );
};

// Thought stream particles
const ThoughtStreams = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleCount = 800;
  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    
    const colorPalette = [
      new THREE.Color("#a855f7"),
      new THREE.Color("#ec4899"),
      new THREE.Color("#8b5cf6"),
      new THREE.Color("#d946ef")
    ];
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Distribute in streams
      const streamAngle = Math.floor(Math.random() * 6) * (Math.PI / 3);
      const streamRadius = Math.random() * 4;
      
      pos[i3] = Math.cos(streamAngle) * streamRadius + (Math.random() - 0.5) * 0.5;
      pos[i3 + 1] = (Math.random() - 0.5) * 5;
      pos[i3 + 2] = Math.sin(streamAngle) * streamRadius + (Math.random() - 0.5) * 0.5;
      
      // Velocity toward center
      vel[i3] = -pos[i3] * 0.1;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.2;
      vel[i3 + 2] = -pos[i3 + 2] * 0.1;
      
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;
    }
    
    return { positions: pos, velocities: vel, colors: col };
  }, []);
  
  useFrame((rootState) => {
    if (!particlesRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    const activity = state === "thinking" ? 1.5 : state === "speaking" ? 1.2 : 0.6;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Move along streams with spiral motion
      posArray[i3] += velocities[i3] * activity * 0.02;
      posArray[i3 + 1] += Math.sin(time + i * 0.1) * 0.005 * activity;
      posArray[i3 + 2] += velocities[i3 + 2] * activity * 0.02;
      
      // Respawn when too close to center
      const dist = Math.sqrt(posArray[i3] ** 2 + posArray[i3 + 2] ** 2);
      if (dist < 0.5) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 4 + Math.random() * 2;
        posArray[i3] = Math.cos(angle) * radius;
        posArray[i3 + 2] = Math.sin(angle) * radius;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Outer membrane boundary
const MembraneBoundary = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((rootState) => {
    if (!meshRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.3 : state === "speaking" ? 1.1 : 0.8;
    
    const scale = 5 + Math.sin(time * 0.5) * 0.2 * activity + audioLevel * 0.5;
    meshRef.current.scale.setScalar(scale);
    meshRef.current.rotation.y = time * 0.02;
    meshRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
  });
  
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial
        color="#a855f7"
        emissive="#7c3aed"
        emissiveIntensity={0.3}
        transparent
        opacity={0.1}
        wireframe
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export const NeuralPathwaysScene = ({ state, audioLevel = 0 }: NeuralPathwaysSceneProps) => {
  return (
    <group>
      <NeuronNodes state={state} audioLevel={audioLevel} />
      <SynapticConnections state={state} audioLevel={audioLevel} />
      <ThoughtStreams state={state} audioLevel={audioLevel} />
      <MembraneBoundary state={state} audioLevel={audioLevel} />
    </group>
  );
};
