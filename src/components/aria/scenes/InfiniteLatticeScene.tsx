import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface InfiniteLatticeSceneProps {
  state: AIState;
  audioLevel?: number;
}

// 4D Tesseract projection core
const TesseractCore = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Generate 4D hypercube vertices
  const { vertices4D, edges } = useMemo(() => {
    const vertices4D: number[][] = [];
    
    // 16 vertices of a tesseract
    for (let i = 0; i < 16; i++) {
      vertices4D.push([
        (i & 1) ? 1 : -1,
        (i & 2) ? 1 : -1,
        (i & 4) ? 1 : -1,
        (i & 8) ? 1 : -1,
      ]);
    }
    
    // 32 edges connecting vertices that differ in exactly one coordinate
    const edges: number[][] = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diff = 0;
        for (let k = 0; k < 4; k++) {
          if (vertices4D[i][k] !== vertices4D[j][k]) diff++;
        }
        if (diff === 1) edges.push([i, j]);
      }
    }
    
    return { vertices4D, edges };
  }, []);

  useFrame((rootState) => {
    if (!linesRef.current) return;
    
    const time = rootState.clock.getElapsedTime();
    const rotationSpeed = state === "speaking" ? 0.5 : state === "thinking" ? 0.3 : 0.15;
    
    // 4D rotation matrices
    const angle1 = time * rotationSpeed;
    const angle2 = time * rotationSpeed * 0.7;
    
    // Project 4D to 3D
    const positions: number[] = [];
    const projectedVertices: THREE.Vector3[] = [];
    
    vertices4D.forEach((v4) => {
      // Rotate in XW plane
      let x = v4[0] * Math.cos(angle1) - v4[3] * Math.sin(angle1);
      let w = v4[0] * Math.sin(angle1) + v4[3] * Math.cos(angle1);
      
      // Rotate in YW plane
      let y = v4[1] * Math.cos(angle2) - w * Math.sin(angle2);
      w = v4[1] * Math.sin(angle2) + w * Math.cos(angle2);
      
      let z = v4[2];
      
      // Perspective projection from 4D to 3D
      const distance = 3;
      const scale = distance / (distance - w) * (0.8 + audioLevel * 0.2);
      
      projectedVertices.push(new THREE.Vector3(x * scale, y * scale, z * scale));
    });
    
    // Create edge geometry
    edges.forEach(([i, j]) => {
      positions.push(
        projectedVertices[i].x, projectedVertices[i].y, projectedVertices[i].z,
        projectedVertices[j].x, projectedVertices[j].y, projectedVertices[j].z
      );
    });
    
    const geometry = linesRef.current.geometry as THREE.BufferGeometry;
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  });

  return (
    <group ref={groupRef}>
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#00ffcc" transparent opacity={0.9} linewidth={2} />
      </lineSegments>
    </group>
  );
};

// Inner tesseract layers
const InnerTesseracts = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const layerCount = 3;

  useFrame((rootState) => {
    if (!groupRef.current) return;
    
    const time = rootState.clock.getElapsedTime();
    const speed = state === "speaking" ? 1.5 : 1;
    
    groupRef.current.children.forEach((child, i) => {
      const scale = 0.3 + i * 0.2;
      child.scale.setScalar(scale + Math.sin(time * speed + i) * 0.05);
      child.rotation.x = time * 0.3 * (i + 1) * speed;
      child.rotation.y = time * 0.2 * (i + 1) * speed;
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: layerCount }).map((_, i) => (
        <mesh key={i}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial 
            color={i === 0 ? "#ffffff" : i === 1 ? "#00ffaa" : "#00aaff"} 
            wireframe 
            transparent 
            opacity={0.4 - i * 0.1} 
          />
        </mesh>
      ))}
    </group>
  );
};

// Infinite grid extending to horizon
const InfiniteGrid = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_audioLevel: { value: 0 },
  }), []);

  const vertexShader = `
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
      vPosition = position;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float u_time;
    uniform float u_audioLevel;
    
    varying vec3 vPosition;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv * 20.0;
      
      // Moving grid lines
      float lineX = smoothstep(0.02, 0.0, abs(fract(uv.x + u_time * 0.2) - 0.5));
      float lineY = smoothstep(0.02, 0.0, abs(fract(uv.y + u_time * 0.1) - 0.5));
      
      float grid = max(lineX, lineY);
      
      // Fade with distance from center
      float dist = length(vUv - 0.5) * 2.0;
      float fade = 1.0 - smoothstep(0.3, 1.0, dist);
      
      // Pulse effect
      float pulse = sin(u_time * 2.0 - dist * 5.0) * 0.5 + 0.5;
      pulse = pulse * u_audioLevel + 0.3;
      
      vec3 color = vec3(0.0, 0.8, 1.0) * grid * fade * pulse;
      
      float alpha = grid * fade * 0.5;
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value += delta;
      materialRef.current.uniforms.u_audioLevel.value = audioLevel;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[20, 20, 1, 1]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2, 0]}>
        <planeGeometry args={[20, 20, 1, 1]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// Data node clusters at grid intersections
const DataNodes = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const nodeCount = 500;

  const { positions, phases, baseScales } = useMemo(() => {
    const positions = new Float32Array(nodeCount * 3);
    const phases = new Float32Array(nodeCount);
    const baseScales = new Float32Array(nodeCount);

    for (let i = 0; i < nodeCount; i++) {
      // Grid-aligned positions with some randomness
      const gridSize = 0.8;
      positions[i * 3] = (Math.floor(Math.random() * 12) - 6) * gridSize + (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 1] = (Math.floor(Math.random() * 8) - 4) * gridSize + (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 2] = (Math.floor(Math.random() * 12) - 6) * gridSize + (Math.random() - 0.5) * 0.2;
      
      phases[i] = Math.random() * Math.PI * 2;
      baseScales[i] = 0.02 + Math.random() * 0.03;
    }

    return { positions, phases, baseScales };
  }, []);

  useFrame((rootState) => {
    if (!meshRef.current) return;
    
    const time = rootState.clock.getElapsedTime();
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    
    const activity = state === "thinking" ? 1.5 : state === "speaking" ? 1.3 : 1;

    for (let i = 0; i < nodeCount; i++) {
      position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      
      // Pulsing based on activity
      const pulse = Math.sin(time * 2 * activity + phases[i]) * 0.5 + 0.5;
      const nodeScale = baseScales[i] * (1 + pulse * 0.5 + audioLevel * 0.5);
      scale.setScalar(nodeScale);
      
      matrix.compose(position, rotation, scale);
      meshRef.current.setMatrixAt(i, matrix);
      
      // Color based on activity level
      const brightness = 0.5 + pulse * 0.5;
      const color = new THREE.Color().setHSL(0.5 + pulse * 0.1, 0.8, brightness);
      meshRef.current.setColorAt(i, color);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, nodeCount]}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial transparent opacity={0.9} />
    </instancedMesh>
  );
};

// Energy pulses traveling along grid lines
const EnergyPulses = ({ audioLevel = 0 }: { audioLevel: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const pulseCount = 60;

  const { positions, directions, speeds, phases } = useMemo(() => {
    const positions = new Float32Array(pulseCount * 3);
    const directions = new Float32Array(pulseCount * 3);
    const speeds = new Float32Array(pulseCount);
    const phases = new Float32Array(pulseCount);

    for (let i = 0; i < pulseCount; i++) {
      // Start at random grid positions
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      // Move along grid axes
      const axis = Math.floor(Math.random() * 3);
      directions[i * 3] = axis === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      directions[i * 3 + 1] = axis === 1 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      directions[i * 3 + 2] = axis === 2 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      
      speeds[i] = 2 + Math.random() * 3;
      phases[i] = Math.random() * 10;
    }

    return { positions, directions, speeds, phases };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < pulseCount; i++) {
      // Move pulse
      positions[i * 3] += directions[i * 3] * speeds[i] * delta;
      positions[i * 3 + 1] += directions[i * 3 + 1] * speeds[i] * delta;
      positions[i * 3 + 2] += directions[i * 3 + 2] * speeds[i] * delta;
      
      // Wrap around
      for (let j = 0; j < 3; j++) {
        if (positions[i * 3 + j] > 5) positions[i * 3 + j] = -5;
        if (positions[i * 3 + j] < -5) positions[i * 3 + j] = 5;
      }
      
      position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      
      const pulse = Math.sin(time * 5 + phases[i]) * 0.5 + 0.5;
      const pulseScale = 0.03 + pulse * 0.02 + audioLevel * 0.02;
      scale.setScalar(pulseScale);
      
      matrix.compose(position, rotation, scale);
      meshRef.current.setMatrixAt(i, matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, pulseCount]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
    </instancedMesh>
  );
};

// Crystalline shards orbiting
const CrystallineShards = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const shardCount = 20;

  const shards = useMemo(() => {
    return Array.from({ length: shardCount }).map((_, i) => ({
      orbitRadius: 2 + Math.random() * 1.5,
      orbitSpeed: 0.1 + Math.random() * 0.2,
      orbitPhase: (i / shardCount) * Math.PI * 2,
      tilt: Math.random() * Math.PI,
      size: 0.05 + Math.random() * 0.1,
    }));
  }, []);

  useFrame((rootState) => {
    if (!groupRef.current) return;
    
    const time = rootState.clock.getElapsedTime();
    const speed = state === "speaking" ? 2 : 1;
    
    groupRef.current.children.forEach((mesh, i) => {
      const shard = shards[i];
      const angle = time * shard.orbitSpeed * speed + shard.orbitPhase;
      
      mesh.position.x = Math.cos(angle) * shard.orbitRadius;
      mesh.position.y = Math.sin(time * 0.3 + shard.orbitPhase) * 0.5;
      mesh.position.z = Math.sin(angle) * shard.orbitRadius;
      
      mesh.rotation.x = time + i;
      mesh.rotation.y = time * 0.7 + i;
      
      const scale = shard.size * (1 + audioLevel * 0.3);
      mesh.scale.setScalar(scale);
    });
  });

  return (
    <group ref={groupRef}>
      {shards.map((shard, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial 
            color={i % 3 === 0 ? "#00ffcc" : i % 3 === 1 ? "#00aaff" : "#ffffff"} 
            wireframe 
            transparent 
            opacity={0.6} 
          />
        </mesh>
      ))}
    </group>
  );
};

export const InfiniteLatticeScene = ({ state, audioLevel = 0 }: InfiniteLatticeSceneProps) => {
  return (
    <group>
      <TesseractCore state={state} audioLevel={audioLevel} />
      <InnerTesseracts state={state} audioLevel={audioLevel} />
      <InfiniteGrid state={state} audioLevel={audioLevel} />
      <DataNodes state={state} audioLevel={audioLevel} />
      <EnergyPulses audioLevel={audioLevel} />
      <CrystallineShards state={state} audioLevel={audioLevel} />
    </group>
  );
};

export default InfiniteLatticeScene;
