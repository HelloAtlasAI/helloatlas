import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface HUDSceneProps {
  state: AIState;
}

// Status indicator with pulsing dot
const StatusIndicator = ({ position, state }: { position: [number, number, number]; state: AIState }) => {
  const dotRef = useRef<THREE.Mesh>(null);

  const statusText = useMemo(() => {
    switch (state) {
      case "thinking": return "PROCESSING";
      case "speaking": return "RESPONDING";
      case "listening": return "LISTENING";
      default: return "READY";
    }
  }, [state]);

  const color = useMemo(() => {
    switch (state) {
      case "thinking": return "#ffaa00";
      case "speaking": return "#00ff88";
      case "listening": return "#00d4ff";
      default: return "#666666";
    }
  }, [state]);

  useFrame(({ clock }) => {
    if (!dotRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 4) * 0.28;
    dotRef.current.scale.setScalar(pulse);
    (dotRef.current.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(t * 4) * 0.25;
  });

  return (
    <group position={position}>
      <mesh ref={dotRef}>
        <circleGeometry args={[0.012, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.75} />
      </mesh>
      <Text
        position={[0.045, 0, 0]}
        fontSize={0.028}
        color={color}
        anchorX="left"
        anchorY="middle"
      >
        {statusText}
        <meshBasicMaterial transparent opacity={0.75} />
      </Text>
    </group>
  );
};

// Data visualization bars
const DataBars = ({ position, state }: { position: [number, number, number]; state: AIState }) => {
  const barsRef = useRef<THREE.Group>(null);
  const barCount = 6;

  useFrame(({ clock }) => {
    if (!barsRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 3.5 : state === "speaking" ? 2 : 1;

    barsRef.current.children.forEach((bar, idx) => {
      if (bar instanceof THREE.Mesh) {
        const height = 0.04 + Math.sin(t * speed + idx * 0.6) * 0.035;
        bar.scale.y = height / 0.04;
        bar.position.y = height / 2;
      }
    });
  });

  return (
    <group ref={barsRef} position={position}>
      {Array.from({ length: barCount }).map((_, idx) => (
        <mesh key={idx} position={[(idx - barCount / 2 + 0.5) * 0.018, 0.02, 0]}>
          <boxGeometry args={[0.012, 0.04, 0.004]} />
          <meshBasicMaterial
            color={idx % 2 === 0 ? "#00d4ff" : "#00ff88"}
            transparent
            opacity={0.55}
          />
        </mesh>
      ))}
    </group>
  );
};

// Orbiting decorative elements
const OrbitingElements = ({ state }: { state: AIState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const count = 5;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 1.8 : 1;

    groupRef.current.rotation.z = t * 0.25 * speed;

    groupRef.current.children.forEach((element, idx) => {
      if (element instanceof THREE.Mesh) {
        const angle = (idx / count) * Math.PI * 2 + t * speed * 0.5;
        const radius = 0.85 + Math.sin(t * 2 + idx) * 0.04;

        element.position.x = Math.cos(angle) * radius;
        element.position.y = Math.sin(angle) * radius;

        (element.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(t * 3 + idx) * 0.2;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, idx) => (
        <mesh key={idx}>
          <octahedronGeometry args={[0.012, 0]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
};

// Corner decoration elements
const CornerDecorations = () => {
  return (
    <>
      {[[-0.72, 0.45], [0.72, 0.45], [-0.72, -0.45], [0.72, -0.45]].map(([x, y], idx) => (
        <mesh key={idx} position={[x, y, -0.1]}>
          <circleGeometry args={[0.015, 4]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.18} wireframe />
        </mesh>
      ))}
    </>
  );
};

// Progress ring for thinking state
const ProgressRing = ({ state }: { state: AIState }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (state === "thinking") {
      const interval = setInterval(() => {
        setProgress((p) => (p + 0.025) % 1);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [state]);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    ringRef.current.rotation.z = t * 0.4;
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(t * 4) * 0.18;
  });

  if (state !== "thinking") return null;

  return (
    <group position={[0, -0.48, 0]}>
      <mesh>
        <ringGeometry args={[0.065, 0.08, 48]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.1} />
      </mesh>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.065, 0.08, 48, 1, 0, Math.PI * 2 * progress]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.45} />
      </mesh>
      <Text
        position={[0.12, 0, 0]}
        fontSize={0.025}
        color="#00ff88"
        anchorX="left"
        anchorY="middle"
      >
        PROCESSING...
        <meshBasicMaterial transparent opacity={0.65} />
      </Text>
    </group>
  );
};

export const HUDScene = ({ state }: HUDSceneProps) => {
  return (
    <group>
      {/* Top status area */}
      <StatusIndicator position={[-0.55, 0.38, 0]} state={state} />
      
      {/* Data visualization */}
      <DataBars position={[0.55, 0.38, 0]} state={state} />
      
      {/* Orbiting elements */}
      <OrbitingElements state={state} />
      
      {/* Corner decorations */}
      <CornerDecorations />
      
      {/* Progress indicator */}
      <ProgressRing state={state} />
    </group>
  );
};
