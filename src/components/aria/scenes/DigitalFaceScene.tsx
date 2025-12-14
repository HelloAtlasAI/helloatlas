import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface DigitalFaceSceneProps {
  state: AIState;
  audioLevel?: number;
  isSpeaking?: boolean;
}

// Create a human head profile curve for LatheGeometry
const createHeadProfileCurve = () => {
  const points: THREE.Vector2[] = [];
  
  // Crown of head
  points.push(new THREE.Vector2(0, 0.6));
  points.push(new THREE.Vector2(0.15, 0.58));
  points.push(new THREE.Vector2(0.28, 0.54));
  points.push(new THREE.Vector2(0.38, 0.48));
  
  // Upper forehead
  points.push(new THREE.Vector2(0.44, 0.42));
  points.push(new THREE.Vector2(0.47, 0.36));
  
  // Brow ridge (prominent)
  points.push(new THREE.Vector2(0.49, 0.28));
  points.push(new THREE.Vector2(0.50, 0.22));
  
  // Eye socket indent
  points.push(new THREE.Vector2(0.47, 0.16));
  points.push(new THREE.Vector2(0.44, 0.10));
  
  // Cheekbone
  points.push(new THREE.Vector2(0.46, 0.04));
  points.push(new THREE.Vector2(0.48, -0.02));
  
  // Nose bridge start
  points.push(new THREE.Vector2(0.42, -0.06));
  
  // Upper lip area
  points.push(new THREE.Vector2(0.40, -0.14));
  points.push(new THREE.Vector2(0.38, -0.20));
  
  // Lower lip
  points.push(new THREE.Vector2(0.36, -0.26));
  
  // Chin
  points.push(new THREE.Vector2(0.32, -0.34));
  points.push(new THREE.Vector2(0.26, -0.42));
  points.push(new THREE.Vector2(0.18, -0.48));
  
  // Neck transition
  points.push(new THREE.Vector2(0.14, -0.54));
  points.push(new THREE.Vector2(0.16, -0.62));
  points.push(new THREE.Vector2(0.18, -0.72));
  points.push(new THREE.Vector2(0.16, -0.82));
  points.push(new THREE.Vector2(0, -0.85));
  
  return points;
};

// Realistic iris pattern with depth - fixed Z-separation to prevent flickering
const IrisGeometry = ({ radius = 0.055, color = "#00d4ff" }: { radius?: number; color?: string }) => {
  return (
    <group>
      {/* Iris base - concave for realism */}
      <mesh position={[0, 0, 0.04]} renderOrder={10}>
        <circleGeometry args={[radius, 128]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.4} 
          roughness={0.3}
          emissive={color}
          emissiveIntensity={0.5}
          depthWrite={true}
        />
      </mesh>
      
      {/* Limbal ring (dark outer edge) */}
      <mesh position={[0, 0, 0.055]} renderOrder={11}>
        <ringGeometry args={[radius * 0.88, radius, 128]} />
        <meshBasicMaterial color="#004455" transparent opacity={0.6} depthWrite={false} />
      </mesh>
      
      {/* Collarette (inner ring structure) */}
      <mesh position={[0, 0, 0.07]} renderOrder={12}>
        <ringGeometry args={[radius * 0.45, radius * 0.55, 128]} />
        <meshBasicMaterial color="#00aacc" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      
      {/* Radial fibers */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const innerR = radius * 0.3;
        const outerR = radius * 0.9;
        return (
          <mesh 
            key={i} 
            position={[0, 0, 0.085]}
            rotation={[0, 0, angle]}
            renderOrder={13}
          >
            <planeGeometry args={[0.002, outerR - innerR]} />
            <meshBasicMaterial 
              color={i % 3 === 0 ? "#00ffff" : "#006688"} 
              transparent 
              opacity={0.3}
              depthWrite={false}
            />
          </mesh>
        );
      })}
      
      {/* Pupil - 3D depth */}
      <mesh position={[0, 0, 0.1]} renderOrder={14}>
        <circleGeometry args={[radius * 0.35, 64]} />
        <meshBasicMaterial color="#000000" depthWrite={true} />
      </mesh>
      
      {/* Pupil inner depth */}
      <mesh position={[0, 0, 0.02]} renderOrder={9}>
        <circleGeometry args={[radius * 0.32, 64]} />
        <meshBasicMaterial color="#000000" depthWrite={true} />
      </mesh>
      
      {/* Specular highlight - primary */}
      <mesh position={[radius * 0.2, radius * 0.2, 0.12]} renderOrder={15}>
        <circleGeometry args={[0.012, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} depthWrite={false} />
      </mesh>
      
      {/* Specular highlight - secondary */}
      <mesh position={[-radius * 0.15, radius * 0.25, 0.115]} renderOrder={15}>
        <circleGeometry args={[0.006, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </group>
  );
};

// Anatomical lip geometry
const LipGeometry = ({ 
  mouthRef, 
  isSpeaking, 
  audioLevel 
}: { 
  mouthRef: React.RefObject<THREE.Group>;
  isSpeaking: boolean;
  audioLevel: number;
}) => {
  return (
    <group ref={mouthRef} position={[0, -0.16, 0.44]}>
      {/* Upper lip - Cupid's bow shape */}
      <mesh position={[0, 0.018, 0]}>
        <torusGeometry args={[0.055, 0.018, 32, 64, Math.PI]} />
        <meshStandardMaterial 
          color="#2a1a2a" 
          metalness={0.2} 
          roughness={0.4}
        />
      </mesh>
      
      {/* Cupid's bow peaks */}
      <mesh position={[-0.022, 0.032, 0.01]}>
        <sphereGeometry args={[0.012, 32, 32]} />
        <meshStandardMaterial color="#2a1a2a" metalness={0.2} roughness={0.4} />
      </mesh>
      <mesh position={[0.022, 0.032, 0.01]}>
        <sphereGeometry args={[0.012, 32, 32]} />
        <meshStandardMaterial color="#2a1a2a" metalness={0.2} roughness={0.4} />
      </mesh>
      
      {/* Philtrum columns */}
      <mesh position={[-0.01, 0.05, 0.02]}>
        <capsuleGeometry args={[0.004, 0.035, 16, 32]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0.01, 0.05, 0.02]}>
        <capsuleGeometry args={[0.004, 0.035, 16, 32]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.2} roughness={0.5} />
      </mesh>
      
      {/* Lower lip - fuller */}
      <mesh position={[0, -0.02, 0.01]} rotation={[Math.PI, 0, 0]}>
        <torusGeometry args={[0.048, 0.024, 32, 64, Math.PI]} />
        <meshStandardMaterial 
          color="#2a1a2a" 
          metalness={0.2} 
          roughness={0.35}
        />
      </mesh>
      
      {/* Mouth opening (dark cavity) */}
      <mesh position={[0, 0, -0.01]}>
        <capsuleGeometry args={[0.015, 0.06, 24, 48]} />
        <meshBasicMaterial color="#050508" />
      </mesh>
      
      {/* Teeth hint (visible when speaking) */}
      {isSpeaking && audioLevel > 0.3 && (
        <mesh position={[0, 0.008, 0.005]}>
          <boxGeometry args={[0.05, 0.012, 0.008]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.3} />
        </mesh>
      )}
      
      {/* Lip outline glow */}
      <mesh position={[0, 0, 0.02]}>
        <torusGeometry args={[0.062, 0.008, 24, 96]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.35} />
      </mesh>
      
      {/* Vermillion border */}
      <mesh position={[0, 0.035, 0.015]}>
        <torusGeometry args={[0.058, 0.003, 16, 64, Math.PI]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.25} />
      </mesh>
    </group>
  );
};

// Anatomical nose with full 3D structure
const NoseGeometry = () => {
  return (
    <group position={[0, 0.02, 0.48]}>
      {/* Nose bridge - curved, not a box */}
      <mesh position={[0, 0.06, 0]} rotation={[0.15, 0, 0]}>
        <capsuleGeometry args={[0.018, 0.08, 24, 48]} />
        <meshStandardMaterial 
          color="#1a1a2e" 
          metalness={0.25} 
          roughness={0.55}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Nasion (top of bridge, between eyes) */}
      <mesh position={[0, 0.11, -0.01]}>
        <sphereGeometry args={[0.022, 32, 32]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.25} roughness={0.55} transparent opacity={0.9} />
      </mesh>
      
      {/* Dorsum (main ridge) */}
      <mesh position={[0, 0.03, 0.01]}>
        <boxGeometry args={[0.025, 0.06, 0.02]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.25} roughness={0.55} transparent opacity={0.9} />
      </mesh>
      
      {/* Nose tip (bulbous) */}
      <mesh position={[0, -0.03, 0.025]}>
        <sphereGeometry args={[0.032, 48, 48]} />
        <meshStandardMaterial 
          color="#1a1a2e" 
          metalness={0.3} 
          roughness={0.45}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Tip bifurcation hint */}
      <mesh position={[-0.008, -0.035, 0.03]}>
        <sphereGeometry args={[0.015, 24, 24]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.45} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0.008, -0.035, 0.03]}>
        <sphereGeometry args={[0.015, 24, 24]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.45} transparent opacity={0.85} />
      </mesh>
      
      {/* Nostrils - left */}
      <group position={[-0.022, -0.045, 0.01]}>
        <mesh rotation={[0.3, 0.4, 0]}>
          <torusGeometry args={[0.012, 0.006, 16, 32, Math.PI]} />
          <meshBasicMaterial color="#0a0a12" />
        </mesh>
        {/* Ala (nostril wing) */}
        <mesh position={[-0.008, 0, 0.005]}>
          <sphereGeometry args={[0.018, 24, 24]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.25} roughness={0.5} transparent opacity={0.88} />
        </mesh>
      </group>
      
      {/* Nostrils - right */}
      <group position={[0.022, -0.045, 0.01]}>
        <mesh rotation={[0.3, -0.4, 0]}>
          <torusGeometry args={[0.012, 0.006, 16, 32, Math.PI]} />
          <meshBasicMaterial color="#0a0a12" />
        </mesh>
        <mesh position={[0.008, 0, 0.005]}>
          <sphereGeometry args={[0.018, 24, 24]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.25} roughness={0.5} transparent opacity={0.88} />
        </mesh>
      </group>
      
      {/* Columella (between nostrils) */}
      <mesh position={[0, -0.048, 0.018]}>
        <boxGeometry args={[0.012, 0.015, 0.01]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.25} roughness={0.5} />
      </mesh>
      
      {/* Digital accent line down nose */}
      <mesh position={[0, 0.02, 0.035]}>
        <boxGeometry args={[0.003, 0.12, 0.003]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};

// Complete eye assembly with anatomical detail
const EyeAssembly = ({ 
  position, 
  eyeRef, 
  eyelidRef,
  isLeft = true 
}: { 
  position: [number, number, number];
  eyeRef: React.RefObject<THREE.Group>;
  eyelidRef: React.RefObject<THREE.Mesh>;
  isLeft?: boolean;
}) => {
  return (
    <group position={position}>
      {/* Eye socket - recessed */}
      <mesh position={[0, 0, -0.025]}>
        <sphereGeometry args={[0.11, 64, 64]} />
        <meshBasicMaterial color="#0a0a15" transparent opacity={0.9} />
      </mesh>
      
      {/* Orbital rim shadow */}
      <mesh position={[0, 0.03, -0.01]}>
        <torusGeometry args={[0.09, 0.015, 16, 64, Math.PI]} />
        <meshBasicMaterial color="#0a0a12" transparent opacity={0.5} />
      </mesh>
      
      {/* Eyeball - sclera with subtle blue tint */}
      <mesh>
        <sphereGeometry args={[0.088, 96, 96]} />
        <meshStandardMaterial 
          color="#e8e8f5" 
          roughness={0.2} 
          metalness={0.08}
        />
      </mesh>
      
      {/* Sclera veins hint */}
      <mesh position={[isLeft ? 0.04 : -0.04, 0.02, 0.065]}>
        <planeGeometry args={[0.02, 0.003]} />
        <meshBasicMaterial color="#cc8888" transparent opacity={0.15} />
      </mesh>
      
      {/* Cornea bulge - transparent */}
      <mesh position={[0, 0, 0.045]}>
        <sphereGeometry args={[0.055, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.15}
          roughness={0.05}
          metalness={0.1}
        />
      </mesh>
      
      {/* Eye tracking group */}
      <group ref={eyeRef}>
        <IrisGeometry />
      </group>
      
      {/* Upper eyelid */}
      <mesh ref={eyelidRef} position={[0, 0.075, 0.04]}>
        <capsuleGeometry args={[0.012, 0.085, 24, 48]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.2} roughness={0.55} />
      </mesh>
      
      {/* Eyelid crease */}
      <mesh position={[0, 0.095, 0.02]}>
        <torusGeometry args={[0.075, 0.004, 8, 32, Math.PI]} />
        <meshBasicMaterial color="#0a0a15" transparent opacity={0.4} />
      </mesh>
      
      {/* Lower eyelid */}
      <mesh position={[0, -0.065, 0.04]} rotation={[Math.PI, 0, 0]}>
        <capsuleGeometry args={[0.008, 0.07, 16, 32]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.2} roughness={0.55} />
      </mesh>
      
      {/* Eyelashes - upper (simplified as thin strips) */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = ((i - 5.5) / 12) * Math.PI * 0.6;
        return (
          <mesh 
            key={`lash-${i}`}
            position={[
              Math.sin(angle) * 0.08,
              0.08 + Math.cos(angle) * 0.015,
              0.05 + Math.abs(Math.sin(angle)) * 0.01
            ]}
            rotation={[0.2, 0, angle * 0.3]}
          >
            <capsuleGeometry args={[0.002, 0.015, 4, 8]} />
            <meshBasicMaterial color="#0a0a15" />
          </mesh>
        );
      })}
      
      {/* Eye glow ring */}
      <mesh position={[0, 0, 0.02]}>
        <ringGeometry args={[0.085, 0.095, 128]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.45} />
      </mesh>
      
      {/* Inner corner caruncle */}
      <mesh position={[isLeft ? 0.075 : -0.075, -0.01, 0.035]}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshStandardMaterial color="#cc9999" roughness={0.5} />
      </mesh>
    </group>
  );
};

// Main realistic face component
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
  const jawRef = useRef<THREE.Mesh>(null);

  const [blinkProgress, setBlinkProgress] = useState(0);
  const eyeTargetRef = useRef(new THREE.Vector3(0, 0, 1));

  const headProfile = useMemo(() => createHeadProfileCurve(), []);

  // Random eye movements and blinks
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.6) {
        setBlinkProgress(1);
        setTimeout(() => setBlinkProgress(0.5), 80);
        setTimeout(() => setBlinkProgress(0), 150);
      }
    }, 3000);

    const eyeInterval = setInterval(() => {
      eyeTargetRef.current.set(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.2,
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

    // Head breathing and subtle movement
    if (faceRef.current) {
      faceRef.current.rotation.y = Math.sin(t * 0.35) * 0.05;
      faceRef.current.rotation.x = Math.sin(t * 0.2) * 0.02;
      faceRef.current.position.y = Math.sin(t * 0.5) * 0.01;
    }

    // Eye tracking with smooth interpolation
    const target = eyeTargetRef.current;
    [leftEyeRef, rightEyeRef].forEach(ref => {
      if (ref.current) {
        ref.current.rotation.y = THREE.MathUtils.lerp(
          ref.current.rotation.y,
          target.x * 0.25,
          0.06
        );
        ref.current.rotation.x = THREE.MathUtils.lerp(
          ref.current.rotation.x,
          -target.y * 0.2,
          0.06
        );
      }
    });

    // Eyelid blink animation
    if (leftEyelidRef.current && rightEyelidRef.current) {
      const lidOffset = blinkProgress * 0.07;
      leftEyelidRef.current.position.y = 0.075 - lidOffset;
      rightEyelidRef.current.position.y = 0.075 - lidOffset;
      leftEyelidRef.current.scale.y = 1 + blinkProgress * 2.5;
      rightEyelidRef.current.scale.y = 1 + blinkProgress * 2.5;
    }

    // Mouth animation for speech
    if (mouthRef.current) {
      const mouthScale = isSpeaking
        ? 1 + audioLevel * 0.4 + Math.sin(t * 20) * 0.08 * audioLevel
        : state === "thinking"
        ? 1 + Math.sin(t * 2) * 0.03
        : 1;
      
      mouthRef.current.scale.y = mouthScale;
    }

    // Jaw movement
    if (jawRef.current) {
      const jawDrop = isSpeaking
        ? audioLevel * 0.03 + Math.sin(t * 18) * 0.01 * audioLevel
        : 0;
      jawRef.current.position.y = -0.38 - jawDrop;
      jawRef.current.rotation.x = jawDrop * 2;
    }

    // Eyebrow expressions
    if (leftBrowRef.current && rightBrowRef.current) {
      const browRaise = state === "listening" ? 0.02 : state === "thinking" ? -0.01 : 0;
      leftBrowRef.current.position.y = 0.24 + browRaise + Math.sin(t * 0.6) * 0.003;
      rightBrowRef.current.position.y = 0.24 + browRaise + Math.sin(t * 0.6 + 0.5) * 0.003;
      leftBrowRef.current.rotation.z = state === "thinking" ? 0.1 : 0;
      rightBrowRef.current.rotation.z = state === "thinking" ? -0.1 : 0;
    }
  });

  const skinColor = "#1a1a2e";
  const digitalColor = "#00d4ff";

  return (
    <group ref={faceRef} scale={1.4} position={[0, 0, 0]}>
      {/* Main head using LatheGeometry for realistic profile */}
      <mesh rotation={[0, 0, 0]} renderOrder={0}>
        <latheGeometry args={[headProfile, 256, 0, Math.PI * 2]} />
        <meshPhysicalMaterial
          color={skinColor}
          metalness={0.15}
          roughness={0.65}
          clearcoat={0.1}
          clearcoatRoughness={0.4}
          side={THREE.FrontSide}
          depthWrite={true}
          depthTest={true}
        />
      </mesh>

      {/* Inner skull glow - increased offset to prevent z-fighting */}
      <mesh scale={0.8} renderOrder={-1}>
        <latheGeometry args={[headProfile.map(p => new THREE.Vector2(p.x * 0.95, p.y)), 128]} />
        <meshBasicMaterial color={digitalColor} transparent opacity={0.04} side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* Jaw bone extension */}
      <mesh ref={jawRef} position={[0, -0.38, 0.08]} renderOrder={1}>
        <sphereGeometry args={[0.26, 96, 96]} />
        <meshPhysicalMaterial
          color={skinColor}
          metalness={0.15}
          roughness={0.6}
          clearcoat={0.08}
          side={THREE.FrontSide}
          depthWrite={true}
        />
      </mesh>

      {/* Cheekbones */}
      <mesh position={[-0.28, 0.02, 0.28]} rotation={[0, -0.4, 0]} renderOrder={2}>
        <sphereGeometry args={[0.12, 48, 48]} />
        <meshPhysicalMaterial color={skinColor} metalness={0.15} roughness={0.6} side={THREE.FrontSide} depthWrite={true} />
      </mesh>
      <mesh position={[0.28, 0.02, 0.28]} rotation={[0, 0.4, 0]} renderOrder={2}>
        <sphereGeometry args={[0.12, 48, 48]} />
        <meshPhysicalMaterial color={skinColor} metalness={0.15} roughness={0.6} side={THREE.FrontSide} depthWrite={true} />
      </mesh>

      {/* Digital wireframe overlay */}
      <mesh scale={0.52} renderOrder={20}>
        <icosahedronGeometry args={[1, 4]} />
        <meshBasicMaterial color={digitalColor} wireframe transparent opacity={0.08} depthWrite={false} />
      </mesh>

      {/* Eye assemblies */}
      <EyeAssembly 
        position={[-0.14, 0.1, 0.38]} 
        eyeRef={leftEyeRef} 
        eyelidRef={leftEyelidRef}
        isLeft={true}
      />
      <EyeAssembly 
        position={[0.14, 0.1, 0.38]} 
        eyeRef={rightEyeRef} 
        eyelidRef={rightEyelidRef}
        isLeft={false}
      />

      {/* Eyebrows */}
      <mesh ref={leftBrowRef} position={[-0.14, 0.24, 0.42]} rotation={[0, 0, 0.08]}>
        <capsuleGeometry args={[0.01, 0.08, 24, 48]} />
        <meshBasicMaterial color={digitalColor} />
      </mesh>
      <mesh ref={rightBrowRef} position={[0.14, 0.24, 0.42]} rotation={[0, 0, -0.08]}>
        <capsuleGeometry args={[0.01, 0.08, 24, 48]} />
        <meshBasicMaterial color={digitalColor} />
      </mesh>

      {/* Nose */}
      <NoseGeometry />

      {/* Lips and mouth */}
      <LipGeometry 
        mouthRef={mouthRef} 
        isSpeaking={isSpeaking} 
        audioLevel={audioLevel} 
      />

      {/* Forehead circuit lines */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.38 + i * 0.035, 0.38 - i * 0.025]}>
          <boxGeometry args={[0.22 - i * 0.04, 0.004, 0.004]} />
          <meshBasicMaterial color={digitalColor} transparent opacity={0.35 - i * 0.08} />
        </mesh>
      ))}

      {/* Temple data circuits */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.42, 0.08, 0.18]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[0, i * 0.05, 0]} rotation={[0, side * 0.5, 0]}>
              <boxGeometry args={[0.05, 0.003, 0.003]} />
              <meshBasicMaterial color={digitalColor} transparent opacity={0.4 - i * 0.1} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Chin circuit accent */}
      <mesh position={[0, -0.28, 0.42]}>
        <boxGeometry args={[0.08, 0.003, 0.003]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.3} />
      </mesh>

      {/* Outer aura glow */}
      <mesh scale={0.68} renderOrder={-5}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color={digitalColor} transparent opacity={0.03} depthWrite={false} side={THREE.BackSide} />
      </mesh>

      {/* Fresnel rim light simulation */}
      <mesh scale={0.72} renderOrder={-6}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial 
          color="#00ffaa" 
          transparent 
          opacity={0.08}
          side={THREE.BackSide}
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
    const speed = state === "thinking" ? 2.5 : 1.2;
    scanRef.current.position.y = Math.sin(t * speed) * 0.7;
    (scanRef.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * 10) * 0.04;
  });

  return (
    <mesh ref={scanRef} position={[0, 0, 0.8]}>
      <planeGeometry args={[2.5, 0.008]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.15} />
    </mesh>
  );
};

// Particle aura with multiple layers
const ParticleAura = ({ state }: { state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const innerPointsRef = useRef<THREE.Points>(null);
  const count = 800;
  const innerCount = 400;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 0.8 + Math.random() * 0.6;

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
      const radius = 0.5 + Math.random() * 0.25;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.05;
      pointsRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
    }
    if (innerPointsRef.current) {
      innerPointsRef.current.rotation.y = -t * 0.08;
    }
  });

  const opacity = state === "thinking" ? 0.6 : state === "speaking" ? 0.45 : 0.25;

  return (
    <>
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
      <points ref={innerPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={innerCount} array={innerPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.008}
          color="#00ff88"
          transparent
          opacity={opacity * 0.7}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
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
    const speed = state === "thinking" ? 1.5 : 0.8;
    
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * speed * 0.3;
      ring1Ref.current.rotation.z = t * speed * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = t * speed * 0.25;
      ring2Ref.current.rotation.x = Math.PI / 4 + t * speed * 0.15;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = t * speed * 0.2;
      ring3Ref.current.rotation.y = Math.PI / 3 + t * speed * 0.1;
    }
  });

  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.1, 0.004, 16, 128]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.25} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.25, 0.003, 16, 128]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.2} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[1.4, 0.003, 16, 128]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.15} />
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
      <ScanlineEffect state={state} />
      <ParticleAura state={state} />
      <OrbitalRings state={state} />
    </group>
  );
};