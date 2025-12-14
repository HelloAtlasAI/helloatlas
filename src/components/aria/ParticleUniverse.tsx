import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "./AIOrb";

interface ParticleUniverseProps {
  state: AIState;
  className?: string;
}

// Deep space particle system
const StarField = ({ state }: { state: AIState }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 2000;
  
  const [positions, velocities, sizes, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const size = new Float32Array(particleCount);
    const col = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Distribute in a large sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 5 + Math.random() * 15;
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
      
      // Random velocities
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      
      // Varying sizes
      size[i] = Math.random() * 0.05 + 0.02;
      
      // Colors: cyan, purple, pink, white
      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        col[i * 3] = 0; col[i * 3 + 1] = 0.83; col[i * 3 + 2] = 1; // Cyan
      } else if (colorChoice < 0.7) {
        col[i * 3] = 0.66; col[i * 3 + 1] = 0.33; col[i * 3 + 2] = 0.97; // Purple
      } else if (colorChoice < 0.9) {
        col[i * 3] = 0.93; col[i * 3 + 1] = 0.27; col[i * 3 + 2] = 0.6; // Pink
      } else {
        col[i * 3] = 1; col[i * 3 + 1] = 1; col[i * 3 + 2] = 1; // White
      }
    }
    return [pos, vel, size, col];
  }, []);

  const originalPositions = useMemo(() => new Float32Array(positions), [positions]);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    const t = clock.getElapsedTime();
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    // Calculate pull strength based on state
    const pullStrength = state === "thinking" ? 0.02 : state === "speaking" ? -0.005 : 0;
    const orbitSpeed = state === "thinking" ? 0.3 : state === "speaking" ? 0.2 : 0.05;
    
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      
      // Current position
      let x = posArray[idx];
      let y = posArray[idx + 1];
      let z = posArray[idx + 2];
      
      // Distance from center
      const dist = Math.sqrt(x * x + y * y + z * z);
      
      // Normalize direction to center
      const nx = x / dist;
      const ny = y / dist;
      const nz = z / dist;
      
      // Apply pull/push toward/from center
      x -= nx * pullStrength * dist * 0.1;
      y -= ny * pullStrength * dist * 0.1;
      z -= nz * pullStrength * dist * 0.1;
      
      // Orbital motion
      const angle = orbitSpeed * 0.01;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const newX = x * cosA - z * sinA;
      const newZ = x * sinA + z * cosA;
      
      // Subtle drift
      const drift = 0.001;
      
      posArray[idx] = newX + velocities[idx] * drift;
      posArray[idx + 1] = y + Math.sin(t + i * 0.01) * 0.001;
      posArray[idx + 2] = newZ + velocities[idx + 2] * drift;
      
      // Keep particles within bounds
      const newDist = Math.sqrt(posArray[idx] ** 2 + posArray[idx + 1] ** 2 + posArray[idx + 2] ** 2);
      if (newDist < 3 || newDist > 25) {
        // Reset to original position
        posArray[idx] = originalPositions[idx];
        posArray[idx + 1] = originalPositions[idx + 1];
        posArray[idx + 2] = originalPositions[idx + 2];
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.rotation.y = t * 0.02;
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
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Flowing energy streams
const EnergyStreams = ({ state }: { state: AIState }) => {
  const streamRefs = useRef<THREE.Line[]>([]);
  const streamCount = 6;
  
  const streams = useMemo(() => {
    return Array.from({ length: streamCount }, (_, i) => {
      const points: THREE.Vector3[] = [];
      const segments = 50;
      const baseAngle = (i / streamCount) * Math.PI * 2;
      
      for (let j = 0; j < segments; j++) {
        const t = j / segments;
        const radius = 3 + t * 8;
        const spiral = baseAngle + t * Math.PI * 2;
        const heightVariation = Math.sin(t * Math.PI * 4) * 2;
        
        points.push(new THREE.Vector3(
          Math.cos(spiral) * radius,
          heightVariation,
          Math.sin(spiral) * radius
        ));
      }
      
      return new THREE.BufferGeometry().setFromPoints(points);
    });
  }, []);

  const lineObjects = useMemo(() => {
    return streams.map((geometry, idx) => {
      const material = new THREE.LineBasicMaterial({
        color: idx % 2 === 0 ? "#00d4ff" : "#a855f7",
        transparent: true,
        opacity: 0.1,
      });
      return new THREE.Line(geometry, material);
    });
  }, [streams]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 2 : state === "speaking" ? 1.5 : 0.5;
    
    lineObjects.forEach((line, idx) => {
      line.rotation.y = t * speed * 0.1 + idx * 0.5;
      (line.material as THREE.LineBasicMaterial).opacity = 0.1 + Math.sin(t * 2 + idx) * 0.05;
    });
  });

  return (
    <group>
      {lineObjects.map((lineObj, idx) => (
        <primitive key={idx} object={lineObj} />
      ))}
    </group>
  );
};

// Nebula clouds
const NebulaClouds = ({ state }: { state: AIState }) => {
  const cloudRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y = clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <group ref={cloudRef}>
      {/* Large ambient clouds */}
      {[...Array(3)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 3) * Math.PI * 2) * 12,
            (i - 1) * 3,
            Math.sin((i / 3) * Math.PI * 2) * 12
          ]}
        >
          <sphereGeometry args={[4, 16, 16]} />
          <meshBasicMaterial
            color={i === 0 ? "#00d4ff" : i === 1 ? "#a855f7" : "#ec4899"}
            transparent
            opacity={0.02}
          />
        </mesh>
      ))}
    </group>
  );
};

// Main particle universe scene
const UniverseScene = ({ state }: { state: AIState }) => {
  return (
    <>
      <ambientLight intensity={0.1} />
      
      {/* Deep star field */}
      <StarField state={state} />
      
      {/* Energy streams */}
      <EnergyStreams state={state} />
      
      {/* Nebula effect */}
      <NebulaClouds state={state} />
      
      {/* Fog for depth */}
      <fog attach="fog" args={["#0a0a12", 5, 30]} />
    </>
  );
};

export const ParticleUniverse = ({ state, className = "" }: ParticleUniverseProps) => {
  return (
    <div className={`fixed inset-0 ${className}`} style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <UniverseScene state={state} />
      </Canvas>
    </div>
  );
};
