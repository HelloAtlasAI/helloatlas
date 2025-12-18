import { Suspense, memo, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AIState } from '@/types';

interface PureNebulaSphereProps {
  state: AIState;
  audioLevel: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-24 h-24',
  md: 'w-40 h-40',
  lg: 'w-56 h-56',
  xl: 'w-72 h-72',
};

// Clean blue sphere shader - just the sphere, no background
const vertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uMorph;
  
  attribute float aRandomness;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float time = uTime * 0.3;
    
    vec3 pos = position;
    
    // Gentle morphing based on state
    float morphAmount = uMorph * (0.3 + aRandomness * 0.4);
    pos += normal * sin(time + aRandomness * 8.0) * morphAmount;
    
    // Audio reactivity
    pos *= 1.0 + uAudioLevel * 0.1;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Particle size
    float size = 1.8 + aRandomness * 1.2;
    gl_PointSize = size * (200.0 / -mvPosition.z);
    
    // Distance-based alpha
    float dist = length(pos);
    vAlpha = 0.6 * (1.0 - smoothstep(0.3, 0.8, dist));
    
    // Blue color palette - visible and clean
    vec3 colorDeep = vec3(0.08, 0.20, 0.45);
    vec3 colorMid = vec3(0.15, 0.35, 0.65);
    vec3 colorBright = vec3(0.25, 0.50, 0.85);
    
    float colorMix = aRandomness;
    vColor = mix(colorDeep, mix(colorMid, colorBright, colorMix), colorMix);
    vColor += vec3(0.05, 0.10, 0.15) * uAudioLevel;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Soft circle
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vAlpha;
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

interface SphereProps {
  state: AIState;
  audioLevel: number;
}

const Sphere = ({ state, audioLevel }: SphereProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothAudioRef = useRef(0);

  const geometry = useMemo(() => {
    const count = 15000;
    const positions = new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);
    const randomness = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.5 * Math.pow(Math.random(), 0.4);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      normals[i3] = x / len;
      normals[i3 + 1] = y / len;
      normals[i3 + 2] = z / len;
      
      randomness[i] = Math.random();
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geo.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 1));
    
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uMorph: { value: 0.15 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((frameState) => {
    if (!materialRef.current || !pointsRef.current) return;

    const time = frameState.clock.elapsedTime;
    smoothAudioRef.current = THREE.MathUtils.lerp(smoothAudioRef.current, audioLevel, 0.1);

    // State-based morphing
    let morphTarget = 0.15;
    switch (state) {
      case "listening": morphTarget = 0.25; break;
      case "thinking": morphTarget = 0.4; break;
      case "speaking": morphTarget = 0.3; break;
    }

    const uniforms = materialRef.current.uniforms;
    uniforms.uTime.value = time;
    uniforms.uAudioLevel.value = smoothAudioRef.current;
    uniforms.uMorph.value = THREE.MathUtils.lerp(uniforms.uMorph.value, morphTarget, 0.05);

    pointsRef.current.rotation.y += 0.001;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
};

const PureNebulaSphereComponent = ({ 
  state, 
  audioLevel, 
  size = 'lg',
  onClick,
  className = '',
}: PureNebulaSphereProps) => {
  return (
    <div 
      className={`${sizeClasses[size]} ${className} cursor-pointer relative`}
      onClick={onClick}
    >
      {/* Subtle ambient glow */}
      <div 
        className="absolute inset-[-20%] rounded-full opacity-40 blur-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(210 70% 50% / 0.3) 0%, transparent 60%)',
        }}
      />
      
      <Canvas
        camera={{ position: [0, 0, 1.8], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Sphere state={state} audioLevel={audioLevel} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export const PureNebulaSphere = memo(PureNebulaSphereComponent);
