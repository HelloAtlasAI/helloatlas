import { Suspense, memo, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type AIState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface AtlasSphereProps {
  state: AIState;
  audioLevel: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  className?: string;
}

const sizeConfig = {
  sm: { container: 'w-20 h-20', scale: 0.6 },
  md: { container: 'w-32 h-32', scale: 0.8 },
  lg: { container: 'w-48 h-48', scale: 1.0 },
  xl: { container: 'w-64 h-64', scale: 1.2 },
};

// Optimized vertex shader - visible bright blue sphere
const vertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uMorph;
  
  attribute float aRandom;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float time = uTime * 0.4;
    vec3 pos = position;
    
    // Gentle organic morphing
    float wave = sin(pos.x * 3.0 + time) * cos(pos.y * 3.0 + time * 0.7) * sin(pos.z * 3.0 + time * 0.5);
    pos += normal * wave * uMorph * 0.15;
    
    // Audio reactivity - subtle pulse
    float audioEffect = 1.0 + uAudioLevel * 0.15;
    pos *= audioEffect;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Particle size based on depth
    float size = 2.0 + aRandom * 1.5;
    gl_PointSize = size * (180.0 / -mvPosition.z);
    
    // Distance from center for alpha
    float dist = length(position);
    vAlpha = 0.75 * (1.0 - smoothstep(0.2, 0.55, dist));
    
    // Bright visible blue palette
    vec3 colorCore = vec3(0.2, 0.5, 0.9);    // Bright blue
    vec3 colorMid = vec3(0.3, 0.6, 1.0);     // Electric blue
    vec3 colorOuter = vec3(0.4, 0.7, 1.0);   // Light blue
    
    float colorMix = aRandom;
    vColor = mix(colorCore, mix(colorMid, colorOuter, colorMix), dist * 2.0);
    
    // Boost brightness with audio
    vColor += vec3(0.1, 0.15, 0.2) * uAudioLevel;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Soft glowing circle
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vAlpha;
    
    // Add slight glow at edges
    float glow = smoothstep(0.3, 0.5, dist) * 0.3;
    vec3 finalColor = vColor + vec3(0.1, 0.2, 0.3) * glow;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

interface SphereParticlesProps {
  state: AIState;
  audioLevel: number;
  scale: number;
}

const SphereParticles = memo(({ state, audioLevel, scale }: SphereParticlesProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothAudioRef = useRef(0);

  const { geometry, material } = useMemo(() => {
    const count = 8000; // Optimized particle count
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Sphere distribution with core concentration
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.5 * Math.pow(Math.random(), 0.35); // Concentrate in center
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      randoms[i] = Math.random();
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
    
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uMorph: { value: 0.5 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    return { geometry: geo, material: mat };
  }, []);

  useFrame((frameState) => {
    if (!materialRef.current || !pointsRef.current) return;

    const time = frameState.clock.elapsedTime;
    smoothAudioRef.current = THREE.MathUtils.lerp(smoothAudioRef.current, audioLevel, 0.12);

    // State-based morph intensity
    let morphTarget = 0.5;
    let rotationSpeed = 0.002;
    
    switch (state) {
      case 'listening':
        morphTarget = 0.8;
        rotationSpeed = 0.004;
        break;
      case 'thinking':
        morphTarget = 1.2;
        rotationSpeed = 0.006;
        break;
      case 'speaking':
        morphTarget = 0.9;
        rotationSpeed = 0.003;
        break;
    }

    const uniforms = materialRef.current.uniforms;
    uniforms.uTime.value = time;
    uniforms.uAudioLevel.value = smoothAudioRef.current;
    uniforms.uMorph.value = THREE.MathUtils.lerp(uniforms.uMorph.value, morphTarget, 0.05);

    pointsRef.current.rotation.y += rotationSpeed;
    pointsRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
  });

  return (
    <points ref={pointsRef} geometry={geometry} scale={scale}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
});

SphereParticles.displayName = 'SphereParticles';

const AtlasSphereComponent = ({ 
  state, 
  audioLevel, 
  size = 'lg',
  onClick,
  className = '',
}: AtlasSphereProps) => {
  const config = sizeConfig[size];
  
  // Glow color based on state
  const glowColor = useMemo(() => {
    switch (state) {
      case 'listening': return 'hsl(200 80% 60% / 0.4)';
      case 'thinking': return 'hsl(220 80% 60% / 0.5)';
      case 'speaking': return 'hsl(180 70% 55% / 0.45)';
      default: return 'hsl(210 70% 50% / 0.3)';
    }
  }, [state]);

  return (
    <div 
      className={`${config.container} ${className} cursor-pointer relative`}
      onClick={onClick}
    >
      {/* Ambient glow */}
      <div 
        className="absolute inset-[-30%] rounded-full blur-3xl pointer-events-none transition-all duration-500"
        style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
      />
      
      {/* State indicator ring */}
      {state !== 'idle' && (
        <div 
          className="absolute inset-[-5%] rounded-full border-2 pointer-events-none animate-pulse"
          style={{ 
            borderColor: state === 'listening' ? 'hsl(200 80% 60% / 0.6)' : 
                         state === 'thinking' ? 'hsl(220 80% 60% / 0.6)' : 
                         'hsl(180 70% 55% / 0.6)'
          }}
        />
      )}
      
      <Canvas
        camera={{ position: [0, 0, 1.5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <SphereParticles state={state} audioLevel={audioLevel} scale={config.scale} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export const AtlasSphere = memo(AtlasSphereComponent);
