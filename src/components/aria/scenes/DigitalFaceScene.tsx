import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface DigitalFaceSceneProps {
  state: AIState;
  audioLevel?: number;
  isSpeaking?: boolean;
}

// Speech burst particles - explode outward from mouth when speaking
const SpeechBurstParticles = ({
  audioLevel,
  isSpeaking,
}: {
  audioLevel: number;
  isSpeaking: boolean;
}) => {
  const particlesRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const lifetimesRef = useRef<Float32Array | null>(null);
  const count = 300;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    velocitiesRef.current = new Float32Array(count * 3);
    lifetimesRef.current = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Start at mouth position
      pos[i * 3] = (Math.random() - 0.5) * 0.08;
      pos[i * 3 + 1] = -0.12 + (Math.random() - 0.5) * 0.04;
      pos[i * 3 + 2] = 0.35 + Math.random() * 0.05;

      // Random outward velocities - more forward and spread
      const angle = (Math.random() - 0.5) * Math.PI * 0.6;
      const upAngle = (Math.random() - 0.5) * Math.PI * 0.3;
      velocitiesRef.current[i * 3] = Math.sin(angle) * 0.015;
      velocitiesRef.current[i * 3 + 1] = Math.sin(upAngle) * 0.01;
      velocitiesRef.current[i * 3 + 2] = Math.cos(angle) * 0.025 + 0.01;
      
      lifetimesRef.current[i] = Math.random();
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current || !velocitiesRef.current || !lifetimesRef.current) return;

    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const vel = velocitiesRef.current;
    const life = lifetimesRef.current;
    const speedMultiplier = isSpeaking ? (1 + audioLevel * 3) : 0.1;

    for (let i = 0; i < count; i++) {
      life[i] += delta * (isSpeaking ? 1.5 : 0.3);
      
      if (life[i] > 1 || !isSpeaking) {
        // Reset particle to mouth
        posArray[i * 3] = (Math.random() - 0.5) * 0.08;
        posArray[i * 3 + 1] = -0.12 + (Math.random() - 0.5) * 0.04;
        posArray[i * 3 + 2] = 0.35 + Math.random() * 0.05;
        
        // New random velocity
        const angle = (Math.random() - 0.5) * Math.PI * 0.6;
        const upAngle = (Math.random() - 0.5) * Math.PI * 0.3;
        vel[i * 3] = Math.sin(angle) * 0.015;
        vel[i * 3 + 1] = Math.sin(upAngle) * 0.01;
        vel[i * 3 + 2] = Math.cos(angle) * 0.025 + 0.01;
        
        life[i] = 0;
      } else {
        // Move outward
        posArray[i * 3] += vel[i * 3] * speedMultiplier * delta * 60;
        posArray[i * 3 + 1] += vel[i * 3 + 1] * speedMultiplier * delta * 60;
        posArray[i * 3 + 2] += vel[i * 3 + 2] * speedMultiplier * delta * 60;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const particleSize = 0.012 + (isSpeaking ? audioLevel * 0.015 : 0);
  const particleOpacity = isSpeaking ? 0.5 + audioLevel * 0.4 : 0.1;

  return (
    <points ref={particlesRef} renderOrder={50}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={particleSize}
        color={isSpeaking && audioLevel > 0.5 ? "#00ffff" : "#00ff88"}
        transparent
        opacity={particleOpacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// High-quality forward-facing eye with realistic details
const RealisticEye = ({
  position,
  eyeRef,
  eyelidRef,
  isLeft = true,
}: {
  position: [number, number, number];
  eyeRef: React.RefObject<THREE.Group>;
  eyelidRef: React.RefObject<THREE.Mesh>;
  isLeft?: boolean;
}) => {
  return (
    <group position={position}>
      {/* Deep eye socket with ambient occlusion */}
      <mesh position={[0, 0, -0.03]} renderOrder={1}>
        <sphereGeometry args={[0.095, 64, 64]} />
        <meshStandardMaterial 
          color="#08080f" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Orbital bone rim - gives depth */}
      <mesh position={[0, 0.025, -0.015]} rotation={[0.1, 0, 0]} renderOrder={2}>
        <torusGeometry args={[0.085, 0.012, 16, 48, Math.PI * 1.2]} />
        <meshStandardMaterial 
          color="#2a2a4a" 
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Eyeball - visible sclera with subtle veining */}
      <mesh renderOrder={3}>
        <sphereGeometry args={[0.075, 96, 96]} />
        <meshPhysicalMaterial
          color="#e8e8f8"
          roughness={0.15}
          metalness={0.05}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Sclera blood vessels hint */}
      <mesh position={[isLeft ? 0.035 : -0.035, 0.015, 0.055]} renderOrder={4}>
        <planeGeometry args={[0.018, 0.003]} />
        <meshBasicMaterial color="#aa6666" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh position={[isLeft ? 0.03 : -0.03, -0.01, 0.058]} rotation={[0, 0, 0.3]} renderOrder={4}>
        <planeGeometry args={[0.012, 0.002]} />
        <meshBasicMaterial color="#aa6666" transparent opacity={0.1} depthWrite={false} />
      </mesh>

      {/* Cornea dome - refractive surface */}
      <mesh position={[0, 0, 0.035]} renderOrder={5}>
        <sphereGeometry args={[0.048, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.12}
          roughness={0.02}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0}
          ior={1.376}
        />
      </mesh>

      {/* Eye tracking group - iris and pupil */}
      <group ref={eyeRef}>
        {/* Iris base - vibrant with depth */}
        <mesh position={[0, 0, 0.045]} renderOrder={10}>
          <circleGeometry args={[0.042, 128]} />
          <meshPhysicalMaterial
            color="#00a8cc"
            emissive="#00d4ff"
            emissiveIntensity={0.6}
            metalness={0.5}
            roughness={0.2}
            clearcoat={0.5}
          />
        </mesh>

        {/* Limbal ring - dark outer edge */}
        <mesh position={[0, 0, 0.048]} renderOrder={11}>
          <ringGeometry args={[0.035, 0.042, 128]} />
          <meshBasicMaterial color="#004466" transparent opacity={0.7} depthWrite={false} />
        </mesh>

        {/* Collarette - inner iris ring */}
        <mesh position={[0, 0, 0.052]} renderOrder={12}>
          <ringGeometry args={[0.018, 0.024, 128]} />
          <meshBasicMaterial color="#00ccee" transparent opacity={0.5} depthWrite={false} />
        </mesh>

        {/* Radial fibers for iris texture */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[0, 0, 0.055]}
              rotation={[0, 0, angle]}
              renderOrder={13}
            >
              <planeGeometry args={[0.0015, 0.022]} />
              <meshBasicMaterial
                color={i % 2 === 0 ? "#00ddff" : "#008899"}
                transparent
                opacity={0.4}
                depthWrite={false}
              />
            </mesh>
          );
        })}

        {/* Pupil - deep black with subtle glow edge */}
        <mesh position={[0, 0, 0.058]} renderOrder={14}>
          <circleGeometry args={[0.014, 64]} />
          <meshBasicMaterial color="#000000" />
        </mesh>

        {/* Pupil glow ring */}
        <mesh position={[0, 0, 0.059]} renderOrder={15}>
          <ringGeometry args={[0.013, 0.016, 64]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.3} depthWrite={false} />
        </mesh>

        {/* Primary specular highlight */}
        <mesh position={[0.015, 0.015, 0.065]} renderOrder={20}>
          <circleGeometry args={[0.008, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthWrite={false} />
        </mesh>

        {/* Secondary highlight */}
        <mesh position={[-0.01, 0.018, 0.063]} renderOrder={20}>
          <circleGeometry args={[0.004, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      </group>

      {/* Upper eyelid - animated */}
      <mesh ref={eyelidRef} position={[0, 0.06, 0.035]} rotation={[0.1, 0, 0]} renderOrder={25}>
        <capsuleGeometry args={[0.012, 0.075, 24, 48]} />
        <meshStandardMaterial 
          color="#252540" 
          metalness={0.2} 
          roughness={0.5}
        />
      </mesh>

      {/* Eyelid crease shadow */}
      <mesh position={[0, 0.08, 0.02]} renderOrder={24}>
        <torusGeometry args={[0.065, 0.005, 8, 32, Math.PI]} />
        <meshBasicMaterial color="#0a0a18" transparent opacity={0.5} depthWrite={false} />
      </mesh>

      {/* Lower eyelid */}
      <mesh position={[0, -0.055, 0.04]} rotation={[Math.PI, 0, 0]} renderOrder={25}>
        <capsuleGeometry args={[0.008, 0.06, 16, 32]} />
        <meshStandardMaterial color="#252540" metalness={0.2} roughness={0.5} />
      </mesh>

      {/* Eyelashes - subtle */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = ((i - 4.5) / 10) * Math.PI * 0.5;
        return (
          <mesh
            key={`lash-${i}`}
            position={[
              Math.sin(angle) * 0.07,
              0.065 + Math.cos(angle) * 0.012,
              0.045 + Math.abs(Math.sin(angle)) * 0.008,
            ]}
            rotation={[0.15, 0, angle * 0.25]}
            renderOrder={26}
          >
            <capsuleGeometry args={[0.0015, 0.012, 4, 8]} />
            <meshBasicMaterial color="#0a0a15" />
          </mesh>
        );
      })}

      {/* Eye glow ring - digital accent */}
      <mesh position={[0, 0, 0.03]} renderOrder={27}>
        <ringGeometry args={[0.073, 0.082, 128]} />
        <meshBasicMaterial 
          color="#00d4ff" 
          transparent 
          opacity={0.5} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner corner (caruncle) */}
      <mesh position={[isLeft ? 0.065 : -0.065, -0.008, 0.03]} renderOrder={23}>
        <sphereGeometry args={[0.01, 16, 16]} />
        <meshStandardMaterial color="#cc9999" roughness={0.6} />
      </mesh>
    </group>
  );
};

// Anatomically detailed nose
const DetailedNose = () => {
  return (
    <group position={[0, 0.01, 0.32]}>
      {/* Nasion (bridge root between eyes) */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.022, 32, 32]} />
        <meshPhysicalMaterial 
          color="#2a2a4a" 
          metalness={0.2} 
          roughness={0.5}
          clearcoat={0.1}
        />
      </mesh>

      {/* Bridge - curved ridge */}
      <mesh position={[0, 0.05, 0.02]} rotation={[0.12, 0, 0]}>
        <capsuleGeometry args={[0.016, 0.07, 24, 48]} />
        <meshPhysicalMaterial 
          color="#2a2a4a" 
          metalness={0.2} 
          roughness={0.5}
          clearcoat={0.1}
        />
      </mesh>

      {/* Dorsum (main ridge body) */}
      <mesh position={[0, 0.02, 0.025]}>
        <boxGeometry args={[0.022, 0.05, 0.018]} />
        <meshPhysicalMaterial color="#2a2a4a" metalness={0.2} roughness={0.5} />
      </mesh>

      {/* Nose tip - bulbous, prominent */}
      <mesh position={[0, -0.025, 0.04]}>
        <sphereGeometry args={[0.028, 48, 48]} />
        <meshPhysicalMaterial
          color="#2a2a4a"
          metalness={0.25}
          roughness={0.4}
          clearcoat={0.15}
        />
      </mesh>

      {/* Tip definition - bifurcated hint */}
      <mesh position={[-0.007, -0.028, 0.05]}>
        <sphereGeometry args={[0.013, 24, 24]} />
        <meshPhysicalMaterial color="#2a2a4a" metalness={0.25} roughness={0.4} />
      </mesh>
      <mesh position={[0.007, -0.028, 0.05]}>
        <sphereGeometry args={[0.013, 24, 24]} />
        <meshPhysicalMaterial color="#2a2a4a" metalness={0.25} roughness={0.4} />
      </mesh>

      {/* Left nostril */}
      <group position={[-0.018, -0.04, 0.02]}>
        <mesh rotation={[0.2, 0.35, 0]}>
          <torusGeometry args={[0.01, 0.005, 16, 24, Math.PI]} />
          <meshBasicMaterial color="#08080f" />
        </mesh>
        {/* Ala (nostril wing) */}
        <mesh position={[-0.008, 0, 0.008]}>
          <sphereGeometry args={[0.016, 24, 24]} />
          <meshPhysicalMaterial color="#2a2a4a" metalness={0.2} roughness={0.5} />
        </mesh>
      </group>

      {/* Right nostril */}
      <group position={[0.018, -0.04, 0.02]}>
        <mesh rotation={[0.2, -0.35, 0]}>
          <torusGeometry args={[0.01, 0.005, 16, 24, Math.PI]} />
          <meshBasicMaterial color="#08080f" />
        </mesh>
        <mesh position={[0.008, 0, 0.008]}>
          <sphereGeometry args={[0.016, 24, 24]} />
          <meshPhysicalMaterial color="#2a2a4a" metalness={0.2} roughness={0.5} />
        </mesh>
      </group>

      {/* Columella (between nostrils) */}
      <mesh position={[0, -0.042, 0.03]}>
        <boxGeometry args={[0.01, 0.012, 0.008]} />
        <meshPhysicalMaterial color="#2a2a4a" metalness={0.2} roughness={0.5} />
      </mesh>

      {/* Digital accent line */}
      <mesh position={[0, 0.015, 0.05]}>
        <boxGeometry args={[0.002, 0.1, 0.002]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};

// Anatomical lips with mouth cavity
const DetailedLips = ({
  mouthRef,
  isSpeaking,
  audioLevel,
}: {
  mouthRef: React.RefObject<THREE.Group>;
  isSpeaking: boolean;
  audioLevel: number;
}) => {
  return (
    <group ref={mouthRef} position={[0, -0.12, 0.3]}>
      {/* Upper lip - Cupid's bow */}
      <mesh position={[0, 0.015, 0]}>
        <torusGeometry args={[0.045, 0.014, 32, 64, Math.PI]} />
        <meshPhysicalMaterial
          color="#3a2a3a"
          metalness={0.15}
          roughness={0.35}
          clearcoat={0.2}
        />
      </mesh>

      {/* Cupid's bow peaks */}
      <mesh position={[-0.018, 0.025, 0.008]}>
        <sphereGeometry args={[0.01, 32, 32]} />
        <meshPhysicalMaterial color="#3a2a3a" metalness={0.15} roughness={0.35} />
      </mesh>
      <mesh position={[0.018, 0.025, 0.008]}>
        <sphereGeometry args={[0.01, 32, 32]} />
        <meshPhysicalMaterial color="#3a2a3a" metalness={0.15} roughness={0.35} />
      </mesh>

      {/* Philtrum columns */}
      <mesh position={[-0.008, 0.04, 0.015]}>
        <capsuleGeometry args={[0.003, 0.028, 16, 32]} />
        <meshStandardMaterial color="#2a2a4a" metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0.008, 0.04, 0.015]}>
        <capsuleGeometry args={[0.003, 0.028, 16, 32]} />
        <meshStandardMaterial color="#2a2a4a" metalness={0.2} roughness={0.5} />
      </mesh>

      {/* Lower lip - fuller */}
      <mesh position={[0, -0.015, 0.008]} rotation={[Math.PI, 0, 0]}>
        <torusGeometry args={[0.04, 0.018, 32, 64, Math.PI]} />
        <meshPhysicalMaterial
          color="#3a2a3a"
          metalness={0.15}
          roughness={0.3}
          clearcoat={0.25}
        />
      </mesh>

      {/* Mouth cavity (dark inside) */}
      <mesh position={[0, 0, -0.008]}>
        <capsuleGeometry args={[0.012, 0.05, 24, 48]} />
        <meshBasicMaterial color="#050508" />
      </mesh>

      {/* Teeth hint when speaking */}
      {isSpeaking && audioLevel > 0.25 && (
        <mesh position={[0, 0.006, 0.003]}>
          <boxGeometry args={[0.04, 0.01, 0.006]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.25} />
        </mesh>
      )}

      {/* Lip outline glow */}
      <mesh position={[0, 0, 0.015]}>
        <torusGeometry args={[0.052, 0.006, 24, 96]} />
        <meshBasicMaterial 
          color="#00ff88" 
          transparent 
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Vermillion border */}
      <mesh position={[0, 0.028, 0.012]}>
        <torusGeometry args={[0.048, 0.002, 16, 64, Math.PI]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
};

// Main forward-facing face component - completely redesigned
const RealisticFace = ({
  state,
  audioLevel = 0,
  isSpeaking = false,
}: {
  state: AIState;
  audioLevel: number;
  isSpeaking: boolean;
}) => {
  const faceRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const leftEyelidRef = useRef<THREE.Mesh>(null);
  const rightEyelidRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Group>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);

  const [blinkProgress, setBlinkProgress] = useState(0);
  const eyeTargetRef = useRef(new THREE.Vector3(0, 0, 1));
  const smoothedRotation = useRef({ x: 0, y: 0 });

  // Random eye movements and blinks
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.65) {
        setBlinkProgress(1);
        setTimeout(() => setBlinkProgress(0.5), 70);
        setTimeout(() => setBlinkProgress(0), 140);
      }
    }, 2800);

    const eyeInterval = setInterval(() => {
      eyeTargetRef.current.set(
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.15,
        1
      );
    }, 1800);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(eyeInterval);
    };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Smooth head movement
    if (faceRef.current) {
      const targetY = Math.sin(t * 0.3) * 0.04;
      const targetX = Math.sin(t * 0.18) * 0.015;
      
      smoothedRotation.current.y = THREE.MathUtils.lerp(smoothedRotation.current.y, targetY, 0.03);
      smoothedRotation.current.x = THREE.MathUtils.lerp(smoothedRotation.current.x, targetX, 0.03);
      
      faceRef.current.rotation.y = smoothedRotation.current.y;
      faceRef.current.rotation.x = smoothedRotation.current.x;
      faceRef.current.position.y = Math.sin(t * 0.4) * 0.008;
    }

    // Eye tracking with smooth interpolation
    const target = eyeTargetRef.current;
    [leftEyeRef, rightEyeRef].forEach((ref) => {
      if (ref.current) {
        ref.current.rotation.y = THREE.MathUtils.lerp(
          ref.current.rotation.y,
          target.x * 0.2,
          0.05
        );
        ref.current.rotation.x = THREE.MathUtils.lerp(
          ref.current.rotation.x,
          -target.y * 0.15,
          0.05
        );
      }
    });

    // Eyelid blink animation
    if (leftEyelidRef.current && rightEyelidRef.current) {
      const lidOffset = blinkProgress * 0.06;
      leftEyelidRef.current.position.y = 0.06 - lidOffset;
      rightEyelidRef.current.position.y = 0.06 - lidOffset;
      leftEyelidRef.current.scale.y = 1 + blinkProgress * 2.2;
      rightEyelidRef.current.scale.y = 1 + blinkProgress * 2.2;
    }

    // Mouth animation for speech
    if (mouthRef.current) {
      const mouthScale = isSpeaking
        ? 1 + audioLevel * 0.35 + Math.sin(t * 18) * 0.06 * audioLevel
        : state === "thinking"
        ? 1 + Math.sin(t * 1.8) * 0.025
        : 1;

      mouthRef.current.scale.y = mouthScale;
    }

    // Eyebrow expressions
    if (leftBrowRef.current && rightBrowRef.current) {
      const browRaise = state === "listening" ? 0.015 : state === "thinking" ? -0.008 : 0;
      const breathe = Math.sin(t * 0.5) * 0.002;
      
      leftBrowRef.current.position.y = 0.19 + browRaise + breathe;
      rightBrowRef.current.position.y = 0.19 + browRaise + breathe;
      leftBrowRef.current.rotation.z = state === "thinking" ? 0.08 : 0;
      rightBrowRef.current.rotation.z = state === "thinking" ? -0.08 : 0;
    }
  });

  return (
    <group ref={faceRef} scale={0.85} position={[0, 0, 0]}>
      {/* Head base - forward-facing half-sphere with visible surface */}
      <mesh renderOrder={0}>
        <sphereGeometry args={[0.38, 128, 128, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshPhysicalMaterial
          color="#2a2a4a"
          metalness={0.25}
          roughness={0.45}
          clearcoat={0.15}
          clearcoatRoughness={0.3}
          side={THREE.FrontSide}
          depthWrite={true}
        />
      </mesh>

      {/* Face plate - gives frontal depth and lighter tone */}
      <mesh position={[0, 0.02, 0.28]} renderOrder={1}>
        <sphereGeometry args={[0.2, 96, 96, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshPhysicalMaterial
          color="#3a3a5e"
          metalness={0.2}
          roughness={0.5}
          clearcoat={0.1}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Forehead */}
      <mesh position={[0, 0.18, 0.22]} renderOrder={2}>
        <sphereGeometry args={[0.16, 64, 64]} />
        <meshPhysicalMaterial
          color="#2a2a4a"
          metalness={0.2}
          roughness={0.5}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Brow ridge - prominent */}
      <mesh position={[0, 0.1, 0.3]} renderOrder={3}>
        <capsuleGeometry args={[0.025, 0.18, 24, 48]} />
        <meshPhysicalMaterial
          color="#252545"
          metalness={0.2}
          roughness={0.55}
        />
      </mesh>

      {/* Cheekbones - prominent */}
      <mesh position={[-0.18, 0, 0.22]} rotation={[0, -0.3, 0]} renderOrder={4}>
        <sphereGeometry args={[0.09, 48, 48]} />
        <meshPhysicalMaterial
          color="#2a2a4a"
          metalness={0.2}
          roughness={0.5}
          clearcoat={0.1}
        />
      </mesh>
      <mesh position={[0.18, 0, 0.22]} rotation={[0, 0.3, 0]} renderOrder={4}>
        <sphereGeometry args={[0.09, 48, 48]} />
        <meshPhysicalMaterial
          color="#2a2a4a"
          metalness={0.2}
          roughness={0.5}
          clearcoat={0.1}
        />
      </mesh>

      {/* Jaw structure */}
      <mesh position={[0, -0.18, 0.18]} renderOrder={5}>
        <sphereGeometry args={[0.15, 64, 64]} />
        <meshPhysicalMaterial
          color="#2a2a4a"
          metalness={0.2}
          roughness={0.5}
        />
      </mesh>

      {/* Chin */}
      <mesh position={[0, -0.25, 0.24]} renderOrder={6}>
        <sphereGeometry args={[0.06, 48, 48]} />
        <meshPhysicalMaterial
          color="#2a2a4a"
          metalness={0.25}
          roughness={0.45}
          clearcoat={0.1}
        />
      </mesh>

      {/* Eye assemblies */}
      <RealisticEye
        position={[-0.1, 0.08, 0.26]}
        eyeRef={leftEyeRef}
        eyelidRef={leftEyelidRef}
        isLeft={true}
      />
      <RealisticEye
        position={[0.1, 0.08, 0.26]}
        eyeRef={rightEyeRef}
        eyelidRef={rightEyelidRef}
        isLeft={false}
      />

      {/* Eyebrows - digital accent */}
      <mesh ref={leftBrowRef} position={[-0.1, 0.19, 0.32]} rotation={[0, 0, 0.06]}>
        <capsuleGeometry args={[0.008, 0.06, 24, 48]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>
      <mesh ref={rightBrowRef} position={[0.1, 0.19, 0.32]} rotation={[0, 0, -0.06]}>
        <capsuleGeometry args={[0.008, 0.06, 24, 48]} />
        <meshBasicMaterial color="#00d4ff" />
      </mesh>

      {/* Nose */}
      <DetailedNose />

      {/* Lips and mouth */}
      <DetailedLips
        mouthRef={mouthRef}
        isSpeaking={isSpeaking}
        audioLevel={audioLevel}
      />

      {/* Forehead circuit lines */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.28 + i * 0.025, 0.22 - i * 0.02]} renderOrder={30}>
          <boxGeometry args={[0.16 - i * 0.03, 0.003, 0.003]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.4 - i * 0.1} />
        </mesh>
      ))}

      {/* Temple circuits */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.3, 0.06, 0.15]} renderOrder={30}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, i * 0.04, 0]} rotation={[0, side * 0.4, 0]}>
              <boxGeometry args={[0.04, 0.002, 0.002]} />
              <meshBasicMaterial color="#00d4ff" transparent opacity={0.35 - i * 0.1} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Chin circuit accent */}
      <mesh position={[0, -0.22, 0.32]} renderOrder={30}>
        <boxGeometry args={[0.06, 0.002, 0.002]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.35} />
      </mesh>

      {/* Outer rim glow */}
      <mesh scale={0.52} renderOrder={-5}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.04}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Fresnel rim light */}
      <mesh scale={0.55} renderOrder={-6}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#00ffaa"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Digital wireframe subtle overlay */}
      <mesh scale={0.42} renderOrder={35}>
        <icosahedronGeometry args={[1, 3]} />
        <meshBasicMaterial
          color="#00d4ff"
          wireframe
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// Holographic scanlines
const ScanlineEffect = ({ state }: { state: AIState }) => {
  const scanRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!scanRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 2.2 : 1;
    scanRef.current.position.y = Math.sin(t * speed) * 0.5;
    (scanRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.1 + Math.sin(t * 8) * 0.03;
  });

  return (
    <mesh ref={scanRef} position={[0, 0, 0.6]} renderOrder={60}>
      <planeGeometry args={[2, 0.006]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.12} depthWrite={false} />
    </mesh>
  );
};

// Particle aura
const ParticleAura = ({ state }: { state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const innerPointsRef = useRef<THREE.Points>(null);
  const count = 600;
  const innerCount = 300;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.6 + Math.random() * 0.4;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  const innerPositions = useMemo(() => {
    const pos = new Float32Array(innerCount * 3);
    for (let i = 0; i < innerCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.4 + Math.random() * 0.18;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.04;
      pointsRef.current.rotation.x = Math.sin(t * 0.25) * 0.08;
    }
    if (innerPointsRef.current) {
      innerPointsRef.current.rotation.y = -t * 0.06;
    }
  });

  const opacity = state === "thinking" ? 0.55 : state === "speaking" ? 0.4 : 0.22;

  return (
    <>
      <points ref={pointsRef} renderOrder={40}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.015}
          color="#00d4ff"
          transparent
          opacity={opacity}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <points ref={innerPointsRef} renderOrder={41}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={innerCount}
            array={innerPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.01}
          color="#00ff88"
          transparent
          opacity={opacity * 0.65}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  );
};

// Orbital data rings
const OrbitalRings = ({ state }: { state: AIState }) => {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 1.3 : 0.7;

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * speed * 0.25;
      ring1Ref.current.rotation.z = t * speed * 0.18;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = t * speed * 0.2;
      ring2Ref.current.rotation.x = Math.PI / 4 + t * speed * 0.12;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = t * speed * 0.15;
      ring3Ref.current.rotation.y = Math.PI / 3 + t * speed * 0.08;
    }
  });

  return (
    <group renderOrder={45}>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.8, 0.003, 16, 128]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.28} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[0.95, 0.0025, 16, 128]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.22} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[1.1, 0.0025, 16, 128]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.18} />
      </mesh>
    </group>
  );
};

export const DigitalFaceScene = ({
  state,
  audioLevel = 0,
  isSpeaking = false,
}: DigitalFaceSceneProps) => {
  return (
    <group>
      <RealisticFace state={state} audioLevel={audioLevel} isSpeaking={isSpeaking} />
      <SpeechBurstParticles audioLevel={audioLevel} isSpeaking={isSpeaking} />
      <ScanlineEffect state={state} />
      <ParticleAura state={state} />
      <OrbitalRings state={state} />
    </group>
  );
};
