import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface HybridSceneProps {
  state: AIState;
  audioLevel?: number;
  isSpeaking?: boolean;
}

// Miniature face emerging from digital core
const EmergingFace = ({
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
  const mouthRef = useRef<THREE.Mesh>(null);

  const emergenceLevel = useMemo(() => {
    switch (state) {
      case "speaking": return 1;
      case "thinking": return 0.75;
      case "listening": return 0.85;
      default: return 0.55;
    }
  }, [state]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (faceRef.current) {
      const targetZ = -0.15 + emergenceLevel * 0.12;
      faceRef.current.position.z = THREE.MathUtils.lerp(faceRef.current.position.z, targetZ, 0.04);
      faceRef.current.rotation.y = Math.sin(t * 0.45) * 0.08;
      faceRef.current.rotation.x = Math.sin(t * 0.28) * 0.04;

      faceRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          if (mat.opacity !== undefined) {
            mat.opacity = THREE.MathUtils.lerp(mat.opacity, emergenceLevel * 0.88, 0.04);
          }
        }
      });
    }

    // Eye movements
    if (leftEyeRef.current && rightEyeRef.current) {
      const eyeX = Math.sin(t * 0.8) * 0.08;
      const eyeY = Math.cos(t * 0.6) * 0.05;
      leftEyeRef.current.rotation.set(-eyeY, eyeX, 0);
      rightEyeRef.current.rotation.set(-eyeY, eyeX, 0);
    }

    if (mouthRef.current) {
      const mouthOpen = isSpeaking
        ? 0.25 + audioLevel * 0.5 + Math.sin(t * 16) * 0.1 * audioLevel
        : 0.05;
      mouthRef.current.scale.y = 0.45 + mouthOpen * 2;
    }
  });

  return (
    <group ref={faceRef} position={[0, 0, -0.15]} scale={0.45}>
      {/* Head wireframe - HIGH POLY */}
      <mesh>
        <sphereGeometry args={[0.42, 48, 48]} />
        <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.35} />
      </mesh>

      {/* Inner head solid */}
      <mesh scale={0.95}>
        <sphereGeometry args={[0.42, 48, 48]} />
        <meshBasicMaterial color="#1a1a2e" transparent opacity={0.6} />
      </mesh>

      {/* Left eye */}
      <group position={[-0.1, 0.05, 0.35]}>
        <mesh>
          <sphereGeometry args={[0.045, 32, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
        <group ref={leftEyeRef}>
          <mesh position={[0, 0, 0.03]}>
            <circleGeometry args={[0.028, 32]} />
            <meshBasicMaterial color="#00d4ff" />
          </mesh>
          <mesh position={[0, 0, 0.035]}>
            <circleGeometry args={[0.012, 24]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.042, 0.05, 32]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Right eye */}
      <group position={[0.1, 0.05, 0.35]}>
        <mesh>
          <sphereGeometry args={[0.045, 32, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
        <group ref={rightEyeRef}>
          <mesh position={[0, 0, 0.03]}>
            <circleGeometry args={[0.028, 32]} />
            <meshBasicMaterial color="#00d4ff" />
          </mesh>
          <mesh position={[0, 0, 0.035]}>
            <circleGeometry args={[0.012, 24]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.042, 0.05, 32]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, -0.1, 0.35]}>
        <capsuleGeometry args={[0.018, 0.05, 8, 16]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.75} />
      </mesh>

      {/* Glow aura */}
      <mesh scale={0.55}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.08} />
      </mesh>
    </group>
  );
};

// Digital shell surrounding face - HIGH POLY
const DigitalShell = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const shellRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  const intensity = state === "thinking" ? 2 : state === "speaking" ? 1.5 : state === "listening" ? 1.2 : 0.8;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 1.8 : 1;

    if (shellRef.current) {
      shellRef.current.rotation.y = t * 0.08 * speed;
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.4 * speed;
      ring1Ref.current.rotation.z = t * 0.25 * speed;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -t * 0.35 * speed;
      ring2Ref.current.rotation.y = t * 0.5 * speed;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = t * 0.6 * speed;
      ring3Ref.current.rotation.z = -t * 0.15 * speed;
    }
  });

  return (
    <group ref={shellRef}>
      {/* Outer icosahedron - HIGH POLY */}
      <mesh scale={0.55}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.28} />
      </mesh>

      {/* Orbiting rings - HIGH POLY */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.48, 0.008, 24, 96]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.45} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[0.52, 0.006, 24, 96]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.38} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[0.56, 0.005, 24, 96]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.28} />
      </mesh>

      {/* Energy core - HIGH POLY */}
      <mesh scale={0.14 + audioLevel * 0.04}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.75} />
      </mesh>

      {/* Ambient glow */}
      <mesh scale={0.28}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.12 * intensity} />
      </mesh>
    </group>
  );
};

// Orbiting circuit nodes
const CircuitNodes = ({ state, count = 60 }: { state: AIState; count?: number }) => {
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const nodeData = useMemo(() => {
    return Array.from({ length: count }, () => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1),
      radius: 0.65 + Math.random() * 0.4,
      speed: 0.35 + Math.random() * 0.65,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  useFrame(({ clock }) => {
    if (!nodesRef.current) return;
    const t = clock.getElapsedTime();
    const speedMult = state === "thinking" ? 1.8 : 1;

    for (let i = 0; i < count; i++) {
      const node = nodeData[i];
      const angle = node.theta + t * node.speed * speedMult * 0.25;

      dummy.position.set(
        node.radius * Math.sin(node.phi) * Math.cos(angle),
        node.radius * Math.sin(node.phi) * Math.sin(angle),
        node.radius * Math.cos(node.phi)
      );

      const pulse = 1 + Math.sin(t * 3.5 + node.phase) * 0.25;
      dummy.scale.setScalar(0.01 * pulse);
      dummy.updateMatrix();
      nodesRef.current.setMatrixAt(i, dummy.matrix);
    }
    nodesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={nodesRef} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 1]} />
      <meshBasicMaterial color="#00ff88" transparent opacity={0.68} />
    </instancedMesh>
  );
};

// Energy particles flowing around
const EnergyParticles = ({ state }: { state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 220;

  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const phs = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 0.22 + Math.random() * 0.45;

      pos[i * 3] = Math.cos(theta) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.55;
      pos[i * 3 + 2] = Math.sin(theta) * r;

      phs[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, phases: phs };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const speed = state === "thinking" ? 2.5 : state === "speaking" ? 1.8 : 1;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const phase = phases[i];

      const currentR = Math.sqrt(posArray[idx] ** 2 + posArray[idx + 2] ** 2);
      const angle = Math.atan2(posArray[idx + 2], posArray[idx]) + 0.015 * speed;
      const newR = 0.22 + ((currentR - 0.22 + 0.008 * speed) % 0.45);

      posArray[idx] = Math.cos(angle) * newR;
      posArray[idx + 2] = Math.sin(angle) * newR;
      posArray[idx + 1] += Math.sin(t + phase) * 0.0015;

      if (Math.abs(posArray[idx + 1]) > 0.28) {
        posArray[idx + 1] *= 0.98;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.014}
        color="#00d4ff"
        transparent
        opacity={0.55}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const HybridScene = ({
  state,
  audioLevel = 0,
  isSpeaking = false,
}: HybridSceneProps) => {
  return (
    <group>
      <DigitalShell state={state} audioLevel={audioLevel} />
      <EmergingFace state={state} audioLevel={audioLevel} isSpeaking={isSpeaking} />
      <CircuitNodes state={state} count={60} />
      <EnergyParticles state={state} />
    </group>
  );
};
