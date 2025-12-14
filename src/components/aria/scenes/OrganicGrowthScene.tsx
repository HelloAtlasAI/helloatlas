import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface OrganicGrowthSceneProps {
  state: AIState;
  audioLevel?: number;
}

// Cell core nodes that breathe and pulse
const CellCores = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const cellsRef = useRef<THREE.InstancedMesh>(null);
  
  const cellCount = 25;
  const cellData = useMemo(() => {
    const data: { position: THREE.Vector3; baseScale: number; phase: number; breathSpeed: number }[] = [];
    
    for (let i = 0; i < cellCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.5 + Math.random() * 3;
      
      data.push({
        position: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * radius,
          Math.sin(phi) * Math.sin(theta) * radius * 0.6,
          Math.cos(phi) * radius
        ),
        baseScale: 0.2 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
        breathSpeed: 0.5 + Math.random() * 0.5
      });
    }
    
    return data;
  }, []);
  
  useFrame((rootState) => {
    if (!cellsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.5 : state === "speaking" ? 1.3 : 0.8;
    
    const dummy = new THREE.Object3D();
    
    cellData.forEach((cell, i) => {
      // Organic breathing motion
      const breath = 1 + Math.sin(time * cell.breathSpeed + cell.phase) * 0.2 * activity;
      const audioBoost = 1 + audioLevel * 0.4;
      
      dummy.position.copy(cell.position);
      dummy.position.y += Math.sin(time * 0.3 + cell.phase) * 0.15;
      
      // Slightly squash/stretch for organic feel
      dummy.scale.set(
        cell.baseScale * breath * audioBoost,
        cell.baseScale * breath * audioBoost * 1.1,
        cell.baseScale * breath * audioBoost
      );
      dummy.updateMatrix();
      cellsRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    cellsRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={cellsRef} args={[undefined, undefined, cellCount]}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshStandardMaterial
        color="#10b981"
        emissive="#059669"
        emissiveIntensity={1.2}
        transparent
        opacity={0.85}
        roughness={0.3}
      />
    </instancedMesh>
  );
};

// Vascular streams - flowing tubes with data blood
const VascularStreams = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const tubesRef = useRef<THREE.Group>(null);
  const bloodRef = useRef<THREE.InstancedMesh>(null);
  
  const tubeData = useMemo(() => {
    const tubes: THREE.CatmullRomCurve3[] = [];
    const bloodParticles: { tubeIndex: number; speed: number; offset: number }[] = [];
    
    for (let i = 0; i < 20; i++) {
      // Create organic curved tubes
      const points: THREE.Vector3[] = [];
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 6
      );
      
      let current = start.clone();
      points.push(current.clone());
      
      const segments = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < segments; j++) {
        current = current.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 2
        ));
        points.push(current.clone());
      }
      
      tubes.push(new THREE.CatmullRomCurve3(points));
      
      // Blood particles per tube
      const particleCount = 3 + Math.floor(Math.random() * 4);
      for (let k = 0; k < particleCount; k++) {
        bloodParticles.push({
          tubeIndex: i,
          speed: 0.15 + Math.random() * 0.2,
          offset: Math.random()
        });
      }
    }
    
    return { tubes, bloodParticles };
  }, []);
  
  useFrame((rootState) => {
    if (!bloodRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 2 : state === "speaking" ? 1.5 : 1;
    
    const dummy = new THREE.Object3D();
    
    tubeData.bloodParticles.forEach((particle, i) => {
      const tube = tubeData.tubes[particle.tubeIndex];
      const t = ((time * particle.speed * activity + particle.offset) % 1);
      const pos = tube.getPoint(t);
      
      dummy.position.copy(pos);
      dummy.scale.setScalar(0.06 + audioLevel * 0.03);
      dummy.updateMatrix();
      bloodRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    bloodRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <group ref={tubesRef}>
      {/* Tube walls */}
      {tubeData.tubes.map((tube, i) => {
        const points = tube.getPoints(40);
        return (
          <mesh key={i}>
            <tubeGeometry args={[tube, 40, 0.03, 8, false]} />
            <meshStandardMaterial
              color="#14b8a6"
              emissive="#0d9488"
              emissiveIntensity={0.5}
              transparent
              opacity={0.4}
            />
          </mesh>
        );
      })}
      
      {/* Blood/data particles */}
      <instancedMesh ref={bloodRef} args={[undefined, undefined, tubeData.bloodParticles.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.9} />
      </instancedMesh>
    </group>
  );
};

// Branching tendrils - fractal-like extensions
const BranchingTendrils = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const tendrilsRef = useRef<THREE.Group>(null);
  
  const tendrilData = useMemo(() => {
    const tendrils: { points: THREE.Vector3[]; thickness: number }[] = [];
    
    // Create fractal-like branches
    const createBranch = (start: THREE.Vector3, direction: THREE.Vector3, depth: number, thickness: number) => {
      if (depth <= 0 || thickness < 0.005) return;
      
      const points: THREE.Vector3[] = [start.clone()];
      let current = start.clone();
      
      const segments = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < segments; i++) {
        const wobble = new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3
        );
        current = current.clone().add(direction.clone().multiplyScalar(0.3).add(wobble));
        points.push(current.clone());
      }
      
      tendrils.push({ points, thickness });
      
      // Spawn child branches
      if (Math.random() > 0.4) {
        const newDir = direction.clone().applyAxisAngle(
          new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
          Math.PI / 4
        );
        createBranch(current, newDir, depth - 1, thickness * 0.6);
      }
    };
    
    // Start main branches from cell positions
    for (let i = 0; i < 12; i++) {
      const theta = (i / 12) * Math.PI * 2;
      const start = new THREE.Vector3(Math.cos(theta) * 2, 0, Math.sin(theta) * 2);
      const dir = start.clone().normalize().multiplyScalar(-1);
      createBranch(start, dir, 3, 0.02);
    }
    
    return tendrils;
  }, []);
  
  useFrame((rootState) => {
    if (!tendrilsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    tendrilsRef.current.rotation.y = time * 0.01;
  });
  
  return (
    <group ref={tendrilsRef}>
      {tendrilData.map((tendril, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={tendril.points.length}
              array={new Float32Array(tendril.points.flatMap(p => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#22d3ee" transparent opacity={0.4} />
        </line>
      ))}
    </group>
  );
};

// Spore particles - ambient drifting organisms
const SporeParticles = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const sporesRef = useRef<THREE.Points>(null);
  
  const sporeCount = 600;
  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(sporeCount * 3);
    const vel = new Float32Array(sporeCount * 3);
    const col = new Float32Array(sporeCount * 3);
    
    const colorPalette = [
      new THREE.Color("#10b981"),
      new THREE.Color("#14b8a6"),
      new THREE.Color("#22d3ee"),
      new THREE.Color("#a7f3d0")
    ];
    
    for (let i = 0; i < sporeCount; i++) {
      const i3 = i * 3;
      
      pos[i3] = (Math.random() - 0.5) * 12;
      pos[i3 + 1] = (Math.random() - 0.5) * 8;
      pos[i3 + 2] = (Math.random() - 0.5) * 12;
      
      vel[i3] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 1] = Math.random() * 0.005;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.01;
      
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;
    }
    
    return { positions: pos, velocities: vel, colors: col };
  }, []);
  
  useFrame((rootState) => {
    if (!sporesRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const posArray = sporesRef.current.geometry.attributes.position.array as Float32Array;
    
    const activity = state === "thinking" ? 1.5 : state === "speaking" ? 1.2 : 0.8;
    
    for (let i = 0; i < sporeCount; i++) {
      const i3 = i * 3;
      
      // Gentle drifting with organic motion
      posArray[i3] += velocities[i3] * activity + Math.sin(time + i * 0.1) * 0.002;
      posArray[i3 + 1] += velocities[i3 + 1] * activity;
      posArray[i3 + 2] += velocities[i3 + 2] * activity + Math.cos(time + i * 0.1) * 0.002;
      
      // Wrap around boundaries
      if (posArray[i3] > 6) posArray[i3] = -6;
      if (posArray[i3] < -6) posArray[i3] = 6;
      if (posArray[i3 + 1] > 4) posArray[i3 + 1] = -4;
      if (posArray[i3 + 2] > 6) posArray[i3 + 2] = -6;
      if (posArray[i3 + 2] < -6) posArray[i3 + 2] = 6;
    }
    
    sporesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={sporesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={sporeCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={sporeCount} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Membrane walls
const MembraneWalls = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const membraneRef = useRef<THREE.Mesh>(null);
  
  useFrame((rootState) => {
    if (!membraneRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.2 : state === "speaking" ? 1.1 : 0.9;
    
    const scale = 5.5 + Math.sin(time * 0.3) * 0.3 * activity + audioLevel * 0.5;
    membraneRef.current.scale.setScalar(scale);
    membraneRef.current.rotation.y = time * 0.015;
  });
  
  return (
    <mesh ref={membraneRef}>
      <icosahedronGeometry args={[1, 3]} />
      <meshStandardMaterial
        color="#10b981"
        emissive="#059669"
        emissiveIntensity={0.2}
        transparent
        opacity={0.08}
        wireframe
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export const OrganicGrowthScene = ({ state, audioLevel = 0 }: OrganicGrowthSceneProps) => {
  return (
    <group>
      <CellCores state={state} audioLevel={audioLevel} />
      <VascularStreams state={state} audioLevel={audioLevel} />
      <BranchingTendrils state={state} audioLevel={audioLevel} />
      <SporeParticles state={state} audioLevel={audioLevel} />
      <MembraneWalls state={state} audioLevel={audioLevel} />
    </group>
  );
};
