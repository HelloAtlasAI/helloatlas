import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface CosmicWebSceneProps {
  state: AIState;
  audioLevel?: number;
}

// Galaxy node cores - swirling dense data centers
const GalaxyNodes = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const galaxiesRef = useRef<THREE.Group>(null);
  const coresRef = useRef<THREE.InstancedMesh>(null);
  
  const galaxyCount = 18;
  const galaxyData = useMemo(() => {
    const data: { position: THREE.Vector3; scale: number; rotationSpeed: number; phase: number }[] = [];
    
    for (let i = 0; i < galaxyCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2 + Math.random() * 4;
      
      data.push({
        position: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * radius,
          Math.sin(phi) * Math.sin(theta) * radius * 0.5,
          Math.cos(phi) * radius
        ),
        scale: 0.15 + Math.random() * 0.2,
        rotationSpeed: 0.5 + Math.random(),
        phase: Math.random() * Math.PI * 2
      });
    }
    
    return data;
  }, []);
  
  useFrame((rootState) => {
    if (!coresRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.5 : state === "speaking" ? 1.2 : 0.8;
    
    const dummy = new THREE.Object3D();
    
    galaxyData.forEach((galaxy, i) => {
      const pulse = 1 + Math.sin(time * galaxy.rotationSpeed + galaxy.phase) * 0.2 * activity;
      
      dummy.position.copy(galaxy.position);
      dummy.rotation.y = time * galaxy.rotationSpeed * 0.2;
      dummy.scale.setScalar(galaxy.scale * pulse * (1 + audioLevel * 0.3));
      dummy.updateMatrix();
      coresRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    coresRef.current.instanceMatrix.needsUpdate = true;
    
    if (galaxiesRef.current) {
      galaxiesRef.current.rotation.y = time * 0.01;
    }
  });
  
  return (
    <group ref={galaxiesRef}>
      <instancedMesh ref={coresRef} args={[undefined, undefined, galaxyCount]}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </instancedMesh>
      
      {/* Galaxy disk halos */}
      {galaxyData.map((galaxy, i) => (
        <mesh key={i} position={galaxy.position} rotation={[Math.PI / 2, 0, i * 0.5]}>
          <ringGeometry args={[galaxy.scale * 1.5, galaxy.scale * 3, 32]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};

// Dark matter filaments - ethereal connections
const DarkMatterFilaments = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const filamentsRef = useRef<THREE.Group>(null);
  
  const filamentData = useMemo(() => {
    const filaments: THREE.CatmullRomCurve3[] = [];
    
    for (let i = 0; i < 35; i++) {
      const points: THREE.Vector3[] = [];
      
      // Create wispy, curved filaments
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 10
      );
      
      let current = start.clone();
      points.push(current.clone());
      
      const segments = 4 + Math.floor(Math.random() * 4);
      for (let j = 0; j < segments; j++) {
        current = current.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 2
        ));
        points.push(current.clone());
      }
      
      filaments.push(new THREE.CatmullRomCurve3(points));
    }
    
    return filaments;
  }, []);
  
  useFrame((rootState) => {
    if (!filamentsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    filamentsRef.current.rotation.y = time * 0.005;
  });
  
  return (
    <group ref={filamentsRef}>
      {filamentData.map((filament, i) => {
        const points = filament.getPoints(50);
        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={points.length}
                array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#6366f1" transparent opacity={0.15} />
          </line>
        );
      })}
    </group>
  );
};

// Light beams - bright data streams at light speed
const LightBeams = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const beamsRef = useRef<THREE.InstancedMesh>(null);
  
  const beamCount = 60;
  const beamData = useMemo(() => {
    const data: { curve: THREE.CatmullRomCurve3; speed: number; offset: number }[] = [];
    
    for (let i = 0; i < beamCount; i++) {
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 12
      );
      const end = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 12
      );
      
      const mid = start.clone().lerp(end, 0.5);
      mid.add(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ));
      
      data.push({
        curve: new THREE.CatmullRomCurve3([start, mid, end]),
        speed: 0.3 + Math.random() * 0.5,
        offset: Math.random()
      });
    }
    
    return data;
  }, []);
  
  useFrame((rootState) => {
    if (!beamsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 2.5 : state === "speaking" ? 1.8 : 1;
    
    const dummy = new THREE.Object3D();
    
    beamData.forEach((beam, i) => {
      const t = ((time * beam.speed * activity + beam.offset) % 1);
      const pos = beam.curve.getPoint(t);
      const tangent = beam.curve.getTangent(t);
      
      dummy.position.copy(pos);
      dummy.lookAt(pos.clone().add(tangent));
      
      // Elongated shape for speed effect
      dummy.scale.set(
        0.02 + audioLevel * 0.01,
        0.02 + audioLevel * 0.01,
        0.15 + audioLevel * 0.05
      );
      dummy.updateMatrix();
      beamsRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    beamsRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={beamsRef} args={[undefined, undefined, beamCount]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
    </instancedMesh>
  );
};

// Star dust - ambient cosmic particles
const StarDust = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const dustRef = useRef<THREE.Points>(null);
  
  const dustCount = 1200;
  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(dustCount * 3);
    const col = new Float32Array(dustCount * 3);
    const siz = new Float32Array(dustCount);
    
    const colorPalette = [
      new THREE.Color("#e0e7ff"),
      new THREE.Color("#c7d2fe"),
      new THREE.Color("#a5b4fc"),
      new THREE.Color("#fbbf24")
    ];
    
    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      
      // Distributed throughout space
      pos[i3] = (Math.random() - 0.5) * 20;
      pos[i3 + 1] = (Math.random() - 0.5) * 15;
      pos[i3 + 2] = (Math.random() - 0.5) * 20;
      
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;
      
      siz[i] = 0.5 + Math.random() * 1.5;
    }
    
    return { positions: pos, colors: col, sizes: siz };
  }, []);
  
  useFrame((rootState) => {
    if (!dustRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const posArray = dustRef.current.geometry.attributes.position.array as Float32Array;
    
    // Very slow drift
    for (let i = 0; i < dustCount; i++) {
      const i3 = i * 3;
      posArray[i3] += Math.sin(time * 0.1 + i * 0.01) * 0.001;
      posArray[i3 + 1] += Math.cos(time * 0.1 + i * 0.01) * 0.001;
    }
    
    dustRef.current.geometry.attributes.position.needsUpdate = true;
    dustRef.current.rotation.y = time * 0.002;
  });
  
  return (
    <points ref={dustRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={dustCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={dustCount} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};

// Void spaces - negative space with subtle fog
const CosmicFog = ({ state }: { state: AIState }) => {
  const fogRef = useRef<THREE.Mesh>(null);
  
  useFrame((rootState) => {
    if (!fogRef.current) return;
    const time = rootState.clock.getElapsedTime();
    fogRef.current.rotation.y = time * 0.01;
    fogRef.current.rotation.x = Math.sin(time * 0.05) * 0.1;
  });
  
  return (
    <mesh ref={fogRef}>
      <sphereGeometry args={[12, 32, 32]} />
      <meshBasicMaterial
        color="#1e1b4b"
        transparent
        opacity={0.3}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

// Gravitational lensing effect around major nodes
const GravitationalLensing = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const lensRef = useRef<THREE.Group>(null);
  
  const lensCount = 5;
  const lensData = useMemo(() => {
    return Array.from({ length: lensCount }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 6
      ),
      scale: 0.5 + Math.random() * 0.5,
      speed: 0.5 + Math.random()
    }));
  }, []);
  
  useFrame((rootState) => {
    if (!lensRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.3 : state === "speaking" ? 1.1 : 0.9;
    
    lensRef.current.children.forEach((lens, i) => {
      const data = lensData[i];
      const scale = data.scale * (1 + Math.sin(time * data.speed) * 0.2 * activity);
      lens.scale.setScalar(scale);
      lens.rotation.z = time * data.speed * 0.1;
    });
  });
  
  return (
    <group ref={lensRef}>
      {lensData.map((data, i) => (
        <mesh key={i} position={data.position}>
          <torusGeometry args={[1, 0.02, 8, 32]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
};

export const CosmicWebScene = ({ state, audioLevel = 0 }: CosmicWebSceneProps) => {
  return (
    <group>
      <CosmicFog state={state} />
      <GalaxyNodes state={state} audioLevel={audioLevel} />
      <DarkMatterFilaments state={state} audioLevel={audioLevel} />
      <LightBeams state={state} audioLevel={audioLevel} />
      <StarDust state={state} audioLevel={audioLevel} />
      <GravitationalLensing state={state} audioLevel={audioLevel} />
    </group>
  );
};
