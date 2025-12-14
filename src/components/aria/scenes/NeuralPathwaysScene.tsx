import { useRef, useMemo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface NeuralPathwaysSceneProps {
  state: AIState;
  audioLevel?: number;
}

// Neuron nodes with dendrite spikes and Fresnel glow
const NeuronClusters = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);
  
  const nodeCount = 28;
  const nodeData = useMemo(() => {
    const data: { position: THREE.Vector3; scale: number; phase: number; spikeRotation: number }[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2 + Math.random() * 3.5;
      
      data.push({
        position: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * radius,
          Math.sin(phi) * Math.sin(theta) * radius * 0.7,
          Math.cos(phi) * radius
        ),
        scale: 0.12 + Math.random() * 0.18,
        phase: Math.random() * Math.PI * 2,
        spikeRotation: Math.random() * Math.PI * 2
      });
    }
    
    return data;
  }, []);
  
  useFrame((rootState) => {
    if (!nodesRef.current || !glowRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.6 : state === "speaking" ? 1.3 : 0.7;
    
    const dummy = new THREE.Object3D();
    const glowDummy = new THREE.Object3D();
    
    for (let i = 0; i < nodeCount; i++) {
      const { position, scale, phase } = nodeData[i];
      
      // Organic pulsing with breathing effect
      const breathe = 1 + Math.sin(time * 1.5 + phase) * 0.25 * activity;
      const audioBoost = 1 + audioLevel * 0.5;
      const finalScale = scale * breathe * audioBoost;
      
      dummy.position.copy(position);
      dummy.position.y += Math.sin(time * 0.4 + phase) * 0.12;
      dummy.scale.setScalar(finalScale);
      dummy.rotation.set(time * 0.1 + phase, time * 0.15 + phase, 0);
      dummy.updateMatrix();
      nodesRef.current.setMatrixAt(i, dummy.matrix);
      
      // Outer glow layer
      glowDummy.position.copy(dummy.position);
      glowDummy.scale.setScalar(finalScale * 1.8);
      glowDummy.updateMatrix();
      glowRef.current.setMatrixAt(i, glowDummy.matrix);
    }
    
    nodesRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
    
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.015;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Core neurons with icosahedron geometry for organic spikes */}
      <instancedMesh ref={nodesRef} args={[undefined, undefined, nodeCount]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#9333ea"
          emissiveIntensity={2.5}
          roughness={0.2}
          metalness={0.3}
        />
      </instancedMesh>
      
      {/* Outer glow spheres */}
      <instancedMesh ref={glowRef} args={[undefined, undefined, nodeCount]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
};

// Volumetric synaptic cables with electricity shader
const SynapticCables = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const cablesRef = useRef<THREE.Group>(null);
  
  const cableData = useMemo(() => {
    const cables: { curve: THREE.CatmullRomCurve3; thickness: number }[] = [];
    
    for (let i = 0; i < 22; i++) {
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 7
      );
      
      // Create organic curved path with multiple control points
      const points: THREE.Vector3[] = [start];
      let current = start.clone();
      
      const segments = 3 + Math.floor(Math.random() * 2);
      for (let j = 0; j < segments; j++) {
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 3
        );
        current = current.clone().add(offset);
        points.push(current.clone());
      }
      
      cables.push({
        curve: new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5),
        thickness: 0.025 + Math.random() * 0.035
      });
    }
    
    return cables;
  }, []);
  
  useFrame((rootState) => {
    if (!cablesRef.current) return;
    const time = rootState.clock.getElapsedTime();
    
    cablesRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.4 + Math.sin(time * 2 + i) * 0.2;
      }
    });
  });
  
  return (
    <group ref={cablesRef}>
      {cableData.map((cable, i) => (
        <group key={i}>
          {/* Inner core - bright */}
          <mesh>
            <tubeGeometry args={[cable.curve, 64, cable.thickness * 0.4, 8, false]} />
            <meshBasicMaterial
              color="#f0abfc"
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* Outer glow */}
          <mesh>
            <tubeGeometry args={[cable.curve, 64, cable.thickness, 8, false]} />
            <meshBasicMaterial
              color="#a855f7"
              transparent
              opacity={0.35}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Data pulses with motion trails
const SynapticPulses = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const pulsesRef = useRef<THREE.InstancedMesh>(null);
  const trailsRef = useRef<THREE.InstancedMesh>(null);
  
  const pulseCount = 45;
  const trailLength = 8;
  
  const pulseData = useMemo(() => {
    const data: { curve: THREE.CatmullRomCurve3; speed: number; offset: number }[] = [];
    
    for (let i = 0; i < pulseCount; i++) {
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 8
      );
      const end = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 8
      );
      
      const mid1 = start.clone().lerp(end, 0.33);
      const mid2 = start.clone().lerp(end, 0.66);
      mid1.add(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 2));
      mid2.add(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 2));
      
      data.push({
        curve: new THREE.CatmullRomCurve3([start, mid1, mid2, end]),
        speed: 0.15 + Math.random() * 0.25,
        offset: Math.random()
      });
    }
    
    return data;
  }, []);
  
  useFrame((rootState) => {
    if (!pulsesRef.current || !trailsRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 2.2 : state === "speaking" ? 1.6 : 0.9;
    
    const dummy = new THREE.Object3D();
    const trailDummy = new THREE.Object3D();
    
    pulseData.forEach((pulse, i) => {
      const t = ((time * pulse.speed * activity + pulse.offset) % 1);
      const pos = pulse.curve.getPoint(t);
      
      // Main pulse
      const scale = 0.08 + audioLevel * 0.05;
      dummy.position.copy(pos);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      pulsesRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Trail particles
      for (let j = 0; j < trailLength; j++) {
        const trailT = Math.max(0, t - (j + 1) * 0.025);
        const trailPos = pulse.curve.getPoint(trailT);
        const trailScale = scale * (1 - (j + 1) / (trailLength + 1)) * 0.7;
        
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
      {/* Main pulses */}
      <instancedMesh ref={pulsesRef} args={[undefined, undefined, pulseCount]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          color="#f9a8d4"
          transparent
          opacity={1}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
      
      {/* Trail particles */}
      <instancedMesh ref={trailsRef} args={[undefined, undefined, pulseCount * trailLength]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          color="#e879f9"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
};

// Thought stream particles converging toward neurons
const ThoughtStreams = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particleCount = 1200;
  const { positions, velocities, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const siz = new Float32Array(particleCount);
    
    const colorPalette = [
      new THREE.Color("#c084fc"),
      new THREE.Color("#e879f9"),
      new THREE.Color("#f0abfc"),
      new THREE.Color("#d946ef"),
      new THREE.Color("#a855f7")
    ];
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Spiral stream distribution
      const streamIndex = Math.floor(Math.random() * 6);
      const streamAngle = (streamIndex / 6) * Math.PI * 2;
      const streamRadius = 1 + Math.random() * 5;
      const heightSpread = (Math.random() - 0.5) * 6;
      
      pos[i3] = Math.cos(streamAngle) * streamRadius + (Math.random() - 0.5) * 0.8;
      pos[i3 + 1] = heightSpread;
      pos[i3 + 2] = Math.sin(streamAngle) * streamRadius + (Math.random() - 0.5) * 0.8;
      
      // Velocity toward center with spiral motion
      const toCenter = -streamRadius * 0.08;
      vel[i3] = Math.cos(streamAngle + Math.PI / 2) * 0.02 + Math.cos(streamAngle) * toCenter * 0.1;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.015;
      vel[i3 + 2] = Math.sin(streamAngle + Math.PI / 2) * 0.02 + Math.sin(streamAngle) * toCenter * 0.1;
      
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;
      
      siz[i] = 0.02 + Math.random() * 0.03;
    }
    
    return { positions: pos, velocities: vel, colors: col, sizes: siz };
  }, []);
  
  useFrame((rootState) => {
    if (!particlesRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    const activity = state === "thinking" ? 1.8 : state === "speaking" ? 1.4 : 0.6;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Spiral motion toward center
      posArray[i3] += velocities[i3] * activity;
      posArray[i3 + 1] += Math.sin(time * 2 + i * 0.05) * 0.003 * activity;
      posArray[i3 + 2] += velocities[i3 + 2] * activity;
      
      // Respawn when too close to center
      const dist = Math.sqrt(posArray[i3] ** 2 + posArray[i3 + 2] ** 2);
      if (dist < 0.6) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 2;
        posArray[i3] = Math.cos(angle) * radius;
        posArray[i3 + 2] = Math.sin(angle) * radius;
        posArray[i3 + 1] = (Math.random() - 0.5) * 6;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.rotation.y = time * 0.03;
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};

// Brain membrane with subsurface effect
const BrainMembrane = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const membraneRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  
  useFrame((rootState) => {
    if (!membraneRef.current || !innerRef.current) return;
    const time = rootState.clock.getElapsedTime();
    const activity = state === "thinking" ? 1.4 : state === "speaking" ? 1.2 : 0.8;
    
    const scale = 6 + Math.sin(time * 0.4) * 0.3 * activity + audioLevel * 0.8;
    membraneRef.current.scale.setScalar(scale);
    membraneRef.current.rotation.y = time * 0.01;
    membraneRef.current.rotation.x = Math.sin(time * 0.2) * 0.08;
    
    innerRef.current.scale.setScalar(scale * 0.97);
    innerRef.current.rotation.y = -time * 0.008;
  });
  
  return (
    <group>
      {/* Outer membrane wireframe */}
      <mesh ref={membraneRef}>
        <icosahedronGeometry args={[1, 3]} />
        <meshBasicMaterial
          color="#9333ea"
          transparent
          opacity={0.08}
          wireframe
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Inner glow layer */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          color="#c084fc"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// Atmospheric fog for depth
const NeuralFog = () => {
  return (
    <mesh>
      <sphereGeometry args={[15, 32, 32]} />
      <meshBasicMaterial
        color="#2e1065"
        transparent
        opacity={0.4}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

export const NeuralPathwaysScene = ({ state, audioLevel = 0 }: NeuralPathwaysSceneProps) => {
  return (
    <group>
      <NeuralFog />
      <NeuronClusters state={state} audioLevel={audioLevel} />
      <SynapticCables state={state} audioLevel={audioLevel} />
      <SynapticPulses state={state} audioLevel={audioLevel} />
      <ThoughtStreams state={state} audioLevel={audioLevel} />
      <BrainMembrane state={state} audioLevel={audioLevel} />
    </group>
  );
};
