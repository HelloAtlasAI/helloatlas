import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface BackgroundSceneProps {
  state: AIState;
}

// Deep space star field with multiple layers
const StarField = ({ state }: { state: AIState }) => {
  const nearStarsRef = useRef<THREE.Points>(null);
  const midStarsRef = useRef<THREE.Points>(null);
  const farStarsRef = useRef<THREE.Points>(null);
  
  const nearCount = 800;
  const midCount = 1500;
  const farCount = 2000;

  const nearData = useMemo(() => {
    const positions = new Float32Array(nearCount * 3);
    const colors = new Float32Array(nearCount * 3);
    const sizes = new Float32Array(nearCount);

    for (let i = 0; i < nearCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 6 + Math.random() * 4;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      sizes[i] = 0.03 + Math.random() * 0.05;

      // Color variations - cyan, white, blue
      const colorType = Math.random();
      if (colorType < 0.4) {
        colors[i * 3] = 0; colors[i * 3 + 1] = 0.83; colors[i * 3 + 2] = 1;
      } else if (colorType < 0.7) {
        colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
      } else {
        colors[i * 3] = 0.5; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 1;
      }
    }

    return { positions, colors, sizes };
  }, []);

  const midData = useMemo(() => {
    const positions = new Float32Array(midCount * 3);
    const colors = new Float32Array(midCount * 3);

    for (let i = 0; i < midCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 10 + Math.random() * 8;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const colorType = Math.random();
      if (colorType < 0.5) {
        colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1;
      } else if (colorType < 0.8) {
        colors[i * 3] = 0.66; colors[i * 3 + 1] = 0.33; colors[i * 3 + 2] = 0.97;
      } else {
        colors[i * 3] = 0.92; colors[i * 3 + 1] = 0.28; colors[i * 3 + 2] = 0.6;
      }
    }

    return { positions, colors };
  }, []);

  const farData = useMemo(() => {
    const positions = new Float32Array(farCount * 3);
    const colors = new Float32Array(farCount * 3);

    for (let i = 0; i < farCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 18 + Math.random() * 12;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Dimmer, more distant colors
      colors[i * 3] = 0.6 + Math.random() * 0.4;
      colors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
    }

    return { positions, colors };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const speed = state === "thinking" ? 0.12 : 0.04;
    
    if (nearStarsRef.current) {
      nearStarsRef.current.rotation.y = t * speed;
      nearStarsRef.current.rotation.x = Math.sin(t * 0.05) * 0.05;
    }
    if (midStarsRef.current) {
      midStarsRef.current.rotation.y = t * speed * 0.6;
    }
    if (farStarsRef.current) {
      farStarsRef.current.rotation.y = t * speed * 0.3;
    }
  });

  return (
    <>
      <points ref={nearStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={nearCount} array={nearData.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={nearCount} array={nearData.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={midStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={midCount} array={midData.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={midCount} array={midData.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.6}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={farStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={farCount} array={farData.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={farCount} array={farData.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.025}
          vertexColors
          transparent
          opacity={0.4}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};

// Volumetric nebula clouds
const NebulaClouds = ({ state }: { state: AIState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh[]>([]);

  const nebulaConfigs = useMemo(() => [
    { position: [-8, 3, -12] as [number, number, number], scale: 4, color: "#00d4ff", opacity: 0.025 },
    { position: [10, -2, -15] as [number, number, number], scale: 5, color: "#a855f7", opacity: 0.02 },
    { position: [-5, -5, -18] as [number, number, number], scale: 6, color: "#ec4899", opacity: 0.018 },
    { position: [7, 5, -10] as [number, number, number], scale: 3.5, color: "#00ff88", opacity: 0.022 },
    { position: [0, 8, -20] as [number, number, number], scale: 7, color: "#00aaff", opacity: 0.015 },
    { position: [-12, 0, -14] as [number, number, number], scale: 4.5, color: "#ff6b9d", opacity: 0.02 },
    { position: [15, -4, -22] as [number, number, number], scale: 8, color: "#8b5cf6", opacity: 0.012 },
    { position: [-3, -8, -16] as [number, number, number], scale: 5, color: "#06b6d4", opacity: 0.018 },
  ], []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.005;
    }

    // Breathing animation for each cloud
    cloudsRef.current.forEach((mesh, i) => {
      if (mesh) {
        const breathe = 1 + Math.sin(t * 0.3 + i * 0.5) * 0.08;
        mesh.scale.setScalar(nebulaConfigs[i].scale * breathe);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {nebulaConfigs.map((config, i) => (
        <mesh
          key={i}
          ref={el => { if (el) cloudsRef.current[i] = el; }}
          position={config.position}
          scale={config.scale}
        >
          <icosahedronGeometry args={[1, 3]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={config.opacity}
          />
        </mesh>
      ))}
      
      {/* Additional softer outer clouds */}
      {nebulaConfigs.slice(0, 4).map((config, i) => (
        <mesh
          key={`outer-${i}`}
          position={[config.position[0] * 1.2, config.position[1] * 1.1, config.position[2] * 1.3]}
          scale={config.scale * 1.8}
        >
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={config.opacity * 0.4}
          />
        </mesh>
      ))}
    </group>
  );
};

// Matrix-style data rain with depth
const DataRain = ({ state }: { state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 2000;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const column = Math.floor(Math.random() * 80);
      pos[i * 3] = (column / 80 - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = -4 - Math.random() * 8;

      vel[i] = 0.6 + Math.random() * 1.8;
    }

    return { positions: pos, velocities: vel };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const speed = state === "thinking" ? 3 : state === "speaking" ? 1.8 : 1;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      posArray[idx + 1] -= velocities[i] * 0.012 * speed;

      if (posArray[idx + 1] < -8) {
        posArray[idx + 1] = 8;
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
        size={0.022}
        color="#00ff88"
        transparent
        opacity={0.35}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Neural network connection lines
const NeuralNetwork = ({ state }: { state: AIState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.Line[]>([]);
  
  const nodeCount = 40;
  const connectionCount = 60;

  const { nodes, connections } = useMemo(() => {
    const nodePositions: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodePositions.push(new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        -3 - Math.random() * 10
      ));
    }

    const conns: [number, number][] = [];
    for (let i = 0; i < connectionCount; i++) {
      const a = Math.floor(Math.random() * nodeCount);
      let b = Math.floor(Math.random() * nodeCount);
      while (b === a) b = Math.floor(Math.random() * nodeCount);
      conns.push([a, b]);
    }

    return { nodes: nodePositions, connections: conns };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.1) * 0.1;
    }

    // Pulse animation along lines
    linesRef.current.forEach((line, i) => {
      if (line && line.material) {
        const material = line.material as THREE.LineBasicMaterial;
        const pulse = (Math.sin(t * 2 + i * 0.5) + 1) / 2;
        material.opacity = 0.1 + pulse * 0.15;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Neural nodes */}
      {nodes.map((pos, i) => (
        <mesh key={`node-${i}`} position={pos}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Connection lines */}
      {connections.map(([a, b], i) => {
        const points = [nodes[a], nodes[b]];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        return (
          <line key={`conn-${i}`} ref={el => { if (el) linesRef.current[i] = el as unknown as THREE.Line; }}>
            <bufferGeometry attach="geometry" {...geometry} />
            <lineBasicMaterial 
              color="#00d4ff" 
              transparent 
              opacity={0.15}
            />
          </line>
        );
      })}
    </group>
  );
};

// Floating holographic symbols
const HolographicSymbols = ({ state }: { state: AIState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const symbolCount = 15;

  const symbols = useMemo(() => {
    return Array.from({ length: symbolCount }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        -2 - Math.random() * 6
      ] as [number, number, number],
      rotation: Math.random() * Math.PI * 2,
      scale: 0.1 + Math.random() * 0.15,
      type: Math.floor(Math.random() * 3), // 0: hexagon, 1: circle, 2: square
    }));
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.rotation.z = symbols[i].rotation + t * 0.3;
        child.rotation.y = Math.sin(t * 0.5 + i) * 0.3;
        child.position.y = symbols[i].position[1] + Math.sin(t * 0.4 + i * 0.5) * 0.3;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {symbols.map((sym, i) => (
        <mesh key={i} position={sym.position} scale={sym.scale}>
          {sym.type === 0 ? (
            <circleGeometry args={[1, 6]} />
          ) : sym.type === 1 ? (
            <ringGeometry args={[0.6, 1, 32]} />
          ) : (
            <planeGeometry args={[1.4, 1.4]} />
          )}
          <meshBasicMaterial 
            color={sym.type === 0 ? "#00d4ff" : sym.type === 1 ? "#a855f7" : "#00ff88"} 
            transparent 
            opacity={0.2}
            wireframe={sym.type === 2}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

// Distant geometric structures
const GeometricStructures = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Distant hexagonal grid panels */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 12, 0, -15]} rotation={[0, side * 0.3, 0]}>
          <mesh>
            <planeGeometry args={[8, 8, 8, 8]} />
            <meshBasicMaterial 
              color="#00d4ff" 
              transparent 
              opacity={0.05}
              wireframe
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      {/* Floor grid */}
      <mesh position={[0, -5, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 20, 30, 20]} />
        <meshBasicMaterial 
          color="#00d4ff" 
          transparent 
          opacity={0.03}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Orbiting data rings in background */}
      {[0, 1, 2].map((i) => (
        <mesh 
          key={i}
          position={[
            Math.cos(i * Math.PI * 0.667) * 8,
            (i - 1) * 3,
            -12 + Math.sin(i * Math.PI * 0.667) * 4
          ]}
          rotation={[Math.PI / 4 + i * 0.3, i * 0.5, 0]}
        >
          <torusGeometry args={[2 + i * 0.5, 0.02, 8, 64]} />
          <meshBasicMaterial 
            color={i === 0 ? "#00d4ff" : i === 1 ? "#a855f7" : "#00ff88"} 
            transparent 
            opacity={0.1}
          />
        </mesh>
      ))}
    </group>
  );
};

// Galaxy sprites in far distance
const GalaxySprites = () => {
  const galaxyCount = 8;
  
  const galaxies = useMemo(() => {
    return Array.from({ length: galaxyCount }).map(() => ({
      position: [
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 25,
        -25 - Math.random() * 15
      ] as [number, number, number],
      scale: 0.5 + Math.random() * 1.5,
      rotation: Math.random() * Math.PI,
    }));
  }, []);

  return (
    <group>
      {galaxies.map((galaxy, i) => (
        <mesh key={i} position={galaxy.position} rotation={[0, 0, galaxy.rotation]} scale={galaxy.scale}>
          <circleGeometry args={[1, 64]} />
          <meshBasicMaterial 
            color={i % 2 === 0 ? "#00aaff" : "#ffaa00"} 
            transparent 
            opacity={0.06}
          />
        </mesh>
      ))}
    </group>
  );
};

export const BackgroundScene = ({ state }: BackgroundSceneProps) => {
  return (
    <group>
      <StarField state={state} />
      <NebulaClouds state={state} />
      <DataRain state={state} />
      <NeuralNetwork state={state} />
      <HolographicSymbols state={state} />
      <GeometricStructures />
      <GalaxySprites />
      <fog attach="fog" args={["#050510", 10, 35]} />
    </group>
  );
};