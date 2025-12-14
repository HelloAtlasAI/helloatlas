import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface DigitalCircuitSceneProps {
  state: AIState;
  audioLevel?: number;
}

// Processor node cores
const ProcessorNodes = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  
  const nodeCount = 20;
  const nodeData = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const rotations: number[] = [];
    const scales: number[] = [];
    
    // Grid-based distribution with some variation
    for (let i = 0; i < nodeCount; i++) {
      const gridX = (i % 4 - 1.5) * 2.5;
      const gridZ = (Math.floor(i / 4) % 4 - 1.5) * 2.5;
      const gridY = (Math.floor(i / 16) - 0.5) * 2;
      
      positions.push(new THREE.Vector3(
        gridX + (Math.random() - 0.5) * 0.5,
        gridY + (Math.random() - 0.5) * 0.5,
        gridZ + (Math.random() - 0.5) * 0.5
      ));
      rotations.push(Math.random() * Math.PI * 0.25);
      scales.push(0.3 + Math.random() * 0.2);
    }
    
    return { positions, rotations, scales };
  }, []);
  
  useFrame((rootState) => {
    if (!nodesRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.5 : state === "speaking" ? 1.2 : 0.8;
    
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < nodeCount; i++) {
      const pos = nodeData.positions[i];
      const rot = nodeData.rotations[i];
      const scale = nodeData.scales[i];
      
      dummy.position.copy(pos);
      dummy.rotation.y = rot + time * 0.1;
      dummy.rotation.x = Math.PI / 4;
      
      const pulse = 1 + Math.sin(time * 3 + i) * 0.1 * activity;
      dummy.scale.setScalar(scale * pulse * (1 + audioLevel * 0.2));
      dummy.updateMatrix();
      nodesRef.current.setMatrixAt(i, dummy.matrix);
    }
    nodesRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={nodesRef} args={[undefined, undefined, nodeCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#00d4ff"
        emissive="#0ea5e9"
        emissiveIntensity={1.2}
        metalness={0.8}
        roughness={0.2}
      />
    </instancedMesh>
  );
};

// Circuit traces with 90-degree angles
const CircuitTraces = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const traceData = useMemo(() => {
    const traces: THREE.Vector3[][] = [];
    
    // Create grid-aligned traces
    for (let i = 0; i < 30; i++) {
      const start = new THREE.Vector3(
        (Math.floor(Math.random() * 5) - 2) * 2,
        (Math.floor(Math.random() * 3) - 1) * 1.5,
        (Math.floor(Math.random() * 5) - 2) * 2
      );
      
      const points: THREE.Vector3[] = [start.clone()];
      let current = start.clone();
      
      // Create 90-degree path
      const segments = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < segments; j++) {
        const axis = Math.floor(Math.random() * 3);
        const distance = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2);
        
        const next = current.clone();
        if (axis === 0) next.x += distance;
        else if (axis === 1) next.y += distance * 0.5;
        else next.z += distance;
        
        points.push(next);
        current = next;
      }
      
      traces.push(points);
    }
    
    return traces;
  }, []);
  
  return (
    <group>
      {traceData.map((points, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={points.length}
              array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#0ea5e9" transparent opacity={0.5} linewidth={1} />
        </line>
      ))}
    </group>
  );
};

// Data packets traveling along traces
const DataPackets = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const packetsRef = useRef<THREE.InstancedMesh>(null);
  
  const packetCount = 50;
  const packetData = useMemo(() => {
    const data: { path: THREE.Vector3[]; speed: number; offset: number }[] = [];
    
    for (let i = 0; i < packetCount; i++) {
      // Create simple grid-aligned paths
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 8
      );
      const end = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 8
      );
      
      // Create 90-degree path
      const mid1 = new THREE.Vector3(end.x, start.y, start.z);
      const mid2 = new THREE.Vector3(end.x, end.y, start.z);
      
      data.push({
        path: [start, mid1, mid2, end],
        speed: 0.2 + Math.random() * 0.3,
        offset: Math.random()
      });
    }
    
    return data;
  }, []);
  
  useFrame((rootState) => {
    if (!packetsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 2 : state === "speaking" ? 1.5 : 1;
    
    const dummy = new THREE.Object3D();
    
    packetData.forEach((packet, i) => {
      const t = ((time * packet.speed * activity + packet.offset) % 1);
      const totalLength = packet.path.length - 1;
      const segment = Math.floor(t * totalLength);
      const segmentT = (t * totalLength) % 1;
      
      const from = packet.path[Math.min(segment, packet.path.length - 1)];
      const to = packet.path[Math.min(segment + 1, packet.path.length - 1)];
      
      dummy.position.lerpVectors(from, to, segmentT);
      dummy.scale.setScalar(0.08 + audioLevel * 0.03);
      dummy.updateMatrix();
      packetsRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    packetsRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={packetsRef} args={[undefined, undefined, packetCount]}>
      <boxGeometry args={[1, 0.5, 0.5]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.9} />
    </instancedMesh>
  );
};

// Signal bursts from active nodes
const SignalBursts = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const ringsRef = useRef<THREE.Group>(null);
  
  const ringCount = 8;
  const ringData = useMemo(() => {
    return Array.from({ length: ringCount }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 6
      ),
      phase: Math.random() * Math.PI * 2,
      speed: 1 + Math.random()
    }));
  }, []);
  
  useFrame((rootState) => {
    if (!ringsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.5 : state === "speaking" ? 1.2 : 0.8;
    
    ringsRef.current.children.forEach((ring, i) => {
      const data = ringData[i];
      const progress = ((time * data.speed * activity + data.phase) % 3) / 3;
      const scale = progress * 0.8;
      const opacity = 1 - progress;
      
      ring.scale.setScalar(scale);
      (ring as THREE.Mesh).material = new THREE.MeshBasicMaterial({
        color: "#00d4ff",
        transparent: true,
        opacity: opacity * 0.5,
        side: THREE.DoubleSide
      });
    });
  });
  
  return (
    <group ref={ringsRef}>
      {ringData.map((data, i) => (
        <mesh key={i} position={data.position} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1, 6]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

// Infinite grid floor
const GridFloor = ({ state }: { state: AIState }) => {
  const gridRef = useRef<THREE.GridHelper>(null);
  
  useFrame((rootState) => {
    if (!gridRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const speed = state === "thinking" ? 0.5 : state === "speaking" ? 0.3 : 0.1;
    gridRef.current.position.z = (time * speed) % 2;
  });
  
  return (
    <group position={[0, -3, 0]}>
      <gridHelper ref={gridRef} args={[30, 30, "#0ea5e9", "#0369a1"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

export const DigitalCircuitScene = ({ state, audioLevel = 0 }: DigitalCircuitSceneProps) => {
  return (
    <group>
      <ProcessorNodes state={state} audioLevel={audioLevel} />
      <CircuitTraces state={state} audioLevel={audioLevel} />
      <DataPackets state={state} audioLevel={audioLevel} />
      <SignalBursts state={state} audioLevel={audioLevel} />
      <GridFloor state={state} />
    </group>
  );
};
