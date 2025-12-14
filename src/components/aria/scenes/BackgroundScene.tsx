import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface BackgroundSceneProps {
  state: AIState;
}

// Optimized star field with reduced particle count
const StarField = ({ state }: { state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 600; // Reduced from 2000

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 8 + Math.random() * 12;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      sz[i] = 0.02 + Math.random() * 0.04;

      // Color variations
      const colorType = Math.random();
      if (colorType < 0.5) {
        col[i * 3] = 0; col[i * 3 + 1] = 0.83; col[i * 3 + 2] = 1;
      } else if (colorType < 0.8) {
        col[i * 3] = 0.66; col[i * 3 + 1] = 0.33; col[i * 3 + 2] = 0.97;
      } else {
        col[i * 3] = 1; col[i * 3 + 1] = 1; col[i * 3 + 2] = 1;
      }
    }

    return { positions: pos, colors: col, sizes: sz };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 0.15 : 0.05;
    pointsRef.current.rotation.y = t * speed;
    pointsRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Matrix-style data rain - heavily optimized
const DataRain = ({ state }: { state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1500; // Reduced from 8000

  const { positions, velocities, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    const phs = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const column = Math.floor(Math.random() * 60);
      pos[i * 3] = (column / 60 - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = -3 - Math.random() * 4;

      vel[i] = 0.8 + Math.random() * 1.5;
      phs[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, velocities: vel, phases: phs };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const speed = state === "thinking" ? 2.5 : state === "speaking" ? 1.5 : 1;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      posArray[idx + 1] -= velocities[i] * 0.015 * speed;

      if (posArray[idx + 1] < -6) {
        posArray[idx + 1] = 6;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#00ff88"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Nebula clouds for depth
const NebulaClouds = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.008;
    }
  });

  return (
    <group ref={groupRef}>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 3) * Math.PI * 2) * 10,
            (i - 1) * 2,
            Math.sin((i / 3) * Math.PI * 2) * 10 - 5
          ]}
        >
          <sphereGeometry args={[3, 24, 24]} />
          <meshBasicMaterial
            color={i === 0 ? "#00d4ff" : i === 1 ? "#a855f7" : "#ec4899"}
            transparent
            opacity={0.015}
          />
        </mesh>
      ))}
    </group>
  );
};

export const BackgroundScene = ({ state }: BackgroundSceneProps) => {
  return (
    <group>
      <StarField state={state} />
      <DataRain state={state} />
      <NebulaClouds />
      <fog attach="fog" args={["#0a0a12", 8, 25]} />
    </group>
  );
};
