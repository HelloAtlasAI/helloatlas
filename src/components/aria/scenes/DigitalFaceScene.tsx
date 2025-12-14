import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface DigitalFaceSceneProps {
  state: AIState;
  audioLevel?: number;
  isSpeaking?: boolean;
}

// ============================================
// COLOR PALETTE - ULTRA-VISIBLE
// ============================================
const COLORS = {
  // Base skin - LIGHT silvery-blue for visibility
  skinBase: "#a8b8d8",
  skinLight: "#b8c8e8", 
  skinShadow: "#7888b0",
  skinEmissive: "#4a6090",
  
  // Eyes - BRIGHT and glowing
  eyeSocket: "#1a2040",
  sclera: "#e8eeff",
  irisOuter: "#0088cc",
  irisCore: "#00ccff",
  irisGlow: "#00ffff",
  pupil: "#000008",
  
  // Lips
  lipColor: "#9080a8",
  lipGlow: "#00ff88",
  mouthCavity: "#080810",
  
  // Digital accents
  accentCyan: "#00ffff",
  accentGreen: "#00ff88",
  accentPurple: "#a855f7",
  accentPink: "#ec4899",
  
  // Glows
  glowCyan: "#00d4ff",
  glowGreen: "#00ffaa",
};

// ============================================
// SPEECH BURST PARTICLES
// ============================================
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
  const count = 200;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    velocitiesRef.current = new Float32Array(count * 3);
    lifetimesRef.current = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.06;
      pos[i * 3 + 1] = -0.08 + (Math.random() - 0.5) * 0.03;
      pos[i * 3 + 2] = 0.24 + Math.random() * 0.04;

      const angle = (Math.random() - 0.5) * Math.PI * 0.5;
      const upAngle = (Math.random() - 0.5) * Math.PI * 0.25;
      velocitiesRef.current[i * 3] = Math.sin(angle) * 0.012;
      velocitiesRef.current[i * 3 + 1] = Math.sin(upAngle) * 0.008;
      velocitiesRef.current[i * 3 + 2] = Math.cos(angle) * 0.02 + 0.008;
      
      lifetimesRef.current[i] = Math.random();
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (!particlesRef.current || !velocitiesRef.current || !lifetimesRef.current) return;

    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const vel = velocitiesRef.current;
    const life = lifetimesRef.current;
    const speedMultiplier = isSpeaking ? (1 + audioLevel * 2.5) : 0.1;

    for (let i = 0; i < count; i++) {
      life[i] += delta * (isSpeaking ? 1.2 : 0.25);
      
      if (life[i] > 1 || !isSpeaking) {
        posArray[i * 3] = (Math.random() - 0.5) * 0.06;
        posArray[i * 3 + 1] = -0.08 + (Math.random() - 0.5) * 0.03;
        posArray[i * 3 + 2] = 0.24 + Math.random() * 0.04;
        
        const angle = (Math.random() - 0.5) * Math.PI * 0.5;
        const upAngle = (Math.random() - 0.5) * Math.PI * 0.25;
        vel[i * 3] = Math.sin(angle) * 0.012;
        vel[i * 3 + 1] = Math.sin(upAngle) * 0.008;
        vel[i * 3 + 2] = Math.cos(angle) * 0.02 + 0.008;
        
        life[i] = 0;
      } else {
        posArray[i * 3] += vel[i * 3] * speedMultiplier * delta * 60;
        posArray[i * 3 + 1] += vel[i * 3 + 1] * speedMultiplier * delta * 60;
        posArray[i * 3 + 2] += vel[i * 3 + 2] * speedMultiplier * delta * 60;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const particleSize = 0.008 + (isSpeaking ? audioLevel * 0.012 : 0);
  const particleOpacity = isSpeaking ? 0.6 + audioLevel * 0.35 : 0.08;

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
        color={isSpeaking && audioLevel > 0.4 ? COLORS.accentCyan : COLORS.accentGreen}
        transparent
        opacity={particleOpacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// ============================================
// ULTRA-DETAILED EYE COMPONENT
// ============================================
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
      {/* DEEP EYE SOCKET - Concave depression */}
      <mesh position={[0, 0, -0.02]} renderOrder={1}>
        <sphereGeometry args={[0.068, 48, 48]} />
        <meshStandardMaterial 
          color={COLORS.eyeSocket}
          roughness={0.95}
          metalness={0.1}
        />
      </mesh>

      {/* ORBITAL BONE RIM - Upper arch definition */}
      <mesh position={[0, 0.018, -0.008]} rotation={[0.15, 0, 0]} renderOrder={2}>
        <torusGeometry args={[0.058, 0.008, 12, 36, Math.PI * 1.1]} />
        <meshStandardMaterial 
          color={COLORS.skinShadow}
          roughness={0.55}
          metalness={0.2}
        />
      </mesh>

      {/* EYEBALL - Bright white sclera */}
      <mesh renderOrder={3}>
        <sphereGeometry args={[0.052, 64, 64]} />
        <meshPhysicalMaterial
          color={COLORS.sclera}
          roughness={0.12}
          metalness={0.02}
          clearcoat={0.4}
          clearcoatRoughness={0.15}
        />
      </mesh>

      {/* Sclera vein hints */}
      <mesh position={[isLeft ? 0.025 : -0.025, 0.012, 0.038]} renderOrder={4}>
        <planeGeometry args={[0.012, 0.002]} />
        <meshBasicMaterial color="#bb7777" transparent opacity={0.15} depthWrite={false} />
      </mesh>

      {/* CORNEA DOME - Refractive clear surface */}
      <mesh position={[0, 0, 0.025]} renderOrder={5}>
        <sphereGeometry args={[0.035, 48, 48, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.15}
          roughness={0.01}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0}
          ior={1.38}
        />
      </mesh>

      {/* EYE TRACKING GROUP - Contains iris, pupil, highlights */}
      <group ref={eyeRef}>
        {/* IRIS GLOW HALO - Behind iris for bloom effect */}
        <mesh position={[0, 0, 0.028]} renderOrder={8}>
          <circleGeometry args={[0.042, 48]} />
          <meshBasicMaterial 
            color={COLORS.irisGlow}
            transparent 
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        
        {/* IRIS BASE - Main colored area, SUPER BRIGHT */}
        <mesh position={[0, 0, 0.032]} renderOrder={10}>
          <circleGeometry args={[0.032, 96]} />
          <meshPhysicalMaterial
            color={COLORS.irisCore}
            emissive={COLORS.irisGlow}
            emissiveIntensity={2.8}
            metalness={0.7}
            roughness={0.1}
            clearcoat={0.7}
          />
        </mesh>

        {/* LIMBAL RING - Dark outer edge of iris */}
        <mesh position={[0, 0, 0.034]} renderOrder={11}>
          <ringGeometry args={[0.027, 0.032, 96]} />
          <meshBasicMaterial color={COLORS.irisOuter} transparent opacity={0.85} depthWrite={false} />
        </mesh>

        {/* COLLARETTE - Inner iris ring, brighter */}
        <mesh position={[0, 0, 0.036]} renderOrder={12}>
          <ringGeometry args={[0.014, 0.02, 96]} />
          <meshBasicMaterial 
            color={COLORS.irisGlow}
            transparent 
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false} 
          />
        </mesh>

        {/* RADIAL FIBERS - Iris texture striations */}
        {Array.from({ length: 32 }).map((_, i) => {
          const angle = (i / 32) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[0, 0, 0.037]}
              rotation={[0, 0, angle]}
              renderOrder={13}
            >
              <planeGeometry args={[0.0015, 0.018]} />
              <meshBasicMaterial
                color={i % 2 === 0 ? COLORS.irisGlow : COLORS.irisCore}
                transparent
                opacity={0.7}
                depthWrite={false}
              />
            </mesh>
          );
        })}

        {/* PUPIL - Deep black center */}
        <mesh position={[0, 0, 0.04]} renderOrder={14}>
          <circleGeometry args={[0.011, 48]} />
          <meshBasicMaterial color={COLORS.pupil} />
        </mesh>

        {/* PUPIL GLOW RING - Electric edge */}
        <mesh position={[0, 0, 0.041]} renderOrder={15}>
          <ringGeometry args={[0.01, 0.014, 48]} />
          <meshBasicMaterial 
            color={COLORS.irisGlow}
            transparent 
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false} 
          />
        </mesh>

        {/* PRIMARY SPECULAR HIGHLIGHT - Large, bright */}
        <mesh position={[0.012, 0.012, 0.045]} renderOrder={20}>
          <circleGeometry args={[0.008, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.98} depthWrite={false} />
        </mesh>

        {/* SECONDARY HIGHLIGHT */}
        <mesh position={[-0.008, 0.014, 0.044]} renderOrder={20}>
          <circleGeometry args={[0.004, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.75} depthWrite={false} />
        </mesh>
        
        {/* THIRD HIGHLIGHT - Extra sparkle */}
        <mesh position={[-0.005, -0.006, 0.043]} renderOrder={20}>
          <circleGeometry args={[0.0025, 12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      </group>

      {/* UPPER EYELID - Animated blink */}
      <mesh ref={eyelidRef} position={[0, 0.042, 0.024]} rotation={[0.12, 0, 0]} renderOrder={25}>
        <capsuleGeometry args={[0.009, 0.052, 16, 32]} />
        <meshStandardMaterial 
          color={COLORS.skinShadow}
          metalness={0.15}
          roughness={0.5}
        />
      </mesh>

      {/* EYELID CREASE SHADOW */}
      <mesh position={[0, 0.055, 0.012]} renderOrder={24}>
        <torusGeometry args={[0.046, 0.004, 6, 24, Math.PI]} />
        <meshBasicMaterial color="#0a0a18" transparent opacity={0.45} depthWrite={false} />
      </mesh>

      {/* LOWER EYELID */}
      <mesh position={[0, -0.038, 0.028]} rotation={[Math.PI, 0, 0]} renderOrder={25}>
        <capsuleGeometry args={[0.006, 0.042, 12, 24]} />
        <meshStandardMaterial color={COLORS.skinShadow} metalness={0.15} roughness={0.5} />
      </mesh>

      {/* EYELASHES - Subtle, sparse */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = ((i - 3.5) / 8) * Math.PI * 0.45;
        return (
          <mesh
            key={`lash-${i}`}
            position={[
              Math.sin(angle) * 0.048,
              0.045 + Math.cos(angle) * 0.009,
              0.032 + Math.abs(Math.sin(angle)) * 0.006,
            ]}
            rotation={[0.12, 0, angle * 0.2]}
            renderOrder={26}
          >
            <capsuleGeometry args={[0.001, 0.008, 3, 6]} />
            <meshBasicMaterial color="#0a0a12" />
          </mesh>
        );
      })}

      {/* EYE GLOW RING - Digital accent around eye */}
      <mesh position={[0, 0, 0.02]} renderOrder={27}>
        <ringGeometry args={[0.05, 0.058, 96]} />
        <meshBasicMaterial 
          color={COLORS.glowCyan}
          transparent 
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* INNER CORNER (Caruncle) */}
      <mesh position={[isLeft ? 0.045 : -0.045, -0.005, 0.02]} renderOrder={23}>
        <sphereGeometry args={[0.007, 12, 12]} />
        <meshStandardMaterial color="#cc9999" roughness={0.6} />
      </mesh>
    </group>
  );
};

// ============================================
// ANATOMICAL NOSE - VISIBLE & CONNECTED
// ============================================
const DetailedNose = () => {
  return (
    <group position={[0, 0.01, 0.2]}>
      {/* NASION - Bridge root between eyes */}
      <mesh position={[0, 0.07, 0]}>
        <sphereGeometry args={[0.016, 24, 24]} />
        <meshPhysicalMaterial 
          color={COLORS.skinBase}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.12}
          metalness={0.35}
          roughness={0.45}
          clearcoat={0.12}
        />
      </mesh>

      {/* BRIDGE - Curved ridge connecting to tip */}
      <mesh position={[0, 0.035, 0.015]} rotation={[0.15, 0, 0]}>
        <capsuleGeometry args={[0.012, 0.052, 16, 32]} />
        <meshPhysicalMaterial 
          color={COLORS.skinBase}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.12}
          metalness={0.35}
          roughness={0.45}
          clearcoat={0.1}
        />
      </mesh>

      {/* DORSUM - Main ridge body */}
      <mesh position={[0, 0.015, 0.02]}>
        <boxGeometry args={[0.016, 0.035, 0.014]} />
        <meshPhysicalMaterial 
          color={COLORS.skinBase}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.12}
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>

      {/* NOSE TIP - Bulbous, the forward-most point */}
      <mesh position={[0, -0.016, 0.032]}>
        <sphereGeometry args={[0.02, 32, 32]} />
        <meshPhysicalMaterial
          color={COLORS.skinLight}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.15}
          metalness={0.38}
          roughness={0.35}
          clearcoat={0.18}
        />
      </mesh>

      {/* TIP DEFINITION - Bifurcated hint */}
      <mesh position={[-0.005, -0.018, 0.038]}>
        <sphereGeometry args={[0.009, 18, 18]} />
        <meshPhysicalMaterial 
          color={COLORS.skinLight}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.12}
          metalness={0.38}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0.005, -0.018, 0.038]}>
        <sphereGeometry args={[0.009, 18, 18]} />
        <meshPhysicalMaterial 
          color={COLORS.skinLight}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.12}
          metalness={0.38}
          roughness={0.35}
        />
      </mesh>

      {/* LEFT NOSTRIL */}
      <group position={[-0.013, -0.028, 0.015]}>
        <mesh rotation={[0.25, 0.3, 0]}>
          <torusGeometry args={[0.007, 0.003, 12, 18, Math.PI]} />
          <meshBasicMaterial color={COLORS.mouthCavity} />
        </mesh>
        {/* Ala (nostril wing) */}
        <mesh position={[-0.006, 0, 0.006]}>
          <sphereGeometry args={[0.011, 18, 18]} />
          <meshPhysicalMaterial 
            color={COLORS.skinBase}
            emissive={COLORS.skinEmissive}
            emissiveIntensity={0.1}
            metalness={0.35}
            roughness={0.45}
          />
        </mesh>
      </group>

      {/* RIGHT NOSTRIL */}
      <group position={[0.013, -0.028, 0.015]}>
        <mesh rotation={[0.25, -0.3, 0]}>
          <torusGeometry args={[0.007, 0.003, 12, 18, Math.PI]} />
          <meshBasicMaterial color={COLORS.mouthCavity} />
        </mesh>
        <mesh position={[0.006, 0, 0.006]}>
          <sphereGeometry args={[0.011, 18, 18]} />
          <meshPhysicalMaterial 
            color={COLORS.skinBase}
            emissive={COLORS.skinEmissive}
            emissiveIntensity={0.1}
            metalness={0.35}
            roughness={0.45}
          />
        </mesh>
      </group>

      {/* COLUMELLA - Between nostrils */}
      <mesh position={[0, -0.03, 0.022]}>
        <boxGeometry args={[0.007, 0.009, 0.006]} />
        <meshPhysicalMaterial 
          color={COLORS.skinBase}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.1}
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>

      {/* DIGITAL ACCENT LINE */}
      <mesh position={[0, 0.01, 0.042]}>
        <boxGeometry args={[0.002, 0.07, 0.002]} />
        <meshBasicMaterial color={COLORS.accentCyan} transparent opacity={0.75} />
      </mesh>
      
      {/* NOSE HIGHLIGHT GLOW */}
      <mesh position={[0, -0.014, 0.045]}>
        <sphereGeometry args={[0.014, 12, 12]} />
        <meshBasicMaterial 
          color={COLORS.glowCyan}
          transparent 
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// ============================================
// EXPRESSIVE LIPS WITH MOUTH CAVITY
// ============================================
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
    <group ref={mouthRef} position={[0, -0.085, 0.19]}>
      {/* UPPER LIP - Cupid's bow shape */}
      <mesh position={[0, 0.01, 0]}>
        <torusGeometry args={[0.032, 0.01, 24, 48, Math.PI]} />
        <meshPhysicalMaterial
          color={COLORS.lipColor}
          emissive="#503050"
          emissiveIntensity={0.15}
          metalness={0.12}
          roughness={0.32}
          clearcoat={0.22}
        />
      </mesh>

      {/* CUPID'S BOW PEAKS */}
      <mesh position={[-0.013, 0.017, 0.006]}>
        <sphereGeometry args={[0.007, 24, 24]} />
        <meshPhysicalMaterial color={COLORS.lipColor} metalness={0.12} roughness={0.32} />
      </mesh>
      <mesh position={[0.013, 0.017, 0.006]}>
        <sphereGeometry args={[0.007, 24, 24]} />
        <meshPhysicalMaterial color={COLORS.lipColor} metalness={0.12} roughness={0.32} />
      </mesh>

      {/* PHILTRUM COLUMNS */}
      <mesh position={[-0.006, 0.028, 0.01]}>
        <capsuleGeometry args={[0.002, 0.02, 12, 24]} />
        <meshStandardMaterial color={COLORS.skinShadow} metalness={0.18} roughness={0.5} />
      </mesh>
      <mesh position={[0.006, 0.028, 0.01]}>
        <capsuleGeometry args={[0.002, 0.02, 12, 24]} />
        <meshStandardMaterial color={COLORS.skinShadow} metalness={0.18} roughness={0.5} />
      </mesh>

      {/* LOWER LIP - Fuller */}
      <mesh position={[0, -0.01, 0.006]} rotation={[Math.PI, 0, 0]}>
        <torusGeometry args={[0.028, 0.013, 24, 48, Math.PI]} />
        <meshPhysicalMaterial
          color={COLORS.lipColor}
          emissive="#503050"
          emissiveIntensity={0.15}
          metalness={0.12}
          roughness={0.28}
          clearcoat={0.25}
        />
      </mesh>

      {/* MOUTH CAVITY - Dark interior */}
      <mesh position={[0, 0, -0.006]}>
        <capsuleGeometry args={[0.008, 0.035, 18, 36]} />
        <meshBasicMaterial color={COLORS.mouthCavity} />
      </mesh>

      {/* TEETH HINT - When speaking */}
      {isSpeaking && audioLevel > 0.2 && (
        <mesh position={[0, 0.004, 0.002]}>
          <boxGeometry args={[0.028, 0.007, 0.004]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.22} />
        </mesh>
      )}

      {/* LIP OUTLINE GLOW */}
      <mesh position={[0, 0, 0.012]}>
        <torusGeometry args={[0.038, 0.004, 18, 72]} />
        <meshBasicMaterial 
          color={COLORS.lipGlow}
          transparent 
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* VERMILLION BORDER */}
      <mesh position={[0, 0.02, 0.009]}>
        <torusGeometry args={[0.035, 0.0015, 12, 48, Math.PI]} />
        <meshBasicMaterial color={COLORS.glowCyan} transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ============================================
// MAIN FACE COMPONENT - COMPLETELY REBUILT
// ============================================
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
      if (Math.random() > 0.68) {
        setBlinkProgress(1);
        setTimeout(() => setBlinkProgress(0.5), 65);
        setTimeout(() => setBlinkProgress(0), 130);
      }
    }, 3000);

    const eyeInterval = setInterval(() => {
      eyeTargetRef.current.set(
        (Math.random() - 0.5) * 0.22,
        (Math.random() - 0.5) * 0.12,
        1
      );
    }, 2000);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(eyeInterval);
    };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Smooth head movement - subtle idle sway
    if (faceRef.current) {
      const targetY = Math.sin(t * 0.28) * 0.035;
      const targetX = Math.sin(t * 0.16) * 0.012;
      
      smoothedRotation.current.y = THREE.MathUtils.lerp(smoothedRotation.current.y, targetY, 0.025);
      smoothedRotation.current.x = THREE.MathUtils.lerp(smoothedRotation.current.x, targetX, 0.025);
      
      faceRef.current.rotation.y = smoothedRotation.current.y;
      faceRef.current.rotation.x = smoothedRotation.current.x;
      faceRef.current.position.y = Math.sin(t * 0.38) * 0.006;
    }

    // Eye tracking with smooth interpolation
    const target = eyeTargetRef.current;
    [leftEyeRef, rightEyeRef].forEach((ref) => {
      if (ref.current) {
        ref.current.rotation.y = THREE.MathUtils.lerp(
          ref.current.rotation.y,
          target.x * 0.18,
          0.045
        );
        ref.current.rotation.x = THREE.MathUtils.lerp(
          ref.current.rotation.x,
          -target.y * 0.12,
          0.045
        );
      }
    });

    // Eyelid blink animation
    if (leftEyelidRef.current && rightEyelidRef.current) {
      const lidOffset = blinkProgress * 0.045;
      leftEyelidRef.current.position.y = 0.042 - lidOffset;
      rightEyelidRef.current.position.y = 0.042 - lidOffset;
      leftEyelidRef.current.scale.y = 1 + blinkProgress * 2.5;
      rightEyelidRef.current.scale.y = 1 + blinkProgress * 2.5;
    }

    // Mouth animation for speech
    if (mouthRef.current) {
      const mouthScale = isSpeaking
        ? 1 + audioLevel * 0.3 + Math.sin(t * 16) * 0.05 * audioLevel
        : state === "thinking"
        ? 1 + Math.sin(t * 1.6) * 0.02
        : 1;

      mouthRef.current.scale.y = mouthScale;
    }

    // Eyebrow expressions
    if (leftBrowRef.current && rightBrowRef.current) {
      const browRaise = state === "listening" ? 0.012 : state === "thinking" ? -0.006 : 0;
      const breathe = Math.sin(t * 0.45) * 0.0015;
      
      leftBrowRef.current.position.y = 0.135 + browRaise + breathe;
      rightBrowRef.current.position.y = 0.135 + browRaise + breathe;
      leftBrowRef.current.rotation.z = state === "thinking" ? 0.06 : 0;
      rightBrowRef.current.rotation.z = state === "thinking" ? -0.06 : 0;
    }
  });

  return (
    <group ref={faceRef} scale={0.55} position={[0, 0, 0]}>
      {/* ==================== HEAD STRUCTURE ==================== */}
      
      {/* CRANIUM - Main head base, LIGHT color for visibility */}
      <mesh renderOrder={0}>
        <sphereGeometry args={[0.28, 96, 96, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshPhysicalMaterial
          color={COLORS.skinBase}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.1}
          metalness={0.32}
          roughness={0.42}
          clearcoat={0.15}
          clearcoatRoughness={0.25}
          side={THREE.FrontSide}
          depthWrite={true}
        />
      </mesh>

      {/* FACE PLANE - Forward-facing lighter surface */}
      <mesh position={[0, 0.015, 0.2]} renderOrder={1}>
        <sphereGeometry args={[0.15, 72, 72, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
        <meshPhysicalMaterial
          color={COLORS.skinLight}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.12}
          metalness={0.3}
          roughness={0.4}
          clearcoat={0.12}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* FOREHEAD */}
      <mesh position={[0, 0.13, 0.16]} renderOrder={2}>
        <sphereGeometry args={[0.12, 48, 48]} />
        <meshPhysicalMaterial
          color={COLORS.skinBase}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.1}
          metalness={0.32}
          roughness={0.45}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* BROW RIDGE - Prominent with subtle glow */}
      <mesh position={[0, 0.075, 0.22]} renderOrder={3}>
        <capsuleGeometry args={[0.018, 0.135, 18, 36]} />
        <meshPhysicalMaterial
          color={COLORS.skinShadow}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.08}
          metalness={0.28}
          roughness={0.5}
        />
      </mesh>

      {/* CHEEKBONES - Prominent, lighter to catch light */}
      <mesh position={[-0.135, 0, 0.16]} rotation={[0, -0.25, 0]} renderOrder={4}>
        <sphereGeometry args={[0.065, 36, 36]} />
        <meshPhysicalMaterial
          color={COLORS.skinLight}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.12}
          metalness={0.35}
          roughness={0.4}
          clearcoat={0.12}
        />
      </mesh>
      <mesh position={[0.135, 0, 0.16]} rotation={[0, 0.25, 0]} renderOrder={4}>
        <sphereGeometry args={[0.065, 36, 36]} />
        <meshPhysicalMaterial
          color={COLORS.skinLight}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.12}
          metalness={0.35}
          roughness={0.4}
          clearcoat={0.12}
        />
      </mesh>

      {/* JAW STRUCTURE */}
      <mesh position={[0, -0.13, 0.13]} renderOrder={5}>
        <sphereGeometry args={[0.11, 48, 48]} />
        <meshPhysicalMaterial
          color={COLORS.skinBase}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.1}
          metalness={0.32}
          roughness={0.45}
        />
      </mesh>

      {/* CHIN - Prominent, forward */}
      <mesh position={[0, -0.18, 0.175]} renderOrder={6}>
        <sphereGeometry args={[0.045, 36, 36]} />
        <meshPhysicalMaterial
          color={COLORS.skinLight}
          emissive={COLORS.skinEmissive}
          emissiveIntensity={0.12}
          metalness={0.35}
          roughness={0.4}
          clearcoat={0.12}
        />
      </mesh>

      {/* ==================== FACIAL FEATURES ==================== */}
      
      {/* EYE ASSEMBLIES */}
      <RealisticEye
        position={[-0.072, 0.058, 0.19]}
        eyeRef={leftEyeRef}
        eyelidRef={leftEyelidRef}
        isLeft={true}
      />
      <RealisticEye
        position={[0.072, 0.058, 0.19]}
        eyeRef={rightEyeRef}
        eyelidRef={rightEyelidRef}
        isLeft={false}
      />

      {/* EYEBROWS - Digital accent, bright */}
      <mesh ref={leftBrowRef} position={[-0.072, 0.135, 0.23]} rotation={[0, 0, 0.05]}>
        <capsuleGeometry args={[0.007, 0.05, 18, 36]} />
        <meshBasicMaterial color={COLORS.accentCyan} />
      </mesh>
      <mesh ref={rightBrowRef} position={[0.072, 0.135, 0.23]} rotation={[0, 0, -0.05]}>
        <capsuleGeometry args={[0.007, 0.05, 18, 36]} />
        <meshBasicMaterial color={COLORS.accentCyan} />
      </mesh>
      
      {/* EYEBROW GLOW HALOS */}
      <mesh position={[-0.072, 0.135, 0.225]} rotation={[0, 0, 0.05]}>
        <capsuleGeometry args={[0.018, 0.058, 12, 24]} />
        <meshBasicMaterial 
          color={COLORS.glowCyan}
          transparent 
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0.072, 0.135, 0.225]} rotation={[0, 0, -0.05]}>
        <capsuleGeometry args={[0.018, 0.058, 12, 24]} />
        <meshBasicMaterial 
          color={COLORS.glowCyan}
          transparent 
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* NOSE */}
      <DetailedNose />

      {/* LIPS AND MOUTH */}
      <DetailedLips
        mouthRef={mouthRef}
        isSpeaking={isSpeaking}
        audioLevel={audioLevel}
      />

      {/* ==================== DIGITAL ACCENTS ==================== */}
      
      {/* FOREHEAD CIRCUIT LINES */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.2 + i * 0.018, 0.16 - i * 0.015]} renderOrder={30}>
          <boxGeometry args={[0.12 - i * 0.022, 0.003, 0.003]} />
          <meshBasicMaterial color={COLORS.accentCyan} transparent opacity={0.8 - i * 0.15} />
        </mesh>
      ))}
      
      {/* FOREHEAD CIRCUIT GLOW */}
      {[0, 1, 2].map((i) => (
        <mesh key={`glow-${i}`} position={[0, 0.2 + i * 0.018, 0.155 - i * 0.015]} renderOrder={29}>
          <boxGeometry args={[0.14 - i * 0.022, 0.012, 0.006]} />
          <meshBasicMaterial 
            color={COLORS.glowCyan}
            transparent 
            opacity={0.22 - i * 0.05}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* TEMPLE CIRCUITS */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.22, 0.045, 0.11]} renderOrder={30}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, i * 0.028, 0]} rotation={[0, side * 0.35, 0]}>
              <boxGeometry args={[0.035, 0.0025, 0.0025]} />
              <meshBasicMaterial color={COLORS.accentCyan} transparent opacity={0.65 - i * 0.15} />
            </mesh>
          ))}
        </group>
      ))}

      {/* CHIN CIRCUIT ACCENT */}
      <mesh position={[0, -0.16, 0.23]} renderOrder={30}>
        <boxGeometry args={[0.055, 0.0025, 0.0025]} />
        <meshBasicMaterial color={COLORS.accentGreen} transparent opacity={0.75} />
      </mesh>
      
      {/* CHIN GLOW */}
      <mesh position={[0, -0.16, 0.225]} renderOrder={29}>
        <boxGeometry args={[0.07, 0.01, 0.006]} />
        <meshBasicMaterial 
          color={COLORS.glowGreen}
          transparent 
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* CHEEKBONE ACCENT LINES */}
      <mesh position={[-0.16, 0.015, 0.145]} rotation={[0, 0.45, 0.25]} renderOrder={30}>
        <boxGeometry args={[0.042, 0.0025, 0.0025]} />
        <meshBasicMaterial color={COLORS.accentPurple} transparent opacity={0.65} />
      </mesh>
      <mesh position={[0.16, 0.015, 0.145]} rotation={[0, -0.45, -0.25]} renderOrder={30}>
        <boxGeometry args={[0.042, 0.0025, 0.0025]} />
        <meshBasicMaterial color={COLORS.accentPurple} transparent opacity={0.65} />
      </mesh>

      {/* ==================== GLOW EFFECTS ==================== */}
      
      {/* OUTER RIM GLOW */}
      <mesh scale={0.38} renderOrder={-5}>
        <sphereGeometry args={[1, 36, 36]} />
        <meshBasicMaterial
          color={COLORS.glowCyan}
          transparent
          opacity={0.14}
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* FRESNEL RIM LIGHT */}
      <mesh scale={0.4} renderOrder={-6}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color={COLORS.glowGreen}
          transparent
          opacity={0.22}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* SECONDARY RIM FOR DEPTH */}
      <mesh scale={0.42} renderOrder={-7}>
        <sphereGeometry args={[1, 36, 36]} />
        <meshBasicMaterial
          color={COLORS.accentPurple}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* HOLOGRAPHIC WIREFRAME - Subtle */}
      <mesh scale={0.32} renderOrder={35}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          color={COLORS.accentCyan}
          wireframe
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>
      
      {/* PULSING GLOW NODES - Key facial points */}
      {[
        [0, 0.2, 0.18],         // Forehead center
        [-0.072, 0.135, 0.24],  // Left brow
        [0.072, 0.135, 0.24],   // Right brow
        [-0.15, 0.01, 0.17],    // Left cheek
        [0.15, 0.01, 0.17],     // Right cheek
        [0, -0.16, 0.24],       // Chin
      ].map((pos, i) => (
        <mesh key={`node-${i}`} position={pos as [number, number, number]} renderOrder={36}>
          <sphereGeometry args={[0.008, 12, 12]} />
          <meshBasicMaterial 
            color={i % 2 === 0 ? COLORS.accentCyan : COLORS.accentGreen}
            transparent 
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
};

// ============================================
// HOLOGRAPHIC SCANLINE EFFECT
// ============================================
const ScanlineEffect = ({ state }: { state: AIState }) => {
  const scanRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!scanRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 2 : 0.9;
    scanRef.current.position.y = Math.sin(t * speed) * 0.4;
    (scanRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.08 + Math.sin(t * 7) * 0.025;
  });

  return (
    <mesh ref={scanRef} position={[0, 0, 0.5]} renderOrder={60}>
      <planeGeometry args={[1.5, 0.004]} />
      <meshBasicMaterial color={COLORS.accentGreen} transparent opacity={0.1} depthWrite={false} />
    </mesh>
  );
};

// ============================================
// PARTICLE AURA EFFECT
// ============================================
const ParticleAura = ({ state }: { state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 400;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.45 + Math.random() * 0.3;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const speed = state === "thinking" ? 0.25 : 0.12;
      pointsRef.current.rotation.y = clock.getElapsedTime() * speed;
      pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.15) * 0.08;
    }
  });

  return (
    <points ref={pointsRef} renderOrder={-10}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.005}
        color={state === "thinking" ? COLORS.accentPurple : COLORS.accentCyan}
        transparent
        opacity={0.45}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// ============================================
// ORBITAL RINGS
// ============================================
const OrbitalRings = ({ state }: { state: AIState }) => {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 1.2 : 0.55;

    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * speed * 0.4;
      ring1Ref.current.rotation.x = Math.sin(t * 0.2) * 0.15;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * speed * 0.3;
      ring2Ref.current.rotation.y = Math.sin(t * 0.18) * 0.12;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = t * speed * 0.25;
      ring3Ref.current.rotation.x = Math.cos(t * 0.15) * 0.1;
    }
  });

  return (
    <group>
      <mesh ref={ring1Ref} rotation={[1.1, 0, 0]} renderOrder={-8}>
        <torusGeometry args={[0.42, 0.0015, 8, 96]} />
        <meshBasicMaterial
          color={COLORS.accentCyan}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation={[0.7, 0.5, 0]} renderOrder={-8}>
        <torusGeometry args={[0.48, 0.001, 8, 96]} />
        <meshBasicMaterial
          color={COLORS.accentGreen}
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ring3Ref} rotation={[1.4, 0.3, 0.2]} renderOrder={-8}>
        <torusGeometry args={[0.52, 0.001, 8, 96]} />
        <meshBasicMaterial
          color={COLORS.accentPurple}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// ============================================
// MAIN SCENE EXPORT
// ============================================
export const DigitalFaceScene = ({
  state,
  audioLevel = 0,
  isSpeaking = false,
}: DigitalFaceSceneProps) => {
  return (
    <group>
      {/* Main face */}
      <RealisticFace state={state} audioLevel={audioLevel} isSpeaking={isSpeaking} />
      
      {/* Speech particles */}
      <SpeechBurstParticles audioLevel={audioLevel} isSpeaking={isSpeaking} />
      
      {/* Ambient effects */}
      <ScanlineEffect state={state} />
      <ParticleAura state={state} />
      <OrbitalRings state={state} />
    </group>
  );
};
