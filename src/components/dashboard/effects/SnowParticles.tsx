import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SnowParticlesProps {
  count?: number;
  intensity?: number;
  speed?: number;
}

export const SnowParticles = ({
  count = 1000,
  intensity = 1,
  speed = 0.3,
}: SnowParticlesProps) => {
  const meshRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 15 - 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = 0.02 + Math.random() * 0.04;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      
      sizes[i] = 0.03 + Math.random() * 0.05;
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, velocities, sizes, phases };
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    timeRef.current += delta;
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Gentle swaying motion
      const sway = Math.sin(timeRef.current * 2 + particles.phases[i]) * 0.01;
      
      positions[i * 3] += (particles.velocities[i * 3] + sway) * speed * intensity * 60 * delta;
      positions[i * 3 + 1] -= particles.velocities[i * 3 + 1] * speed * intensity * 60 * delta;
      positions[i * 3 + 2] += particles.velocities[i * 3 + 2] * speed * intensity * 60 * delta;

      if (positions[i * 3 + 1] < -5) {
        positions[i * 3 + 1] = 10;
        positions[i * 3] = (Math.random() - 0.5) * 20;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#ffffff"
        transparent
        opacity={0.8 * intensity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
