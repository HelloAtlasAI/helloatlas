import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 200;
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 50;
      pos[i3 + 1] = (Math.random() - 0.5) * 30;
      pos[i3 + 2] = (Math.random() - 0.5) * 20;
      
      vel[i3] = (Math.random() - 0.5) * 0.02;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.02;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    
    return [pos, vel];
  }, []);
  
  const sizes = useMemo(() => {
    const s = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      s[i] = Math.random() * 3 + 1;
    }
    return s;
  }, []);
  
  useFrame(() => {
    if (!pointsRef.current) return;
    
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      posArray[i3] += velocities[i3];
      posArray[i3 + 1] += velocities[i3 + 1];
      posArray[i3 + 2] += velocities[i3 + 2];
      
      // Wrap around bounds
      if (posArray[i3] > 25) posArray[i3] = -25;
      if (posArray[i3] < -25) posArray[i3] = 25;
      if (posArray[i3 + 1] > 15) posArray[i3 + 1] = -15;
      if (posArray[i3 + 1] < -15) posArray[i3 + 1] = 15;
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
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        color="#06b6d4"
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FloatingOrbs() {
  const group = useRef<THREE.Group>(null);
  
  const orbs = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 15 - 5,
      ] as [number, number, number],
      scale: Math.random() * 2 + 1,
      speed: Math.random() * 0.3 + 0.1,
      color: ['#06b6d4', '#8b5cf6', '#3b82f6'][i % 3],
    }));
  }, []);
  
  useFrame(({ clock }) => {
    if (!group.current) return;
    
    group.current.children.forEach((child, i) => {
      const orb = orbs[i];
      child.position.y = orb.position[1] + Math.sin(clock.elapsedTime * orb.speed) * 2;
      child.position.x = orb.position[0] + Math.cos(clock.elapsedTime * orb.speed * 0.5) * 1;
    });
  });
  
  return (
    <group ref={group}>
      {orbs.map((orb, i) => (
        <mesh key={i} position={orb.position}>
          <sphereGeometry args={[orb.scale, 16, 16]} />
          <meshBasicMaterial
            color={orb.color}
            transparent
            opacity={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

export const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 70%),
            linear-gradient(180deg, #0a0a0f 0%, #0d0d15 50%, #0a0a0f 100%)
          `,
        }}
      />
      
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Particles />
        <FloatingOrbs />
      </Canvas>
      
      {/* Vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
};
