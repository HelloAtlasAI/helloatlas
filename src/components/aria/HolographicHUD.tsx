import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { AIState } from "./AIOrb";

interface HolographicHUDProps {
  state: AIState;
  className?: string;
}

// Floating text labels
const HUDText = ({ 
  text, 
  position, 
  state,
  delay = 0
}: { 
  text: string; 
  position: [number, number, number];
  state: AIState;
  delay?: number;
}) => {
  const textRef = useRef<THREE.Mesh>(null);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useFrame(({ clock, camera }) => {
    if (!textRef.current) return;
    const t = clock.getElapsedTime();
    
    // Billboard effect - face camera
    textRef.current.quaternion.copy(camera.quaternion);
    
    // Floating animation
    textRef.current.position.y = position[1] + Math.sin(t * 2 + delay) * 0.02;
    
    // Opacity based on state
    const mat = textRef.current.material as THREE.MeshBasicMaterial;
    if (mat && mat.opacity !== undefined) {
      mat.opacity = visible 
        ? (state === "thinking" ? 0.9 : state === "speaking" ? 0.7 : 0.5) 
        : 0;
    }
  });

  if (!visible) return null;

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={0.06}
      color="#00d4ff"
      anchorX="center"
      anchorY="middle"
      font="/fonts/inter-medium.woff"
      characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:%/"
    >
      {text}
      <meshBasicMaterial transparent opacity={0.7} />
    </Text>
  );
};

// Circular progress indicator
const ProgressRing = ({ 
  progress, 
  position, 
  state 
}: { 
  progress: number; 
  position: [number, number, number];
  state: AIState;
}) => {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    
    ringRef.current.rotation.z = t * 0.5;
    
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = state === "thinking" 
      ? 0.6 + Math.sin(t * 4) * 0.2
      : 0.3;
  });

  return (
    <group position={position}>
      {/* Background ring */}
      <mesh>
        <ringGeometry args={[0.08, 0.1, 32]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.1} />
      </mesh>
      {/* Progress ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.08, 0.1, 32, 1, 0, Math.PI * 2 * progress]} />
        <meshBasicMaterial color="#00ff88" transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

// Data visualization bars
const DataBars = ({ position, state }: { position: [number, number, number]; state: AIState }) => {
  const barsRef = useRef<THREE.Group>(null);
  const barCount = 8;
  
  useFrame(({ clock }) => {
    if (!barsRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 4 : state === "speaking" ? 2 : 1;
    
    barsRef.current.children.forEach((bar, idx) => {
      if (bar instanceof THREE.Mesh) {
        const height = 0.05 + Math.sin(t * speed + idx * 0.5) * 0.04;
        bar.scale.y = height / 0.05;
        bar.position.y = height / 2;
      }
    });
  });

  return (
    <group ref={barsRef} position={position}>
      {Array.from({ length: barCount }).map((_, idx) => (
        <mesh key={idx} position={[(idx - barCount / 2 + 0.5) * 0.02, 0.025, 0]}>
          <boxGeometry args={[0.015, 0.05, 0.005]} />
          <meshBasicMaterial 
            color={idx % 2 === 0 ? "#00d4ff" : "#00ff88"} 
            transparent 
            opacity={0.6} 
          />
        </mesh>
      ))}
    </group>
  );
};

// Holographic panel frame
const HUDPanel = ({ 
  position, 
  size,
  state,
  children 
}: { 
  position: [number, number, number];
  size: [number, number];
  state: AIState;
  children?: React.ReactNode;
}) => {
  const panelRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock, camera }) => {
    if (!panelRef.current) return;
    const t = clock.getElapsedTime();
    
    // Face camera with slight lag
    panelRef.current.quaternion.slerp(camera.quaternion, 0.05);
    
    // Floating effect
    panelRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.01;
  });

  const opacity = state === "thinking" ? 0.4 : state === "speaking" ? 0.3 : 0.2;

  return (
    <group ref={panelRef} position={position}>
      {/* Panel background */}
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial 
          color="#0a0a1a" 
          transparent 
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(...size)]} />
        <lineBasicMaterial color="#00d4ff" transparent opacity={0.5} />
      </lineSegments>
      {/* Corner accents */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([x, y], idx) => (
        <mesh key={idx} position={[x * size[0] / 2, y * size[1] / 2, 0.001]}>
          <planeGeometry args={[0.02, 0.02]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.6} />
        </mesh>
      ))}
      {children}
    </group>
  );
};

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
      default: return "#888888";
    }
  }, [state]);

  useFrame(({ clock }) => {
    if (!dotRef.current) return;
    const t = clock.getElapsedTime();
    
    const pulse = 1 + Math.sin(t * 4) * 0.3;
    dotRef.current.scale.setScalar(pulse);
    
    (dotRef.current.material as THREE.MeshBasicMaterial).opacity = 
      0.6 + Math.sin(t * 4) * 0.3;
  });

  return (
    <group position={position}>
      <mesh ref={dotRef}>
        <circleGeometry args={[0.015, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <Text
        position={[0.05, 0, 0]}
        fontSize={0.035}
        color={color}
        anchorX="left"
        anchorY="middle"
      >
        {statusText}
        <meshBasicMaterial transparent opacity={0.8} />
      </Text>
    </group>
  );
};

// Orbiting data points
const OrbitingData = ({ state }: { state: AIState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const pointCount = 6;
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 2 : 1;
    
    groupRef.current.rotation.z = t * 0.3 * speed;
    
    groupRef.current.children.forEach((point, idx) => {
      if (point instanceof THREE.Mesh) {
        const angle = (idx / pointCount) * Math.PI * 2 + t * speed;
        const radius = 0.4 + Math.sin(t * 2 + idx) * 0.05;
        
        point.position.x = Math.cos(angle) * radius;
        point.position.y = Math.sin(angle) * radius;
        
        (point.material as THREE.MeshBasicMaterial).opacity = 
          0.4 + Math.sin(t * 3 + idx) * 0.3;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: pointCount }).map((_, idx) => (
        <mesh key={idx}>
          <octahedronGeometry args={[0.015, 0]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
};

// Main HUD Scene
const HUDScene = ({ state }: { state: AIState }) => {
  const [time, setTime] = useState("00:00:00");
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString());
      
      if (state === "thinking") {
        setProgress((p) => (p + 0.02) % 1);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <>
      <ambientLight intensity={0.2} />
      
      {/* Top left panel - Status */}
      <HUDPanel position={[-0.6, 0.4, 0]} size={[0.35, 0.15]} state={state}>
        <StatusIndicator position={[-0.1, 0.02, 0.01]} state={state} />
        <HUDText text={time} position={[-0.1, -0.03, 0.01]} state={state} />
      </HUDPanel>
      
      {/* Top right panel - Data viz */}
      <HUDPanel position={[0.6, 0.4, 0]} size={[0.3, 0.12]} state={state}>
        <DataBars position={[0, -0.02, 0.01]} state={state} />
        <HUDText text="NEURAL ACTIVITY" position={[0, 0.03, 0.01]} state={state} />
      </HUDPanel>
      
      {/* Bottom panel - Progress */}
      {state === "thinking" && (
        <group position={[0, -0.5, 0]}>
          <ProgressRing progress={progress} position={[0, 0, 0]} state={state} />
          <HUDText text="PROCESSING..." position={[0.15, 0, 0]} state={state} />
        </group>
      )}
      
      {/* Orbiting elements */}
      <OrbitingData state={state} />
      
      {/* Corner decorations */}
      {[[-0.8, 0.5], [0.8, 0.5], [-0.8, -0.5], [0.8, -0.5]].map(([x, y], idx) => (
        <mesh key={idx} position={[x, y, -0.1]}>
          <circleGeometry args={[0.02, 4]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.2} wireframe />
        </mesh>
      ))}
    </>
  );
};

export const HolographicHUD = ({ state, className = "" }: HolographicHUDProps) => {
  return (
    <div className={`w-full h-full pointer-events-none ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 1.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <HUDScene state={state} />
      </Canvas>
    </div>
  );
};