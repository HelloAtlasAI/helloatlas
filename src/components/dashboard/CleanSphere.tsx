import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uMorphIntensity;
  
  varying vec3 vNormal;
  varying float vDisplacement;
  varying vec3 vPosition;
  
  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
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
    vNormal = normal;
    vPosition = position;
    
    float baseSpeed = 0.3;
    float speed = baseSpeed + uAudioLevel * 0.5;
    
    // Multi-layered noise for organic morphing
    float noise1 = snoise(position * 1.5 + uTime * speed) * 0.4;
    float noise2 = snoise(position * 3.0 + uTime * speed * 1.5) * 0.2;
    float noise3 = snoise(position * 6.0 + uTime * speed * 2.0) * 0.1;
    
    float displacement = (noise1 + noise2 + noise3) * uMorphIntensity * (1.0 + uAudioLevel * 2.0);
    vDisplacement = displacement;
    
    vec3 newPosition = position + normal * displacement;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  
  varying vec3 vNormal;
  varying float vDisplacement;
  varying vec3 vPosition;
  
  void main() {
    // Dynamic color mixing based on displacement and position
    float colorMix = (vDisplacement + 0.5) * 0.5 + sin(uTime * 0.5) * 0.1;
    colorMix = clamp(colorMix, 0.0, 1.0);
    
    vec3 color1 = mix(uColorA, uColorB, colorMix);
    vec3 color2 = mix(uColorB, uColorC, colorMix);
    vec3 finalColor = mix(color1, color2, sin(vPosition.y * 2.0 + uTime) * 0.5 + 0.5);
    
    // Fresnel effect for edge glow
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
    
    // Add glow at edges
    finalColor += uColorC * fresnel * (0.5 + uAudioLevel);
    
    // Inner glow based on displacement
    float innerGlow = smoothstep(-0.2, 0.3, vDisplacement) * 0.3;
    finalColor += uColorB * innerGlow;
    
    // Slight transparency at edges
    float alpha = 0.85 + fresnel * 0.15;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

interface SphereProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioLevel: number;
}

function Sphere({ state, audioLevel }: SphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAudioLevel: { value: 0 },
    uMorphIntensity: { value: 0.3 },
    uColorA: { value: new THREE.Color('#0ea5e9') }, // Cyan
    uColorB: { value: new THREE.Color('#8b5cf6') }, // Purple
    uColorC: { value: new THREE.Color('#06b6d4') }, // Teal
  }), []);
  
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    uniforms.uTime.value += delta;
    
    // Smooth audio level interpolation
    const targetAudio = audioLevel;
    uniforms.uAudioLevel.value += (targetAudio - uniforms.uAudioLevel.value) * 0.1;
    
    // Morph intensity based on state
    const targetMorph = state === 'speaking' ? 0.6 : 
                        state === 'thinking' ? 0.5 : 
                        state === 'listening' ? 0.4 : 0.25;
    uniforms.uMorphIntensity.value += (targetMorph - uniforms.uMorphIntensity.value) * 0.05;
    
    // Gentle rotation
    meshRef.current.rotation.y += delta * 0.1;
    meshRef.current.rotation.x += delta * 0.05;
  });
  
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.5, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

interface CleanSphereProps {
  state?: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioLevel?: number;
  onClick?: () => void;
  className?: string;
}

export const CleanSphere = ({ 
  state = 'idle', 
  audioLevel = 0, 
  onClick,
  className = ''
}: CleanSphereProps) => {
  return (
    <div 
      className={`relative cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Outer glow effect */}
      <div 
        className="absolute inset-0 rounded-full blur-3xl opacity-50 transition-all duration-500"
        style={{
          background: state === 'speaking' 
            ? 'radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, rgba(14, 165, 233, 0.3) 50%, transparent 70%)'
            : state === 'listening'
            ? 'radial-gradient(circle, rgba(6, 182, 212, 0.5) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 70%)',
          transform: `scale(${1 + audioLevel * 0.3})`,
        }}
      />
      
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8b5cf6" />
        <Sphere state={state} audioLevel={audioLevel} />
      </Canvas>
    </div>
  );
};
