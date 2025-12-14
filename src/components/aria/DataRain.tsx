import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "./AIOrb";

interface DataRainProps {
  state: AIState;
  className?: string;
}

// Matrix-style data rain with GPU particles
const RainParticles = ({ state, count = 8000 }: { state: AIState; count?: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions, velocities, phases, columns } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    const phs = new Float32Array(count);
    const cols = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Distribute in columns for matrix effect
      const column = Math.floor(Math.random() * 100);
      const x = (column / 100 - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 5 - 2;
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      
      vel[i] = 0.5 + Math.random() * 2;
      phs[i] = Math.random() * Math.PI * 2;
      cols[i] = column;
    }
    
    return { positions: pos, velocities: vel, phases: phs, columns: cols };
  }, [count]);

  const colors = useMemo(() => {
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Cyan to green gradient with some purple
      const type = Math.random();
      let r, g, b;
      if (type > 0.8) {
        // Purple accent
        r = 0.4; g = 0.1; b = 0.6;
      } else if (type > 0.3) {
        // Green (matrix style)
        r = 0; g = 0.8 + Math.random() * 0.2; b = 0.3;
      } else {
        // Cyan
        r = 0; g = 0.8; b = 1;
      }
      cols[i * 3] = r;
      cols[i * 3 + 1] = g;
      cols[i * 3 + 2] = b;
    }
    return cols;
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    
    const speed = state === "thinking" ? 3 : state === "speaking" ? 2 : 1;
    const pullToCenter = state === "thinking" ? 0.02 : 0;
    
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      
      // Fall down
      posArray[idx + 1] -= velocities[i] * 0.02 * speed;
      
      // Pull toward center when thinking
      if (pullToCenter > 0) {
        posArray[idx] += (0 - posArray[idx]) * pullToCenter;
        posArray[idx + 2] += (-1 - posArray[idx + 2]) * pullToCenter;
      }
      
      // Subtle horizontal drift
      posArray[idx] += Math.sin(t + phases[i]) * 0.001;
      
      // Reset when below screen
      if (posArray[idx + 1] < -5) {
        posArray[idx + 1] = 5;
        posArray[idx] = (columns[i] / 100 - 0.5) * 10;
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Horizontal data streams
const DataStreams = ({ state }: { state: AIState }) => {
  const streamsRef = useRef<THREE.Group>(null);
  const streamCount = 20;
  
  const streams = useMemo(() => {
    return Array.from({ length: streamCount }, () => ({
      y: (Math.random() - 0.5) * 8,
      z: -2 - Math.random() * 3,
      speed: 1 + Math.random() * 3,
      length: 0.5 + Math.random() * 2,
      offset: Math.random() * 10,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!streamsRef.current) return;
    const t = clock.getElapsedTime();
    const speedMult = state === "thinking" ? 2 : 1;
    
    streamsRef.current.children.forEach((stream, idx) => {
      if (stream instanceof THREE.Mesh) {
        const data = streams[idx];
        stream.position.x = ((t * data.speed * speedMult + data.offset) % 12) - 6;
        (stream.material as THREE.MeshBasicMaterial).opacity = 
          0.2 + Math.sin(t * 3 + idx) * 0.1;
      }
    });
  });

  return (
    <group ref={streamsRef}>
      {streams.map((stream, idx) => (
        <mesh key={idx} position={[-6, stream.y, stream.z]}>
          <boxGeometry args={[stream.length, 0.01, 0.01]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
};

// Floating binary/hex characters
const FloatingCharacters = ({ state }: { state: AIState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const charCount = 30;
  
  const characters = useMemo(() => {
    return Array.from({ length: charCount }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        -1 - Math.random() * 3
      ),
      rotation: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.5,
      scale: 0.05 + Math.random() * 0.1,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    
    groupRef.current.children.forEach((char, idx) => {
      if (char instanceof THREE.Mesh) {
        const data = characters[idx];
        char.rotation.z = t * data.speed;
        char.position.y = data.position.y + Math.sin(t + idx) * 0.2;
        
        if (state === "thinking") {
          char.position.x += (0 - char.position.x) * 0.01;
          char.position.y += (0 - char.position.y) * 0.01;
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {characters.map((char, idx) => (
        <mesh key={idx} position={char.position} scale={char.scale}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial 
            color={idx % 2 === 0 ? "#00d4ff" : "#00ff88"} 
            transparent 
            opacity={0.4}
            wireframe
          />
        </mesh>
      ))}
    </group>
  );
};

// Grid floor effect
const GridFloor = ({ state }: { state: AIState }) => {
  const gridRef = useRef<THREE.GridHelper>(null);
  
  useFrame(({ clock }) => {
    if (!gridRef.current) return;
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 2 : 0.5;
    
    gridRef.current.position.z = (t * speed) % 1;
  });

  return (
    <group position={[0, -3, 0]} rotation={[0, 0, 0]}>
      <gridHelper 
        ref={gridRef}
        args={[20, 40, "#00ff8833", "#00ff8811"]} 
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -5]}
      />
    </group>
  );
};

// Main Data Rain Scene
const DataRainScene = ({ state }: { state: AIState }) => {
  return (
    <>
      <ambientLight intensity={0.1} />
      <RainParticles state={state} count={8000} />
      <DataStreams state={state} />
      <FloatingCharacters state={state} />
      <GridFloor state={state} />
    </>
  );
};

export const DataRain = ({ state, className = "" }: DataRainProps) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <DataRainScene state={state} />
      </Canvas>
    </div>
  );
};