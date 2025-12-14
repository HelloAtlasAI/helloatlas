import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface DigitalFaceSceneProps {
  state: AIState;
  audioLevel?: number;
  isSpeaking?: boolean;
}

// Ultra high-poly realistic digital face with PBR materials
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
      faceRef.current.position.y = Math.sin(t * 0.6) * 0.012;
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
      const lidPos = blinkProgress * 0.08;
      leftEyelidRef.current.position.y = 0.09 - lidPos;
      rightEyelidRef.current.position.y = 0.09 - lidPos;
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
      jawRef.current.position.y = -0.42 - mouthOpen * 0.05;
      jawRef.current.rotation.x = mouthOpen * 0.15;
    }

    // Eyebrow expressions
    if (leftBrowRef.current && rightBrowRef.current) {
      const browRaise = state === "listening" ? 0.025 : state === "thinking" ? -0.012 : 0;
      leftBrowRef.current.position.y = 0.27 + browRaise + Math.sin(t * 0.7) * 0.004;
      rightBrowRef.current.position.y = 0.27 + browRaise + Math.sin(t * 0.7 + 0.4) * 0.004;
      leftBrowRef.current.rotation.z = state === "thinking" ? 0.12 : 0;
      rightBrowRef.current.rotation.z = state === "thinking" ? -0.12 : 0;
    }
  });

  const skinColor = "#1a1a2e";
  const digitalColor = "#00d4ff";
  const accentColor = "#00ff88";

  return (
    <group ref={faceRef} scale={2.2} position={[0, 0, 0.15]}>
      {/* Main head - ULTRA HIGH POLY smooth sphere */}
      <mesh ref={headRef} position={[0, 0, -0.08]}>
        <sphereGeometry args={[0.55, 128, 128]} />
        <meshStandardMaterial
          color={skinColor}
          metalness={0.35}
          roughness={0.55}
          transparent
          opacity={0.92}
          envMapIntensity={0.8}
        />
      </mesh>

      {/* Head inner glow */}
      <mesh position={[0, 0, -0.08]}>
        <sphereGeometry args={[0.52, 64, 64]} />
        <meshBasicMaterial color={digitalColor} transparent opacity={0.05} />
      </mesh>

      {/* Jaw/chin extension - HIGH POLY */}
      <mesh ref={jawRef} position={[0, -0.42, 0.08]}>
        <sphereGeometry args={[0.32, 96, 96]} />
        <meshStandardMaterial
          color={skinColor}
          metalness={0.3}
          roughness={0.6}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Digital wireframe overlay - HIGH POLY with better subdivision */}
      <mesh position={[0, 0, -0.08]} scale={0.58}>
        <icosahedronGeometry args={[1, 4]} />
        <meshBasicMaterial color={digitalColor} wireframe transparent opacity={0.12} />
      </mesh>

      {/* Left eye assembly */}
      <group position={[-0.16, 0.09, 0.42]}>
        {/* Eye socket shadow */}
        <mesh position={[0, 0, -0.015]}>
          <sphereGeometry args={[0.1, 64, 64]} />
          <meshBasicMaterial color="#0a0a15" transparent opacity={0.85} />
        </mesh>
        {/* Eye white (sclera) - HIGH POLY */}
        <mesh>
          <sphereGeometry args={[0.085, 64, 64]} />
          <meshStandardMaterial color="#e8e8f0" roughness={0.25} metalness={0.1} />
        </mesh>
        {/* Eye tracking group */}
        <group ref={leftEyeRef}>
          {/* Iris - ULTRA HIGH POLY ring */}
          <mesh position={[0, 0, 0.055]}>
            <circleGeometry args={[0.058, 96]} />
            <meshBasicMaterial color={digitalColor} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0, 0.06]}>
            <circleGeometry args={[0.028, 64]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          {/* Pupil highlight */}
          <mesh position={[0.012, 0.012, 0.065]}>
            <circleGeometry args={[0.008, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
        </group>
        {/* Eyelid - smoother */}
        <mesh ref={leftEyelidRef} position={[0, 0.09, 0.03]}>
          <boxGeometry args={[0.18, 0.04, 0.06]} />
          <meshStandardMaterial color={skinColor} metalness={0.2} roughness={0.6} />
        </mesh>
        {/* Eye glow ring - HIGH POLY */}
        <mesh position={[0, 0, 0.015]}>
          <ringGeometry args={[0.08, 0.095, 96]} />
          <meshBasicMaterial color={digitalColor} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Right eye assembly */}
      <group position={[0.16, 0.09, 0.42]}>
        <mesh position={[0, 0, -0.015]}>
          <sphereGeometry args={[0.1, 64, 64]} />
          <meshBasicMaterial color="#0a0a15" transparent opacity={0.85} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.085, 64, 64]} />
          <meshStandardMaterial color="#e8e8f0" roughness={0.25} metalness={0.1} />
        </mesh>
        <group ref={rightEyeRef}>
          <mesh position={[0, 0, 0.055]}>
            <circleGeometry args={[0.058, 96]} />
            <meshBasicMaterial color={digitalColor} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <circleGeometry args={[0.028, 64]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh position={[0.012, 0.012, 0.065]}>
            <circleGeometry args={[0.008, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
        </group>
        <mesh ref={rightEyelidRef} position={[0, 0.09, 0.03]}>
          <boxGeometry args={[0.18, 0.04, 0.06]} />
          <meshStandardMaterial color={skinColor} metalness={0.2} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.015]}>
          <ringGeometry args={[0.08, 0.095, 96]} />
          <meshBasicMaterial color={digitalColor} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Eyebrows - smoother capsules */}
      <mesh ref={leftBrowRef} position={[-0.16, 0.27, 0.45]}>
        <capsuleGeometry args={[0.012, 0.09, 24, 48]} />
        <meshBasicMaterial color={digitalColor} />
      </mesh>
      <mesh ref={rightBrowRef} position={[0.16, 0.27, 0.45]}>
        <capsuleGeometry args={[0.012, 0.09, 24, 48]} />
        <meshBasicMaterial color={digitalColor} />
      </mesh>

      {/* Nose - better geometry */}
      <group position={[0, -0.03, 0.5]}>
        {/* Nose bridge */}
        <mesh>
          <boxGeometry args={[0.032, 0.15, 0.045]} />
          <meshStandardMaterial color={skinColor} transparent opacity={0.88} metalness={0.25} roughness={0.6} />
        </mesh>
        {/* Nose tip - HIGH POLY */}
        <mesh position={[0, -0.06, 0.02]}>
          <sphereGeometry args={[0.038, 48, 48]} />
          <meshStandardMaterial color={skinColor} transparent opacity={0.88} metalness={0.25} roughness={0.6} />
        </mesh>
        {/* Digital accent */}
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.022, 0.12, 0.008]} />
          <meshBasicMaterial color={digitalColor} transparent opacity={0.3} />
        </mesh>
      </group>

      {/* Mouth - smoother geometry */}
      <group position={[0, -0.21, 0.45]}>
        {/* Mouth cavity */}
        <mesh ref={mouthRef}>
          <capsuleGeometry args={[0.038, 0.1, 32, 64]} />
          <meshBasicMaterial color="#0a0a15" />
        </mesh>
        {/* Lip outline glow - HIGH POLY */}
        <mesh position={[0, 0, 0.015]}>
          <torusGeometry args={[0.068, 0.012, 32, 128]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Cheekbone accents - larger */}
      <mesh position={[-0.33, -0.03, 0.28]} rotation={[0, -0.5, 0]}>
        <planeGeometry args={[0.12, 0.18]} />
        <meshBasicMaterial color={digitalColor} transparent opacity={0.1} wireframe />
      </mesh>
      <mesh position={[0.33, -0.03, 0.28]} rotation={[0, 0.5, 0]}>
        <planeGeometry args={[0.12, 0.18]} />
        <meshBasicMaterial color={digitalColor} transparent opacity={0.1} wireframe />
      </mesh>

      {/* Forehead circuit lines - more prominent */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.42 + i * 0.038, 0.42 - i * 0.022]}>
          <boxGeometry args={[0.27 - i * 0.05, 0.006, 0.006]} />
          <meshBasicMaterial color={digitalColor} transparent opacity={0.3 - i * 0.1} />
        </mesh>
      ))}

      {/* Temple circuits - larger */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.48, 0.08, 0.15]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, i * 0.06, 0]} rotation={[0, side * 0.6, 0]}>
              <boxGeometry args={[0.06, 0.005, 0.005]} />
              <meshBasicMaterial color={digitalColor} transparent opacity={0.35 - i * 0.12} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Outer glow effect */}
      <mesh position={[0, 0, -0.05]} scale={0.7}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color={digitalColor} transparent opacity={0.04} />
      </mesh>
    </group>
  );
};

// Holographic scanlines - wider coverage
const ScanlineEffect = ({ state }: { state: AIState }) => {
  const scanRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!scanRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 2.5 : 1;
    scanRef.current.position.y = Math.sin(t * speed) * 0.55;
    (scanRef.current.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(t * 8) * 0.05;
  });

  return (
    <mesh ref={scanRef} position={[0, 0, 0.7]}>
      <planeGeometry args={[1.8, 0.012]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.15} />
    </mesh>
  );
};

// Particle aura around face - more particles, bigger spread
const ParticleAura = ({ state }: { state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 500;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.6 + Math.random() * 0.4;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi) - 0.05;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.06;
  });

  const opacity = state === "thinking" ? 0.55 : state === "speaking" ? 0.4 : 0.22;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
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