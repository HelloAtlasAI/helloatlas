import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { AIState } from "./AIOrb";

interface CyberGrid3DProps {
  state: AIState;
  audioLevel?: number;
  className?: string;
}

// GPU-Instanced Hexagonal Circuit Nodes
const CircuitNodes = ({ state, count = 400 }: { state: AIState; count?: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const { positions, scales, phases } = useMemo(() => {
    const pos: [number, number, number][] = [];
    const scl: number[] = [];
    const phs: number[] = [];
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.6 + Math.random() * 1.4;
      
      pos.push([
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      ]);
      scl.push(0.015 + Math.random() * 0.025);
      phs.push(Math.random() * Math.PI * 2);
    }
    return { positions: pos, scales: scl, phases: phs };
  }, [count]);

  const colorArray = useMemo(() => {
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const hue = 180 + Math.random() * 40;
      const color = new THREE.Color(`hsl(${hue}, 100%, 70%)`);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return colors;
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 3 : state === "speaking" ? 2 : 1;
    
    for (let i = 0; i < count; i++) {
      const [x, y, z] = positions[i];
      const phase = phases[i];
      
      // Glitch effect
      const glitch = state === "thinking" && Math.random() > 0.98 ? (Math.random() - 0.5) * 0.1 : 0;
      
      dummy.position.set(
        x + Math.sin(t * speed + phase) * 0.02 + glitch,
        y + Math.cos(t * speed * 0.7 + phase) * 0.02,
        z + Math.sin(t * speed * 0.5 + phase) * 0.02
      );
      
      const pulse = 1 + Math.sin(t * 4 + phase) * 0.3;
      dummy.scale.setScalar(scales[i] * pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[1, 1, 0.3, 6]} />
      <meshBasicMaterial color="#00d4ff" transparent opacity={0.8} />
    </instancedMesh>
  );
};

// Holographic Data Grid Core - Wireframe Icosahedron with inner cube
const HolographicCore = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const cubeRef = useRef<THREE.Mesh>(null);
  const scanlineRef = useRef<THREE.Mesh>(null);

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
    
    if (outerRef.current) {
      outerRef.current.rotation.x = t * 0.2 * speed;
      outerRef.current.rotation.y = t * 0.3 * speed;
      
      // Glitch vertices occasionally
      const geo = outerRef.current.geometry;
      const pos = geo.attributes.position;
      if (state === "thinking" && Math.random() > 0.95) {
        const idx = Math.floor(Math.random() * pos.count);
        const original = pos.getY(idx);
        pos.setY(idx, original + (Math.random() - 0.5) * 0.05);
        pos.needsUpdate = true;
        setTimeout(() => {
          pos.setY(idx, original);
          pos.needsUpdate = true;
        }, 50);
      }
    }
    
    if (innerRef.current) {
      const breathe = 1 + Math.sin(t * 2) * 0.1 * intensity;
      const audio = 1 + audioLevel * 0.3;
      innerRef.current.scale.setScalar(0.25 * breathe * audio);
      innerRef.current.rotation.x = -t * 0.4 * speed;
      innerRef.current.rotation.z = t * 0.3 * speed;
    }
    
    if (cubeRef.current) {
      cubeRef.current.rotation.x = t * 0.5 * speed;
      cubeRef.current.rotation.y = t * 0.7 * speed;
      cubeRef.current.rotation.z = t * 0.3 * speed;
      const pulse = 0.12 + Math.sin(t * 3) * 0.02 * intensity;
      cubeRef.current.scale.setScalar(pulse);
    }

    if (scanlineRef.current) {
      scanlineRef.current.position.y = Math.sin(t * 2) * 0.4;
      (scanlineRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 8) * 0.1;
    }
  });

  return (
    <group>
      {/* Outer wireframe icosahedron */}
      <mesh ref={outerRef} scale={0.4}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial 
          color="#00d4ff" 
          wireframe 
          transparent 
          opacity={0.6}
        />
      </mesh>
      
      {/* Inner dodecahedron */}
      <mesh ref={innerRef}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={intensity * 0.5}
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>
      
      {/* Inner rotating cube with data texture */}
      <mesh ref={cubeRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#ffffff"
          wireframe
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Horizontal scanline */}
      <mesh ref={scanlineRef} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 0.01]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Core glow */}
      <mesh scale={0.08}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Ambient glow sphere */}
      <mesh scale={0.5}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.08} />
      </mesh>
    </group>
  );
};

// Circuit trace connections with animated data packets
const CircuitTraces = ({ state, nodes }: { state: AIState; nodes: [number, number, number][] }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const connections = useMemo(() => {
    const conns: { start: number; end: number; curve: THREE.CatmullRomCurve3 }[] = [];
    const maxConnections = 80;
    let count = 0;
    
    for (let i = 0; i < nodes.length && count < maxConnections; i++) {
      for (let j = i + 1; j < nodes.length && count < maxConnections; j++) {
        const dist = Math.sqrt(
          (nodes[i][0] - nodes[j][0]) ** 2 +
          (nodes[i][1] - nodes[j][1]) ** 2 +
          (nodes[i][2] - nodes[j][2]) ** 2
        );
        if (dist < 0.5 && dist > 0.2) {
          const midPoint = new THREE.Vector3(
            (nodes[i][0] + nodes[j][0]) / 2,
            (nodes[i][1] + nodes[j][1]) / 2,
            (nodes[i][2] + nodes[j][2]) / 2
          );
          // Push midpoint slightly toward center for curved effect
          midPoint.multiplyScalar(0.9);
          
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(...nodes[i]),
            midPoint,
            new THREE.Vector3(...nodes[j]),
          ]);
          conns.push({ start: i, end: j, curve });
          count++;
        }
      }
    }
    return conns;
  }, [nodes]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 2 : 1;
    
    groupRef.current.children.forEach((child, idx) => {
      if (child instanceof THREE.Line) {
        const mat = child.material as THREE.LineDashedMaterial;
        (mat as any).dashOffset = -t * speed * 0.5;
        mat.opacity = state === "thinking" 
          ? 0.4 + Math.sin(t * 5 + idx * 0.3) * 0.3
          : 0.2 + Math.sin(t * 2 + idx * 0.2) * 0.1;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {connections.map((conn, idx) => {
        const points = conn.curve.getPoints(20);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineDashedMaterial({
          color: "#00ff88",
          transparent: true,
          opacity: 0.3,
          dashSize: 0.02,
          gapSize: 0.01,
        });
        const line = new THREE.Line(geometry, material);
        line.computeLineDistances();
        
        return <primitive key={idx} object={line} />;
      })}
    </group>
  );
};

// Data packets traveling along traces
const DataPackets = ({ state }: { state: AIState }) => {
  const packetsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const packetCount = 50;
  
  const paths = useMemo(() => {
    return Array.from({ length: packetCount }, () => ({
      radius: 0.4 + Math.random() * 1,
      speed: 0.5 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      tilt: Math.random() * Math.PI,
      axis: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!packetsRef.current) return;
    const t = clock.getElapsedTime();
    const speedMult = state === "thinking" ? 3 : state === "speaking" ? 2 : 1;
    
    for (let i = 0; i < packetCount; i++) {
      const path = paths[i];
      const angle = t * path.speed * speedMult + path.phase;
      
      dummy.position.set(
        Math.cos(angle) * path.radius * Math.cos(path.tilt),
        Math.sin(angle) * path.radius,
        Math.cos(angle) * path.radius * Math.sin(path.tilt)
      );
      
      dummy.scale.setScalar(0.008 + Math.sin(t * 8 + i) * 0.003);
      dummy.updateMatrix();
      packetsRef.current.setMatrixAt(i, dummy.matrix);
    }
    packetsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={packetsRef} args={[undefined, undefined, packetCount]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.9} />
    </instancedMesh>
  );
};

// Energy pulse rings
const PulseRings = ({ state }: { state: AIState }) => {
  const ringsRef = useRef<THREE.Group>(null);
  const ringCount = 4;
  
  useFrame(({ clock }) => {
    if (!ringsRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 3 : state === "speaking" ? 2 : 1;
    
    ringsRef.current.children.forEach((ring, idx) => {
      if (ring instanceof THREE.Mesh) {
        const phase = idx * 0.5;
        const scale = 0.3 + ((t * speed + phase) % 2) * 0.5;
        ring.scale.setScalar(scale);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.5 - ((t * speed + phase) % 2) * 0.25);
      }
    });
  });

  return (
    <group ref={ringsRef}>
      {Array.from({ length: ringCount }).map((_, idx) => (
        <mesh key={idx} rotation={[Math.PI / 2, 0, idx * 0.3]}>
          <ringGeometry args={[0.95, 1, 64]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

// Binary data streams flowing toward center
const BinaryStreams = ({ state }: { state: AIState }) => {
  const streamsRef = useRef<THREE.Group>(null);
  const streamCount = 12;
  
  useFrame(({ clock }) => {
    if (!streamsRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 4 : 2;
    
    streamsRef.current.children.forEach((stream, idx) => {
      if (stream instanceof THREE.Mesh) {
        // Scroll the stream toward center
        const mat = stream.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.15 + Math.sin(t * 2 + idx) * 0.1;
        stream.position.setLength(1.2 + Math.sin(t * speed + idx * 0.5) * 0.2);
      }
    });
  });

  return (
    <group ref={streamsRef}>
      {Array.from({ length: streamCount }).map((_, idx) => {
        const theta = (idx / streamCount) * Math.PI * 2;
        const phi = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        
        return (
          <mesh 
            key={idx} 
            position={[
              Math.sin(phi) * Math.cos(theta) * 1.2,
              Math.sin(phi) * Math.sin(theta) * 1.2,
              Math.cos(phi) * 1.2
            ]}
          >
            <cylinderGeometry args={[0.002, 0.002, 0.4, 4]} />
            <meshBasicMaterial color="#6b21a8" transparent opacity={0.2} />
          </mesh>
        );
      })}
    </group>
  );
};

// Main Cyber Grid Scene
const CyberGridScene = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const nodes = useMemo(() => {
    const nodePositions: [number, number, number][] = [];
    const count = 100;
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.5 + Math.random() * 0.8;
      
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
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 0]} intensity={3} color="#00d4ff" distance={5} />
      <pointLight position={[2, 2, 2]} intensity={0.8} color="#00ff88" />
      <pointLight position={[-2, -2, 2]} intensity={0.5} color="#6b21a8" />

      <HolographicCore state={state} audioLevel={audioLevel} />
      <CircuitNodes state={state} count={400} />
      <CircuitTraces state={state} nodes={nodes} />
      <DataPackets state={state} />
      <PulseRings state={state} />
      <BinaryStreams state={state} />

      <Environment preset="night" />
    </>
  );
};

export const CyberGrid3D = ({ state, audioLevel = 0, className = "" }: CyberGrid3DProps) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <CyberGridScene state={state} audioLevel={audioLevel} />
      </Canvas>
    </div>
  );
};