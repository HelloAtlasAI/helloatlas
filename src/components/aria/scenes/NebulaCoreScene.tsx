import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AIState } from "../AIOrb";

interface NebulaCoreSceneProps {
  state: AIState;
  audioLevel: number;
}

const nebulaVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDisplacement;
  uniform float u_time;
  uniform float u_audio;
  uniform float u_state;
  
  // Simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vPosition = position;
    vNormal = normal;
    
    float noise1 = snoise(position * 1.5 + u_time * 0.3);
    float noise2 = snoise(position * 3.0 - u_time * 0.2);
    float noise3 = snoise(position * 0.8 + u_time * 0.5);
    
    float breathing = sin(u_time * 0.8) * 0.05 + 1.0;
    float audioReact = u_audio * 0.3;
    
    float displacement = (noise1 * 0.3 + noise2 * 0.15 + noise3 * 0.2) * breathing;
    displacement += audioReact * noise1;
    
    vDisplacement = displacement;
    
    vec3 newPosition = position + normal * displacement * 0.4;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const nebulaFragmentShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDisplacement;
  uniform float u_time;
  uniform float u_state;
  uniform float u_audio;
  
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(viewDirection, vNormal), 3.0);
    
    // Nebula colors: deep purple -> magenta -> pink -> white
    vec3 purple = vec3(0.29, 0.0, 0.5);
    vec3 magenta = vec3(1.0, 0.0, 0.67);
    vec3 pink = vec3(1.0, 0.67, 0.8);
    vec3 white = vec3(1.0, 1.0, 1.0);
    
    float depth = length(vPosition) * 0.5;
    vec3 color = mix(purple, magenta, depth);
    color = mix(color, pink, fresnel * 0.5);
    color = mix(color, white, fresnel * fresnel * 0.8);
    
    // Core glow
    float coreGlow = 1.0 - length(vPosition) * 0.4;
    coreGlow = pow(max(coreGlow, 0.0), 2.0);
    color += white * coreGlow * 0.5;
    
    // Audio reactive brightness
    color += magenta * u_audio * 0.3;
    
    float alpha = 0.7 + fresnel * 0.3;
    gl_FragColor = vec4(color, alpha);
  }
`;

// Star Formation Points
const StarFormations = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 250;
  
  const { positions, sizes, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 0.8 + Math.random() * 1.2;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      sizes[i] = Math.random() * 0.08 + 0.02;
      
      // White to yellow to pink stars
      const colorChoice = Math.random();
      if (colorChoice > 0.7) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 0.7; // Yellow
      } else if (colorChoice > 0.4) {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 0.9; // Pink
      } else {
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0; // White
      }
    }
    
    return { positions, sizes, colors };
  }, []);
  
  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const sizesAttr = pointsRef.current.geometry.attributes.size as THREE.BufferAttribute;
    
    const intensity = state === "thinking" ? 1.5 : state === "speaking" ? 1.2 : 1.0;
    
    for (let i = 0; i < count; i++) {
      const phase = i * 0.1;
      const twinkle = Math.sin(t * 3 + phase) * 0.5 + 0.5;
      sizesAttr.array[i] = sizes[i] * (0.5 + twinkle * 0.5) * intensity;
      sizesAttr.array[i] += audioLevel * 0.05;
    }
    sizesAttr.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

// Cosmic Dust Streams (spiral arms)
const CosmicDustStreams = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const streamCount = 4;
  const particlesPerStream = 300;
  
  const streams = useMemo(() => {
    return Array.from({ length: streamCount }, (_, streamIndex) => {
      const positions = new Float32Array(particlesPerStream * 3);
      const colors = new Float32Array(particlesPerStream * 3);
      
      const baseAngle = (streamIndex / streamCount) * Math.PI * 2;
      const streamColor = [
        [1.0, 0.85, 0.4],   // Gold
        [0.4, 1.0, 1.0],    // Cyan
        [1.0, 0.4, 0.8],    // Magenta
        [0.8, 0.6, 1.0],    // Purple
      ][streamIndex];
      
      for (let i = 0; i < particlesPerStream; i++) {
        const t = i / particlesPerStream;
        const spiralAngle = baseAngle + t * Math.PI * 3;
        const radius = 3.5 - t * 2.5;
        const height = (Math.random() - 0.5) * 0.3;
        
        positions[i * 3] = Math.cos(spiralAngle) * radius + (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 1] = height + Math.sin(t * Math.PI) * 0.5;
        positions[i * 3 + 2] = Math.sin(spiralAngle) * radius + (Math.random() - 0.5) * 0.2;
        
        colors[i * 3] = streamColor[0];
        colors[i * 3 + 1] = streamColor[1];
        colors[i * 3 + 2] = streamColor[2];
      }
      
      return { positions, colors };
    });
  }, []);
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const speed = state === "speaking" ? 0.3 : state === "thinking" ? 0.15 : 0.08;
    groupRef.current.rotation.y += speed * 0.02;
    groupRef.current.rotation.y += audioLevel * 0.01;
  });
  
  return (
    <group ref={groupRef}>
      {streams.map((stream, index) => (
        <points key={index}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[stream.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[stream.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.03}
            vertexColors
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}
    </group>
  );
};

// Gravitational Lensing Ring
const GravitationalLensing = ({ state }: { state: AIState }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    ringRef.current.rotation.x = Math.sin(t * 0.2) * 0.3 + 0.5;
    ringRef.current.rotation.z = t * 0.1;
    
    const scale = state === "thinking" ? 1.2 : 1.0;
    ringRef.current.scale.setScalar(scale + Math.sin(t) * 0.05);
  });
  
  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[2.2, 0.02, 16, 100]} />
      <meshBasicMaterial
        color="#ff88cc"
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// Main Nebula Core
const NebulaCore = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_audio: { value: 0 },
    u_state: { value: 0 },
  }), []);
  
  useFrame(({ clock }) => {
    if (!materialRef.current || !meshRef.current) return;
    materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
    materialRef.current.uniforms.u_audio.value = audioLevel;
    
    const stateValue = state === "speaking" ? 1.0 : state === "thinking" ? 0.7 : state === "listening" ? 0.4 : 0.0;
    materialRef.current.uniforms.u_state.value = stateValue;
    
    meshRef.current.rotation.y += 0.002;
  });
  
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.2, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

export const NebulaCoreScene = ({ state, audioLevel }: NebulaCoreSceneProps) => {
  return (
    <group>
      <NebulaCore state={state} audioLevel={audioLevel} />
      <StarFormations state={state} audioLevel={audioLevel} />
      <CosmicDustStreams state={state} audioLevel={audioLevel} />
      <GravitationalLensing state={state} />
    </group>
  );
};
