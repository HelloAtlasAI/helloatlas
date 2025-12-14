import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface CosmicWebSceneProps {
  state: AIState;
  audioLevel?: number;
}

// Spiral galaxy nodes with rotating arms
const GalaxyClusters = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const galaxiesRef = useRef<THREE.Group>(null);
  const coresRef = useRef<THREE.InstancedMesh>(null);
  const halosRef = useRef<THREE.InstancedMesh>(null);
  
  const galaxyCount = 15;
  const galaxyData = useMemo(() => {
    const data: { position: THREE.Vector3; scale: number; rotSpeed: number; phase: number }[] = [];
    
    for (let i = 0; i < galaxyCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 3 + Math.random() * 5;
      
      data.push({
        position: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * radius,
          Math.sin(phi) * Math.sin(theta) * radius * 0.5,
          Math.cos(phi) * radius
        ),
        scale: 0.15 + Math.random() * 0.2,
        rotSpeed: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2
      });
    }
    
    return data;
  }, []);
  
  // Generate spiral arm particles for each galaxy
  const spiralParticles = useMemo(() => {
    const allParticles: { galaxyIndex: number; offset: THREE.Vector3; armAngle: number }[] = [];
    
    galaxyData.forEach((galaxy, gIndex) => {
      const armCount = 2;
      const particlesPerArm = 25;
      
      for (let arm = 0; arm < armCount; arm++) {
        for (let p = 0; p < particlesPerArm; p++) {
          const t = p / particlesPerArm;
          const armAngle = (arm / armCount) * Math.PI * 2 + t * Math.PI * 2;
          const radius = t * galaxy.scale * 4;
          
          allParticles.push({
            galaxyIndex: gIndex,
            offset: new THREE.Vector3(
              Math.cos(armAngle) * radius,
              (Math.random() - 0.5) * galaxy.scale * 0.3,
              Math.sin(armAngle) * radius
            ),
            armAngle
          });
        }
      }
    });
    
    return allParticles;
  }, [galaxyData]);
  
  useFrame((rootState) => {
    if (!coresRef.current || !halosRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.5 : state === "speaking" ? 1.2 : 0.8;
    
    const dummy = new THREE.Object3D();
    const haloDummy = new THREE.Object3D();
    
    galaxyData.forEach((galaxy, i) => {
      const pulse = 1 + Math.sin(time * galaxy.rotSpeed + galaxy.phase) * 0.25 * activity;
      const finalScale = galaxy.scale * pulse * (1 + audioLevel * 0.4);
      
      // Bright core
      dummy.position.copy(galaxy.position);
      dummy.rotation.y = time * galaxy.rotSpeed;
      dummy.scale.setScalar(finalScale);
      dummy.updateMatrix();
      coresRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Outer halo
      haloDummy.position.copy(galaxy.position);
      haloDummy.scale.setScalar(finalScale * 3);
      haloDummy.updateMatrix();
      halosRef.current!.setMatrixAt(i, haloDummy.matrix);
    });
    
    coresRef.current.instanceMatrix.needsUpdate = true;
    halosRef.current.instanceMatrix.needsUpdate = true;
    
    if (galaxiesRef.current) {
      galaxiesRef.current.rotation.y = time * 0.005;
    }
  });
  
  return (
    <group ref={galaxiesRef}>
      {/* Galaxy cores - bright singularities */}
      <instancedMesh ref={coresRef} args={[undefined, undefined, galaxyCount]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
      
      {/* Outer halos */}
      <instancedMesh ref={halosRef} args={[undefined, undefined, galaxyCount]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
      
      {/* Spiral disk rings for each galaxy */}
      {galaxyData.map((galaxy, i) => (
        <mesh key={i} position={galaxy.position} rotation={[Math.PI / 2 + Math.random() * 0.3, 0, i * 0.8]}>
          <ringGeometry args={[galaxy.scale * 1.2, galaxy.scale * 4, 64]} />
          <meshBasicMaterial
            color="#fcd34d"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};

// Dark matter filaments - volumetric fog tubes
const DarkMatterFilaments = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const filamentsRef = useRef<THREE.Group>(null);
  
  const filamentData = useMemo(() => {
    const filaments: { curve: THREE.CatmullRomCurve3; thickness: number }[] = [];
    
    for (let i = 0; i < 30; i++) {
      const points: THREE.Vector3[] = [];
      
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 14
      );
      
      let current = start.clone();
      points.push(current.clone());
      
      const segments = 5 + Math.floor(Math.random() * 4);
      for (let j = 0; j < segments; j++) {
        current = current.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 3
        ));
        points.push(current.clone());
      }
      
      filaments.push({
        curve: new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5),
        thickness: 0.03 + Math.random() * 0.05
      });
    }
    
    return filaments;
  }, []);
  
  useFrame((rootState) => {
    if (!filamentsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    filamentsRef.current.rotation.y = time * 0.003;
  });
  
  return (
    <group ref={filamentsRef}>
      {filamentData.map((filament, i) => (
        <group key={i}>
          {/* Outer ghostly glow */}
          <mesh>
            <tubeGeometry args={[filament.curve, 64, filament.thickness * 2, 8, false]} />
            <meshBasicMaterial
              color="#6366f1"
              transparent
              opacity={0.08}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Inner dim core */}
          <mesh>
            <tubeGeometry args={[filament.curve, 64, filament.thickness * 0.5, 8, false]} />
            <meshBasicMaterial
              color="#818cf8"
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Light beams at "light speed" with long trails
const LightStreams = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const beamsRef = useRef<THREE.InstancedMesh>(null);
  const trailsRef = useRef<THREE.InstancedMesh>(null);
  
  const beamCount = 80;
  const trailLength = 15;
  
  const beamData = useMemo(() => {
    const data: { curve: THREE.CatmullRomCurve3; speed: number; offset: number }[] = [];
    
    for (let i = 0; i < beamCount; i++) {
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 16
      );
      const end = new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 16
      );
      
      const mid = start.clone().lerp(end, 0.5);
      mid.add(new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 4
      ));
      
      data.push({
        curve: new THREE.CatmullRomCurve3([start, mid, end]),
        speed: 0.4 + Math.random() * 0.6,
        offset: Math.random()
      });
    }
    
    return data;
  }, []);
  
  useFrame((rootState) => {
    if (!beamsRef.current || !trailsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 2.5 : state === "speaking" ? 1.8 : 1;
    
    const dummy = new THREE.Object3D();
    const trailDummy = new THREE.Object3D();
    
    beamData.forEach((beam, i) => {
      const t = ((time * beam.speed * activity + beam.offset) % 1);
      const pos = beam.curve.getPoint(t);
      const tangent = beam.curve.getTangent(t);
      
      // Main beam - elongated streak
      dummy.position.copy(pos);
      if (tangent.length() > 0) {
        dummy.lookAt(pos.clone().add(tangent));
      }
      const scale = 0.025 + audioLevel * 0.015;
      dummy.scale.set(scale, scale, scale * 8);
      dummy.updateMatrix();
      beamsRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Long trailing particles for "light speed" effect
      for (let j = 0; j < trailLength; j++) {
        const trailT = Math.max(0, t - (j + 1) * 0.012);
        const trailPos = beam.curve.getPoint(trailT);
        const trailScale = scale * (1 - (j + 1) / (trailLength + 1)) * 0.5;
        
        trailDummy.position.copy(trailPos);
        trailDummy.scale.setScalar(trailScale);
        trailDummy.updateMatrix();
        trailsRef.current!.setMatrixAt(i * trailLength + j, trailDummy.matrix);
      }
    });
    
    beamsRef.current.instanceMatrix.needsUpdate = true;
    trailsRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <group>
      {/* Main light beams - pure white */}
      <instancedMesh ref={beamsRef} args={[undefined, undefined, beamCount]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
      
      {/* Trail particles */}
      <instancedMesh ref={trailsRef} args={[undefined, undefined, beamCount * trailLength]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial
          color="#e0e7ff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
};

// Multi-layered star dust with nebula colors
const CosmicDust = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const dustRef = useRef<THREE.Points>(null);
  
  const dustCount = 1800;
  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(dustCount * 3);
    const col = new Float32Array(dustCount * 3);
    const siz = new Float32Array(dustCount);
    
    const colorPalette = [
      new THREE.Color("#e0e7ff"),
      new THREE.Color("#c7d2fe"),
      new THREE.Color("#a5b4fc"),
      new THREE.Color("#818cf8"),
      new THREE.Color("#fbbf24"),
      new THREE.Color("#f472b6")
    ];
    
    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      
      // Deep space distribution
      const radius = 5 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i3] = Math.sin(phi) * Math.cos(theta) * radius;
      pos[i3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.7;
      pos[i3 + 2] = Math.cos(phi) * radius;
      
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;
      
      // Variable star sizes
      siz[i] = 0.3 + Math.random() * 1.2;
    }
    
    return { positions: pos, colors: col, sizes: siz };
  }, []);
  
  useFrame((rootState) => {
    if (!dustRef.current) return;
    const time = rootState.clock.getElapsedTime();
    
    // Very slow cosmic drift
    dustRef.current.rotation.y = time * 0.001;
    dustRef.current.rotation.x = Math.sin(time * 0.0005) * 0.05;
  });
  
  return (
    <points ref={dustRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={dustCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={dustCount} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
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

// Gravitational lensing distortion rings
const GravitationalLensing = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const lensRef = useRef<THREE.Group>(null);
  
  const lensCount = 6;
  const lensData = useMemo(() => {
    return Array.from({ length: lensCount }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 8
      ),
      scale: 0.6 + Math.random() * 0.8,
      speed: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2
    }));
  }, []);
  
  useFrame((rootState) => {
    if (!lensRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.3 : state === "speaking" ? 1.1 : 0.9;
    
    lensRef.current.children.forEach((lens, i) => {
      const data = lensData[i];
      const scale = data.scale * (1 + Math.sin(time * data.speed + data.phase) * 0.25 * activity);
      lens.scale.setScalar(scale);
      lens.rotation.z = time * data.speed * 0.15;
      lens.rotation.x = Math.sin(time * 0.2 + data.phase) * 0.2;
    });
  });
  
  return (
    <group ref={lensRef}>
      {lensData.map((data, i) => (
        <group key={i} position={data.position}>
          {/* Outer distortion ring */}
          <mesh>
            <torusGeometry args={[1, 0.03, 8, 64]} />
            <meshBasicMaterial
              color="#a78bfa"
              transparent
              opacity={0.25}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* Inner bright ring */}
          <mesh>
            <torusGeometry args={[0.7, 0.015, 8, 64]} />
            <meshBasicMaterial
              color="#c4b5fd"
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Deep space background with nebula
const DeepSpaceFog = () => {
  return (
    <group>
      {/* Outer void */}
      <mesh>
        <sphereGeometry args={[25, 32, 32]} />
        <meshBasicMaterial
          color="#030712"
          transparent
          opacity={0.95}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Inner nebula glow */}
      <mesh>
        <sphereGeometry args={[20, 32, 32]} />
        <meshBasicMaterial
          color="#1e1b4b"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export const CosmicWebScene = ({ state, audioLevel = 0 }: CosmicWebSceneProps) => {
  return (
    <group>
      <DeepSpaceFog />
      <GalaxyClusters state={state} audioLevel={audioLevel} />
      <DarkMatterFilaments state={state} audioLevel={audioLevel} />
      <LightStreams state={state} audioLevel={audioLevel} />
      <CosmicDust state={state} audioLevel={audioLevel} />
      <GravitationalLensing state={state} audioLevel={audioLevel} />
    </group>
  );
};
