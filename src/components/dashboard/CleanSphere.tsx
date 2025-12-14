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
  varying vec3 vWorldPosition;
  
  // Improved simplex noise with better derivatives
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
  
  // Smooth easing function
  float smootherstep(float edge0, float edge1, float x) {
    x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
  }
  
  void main() {
    vNormal = normal;
    vPosition = position;
    
    float baseSpeed = 0.25;
    float speed = baseSpeed + uAudioLevel * 0.4;
    
    // 4 octaves of noise for ultra-smooth organic morphing
    float noise1 = snoise(position * 1.2 + uTime * speed) * 0.35;
    float noise2 = snoise(position * 2.4 + uTime * speed * 1.3) * 0.2;
    float noise3 = snoise(position * 4.8 + uTime * speed * 1.6) * 0.12;
    float noise4 = snoise(position * 9.6 + uTime * speed * 2.0) * 0.06;
    
    float combinedNoise = noise1 + noise2 + noise3 + noise4;
    
    // Smoother audio reactivity with easing
    float smoothAudio = smootherstep(0.0, 1.0, uAudioLevel);
    float displacement = combinedNoise * uMorphIntensity * (1.0 + smoothAudio * 1.5);
    vDisplacement = displacement;
    
    vec3 newPosition = position + normal * displacement;
    vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
    
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
  varying vec3 vWorldPosition;
  
  // Smooth easing
  float smootherstep(float edge0, float edge1, float x) {
    x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
  }
  
  void main() {
    // Smoother color mixing
    float colorMix = smootherstep(-0.3, 0.6, vDisplacement + sin(uTime * 0.4) * 0.15);
    
    vec3 color1 = mix(uColorA, uColorB, colorMix);
    vec3 color2 = mix(uColorB, uColorC, colorMix);
    float yFactor = smootherstep(-1.0, 1.0, sin(vPosition.y * 1.5 + uTime * 0.5) * 0.5 + 0.5);
    vec3 finalColor = mix(color1, color2, yFactor);
    
    // Enhanced Fresnel with subsurface scattering effect
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);
    
    // Subsurface scattering simulation
    float sss = pow(max(dot(-viewDir, vNormal) * 0.5 + 0.5, 0.0), 2.0) * 0.3;
    finalColor += uColorB * sss;
    
    // Rim glow
    float rimGlow = fresnel * (0.6 + uAudioLevel * 0.5);
    finalColor += uColorC * rimGlow;
    
    // Inner glow based on displacement with smooth falloff
    float innerGlow = smootherstep(-0.15, 0.25, vDisplacement) * 0.25;
    finalColor += uColorB * innerGlow;
    
    // Ambient occlusion in crevices
    float ao = smootherstep(-0.3, 0.1, vDisplacement);
    finalColor *= 0.7 + ao * 0.3;
    
    // Smooth alpha
    float alpha = 0.9 + fresnel * 0.1;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

interface SphereProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioLevel: number;
}

function Sphere({ state, audioLevel }: SphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const smoothedAudioRef = useRef(0);
  const smoothedMorphRef = useRef(0.25);
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAudioLevel: { value: 0 },
    uMorphIntensity: { value: 0.25 },
    uColorA: { value: new THREE.Color('#0ea5e9') },
    uColorB: { value: new THREE.Color('#8b5cf6') },
    uColorC: { value: new THREE.Color('#06b6d4') },
  }), []);
  
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    uniforms.uTime.value += delta;
    
    // Ultra-smooth audio level with exponential smoothing
    const audioSmoothing = 0.15;
    smoothedAudioRef.current += (audioLevel - smoothedAudioRef.current) * audioSmoothing;
    uniforms.uAudioLevel.value = smoothedAudioRef.current;
    
    // Smooth morph intensity with easing
    const targetMorph = state === 'speaking' ? 0.55 : 
                        state === 'thinking' ? 0.45 : 
                        state === 'listening' ? 0.38 : 0.22;
    const morphSmoothing = 0.08;
    smoothedMorphRef.current += (targetMorph - smoothedMorphRef.current) * morphSmoothing;
    uniforms.uMorphIntensity.value = smoothedMorphRef.current;
    
    // Gentle organic rotation
    meshRef.current.rotation.y += delta * 0.08;
    meshRef.current.rotation.x += delta * 0.04;
  });
  
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.5, 128]} />
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
      {/* Outer glow effect with smoother transitions */}
      <div 
        className="absolute inset-0 rounded-full blur-2xl transition-all duration-700 ease-out"
        style={{
          background: state === 'speaking' 
            ? 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(14, 165, 233, 0.25) 50%, transparent 70%)'
            : state === 'listening'
            ? 'radial-gradient(circle, rgba(6, 182, 212, 0.45) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%)'
            : state === 'thinking'
            ? 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(6, 182, 212, 0.2) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 70%)',
          transform: `scale(${1 + audioLevel * 0.25})`,
          opacity: 0.6 + audioLevel * 0.3,
        }}
      />
      
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.25} />
        <pointLight position={[10, 10, 10]} intensity={0.6} />
        <pointLight position={[-10, -10, -10]} intensity={0.35} color="#8b5cf6" />
        <pointLight position={[0, 10, 0]} intensity={0.2} color="#06b6d4" />
        <Sphere state={state} audioLevel={audioLevel} />
      </Canvas>
    </div>
  );
};