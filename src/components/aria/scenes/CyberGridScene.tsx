import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface CyberGridSceneProps {
  state: AIState;
  audioLevel?: number;
}

// Ultra high-poly holographic core with smooth geometry
const HolographicCore = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const cubeRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const intensity = state === "thinking" ? 2 : state === "speaking" ? 1.5 : state === "listening" ? 1.2 : 0.8;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 1.8 : 1;

    if (outerRef.current) {
      outerRef.current.rotation.x = t * 0.15 * speed;
      outerRef.current.rotation.y = t * 0.2 * speed;
    }

    if (innerRef.current) {
      const breathe = 1 + Math.sin(t * 2) * 0.08 * intensity;
      const audio = 1 + audioLevel * 0.25;
      innerRef.current.scale.setScalar(0.28 * breathe * audio);
      innerRef.current.rotation.x = -t * 0.3 * speed;
      innerRef.current.rotation.z = t * 0.25 * speed;
    }

    if (cubeRef.current) {
      cubeRef.current.rotation.x = t * 0.4 * speed;
      cubeRef.current.rotation.y = t * 0.55 * speed;
      cubeRef.current.rotation.z = t * 0.25 * speed;
      const pulse = 0.13 + Math.sin(t * 2.5) * 0.02 * intensity;
      cubeRef.current.scale.setScalar(pulse);
    }

    if (glowRef.current) {
      const glowPulse = 0.35 + Math.sin(t * 1.5) * 0.05 * intensity + audioLevel * 0.1;
      glowRef.current.scale.setScalar(glowPulse);
    }
  });

  return (
    <group>
      {/* Outer icosahedron - ULTRA HIGH POLY (4 subdivisions = 1280 faces) */}
      <mesh ref={outerRef} scale={0.45}>
        <icosahedronGeometry args={[1, 4]} />
        <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.5} />
      </mesh>

      {/* Inner dodecahedron - HIGH POLY */}
      <mesh ref={innerRef}>
        <dodecahedronGeometry args={[1, 3]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={intensity * 0.4}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Inner rotating cube - subdivided */}
      <mesh ref={cubeRef}>
        <boxGeometry args={[1, 1, 1, 4, 4, 4]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.85} />
      </mesh>

      {/* Core bright center - ULTRA HIGH POLY */}
      <mesh scale={0.08}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Glow sphere - HIGH POLY */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.08} />
      </mesh>
    </group>
  );
};

// GPU-Instanced circuit nodes with higher quality geometry
const CircuitNodes = ({ state, count = 300 }: { state: AIState; count?: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { positions, scales, phases } = useMemo(() => {
    const pos: [number, number, number][] = [];
    const scl: number[] = [];
    const phs: number[] = [];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.55 + Math.random() * 1.2;

      pos.push([
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      ]);
      scl.push(0.012 + Math.random() * 0.02);
      phs.push(Math.random() * Math.PI * 2);
    }
    return { positions: pos, scales: scl, phases: phs };
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 2.5 : state === "speaking" ? 1.8 : 1;

    for (let i = 0; i < count; i++) {
      const [x, y, z] = positions[i];
      const phase = phases[i];

      dummy.position.set(
        x + Math.sin(t * speed * 0.5 + phase) * 0.015,
        y + Math.cos(t * speed * 0.4 + phase) * 0.015,
        z + Math.sin(t * speed * 0.3 + phase) * 0.015
      );

      const pulse = 1 + Math.sin(t * 3.5 + phase) * 0.25;
      dummy.scale.setScalar(scales[i] * pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 2]} />
      <meshBasicMaterial color="#00d4ff" transparent opacity={0.75} />
    </instancedMesh>
  );
};

// Animated energy rings - ULTRA HIGH POLY
const EnergyRings = ({ state }: { state: AIState }) => {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ringsRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 2.5 : state === "speaking" ? 1.8 : 1;

    ringsRef.current.children.forEach((ring, idx) => {
      if (ring instanceof THREE.Mesh) {
        const phase = idx * 0.6;
        const scale = 0.35 + ((t * speed * 0.4 + phase) % 2) * 0.4;
        ring.scale.setScalar(scale);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.45 - ((t * speed * 0.4 + phase) % 2) * 0.22);
      }
    });
  });

  return (
    <group ref={ringsRef}>
      {[0, 1, 2, 3].map((idx) => (
        <mesh key={idx} rotation={[Math.PI / 2, 0, idx * 0.4]}>
          <ringGeometry args={[0.92, 1, 256]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

// Data packets orbiting the core
const DataPackets = ({ state }: { state: AIState }) => {
  const packetsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 40;

  const paths = useMemo(() => {
    return Array.from({ length: count }, () => ({
      radius: 0.45 + Math.random() * 0.8,
      speed: 0.6 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      tilt: Math.random() * Math.PI,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!packetsRef.current) return;
    const t = clock.getElapsedTime();
    const speedMult = state === "thinking" ? 2.5 : state === "speaking" ? 1.8 : 1;

    for (let i = 0; i < count; i++) {
      const path = paths[i];
      const angle = t * path.speed * speedMult * 0.5 + path.phase;

      dummy.position.set(
        Math.cos(angle) * path.radius * Math.cos(path.tilt),
        Math.sin(angle) * path.radius,
        Math.cos(angle) * path.radius * Math.sin(path.tilt)
      );

      dummy.scale.setScalar(0.012 + Math.sin(t * 6 + i) * 0.004);
      dummy.updateMatrix();
      packetsRef.current.setMatrixAt(i, dummy.matrix);
    }
    packetsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={packetsRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1, 2, 2, 2]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.85} />
    </instancedMesh>
  );
};

export const CyberGridScene = ({ state, audioLevel = 0 }: CyberGridSceneProps) => {
  return (
    <group>
      <HolographicCore state={state} audioLevel={audioLevel} />
      <CircuitNodes state={state} count={300} />
      <EnergyRings state={state} />
      <DataPackets state={state} />
    </group>
  );
};