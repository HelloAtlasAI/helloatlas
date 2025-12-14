import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AIState } from "../AIOrb";

interface OceanDepthSceneProps {
  state: AIState;
  audioLevel: number;
}

const jellyfishVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDisplacement;
  uniform float u_time;
  uniform float u_audio;
  
  void main() {
    vPosition = position;
    vNormal = normal;
    
    // Pulsing dome effect
    float pulse = sin(u_time * 1.5) * 0.15;
    float wavey = sin(position.x * 4.0 + u_time * 2.0) * 0.05;
    wavey += sin(position.z * 4.0 + u_time * 2.0) * 0.05;
    
    // Contract with audio
    float audioContract = u_audio * 0.2;
    
    vec3 newPosition = position;
    newPosition.y += pulse * (1.0 - position.y * 0.5);
    newPosition.xz *= 1.0 + wavey - audioContract;
    
    vDisplacement = pulse + wavey;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const jellyfishFragmentShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDisplacement;
  uniform float u_time;
  uniform float u_audio;
  
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.5);
    
    // Bioluminescent colors
    vec3 deepBlue = vec3(0.0, 0.1, 0.2);
    vec3 teal = vec3(0.0, 1.0, 0.8);
    vec3 cyan = vec3(0.0, 0.85, 1.0);
    
    vec3 color = mix(deepBlue, teal, fresnel);
    color = mix(color, cyan, fresnel * fresnel);
    
    // Inner glow pulse
    float innerGlow = sin(u_time * 2.0) * 0.3 + 0.7;
    color += teal * innerGlow * 0.3 * (1.0 - fresnel);
    
    // Audio flash
    color += vec3(0.5, 1.0, 1.0) * u_audio * 0.5;
    
    float alpha = 0.4 + fresnel * 0.4;
    gl_FragColor = vec4(color, alpha);
  }
`;

// Jellyfish Dome
const JellyfishCore = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_audio: { value: 0 },
  }), []);
  
  useFrame(({ clock }) => {
    if (!materialRef.current || !meshRef.current) return;
    materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
    materialRef.current.uniforms.u_audio.value = audioLevel;
    
    meshRef.current.rotation.y += 0.001;
  });
  
  return (
    <mesh ref={meshRef} position={[0, 0.3, 0]}>
      <sphereGeometry args={[1, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={jellyfishVertexShader}
        fragmentShader={jellyfishFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// Jellyfish Tentacles
const Tentacles = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const tentacleCount = 12;
  
  const tentacles = useMemo(() => {
    return Array.from({ length: tentacleCount }, (_, i) => {
      const angle = (i / tentacleCount) * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.3;
      return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        length: 1.5 + Math.random() * 1.0,
        phase: Math.random() * Math.PI * 2,
      };
    });
  }, []);
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    
    groupRef.current.children.forEach((tentacle, i) => {
      const data = tentacles[i];
      const sway = Math.sin(t * 0.8 + data.phase) * 0.3;
      tentacle.rotation.x = sway;
      tentacle.rotation.z = Math.cos(t * 0.6 + data.phase) * 0.2;
    });
  });
  
  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {tentacles.map((tentacle, i) => (
        <mesh key={i} position={[tentacle.x, 0, tentacle.z]}>
          <cylinderGeometry args={[0.02, 0.005, tentacle.length, 8]} />
          <meshBasicMaterial
            color="#00ffcc"
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

// Deep Current Particles
const DeepCurrents = ({ state }: { state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 600;
  
  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = Math.random() * 0.002;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    
    return { positions, velocities };
  }, []);
  
  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    
    const speed = state === "speaking" ? 2.0 : state === "thinking" ? 1.5 : 1.0;
    
    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3] += velocities[i * 3] * speed;
      posAttr.array[i * 3 + 1] += velocities[i * 3 + 1] * speed;
      posAttr.array[i * 3 + 2] += velocities[i * 3 + 2] * speed;
      
      // Wrap around
      if (Math.abs(posAttr.array[i * 3]) > 4) posAttr.array[i * 3] *= -0.9;
      if (posAttr.array[i * 3 + 1] > 3) posAttr.array[i * 3 + 1] = -3;
      if (Math.abs(posAttr.array[i * 3 + 2]) > 4) posAttr.array[i * 3 + 2] *= -0.9;
    }
    posAttr.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#00aaff"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Bioluminescent Plankton
const DataPlankton = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 400;
  
  const { positions, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 1.5 + Math.random() * 2;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      phases[i] = Math.random() * Math.PI * 2;
    }
    
    return { positions, phases };
  }, []);
  
  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    
    for (let i = 0; i < count; i++) {
      const phase = phases[i];
      posAttr.array[i * 3] += Math.sin(t * 0.5 + phase) * 0.002;
      posAttr.array[i * 3 + 1] += Math.cos(t * 0.3 + phase) * 0.002;
      posAttr.array[i * 3 + 2] += Math.sin(t * 0.4 + phase) * 0.002;
    }
    posAttr.needsUpdate = true;
    
    // Flash with audio
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.5 + audioLevel * 0.5;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#00ffcc"
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Pressure Wave Pulses
const PressureWaves = ({ audioLevel }: { audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const waveCount = 4;
  
  const wavesRef = useRef<{ scale: number; opacity: number; triggered: boolean }[]>(
    Array.from({ length: waveCount }, () => ({ scale: 0.5, opacity: 0, triggered: false }))
  );
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Trigger new wave on audio peak
    if (audioLevel > 0.5) {
      const inactiveWave = wavesRef.current.find(w => !w.triggered);
      if (inactiveWave) {
        inactiveWave.triggered = true;
        inactiveWave.scale = 0.5;
        inactiveWave.opacity = 0.6;
      }
    }
    
    groupRef.current.children.forEach((ring, i) => {
      const wave = wavesRef.current[i];
      if (wave.triggered) {
        wave.scale += 0.03;
        wave.opacity -= 0.015;
        
        if (wave.opacity <= 0) {
          wave.triggered = false;
          wave.scale = 0.5;
          wave.opacity = 0;
        }
        
        ring.scale.setScalar(wave.scale);
        (ring as THREE.Mesh).material = new THREE.MeshBasicMaterial({
          color: "#00ddff",
          transparent: true,
          opacity: wave.opacity,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        });
      }
    });
  });
  
  return (
    <group ref={groupRef}>
      {Array.from({ length: waveCount }, (_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.95, 1.0, 64]} />
          <meshBasicMaterial
            color="#00ddff"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

export const OceanDepthScene = ({ state, audioLevel }: OceanDepthSceneProps) => {
  return (
    <group>
      <JellyfishCore state={state} audioLevel={audioLevel} />
      <Tentacles state={state} audioLevel={audioLevel} />
      <DeepCurrents state={state} />
      <DataPlankton state={state} audioLevel={audioLevel} />
      <PressureWaves audioLevel={audioLevel} />
    </group>
  );
};
