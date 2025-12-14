import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface DigitalFaceSceneProps {
  state: AIState;
  audioLevel?: number;
  isSpeaking?: boolean;
}

// High-poly realistic digital face with proper geometry
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
  const headRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const leftEyelidRef = useRef<THREE.Mesh>(null);
  const rightEyelidRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);
  

  const [blinkProgress, setBlinkProgress] = useState(0);
  const eyeTargetRef = useRef(new THREE.Vector3(0, 0, 1));

  // Random eye movements and blinks
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.65) {
        setBlinkProgress(1);
        setTimeout(() => setBlinkProgress(0), 120);
      }
    }, 2500);

    const eyeInterval = setInterval(() => {
      eyeTargetRef.current.set(
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.15,
        1
      );
    }, 2500);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(eyeInterval);
    };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Head breathing and subtle movement
    if (faceRef.current) {
      faceRef.current.rotation.y = Math.sin(t * 0.4) * 0.06;
      faceRef.current.rotation.x = Math.sin(t * 0.25) * 0.025;
      faceRef.current.position.y = Math.sin(t * 0.6) * 0.008;
    }

    // Eye tracking
    const target = eyeTargetRef.current;
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.rotation.y = THREE.MathUtils.lerp(
        leftEyeRef.current.rotation.y,
        target.x * 0.3,
        0.08
      );
      leftEyeRef.current.rotation.x = THREE.MathUtils.lerp(
        leftEyeRef.current.rotation.x,
        -target.y * 0.25,
        0.08
      );
      rightEyeRef.current.rotation.y = THREE.MathUtils.lerp(
        rightEyeRef.current.rotation.y,
        target.x * 0.3,
        0.08
      );
      rightEyeRef.current.rotation.x = THREE.MathUtils.lerp(
        rightEyeRef.current.rotation.x,
        -target.y * 0.25,
        0.08
      );
    }

    // Eyelid blink
    if (leftEyelidRef.current && rightEyelidRef.current) {
      const lidPos = blinkProgress * 0.055;
      leftEyelidRef.current.position.y = 0.06 - lidPos;
      rightEyelidRef.current.position.y = 0.06 - lidPos;
      leftEyelidRef.current.scale.y = 1 + blinkProgress * 2;
      rightEyelidRef.current.scale.y = 1 + blinkProgress * 2;
    }

    // Mouth and jaw animation
    if (mouthRef.current && jawRef.current) {
      const mouthOpen = isSpeaking
        ? 0.35 + audioLevel * 0.65 + Math.sin(t * 18) * 0.12 * audioLevel
        : state === "thinking"
        ? 0.08 + Math.sin(t * 1.8) * 0.04
        : 0.03;

      mouthRef.current.scale.y = 0.4 + mouthOpen * 2.5;
      mouthRef.current.scale.x = 1 - mouthOpen * 0.2;
      jawRef.current.position.y = -0.28 - mouthOpen * 0.03;
      jawRef.current.rotation.x = mouthOpen * 0.15;
    }

    // Eyebrow expressions
    if (leftBrowRef.current && rightBrowRef.current) {
      const browRaise = state === "listening" ? 0.018 : state === "thinking" ? -0.008 : 0;
      leftBrowRef.current.position.y = 0.18 + browRaise + Math.sin(t * 0.7) * 0.003;
      rightBrowRef.current.position.y = 0.18 + browRaise + Math.sin(t * 0.7 + 0.4) * 0.003;
      leftBrowRef.current.rotation.z = state === "thinking" ? 0.12 : 0;
      rightBrowRef.current.rotation.z = state === "thinking" ? -0.12 : 0;
    }
  });

  const skinColor = "#1a1a2e";
  const digitalColor = "#00d4ff";
  const accentColor = "#00ff88";

  return (
    <group ref={faceRef}>
      {/* Main head - HIGH POLY smooth sphere */}
      <mesh ref={headRef} position={[0, 0, -0.08]}>
        <sphereGeometry args={[0.42, 64, 64]} />
        <meshStandardMaterial
          color={skinColor}
          metalness={0.25}
          roughness={0.65}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Jaw/chin extension */}
      <mesh ref={jawRef} position={[0, -0.28, 0.08]}>
        <sphereGeometry args={[0.22, 48, 48]} />
        <meshStandardMaterial
          color={skinColor}
          metalness={0.25}
          roughness={0.65}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Digital wireframe overlay - HIGH POLY */}
      <mesh position={[0, 0, -0.08]} scale={0.44}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={digitalColor} wireframe transparent opacity={0.15} />
      </mesh>

      {/* Left eye assembly */}
      <group position={[-0.11, 0.06, 0.32]}>
        {/* Eye socket shadow */}
        <mesh position={[0, 0, -0.01]}>
          <sphereGeometry args={[0.065, 32, 32]} />
          <meshBasicMaterial color="#0a0a15" transparent opacity={0.8} />
        </mesh>
        {/* Eye white (sclera) */}
        <mesh>
          <sphereGeometry args={[0.055, 32, 32]} />
          <meshStandardMaterial color="#e8e8f0" roughness={0.3} />
        </mesh>
        {/* Eye tracking group */}
        <group ref={leftEyeRef}>
          {/* Iris - HIGH POLY ring */}
          <mesh position={[0, 0, 0.035]}>
            <circleGeometry args={[0.038, 48]} />
            <meshBasicMaterial color={digitalColor} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0, 0.04]}>
            <circleGeometry args={[0.018, 32]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          {/* Pupil highlight */}
          <mesh position={[0.008, 0.008, 0.042]}>
            <circleGeometry args={[0.005, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
        </group>
        {/* Eyelid */}
        <mesh ref={leftEyelidRef} position={[0, 0.06, 0.02]}>
          <boxGeometry args={[0.12, 0.025, 0.04]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
        {/* Eye glow ring */}
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.052, 0.062, 48]} />
          <meshBasicMaterial color={digitalColor} transparent opacity={0.45} />
        </mesh>
      </group>

      {/* Right eye assembly */}
      <group position={[0.11, 0.06, 0.32]}>
        <mesh position={[0, 0, -0.01]}>
          <sphereGeometry args={[0.065, 32, 32]} />
          <meshBasicMaterial color="#0a0a15" transparent opacity={0.8} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.055, 32, 32]} />
          <meshStandardMaterial color="#e8e8f0" roughness={0.3} />
        </mesh>
        <group ref={rightEyeRef}>
          <mesh position={[0, 0, 0.035]}>
            <circleGeometry args={[0.038, 48]} />
            <meshBasicMaterial color={digitalColor} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <circleGeometry args={[0.018, 32]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh position={[0.008, 0.008, 0.042]}>
            <circleGeometry args={[0.005, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
        </group>
        <mesh ref={rightEyelidRef} position={[0, 0.06, 0.02]}>
          <boxGeometry args={[0.12, 0.025, 0.04]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.052, 0.062, 48]} />
          <meshBasicMaterial color={digitalColor} transparent opacity={0.45} />
        </mesh>
      </group>

      {/* Eyebrows */}
      <mesh ref={leftBrowRef} position={[-0.11, 0.18, 0.34]}>
        <capsuleGeometry args={[0.008, 0.06, 8, 16]} />
        <meshBasicMaterial color={digitalColor} />
      </mesh>
      <mesh ref={rightBrowRef} position={[0.11, 0.18, 0.34]}>
        <capsuleGeometry args={[0.008, 0.06, 8, 16]} />
        <meshBasicMaterial color={digitalColor} />
      </mesh>

      {/* Nose */}
      <group position={[0, -0.02, 0.38]}>
        {/* Nose bridge */}
        <mesh>
          <boxGeometry args={[0.022, 0.1, 0.03]} />
          <meshStandardMaterial color={skinColor} transparent opacity={0.85} />
        </mesh>
        {/* Nose tip */}
        <mesh position={[0, -0.04, 0.015]}>
          <sphereGeometry args={[0.025, 24, 24]} />
          <meshStandardMaterial color={skinColor} transparent opacity={0.85} />
        </mesh>
        {/* Digital accent */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.015, 0.08, 0.005]} />
          <meshBasicMaterial color={digitalColor} transparent opacity={0.25} />
        </mesh>
      </group>

      {/* Mouth */}
      <group position={[0, -0.14, 0.34]}>
        {/* Mouth cavity */}
        <mesh ref={mouthRef}>
          <capsuleGeometry args={[0.025, 0.07, 16, 24]} />
          <meshBasicMaterial color="#0a0a15" />
        </mesh>
        {/* Lip outline glow */}
        <mesh position={[0, 0, 0.01]}>
          <torusGeometry args={[0.045, 0.008, 16, 48]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.35} />
        </mesh>
      </group>

      {/* Cheekbone accents */}
      <mesh position={[-0.22, -0.02, 0.22]} rotation={[0, -0.5, 0]}>
        <planeGeometry args={[0.08, 0.12]} />
        <meshBasicMaterial color={digitalColor} transparent opacity={0.08} wireframe />
      </mesh>
      <mesh position={[0.22, -0.02, 0.22]} rotation={[0, 0.5, 0]}>
        <planeGeometry args={[0.08, 0.12]} />
        <meshBasicMaterial color={digitalColor} transparent opacity={0.08} wireframe />
      </mesh>

      {/* Forehead circuit lines */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.28 + i * 0.025, 0.32 - i * 0.015]}>
          <boxGeometry args={[0.18 - i * 0.035, 0.004, 0.004]} />
          <meshBasicMaterial color={digitalColor} transparent opacity={0.25 - i * 0.08} />
        </mesh>
      ))}

      {/* Temple circuits */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.32, 0.05, 0.12]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, i * 0.04, 0]} rotation={[0, side * 0.6, 0]}>
              <boxGeometry args={[0.04, 0.003, 0.003]} />
              <meshBasicMaterial color={digitalColor} transparent opacity={0.3 - i * 0.1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

// Holographic scanlines
const ScanlineEffect = ({ state }: { state: AIState }) => {
  const scanRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!scanRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 2.5 : 1;
    scanRef.current.position.y = Math.sin(t * speed) * 0.35;
    (scanRef.current.material as THREE.MeshBasicMaterial).opacity = 0.08 + Math.sin(t * 8) * 0.04;
  });

  return (
    <mesh ref={scanRef} position={[0, 0, 0.55]}>
      <planeGeometry args={[1.2, 0.008]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.12} />
    </mesh>
  );
};

// Particle aura around face
const ParticleAura = ({ state }: { state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 350;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.45 + Math.random() * 0.25;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi) - 0.08;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.08;
  });

  const opacity = state === "thinking" ? 0.5 : state === "speaking" ? 0.35 : 0.18;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        color="#00d4ff"
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
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
      <ScanlineEffect state={state} />
      <ParticleAura state={state} />
    </group>
  );
};
