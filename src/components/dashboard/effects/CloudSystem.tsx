import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CloudSystemProps {
  count?: number;
  coverage?: number;
  speed?: number;
  darkness?: number;
}

interface CloudData {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  speed: number;
  phase: number;
}

export const CloudSystem = ({
  count = 15,
  coverage = 0.6,
  speed = 0.3,
  darkness = 0.3,
}: CloudSystemProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const clouds = useMemo<CloudData[]>(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        5 + Math.random() * 4,
        -5 - Math.random() * 10
      ),
      scale: new THREE.Vector3(
        2 + Math.random() * 4,
        0.5 + Math.random() * 1,
        2 + Math.random() * 3
      ),
      speed: 0.02 + Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    timeRef.current += delta;

    groupRef.current.children.forEach((cloud, i) => {
      const data = clouds[i];
      if (!data) return;

      // Drift clouds slowly
      cloud.position.x += data.speed * speed * 60 * delta;
      
      // Subtle vertical bobbing
      cloud.position.y = data.position.y + Math.sin(timeRef.current * 0.5 + data.phase) * 0.2;

      // Reset position when cloud moves off screen
      if (cloud.position.x > 20) {
        cloud.position.x = -20;
      }
    });
  });

  const cloudMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0, 0, 1 - darkness),
      transparent: true,
      opacity: 0.4 * coverage,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, [coverage, darkness]);

  return (
    <group ref={groupRef}>
      {clouds.map((cloud, i) => (
        <mesh
          key={i}
          position={cloud.position}
          scale={cloud.scale}
        >
          <sphereGeometry args={[1, 16, 16]} />
          <primitive object={cloudMaterial.clone()} attach="material" />
        </mesh>
      ))}
    </group>
  );
};
