import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface DigitalCircuitSceneProps {
  state: AIState;
  audioLevel?: number;
}

// Octahedron processor nodes with metallic shader and rotating inner core
const ProcessorCores = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const coresRef = useRef<THREE.InstancedMesh>(null);
  const innersRef = useRef<THREE.InstancedMesh>(null);
  const glowsRef = useRef<THREE.InstancedMesh>(null);
  
  const nodeCount = 24;
  const nodeData = useMemo(() => {
    const data: { position: THREE.Vector3; scale: number; phase: number; rotSpeed: number }[] = [];
    
    // Grid-based but with strategic spacing
    const gridSize = 4;
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const layerY = Math.floor((x * gridSize + z) / 8) - 0.5;
        data.push({
          position: new THREE.Vector3(
            (x - gridSize / 2 + 0.5) * 2.2 + (Math.random() - 0.5) * 0.3,
            layerY * 2.5 + (Math.random() - 0.5) * 0.3,
            (z - gridSize / 2 + 0.5) * 2.2 + (Math.random() - 0.5) * 0.3
          ),
          scale: 0.25 + Math.random() * 0.15,
          phase: Math.random() * Math.PI * 2,
          rotSpeed: 0.3 + Math.random() * 0.4
        });
        
        if (data.length >= nodeCount) break;
      }
      if (data.length >= nodeCount) break;
    }
    
    return data;
  }, []);
  
  useFrame((rootState) => {
    if (!coresRef.current || !innersRef.current || !glowsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.5 : state === "speaking" ? 1.2 : 0.8;
    
    const dummy = new THREE.Object3D();
    const innerDummy = new THREE.Object3D();
    const glowDummy = new THREE.Object3D();
    
    for (let i = 0; i < nodeCount; i++) {
      const { position, scale, phase, rotSpeed } = nodeData[i];
      
      const pulse = 1 + Math.sin(time * 3 + phase) * 0.12 * activity;
      const finalScale = scale * pulse * (1 + audioLevel * 0.25);
      
      // Outer octahedron
      dummy.position.copy(position);
      dummy.rotation.y = time * rotSpeed;
      dummy.rotation.x = Math.PI / 4;
      dummy.scale.setScalar(finalScale);
      dummy.updateMatrix();
      coresRef.current.setMatrixAt(i, dummy.matrix);
      
      // Inner rotating core
      innerDummy.position.copy(position);
      innerDummy.rotation.y = -time * rotSpeed * 2;
      innerDummy.rotation.z = time * rotSpeed;
      innerDummy.scale.setScalar(finalScale * 0.5);
      innerDummy.updateMatrix();
      innersRef.current.setMatrixAt(i, innerDummy.matrix);
      
      // Outer glow
      glowDummy.position.copy(position);
      glowDummy.scale.setScalar(finalScale * 2);
      glowDummy.updateMatrix();
      glowsRef.current.setMatrixAt(i, glowDummy.matrix);
    }
    
    coresRef.current.instanceMatrix.needsUpdate = true;
    innersRef.current.instanceMatrix.needsUpdate = true;
    glowsRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <group>
      {/* Main octahedron cores */}
      <instancedMesh ref={coresRef} args={[undefined, undefined, nodeCount]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive="#0284c7"
          emissiveIntensity={2}
          metalness={0.9}
          roughness={0.1}
        />
      </instancedMesh>
      
      {/* Inner cores */}
      <instancedMesh ref={innersRef} args={[undefined, undefined, nodeCount]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          color="#67e8f9"
          transparent
          opacity={0.9}
        />
      </instancedMesh>
      
      {/* Glow spheres */}
      <instancedMesh ref={glowsRef} args={[undefined, undefined, nodeCount]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
};

// Dual-layer circuit traces with animated dash pattern
const CircuitTraces = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const tracesRef = useRef<THREE.Group>(null);
  
  const traceData = useMemo(() => {
    const traces: { points: THREE.Vector3[]; isMain: boolean }[] = [];
    
    // Create 90-degree angled traces
    for (let i = 0; i < 40; i++) {
      const start = new THREE.Vector3(
        (Math.floor(Math.random() * 9) - 4) * 1.2,
        (Math.floor(Math.random() * 5) - 2) * 1.2,
        (Math.floor(Math.random() * 9) - 4) * 1.2
      );
      
      const points: THREE.Vector3[] = [start.clone()];
      let current = start.clone();
      
      const segments = 2 + Math.floor(Math.random() * 4);
      for (let j = 0; j < segments; j++) {
        const axis = Math.floor(Math.random() * 3);
        const distance = (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 1.6);
        
        const next = current.clone();
        if (axis === 0) next.x += distance;
        else if (axis === 1) next.y += distance * 0.6;
        else next.z += distance;
        
        points.push(next);
        current = next;
      }
      
      traces.push({ points, isMain: i < 15 });
    }
    
    return traces;
  }, []);
  
  return (
    <group ref={tracesRef}>
      {traceData.map((trace, i) => {
        const curve = new THREE.CatmullRomCurve3(trace.points, false, 'catmullrom', 0);
        return (
          <group key={i}>
            {/* Outer trace glow */}
            <mesh>
              <tubeGeometry args={[curve, 32, trace.isMain ? 0.04 : 0.025, 8, false]} />
              <meshBasicMaterial
                color={trace.isMain ? "#0ea5e9" : "#0369a1"}
                transparent
                opacity={trace.isMain ? 0.6 : 0.35}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            {/* Inner bright core */}
            <mesh>
              <tubeGeometry args={[curve, 32, trace.isMain ? 0.015 : 0.008, 8, false]} />
              <meshBasicMaterial
                color="#67e8f9"
                transparent
                opacity={0.9}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// Rectangular data packets with motion trails
const DataPackets = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const packetsRef = useRef<THREE.InstancedMesh>(null);
  const trailsRef = useRef<THREE.InstancedMesh>(null);
  
  const packetCount = 65;
  const trailLength = 10;
  
  const packetData = useMemo(() => {
    const data: { path: THREE.Vector3[]; speed: number; offset: number }[] = [];
    
    for (let i = 0; i < packetCount; i++) {
      const start = new THREE.Vector3(
        (Math.floor(Math.random() * 9) - 4) * 1.2,
        (Math.floor(Math.random() * 5) - 2) * 1.2,
        (Math.floor(Math.random() * 9) - 4) * 1.2
      );
      
      // Create 90-degree path
      const path: THREE.Vector3[] = [start.clone()];
      let current = start.clone();
      
      const segments = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < segments; j++) {
        const axis = Math.floor(Math.random() * 3);
        const distance = (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random() * 2);
        
        const next = current.clone();
        if (axis === 0) next.x += distance;
        else if (axis === 1) next.y += distance * 0.5;
        else next.z += distance;
        
        path.push(next);
        current = next;
      }
      
      data.push({
        path,
        speed: 0.25 + Math.random() * 0.35,
        offset: Math.random()
      });
    }
    
    return data;
  }, []);
  
  useFrame((rootState) => {
    if (!packetsRef.current || !trailsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 2.5 : state === "speaking" ? 1.8 : 1;
    
    const dummy = new THREE.Object3D();
    const trailDummy = new THREE.Object3D();
    
    packetData.forEach((packet, i) => {
      const t = ((time * packet.speed * activity + packet.offset) % 1);
      const totalLength = packet.path.length - 1;
      const segment = Math.floor(t * totalLength);
      const segmentT = (t * totalLength) % 1;
      
      const from = packet.path[Math.min(segment, packet.path.length - 1)];
      const to = packet.path[Math.min(segment + 1, packet.path.length - 1)];
      const pos = from.clone().lerp(to, segmentT);
      
      // Direction for orientation
      const dir = to.clone().sub(from).normalize();
      
      // Main packet - rectangular shape
      dummy.position.copy(pos);
      if (dir.length() > 0) {
        dummy.lookAt(pos.clone().add(dir));
      }
      const scale = 0.06 + audioLevel * 0.03;
      dummy.scale.set(scale * 0.5, scale * 0.5, scale * 2);
      dummy.updateMatrix();
      packetsRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Trail particles
      for (let j = 0; j < trailLength; j++) {
        const trailT = Math.max(0, t - (j + 1) * 0.015);
        const trailSegment = Math.floor(trailT * totalLength);
        const trailSegmentT = (trailT * totalLength) % 1;
        
        const trailFrom = packet.path[Math.min(trailSegment, packet.path.length - 1)];
        const trailTo = packet.path[Math.min(trailSegment + 1, packet.path.length - 1)];
        const trailPos = trailFrom.clone().lerp(trailTo, trailSegmentT);
        
        const trailScale = scale * (1 - (j + 1) / (trailLength + 1)) * 0.6;
        trailDummy.position.copy(trailPos);
        trailDummy.scale.setScalar(trailScale);
        trailDummy.updateMatrix();
        trailsRef.current!.setMatrixAt(i * trailLength + j, trailDummy.matrix);
      }
    });
    
    packetsRef.current.instanceMatrix.needsUpdate = true;
    trailsRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <group>
      {/* Main packets - rectangular */}
      <instancedMesh ref={packetsRef} args={[undefined, undefined, packetCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
      
      {/* Trail particles */}
      <instancedMesh ref={trailsRef} args={[undefined, undefined, packetCount * trailLength]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
};

// Hexagonal signal bursts from active nodes
const SignalBursts = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const burstsRef = useRef<THREE.Group>(null);
  
  const burstCount = 12;
  const burstData = useMemo(() => {
    return Array.from({ length: burstCount }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 7
      ),
      phase: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 0.6
    }));
  }, []);
  
  useFrame((rootState) => {
    if (!burstsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.5 : state === "speaking" ? 1.2 : 0.8;
    
    burstsRef.current.children.forEach((burst, i) => {
      const data = burstData[i];
      const progress = ((time * data.speed * activity + data.phase) % 2.5) / 2.5;
      const scale = progress * 1.2;
      const opacity = Math.max(0, 1 - progress);
      
      burst.scale.setScalar(scale);
      const mesh = burst as THREE.Mesh;
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.opacity = opacity * 0.4;
      }
    });
  });
  
  return (
    <group ref={burstsRef}>
      {burstData.map((data, i) => (
        <mesh key={i} position={data.position} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1, 6]} />
          <meshBasicMaterial
            color="#00d4ff"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};

// Holographic grid floor with pulse waves
const HolographicGrid = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const gridRef = useRef<THREE.GridHelper>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  
  useFrame((rootState) => {
    if (!gridRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const speed = state === "thinking" ? 0.6 : state === "speaking" ? 0.4 : 0.15;
    gridRef.current.position.z = (time * speed) % 2;
    
    if (pulseRef.current) {
      const pulseScale = 1 + Math.sin(time * 2) * 0.1 + audioLevel * 0.3;
      pulseRef.current.scale.set(pulseScale, 1, pulseScale);
    }
  });
  
  return (
    <group position={[0, -3.5, 0]}>
      <gridHelper ref={gridRef} args={[40, 40, "#0ea5e9", "#0369a1"]} />
      
      {/* Floor plane with gradient */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial
          color="#020617"
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Radial pulse wave */}
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[8, 12, 64]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// Atmospheric fog for depth
const CircuitFog = () => {
  return (
    <mesh>
      <sphereGeometry args={[18, 32, 32]} />
      <meshBasicMaterial
        color="#0c1524"
        transparent
        opacity={0.5}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

export const DigitalCircuitScene = ({ state, audioLevel = 0 }: DigitalCircuitSceneProps) => {
  return (
    <group>
      <CircuitFog />
      <ProcessorCores state={state} audioLevel={audioLevel} />
      <CircuitTraces state={state} audioLevel={audioLevel} />
      <DataPackets state={state} audioLevel={audioLevel} />
      <SignalBursts state={state} audioLevel={audioLevel} />
      <HolographicGrid state={state} audioLevel={audioLevel} />
    </group>
  );
};
