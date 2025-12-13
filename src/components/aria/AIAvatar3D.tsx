import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere, Environment, Float } from "@react-three/drei";
import * as THREE from "three";
import { AIState } from "./AIOrb";

interface AvatarCoreProps {
  state: AIState;
  audioLevel: number;
}

const AvatarCore = ({ state, audioLevel }: AvatarCoreProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const outerGlowRef = useRef<THREE.Mesh>(null);

  // Animated distortion based on state
  const distortionSpeed = useMemo(() => {
    switch (state) {
      case "speaking": return 4;
      case "thinking": return 2;
      case "listening": return 1.5;
      default: return 0.5;
    }
  }, [state]);

  const distortionIntensity = useMemo(() => {
    switch (state) {
      case "speaking": return 0.3 + audioLevel * 0.5;
      case "thinking": return 0.4;
      case "listening": return 0.2;
      default: return 0.1;
    }
  }, [state, audioLevel]);

  useFrame((frameState) => {
    const time = frameState.clock.elapsedTime;

    if (meshRef.current) {
      // Subtle rotation
      meshRef.current.rotation.y = Math.sin(time * 0.3) * 0.1;
      meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.05;

      // Scale pulse based on state
      const baseScale = 1;
      let scalePulse = 0;
      
      if (state === "speaking") {
        scalePulse = Math.sin(time * 8) * 0.05 * audioLevel;
      } else if (state === "thinking") {
        scalePulse = Math.sin(time * 3) * 0.02;
      } else if (state === "listening") {
        scalePulse = Math.sin(time * 2) * 0.03;
      }

      meshRef.current.scale.setScalar(baseScale + scalePulse);
    }

    if (innerRef.current) {
      innerRef.current.rotation.y = time * 0.5;
      innerRef.current.rotation.z = Math.sin(time * 0.5) * 0.2;
    }

    if (outerGlowRef.current) {
      const glowPulse = state === "speaking" 
        ? 1.3 + audioLevel * 0.3 
        : 1.3 + Math.sin(time * 2) * 0.1;
      outerGlowRef.current.scale.setScalar(glowPulse);
    }
  });

  return (
    <group>
      {/* Outer glow sphere */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial 
          color="#00d4ff" 
          transparent 
          opacity={0.05} 
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main avatar sphere */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh ref={meshRef}>
          <Sphere args={[1, 64, 64]}>
            <MeshDistortMaterial
              color="#0891b2"
              attach="material"
              distort={distortionIntensity}
              speed={distortionSpeed}
              roughness={0.2}
              metalness={0.8}
              envMapIntensity={1}
            />
          </Sphere>
        </mesh>

        {/* Inner core */}
        <mesh ref={innerRef} scale={0.6}>
          <Sphere args={[1, 32, 32]}>
            <MeshDistortMaterial
              color="#a855f7"
              attach="material"
              distort={distortionIntensity * 1.5}
              speed={distortionSpeed * 1.5}
              roughness={0.1}
              metalness={0.9}
              transparent
              opacity={0.8}
            />
          </Sphere>
        </mesh>

        {/* Bright core center */}
        <mesh scale={0.25}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </Float>

      {/* Orbiting particles */}
      <OrbitingParticles state={state} />
    </group>
  );
};

const OrbitingParticles = ({ state }: { state: AIState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const particleCount = 12;

  useFrame((frameState) => {
    if (groupRef.current) {
      const speed = state === "thinking" ? 2 : state === "speaking" ? 1.5 : 0.5;
      groupRef.current.rotation.y = frameState.clock.elapsedTime * speed * 0.3;
      groupRef.current.rotation.x = Math.sin(frameState.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {[...Array(particleCount)].map((_, i) => {
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 1.8 + (i % 3) * 0.3;
        const y = Math.sin(i * 0.8) * 0.5;
        
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              y,
              Math.sin(angle) * radius,
            ]}
          >
            <sphereGeometry args={[0.03 + (i % 3) * 0.01, 8, 8]} />
            <meshBasicMaterial 
              color={i % 2 === 0 ? "#00d4ff" : "#a855f7"} 
              transparent 
              opacity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
};

interface AIAvatar3DProps {
  state: AIState;
  audioLevel?: number;
  className?: string;
}

export const AIAvatar3D = ({ state, audioLevel = 0, className }: AIAvatar3DProps) => {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00d4ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
        <spotLight position={[0, 5, 0]} intensity={0.8} angle={0.5} penumbra={1} />
        
        <AvatarCore state={state} audioLevel={audioLevel} />
        
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};
