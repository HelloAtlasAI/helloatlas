import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface OrganicGrowthSceneProps {
  state: AIState;
  audioLevel?: number;
}

// Blob-like cell cores with noise displacement and membrane shimmer
const CellCores = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const cellsRef = useRef<THREE.InstancedMesh>(null);
  const membranesRef = useRef<THREE.InstancedMesh>(null);
  const nucleiRef = useRef<THREE.InstancedMesh>(null);
  
  const cellCount = 20;
  const cellData = useMemo(() => {
    const data: { position: THREE.Vector3; scale: number; phase: number; breathSpeed: number }[] = [];
    
    for (let i = 0; i < cellCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 1.5 + Math.random() * 3.5;
      
      data.push({
        position: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * radius,
          Math.sin(phi) * Math.sin(theta) * radius * 0.65,
          Math.cos(phi) * radius
        ),
        scale: 0.18 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
        breathSpeed: 0.4 + Math.random() * 0.4
      });
    }
    
    return data;
  }, []);
  
  useFrame((rootState) => {
    if (!cellsRef.current || !membranesRef.current || !nucleiRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.5 : state === "speaking" ? 1.3 : 0.7;
    
    const dummy = new THREE.Object3D();
    const membraneDummy = new THREE.Object3D();
    const nucleusDummy = new THREE.Object3D();
    
    cellData.forEach((cell, i) => {
      // Organic breathing and pulsing
      const breath = 1 + Math.sin(time * cell.breathSpeed + cell.phase) * 0.25 * activity;
      const audioBoost = 1 + audioLevel * 0.5;
      const baseScale = cell.scale * breath * audioBoost;
      
      // Cell body - squash and stretch
      dummy.position.copy(cell.position);
      dummy.position.y += Math.sin(time * 0.25 + cell.phase) * 0.18;
      dummy.scale.set(
        baseScale * (1 + Math.sin(time * 0.8 + cell.phase) * 0.1),
        baseScale * (1 + Math.cos(time * 0.8 + cell.phase) * 0.15),
        baseScale * (1 + Math.sin(time * 0.8 + cell.phase + 1) * 0.1)
      );
      dummy.rotation.set(time * 0.1 + cell.phase, time * 0.15 + cell.phase, 0);
      dummy.updateMatrix();
      cellsRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Outer membrane glow
      membraneDummy.position.copy(dummy.position);
      membraneDummy.scale.setScalar(baseScale * 1.6);
      membraneDummy.updateMatrix();
      membranesRef.current!.setMatrixAt(i, membraneDummy.matrix);
      
      // Inner nucleus
      nucleusDummy.position.copy(dummy.position);
      nucleusDummy.scale.setScalar(baseScale * 0.35);
      nucleusDummy.rotation.set(-time * 0.2, time * 0.3, 0);
      nucleusDummy.updateMatrix();
      nucleiRef.current!.setMatrixAt(i, nucleusDummy.matrix);
    });
    
    cellsRef.current.instanceMatrix.needsUpdate = true;
    membranesRef.current.instanceMatrix.needsUpdate = true;
    nucleiRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <group>
      {/* Main cell bodies - using icosahedron for organic blob look */}
      <instancedMesh ref={cellsRef} args={[undefined, undefined, cellCount]}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#047857"
          emissiveIntensity={1.5}
          roughness={0.4}
          metalness={0.2}
          transparent
          opacity={0.85}
        />
      </instancedMesh>
      
      {/* Outer membrane glow */}
      <instancedMesh ref={membranesRef} args={[undefined, undefined, cellCount]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#34d399"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
      
      {/* Inner nuclei */}
      <instancedMesh ref={nucleiRef} args={[undefined, undefined, cellCount]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshBasicMaterial
          color="#a7f3d0"
          transparent
          opacity={0.9}
        />
      </instancedMesh>
    </group>
  );
};

// Thick vascular veins with visible flow
const VascularVeins = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const veinsRef = useRef<THREE.Group>(null);
  
  const veinData = useMemo(() => {
    const veins: { curve: THREE.CatmullRomCurve3; thickness: number }[] = [];
    
    for (let i = 0; i < 18; i++) {
      const points: THREE.Vector3[] = [];
      
      // Create organic curved path
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 7
      );
      
      let current = start.clone();
      points.push(current.clone());
      
      const segments = 4 + Math.floor(Math.random() * 3);
      for (let j = 0; j < segments; j++) {
        const wobble = new THREE.Vector3(
          (Math.random() - 0.5) * 2.5,
          (Math.random() - 0.5) * 1.8,
          (Math.random() - 0.5) * 2.5
        );
        current = current.clone().add(wobble);
        points.push(current.clone());
      }
      
      veins.push({
        curve: new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5),
        thickness: 0.04 + Math.random() * 0.05
      });
    }
    
    return veins;
  }, []);
  
  return (
    <group ref={veinsRef}>
      {veinData.map((vein, i) => (
        <group key={i}>
          {/* Outer vein wall - translucent */}
          <mesh>
            <tubeGeometry args={[vein.curve, 64, vein.thickness, 12, false]} />
            <meshStandardMaterial
              color="#14b8a6"
              emissive="#0d9488"
              emissiveIntensity={0.8}
              transparent
              opacity={0.5}
              roughness={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Inner flow core - bright */}
          <mesh>
            <tubeGeometry args={[vein.curve, 64, vein.thickness * 0.4, 8, false]} />
            <meshBasicMaterial
              color="#5eead4"
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Blood/data pulses with organic trails - ellipsoid shape
const BloodPulses = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const pulsesRef = useRef<THREE.InstancedMesh>(null);
  const trailsRef = useRef<THREE.InstancedMesh>(null);
  
  const pulseCount = 50;
  const trailLength = 6;
  
  const pulseData = useMemo(() => {
    const data: { curve: THREE.CatmullRomCurve3; speed: number; offset: number }[] = [];
    
    for (let i = 0; i < pulseCount; i++) {
      const points: THREE.Vector3[] = [];
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 8
      );
      
      let current = start.clone();
      points.push(current.clone());
      
      const segments = 4 + Math.floor(Math.random() * 3);
      for (let j = 0; j < segments; j++) {
        current = current.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 2.5,
          (Math.random() - 0.5) * 1.8,
          (Math.random() - 0.5) * 2.5
        ));
        points.push(current.clone());
      }
      
      data.push({
        curve: new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5),
        speed: 0.12 + Math.random() * 0.18,
        offset: Math.random()
      });
    }
    
    return data;
  }, []);
  
  useFrame((rootState) => {
    if (!pulsesRef.current || !trailsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 2 : state === "speaking" ? 1.5 : 0.9;
    
    const dummy = new THREE.Object3D();
    const trailDummy = new THREE.Object3D();
    
    pulseData.forEach((pulse, i) => {
      const t = ((time * pulse.speed * activity + pulse.offset) % 1);
      const pos = pulse.curve.getPoint(t);
      const tangent = pulse.curve.getTangent(t);
      
      // Main pulse - ellipsoid shape (like blood cell)
      dummy.position.copy(pos);
      if (tangent.length() > 0) {
        dummy.lookAt(pos.clone().add(tangent));
      }
      const scale = 0.06 + audioLevel * 0.04;
      dummy.scale.set(scale * 0.7, scale * 0.7, scale * 1.8);
      dummy.updateMatrix();
      pulsesRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Organic trail
      for (let j = 0; j < trailLength; j++) {
        const trailT = Math.max(0, t - (j + 1) * 0.03);
        const trailPos = pulse.curve.getPoint(trailT);
        const trailScale = scale * (1 - (j + 1) / (trailLength + 1)) * 0.6;
        
        trailDummy.position.copy(trailPos);
        trailDummy.scale.setScalar(trailScale);
        trailDummy.updateMatrix();
        trailsRef.current!.setMatrixAt(i * trailLength + j, trailDummy.matrix);
      }
    });
    
    pulsesRef.current.instanceMatrix.needsUpdate = true;
    trailsRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <group>
      {/* Main blood pulses */}
      <instancedMesh ref={pulsesRef} args={[undefined, undefined, pulseCount]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color="#f472b6"
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
      
      {/* Trail particles */}
      <instancedMesh ref={trailsRef} args={[undefined, undefined, pulseCount * trailLength]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color="#ec4899"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
};

// Fractal branching tendrils with growth animation
const BranchingTendrils = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const tendrilsRef = useRef<THREE.Group>(null);
  
  const tendrilData = useMemo(() => {
    const tendrils: { curve: THREE.CatmullRomCurve3; thickness: number; depth: number }[] = [];
    
    const createBranch = (start: THREE.Vector3, direction: THREE.Vector3, depth: number, thickness: number) => {
      if (depth <= 0 || thickness < 0.003) return;
      
      const points: THREE.Vector3[] = [start.clone()];
      let current = start.clone();
      
      const segments = 4 + Math.floor(Math.random() * 2);
      for (let i = 0; i < segments; i++) {
        const wobble = new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        );
        current = current.clone().add(direction.clone().multiplyScalar(0.4).add(wobble));
        points.push(current.clone());
      }
      
      tendrils.push({
        curve: new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5),
        thickness,
        depth
      });
      
      // Spawn child branches
      if (Math.random() > 0.3) {
        const newDir = direction.clone().applyAxisAngle(
          new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
          Math.PI / 4 + Math.random() * Math.PI / 4
        );
        createBranch(current, newDir, depth - 1, thickness * 0.55);
      }
      if (Math.random() > 0.5) {
        const newDir = direction.clone().applyAxisAngle(
          new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
          -Math.PI / 4 - Math.random() * Math.PI / 4
        );
        createBranch(current, newDir, depth - 1, thickness * 0.5);
      }
    };
    
    // Start main branches from center
    for (let i = 0; i < 8; i++) {
      const theta = (i / 8) * Math.PI * 2;
      const start = new THREE.Vector3(
        Math.cos(theta) * 0.5,
        (Math.random() - 0.5) * 0.5,
        Math.sin(theta) * 0.5
      );
      const dir = start.clone().normalize();
      createBranch(start, dir, 4, 0.025);
    }
    
    return tendrils;
  }, []);
  
  useFrame((rootState) => {
    if (!tendrilsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    tendrilsRef.current.rotation.y = time * 0.008;
  });
  
  return (
    <group ref={tendrilsRef}>
      {tendrilData.map((tendril, i) => (
        <mesh key={i}>
          <tubeGeometry args={[tendril.curve, 32, tendril.thickness, 6, false]} />
          <meshBasicMaterial
            color="#2dd4bf"
            transparent
            opacity={0.5 + tendril.depth * 0.1}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

// Dense spore particle clouds
const SporeCloud = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const sporesRef = useRef<THREE.Points>(null);
  
  const sporeCount = 900;
  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(sporeCount * 3);
    const vel = new Float32Array(sporeCount * 3);
    const col = new Float32Array(sporeCount * 3);
    
    const colorPalette = [
      new THREE.Color("#10b981"),
      new THREE.Color("#14b8a6"),
      new THREE.Color("#2dd4bf"),
      new THREE.Color("#5eead4"),
      new THREE.Color("#a7f3d0")
    ];
    
    for (let i = 0; i < sporeCount; i++) {
      const i3 = i * 3;
      
      // Clustered distribution
      const cluster = Math.floor(Math.random() * 6);
      const clusterCenter = new THREE.Vector3(
        Math.cos(cluster * Math.PI / 3) * 3,
        (Math.random() - 0.5) * 4,
        Math.sin(cluster * Math.PI / 3) * 3
      );
      
      pos[i3] = clusterCenter.x + (Math.random() - 0.5) * 3;
      pos[i3 + 1] = clusterCenter.y + (Math.random() - 0.5) * 3;
      pos[i3 + 2] = clusterCenter.z + (Math.random() - 0.5) * 3;
      
      vel[i3] = (Math.random() - 0.5) * 0.008;
      vel[i3 + 1] = Math.random() * 0.004;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.008;
      
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
    
    const activity = state === "thinking" ? 1.5 : state === "speaking" ? 1.2 : 0.7;
    
    for (let i = 0; i < sporeCount; i++) {
      const i3 = i * 3;
      
      // Organic drifting motion
      posArray[i3] += velocities[i3] * activity + Math.sin(time * 0.5 + i * 0.05) * 0.002;
      posArray[i3 + 1] += velocities[i3 + 1] * activity + Math.cos(time * 0.3 + i * 0.03) * 0.001;
      posArray[i3 + 2] += velocities[i3 + 2] * activity + Math.sin(time * 0.4 + i * 0.04) * 0.002;
      
      // Wrap around boundaries
      if (Math.abs(posArray[i3]) > 7) posArray[i3] *= -0.9;
      if (posArray[i3 + 1] > 5) posArray[i3 + 1] = -4;
      if (posArray[i3 + 1] < -5) posArray[i3 + 1] = 4;
      if (Math.abs(posArray[i3 + 2]) > 7) posArray[i3 + 2] *= -0.9;
    }
    
    sporesRef.current.geometry.attributes.position.needsUpdate = true;
    sporesRef.current.rotation.y = time * 0.01;
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
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};

// Outer membrane with flex and ripple
const OrganicMembrane = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const membraneRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  
  useFrame((rootState) => {
    if (!membraneRef.current || !innerRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.3 : state === "speaking" ? 1.15 : 0.85;
    
    const scale = 6.5 + Math.sin(time * 0.25) * 0.4 * activity + audioLevel * 0.7;
    membraneRef.current.scale.setScalar(scale);
    membraneRef.current.rotation.y = time * 0.008;
    membraneRef.current.rotation.x = Math.sin(time * 0.15) * 0.06;
    
    innerRef.current.scale.setScalar(scale * 0.95);
    innerRef.current.rotation.y = -time * 0.006;
  });
  
  return (
    <group>
      {/* Outer wireframe membrane */}
      <mesh ref={membraneRef}>
        <icosahedronGeometry args={[1, 3]} />
        <meshBasicMaterial
          color="#059669"
          transparent
          opacity={0.08}
          wireframe
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Inner glow */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          color="#10b981"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// Bioluminescent fog atmosphere
const BioFog = () => {
  return (
    <mesh>
      <sphereGeometry args={[16, 32, 32]} />
      <meshBasicMaterial
        color="#042f2e"
        transparent
        opacity={0.5}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

export const OrganicGrowthScene = ({ state, audioLevel = 0 }: OrganicGrowthSceneProps) => {
  return (
    <group>
      <BioFog />
      <CellCores state={state} audioLevel={audioLevel} />
      <VascularVeins state={state} audioLevel={audioLevel} />
      <BloodPulses state={state} audioLevel={audioLevel} />
      <BranchingTendrils state={state} audioLevel={audioLevel} />
      <SporeCloud state={state} audioLevel={audioLevel} />
      <OrganicMembrane state={state} audioLevel={audioLevel} />
    </group>
  );
};
