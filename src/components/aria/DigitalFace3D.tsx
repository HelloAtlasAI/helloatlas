import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { AIState } from "./AIOrb";

interface DigitalFace3DProps {
  state: AIState;
  audioLevel?: number;
  isSpeaking?: boolean;
  className?: string;
}

// Procedural face geometry with morph targets
const DigitalFaceGeometry = ({ 
  state, 
  audioLevel = 0, 
  isSpeaking = false 
}: { 
  state: AIState; 
  audioLevel: number;
  isSpeaking: boolean;
}) => {
  const faceRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);
  
  // Blink state
  const [blinkProgress, setBlinkProgress] = useState(0);
  const lastBlinkRef = useRef(0);
  
  // Eye tracking target
  const eyeTargetRef = useRef(new THREE.Vector3(0, 0, 1));

  // Random eye movements and blinks
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setBlinkProgress(1);
        setTimeout(() => setBlinkProgress(0), 150);
      }
    }, 2000);

    const eyeInterval = setInterval(() => {
      eyeTargetRef.current.set(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.2,
        1
      );
    }, 3000);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(eyeInterval);
    };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    // Subtle head movement (breathing)
    if (faceRef.current) {
      faceRef.current.rotation.y = Math.sin(t * 0.5) * 0.05;
      faceRef.current.rotation.x = Math.sin(t * 0.3) * 0.02;
      faceRef.current.position.y = Math.sin(t * 0.7) * 0.01;
    }

    // Eye tracking with smooth interpolation
    if (leftPupilRef.current && rightPupilRef.current) {
      const target = eyeTargetRef.current;
      
      leftPupilRef.current.position.x = THREE.MathUtils.lerp(
        leftPupilRef.current.position.x,
        target.x * 0.03,
        0.1
      );
      leftPupilRef.current.position.y = THREE.MathUtils.lerp(
        leftPupilRef.current.position.y,
        target.y * 0.03,
        0.1
      );
      
      rightPupilRef.current.position.x = THREE.MathUtils.lerp(
        rightPupilRef.current.position.x,
        target.x * 0.03,
        0.1
      );
      rightPupilRef.current.position.y = THREE.MathUtils.lerp(
        rightPupilRef.current.position.y,
        target.y * 0.03,
        0.1
      );

      // Pupil dilation based on state
      const dilation = state === "thinking" ? 1.3 : state === "listening" ? 1.1 : 1;
      leftPupilRef.current.scale.setScalar(0.035 * dilation);
      rightPupilRef.current.scale.setScalar(0.035 * dilation);
    }

    // Blink animation
    if (leftEyeRef.current && rightEyeRef.current) {
      const blinkScale = 1 - blinkProgress * 0.9;
      leftEyeRef.current.scale.y = blinkScale;
      rightEyeRef.current.scale.y = blinkScale;
    }

    // Mouth animation based on audio level and speaking
    if (mouthRef.current) {
      const mouthOpen = isSpeaking 
        ? 0.3 + audioLevel * 0.7 + Math.sin(t * 15) * 0.1 * audioLevel
        : state === "thinking" 
          ? 0.1 + Math.sin(t * 2) * 0.05
          : 0.05;
      
      mouthRef.current.scale.y = 0.5 + mouthOpen * 2;
      mouthRef.current.scale.x = 1 - mouthOpen * 0.3;
    }

    // Eyebrow animation
    if (leftBrowRef.current && rightBrowRef.current) {
      const browRaise = state === "listening" ? 0.02 : state === "thinking" ? -0.01 : 0;
      leftBrowRef.current.position.y = 0.15 + browRaise + Math.sin(t * 0.8) * 0.005;
      rightBrowRef.current.position.y = 0.15 + browRaise + Math.sin(t * 0.8 + 0.5) * 0.005;
      
      // Slight angle for expression
      leftBrowRef.current.rotation.z = state === "thinking" ? 0.1 : 0;
      rightBrowRef.current.rotation.z = state === "thinking" ? -0.1 : 0;
    }
  });

  return (
    <group ref={faceRef}>
      {/* Head base - stylized geometric */}
      <mesh ref={headRef} position={[0, 0, -0.1]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.3}
          roughness={0.7}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Digital wireframe overlay */}
      <mesh position={[0, 0, -0.1]} scale={0.52}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#00d4ff"
          wireframe
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Left eye socket */}
      <group position={[-0.12, 0.05, 0.35]}>
        {/* Eye white/glow */}
        <mesh ref={leftEyeRef}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Iris */}
        <mesh position={[0, 0, 0.04]}>
          <circleGeometry args={[0.04, 32]} />
          <meshBasicMaterial color="#00d4ff" />
        </mesh>
        {/* Pupil */}
        <mesh ref={leftPupilRef} position={[0, 0, 0.05]}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        {/* Eye glow ring */}
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.055, 0.065, 32]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Right eye socket */}
      <group position={[0.12, 0.05, 0.35]}>
        <mesh ref={rightEyeRef}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <circleGeometry args={[0.04, 32]} />
          <meshBasicMaterial color="#00d4ff" />
        </mesh>
        <mesh ref={rightPupilRef} position={[0, 0, 0.05]}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.055, 0.065, 32]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Left eyebrow */}
      <mesh ref={leftBrowRef} position={[-0.12, 0.15, 0.38]}>
        <boxGeometry args={[0.08, 0.015, 0.01]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>

      {/* Right eyebrow */}
      <mesh ref={rightBrowRef} position={[0.12, 0.15, 0.38]}>
        <boxGeometry args={[0.08, 0.015, 0.01]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>

      {/* Nose bridge - subtle */}
      <mesh position={[0, -0.02, 0.4]}>
        <boxGeometry args={[0.02, 0.08, 0.02]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.3} />
      </mesh>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, -0.15, 0.38]}>
        <capsuleGeometry args={[0.03, 0.08, 8, 16]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>

      {/* Mouth glow outline */}
      <mesh position={[0, -0.15, 0.39]}>
        <ringGeometry args={[0.04, 0.05, 32]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.4} />
      </mesh>

      {/* Cheek circuits */}
      <mesh position={[-0.25, -0.05, 0.25]} rotation={[0, -0.5, 0]}>
        <planeGeometry args={[0.1, 0.15]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.1} wireframe />
      </mesh>
      <mesh position={[0.25, -0.05, 0.25]} rotation={[0, 0.5, 0]}>
        <planeGeometry args={[0.1, 0.15]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.1} wireframe />
      </mesh>

      {/* Forehead circuit lines */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.25 + i * 0.03, 0.35 - i * 0.02]}>
          <boxGeometry args={[0.2 - i * 0.04, 0.005, 0.005]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.3 - i * 0.1} />
        </mesh>
      ))}
    </group>
  );
};

// Holographic scanline overlay
const ScanlineOverlay = ({ state }: { state: AIState }) => {
  const scanRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (!scanRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 3 : 1;
    
    scanRef.current.position.y = Math.sin(t * speed) * 0.4;
    (scanRef.current.material as THREE.MeshBasicMaterial).opacity = 
      0.1 + Math.sin(t * 10) * 0.05;
  });

  return (
    <mesh ref={scanRef} position={[0, 0, 0.6]}>
      <planeGeometry args={[1.5, 0.01]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.15} />
    </mesh>
  );
};

// Particle dissolution effect
const ParticleAura = ({ state }: { state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 500;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.5 + Math.random() * 0.3;
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi) - 0.1;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      // Subtle floating motion
      posArray[idx + 1] += Math.sin(t + i * 0.1) * 0.0005;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y = t * 0.1;
  });

  const opacity = state === "thinking" ? 0.6 : state === "speaking" ? 0.4 : 0.2;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.01}
        color="#00d4ff"
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Glitch effect overlay
const GlitchEffect = ({ state }: { state: AIState }) => {
  const glitchRef = useRef<THREE.Mesh>(null);
  const [glitchActive, setGlitchActive] = useState(false);
  
  useEffect(() => {
    if (state === "thinking") {
      const interval = setInterval(() => {
        if (Math.random() > 0.85) {
          setGlitchActive(true);
          setTimeout(() => setGlitchActive(false), 50 + Math.random() * 100);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [state]);

  if (!glitchActive) return null;

  return (
    <mesh ref={glitchRef} position={[(Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.5, 0.5]}>
      <planeGeometry args={[0.5 + Math.random() * 0.3, 0.02]} />
      <meshBasicMaterial color="#ff0088" transparent opacity={0.5} />
    </mesh>
  );
};

// Main Digital Face Scene
const DigitalFaceScene = ({ 
  state, 
  audioLevel = 0,
  isSpeaking = false
}: { 
  state: AIState; 
  audioLevel: number;
  isSpeaking: boolean;
}) => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 2]} intensity={1} color="#ffffff" />
      <pointLight position={[-1, 1, 1]} intensity={0.5} color="#00d4ff" />
      <pointLight position={[1, 1, 1]} intensity={0.5} color="#00ff88" />
      <pointLight position={[0, -1, 1]} intensity={0.3} color="#6b21a8" />

      <DigitalFaceGeometry 
        state={state} 
        audioLevel={audioLevel}
        isSpeaking={isSpeaking}
      />
      <ScanlineOverlay state={state} />
      <ParticleAura state={state} />
      <GlitchEffect state={state} />

      <Environment preset="night" />
    </>
  );
};

export const DigitalFace3D = ({ 
  state, 
  audioLevel = 0,
  isSpeaking = false,
  className = "" 
}: DigitalFace3DProps) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 1.2], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <DigitalFaceScene 
          state={state} 
          audioLevel={audioLevel}
          isSpeaking={isSpeaking}
        />
      </Canvas>
    </div>
  );
};