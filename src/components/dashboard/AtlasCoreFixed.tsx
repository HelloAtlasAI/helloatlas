import { useRef, useMemo, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WakeWordState } from '@/hooks/useWakeWord';

interface AtlasCoreProps {
  state: WakeWordState;
  audioLevel: number;
  morphProgress?: number;
}

// State color configurations with proper typing
const STATE_CONFIGS: Record<WakeWordState, { 
  morph: number; 
  intensity: number; 
  primary: THREE.Color;
  secondary: THREE.Color;
  core: THREE.Color;
}> = {
  dormant: { 
    morph: 0.2, 
    intensity: 0.1, 
    primary: new THREE.Color(1.0, 0.4, 0.1),
    secondary: new THREE.Color(1.0, 0.7, 0.3),
    core: new THREE.Color(1.0, 0.5, 0.2)
  },
  passive: { 
    morph: 0.4, 
    intensity: 0.2, 
    primary: new THREE.Color(1.0, 0.5, 0.1),
    secondary: new THREE.Color(1.0, 0.8, 0.3),
    core: new THREE.Color(1.0, 0.6, 0.2)
  },
  activated: { 
    morph: 1.0, 
    intensity: 0.8, 
    primary: new THREE.Color(1.0, 0.6, 0.2),
    secondary: new THREE.Color(1.0, 0.9, 0.5),
    core: new THREE.Color(1.0, 0.8, 0.3)
  },
  listening: { 
    morph: 1.0, 
    intensity: 0.6, 
    primary: new THREE.Color(0.2, 0.6, 1.0),
    secondary: new THREE.Color(0.5, 0.9, 1.0),
    core: new THREE.Color(0.3, 0.8, 1.0)
  },
  thinking: { 
    morph: 1.0, 
    intensity: 0.9, 
    primary: new THREE.Color(0.6, 0.3, 1.0),
    secondary: new THREE.Color(0.9, 0.6, 1.0),
    core: new THREE.Color(0.7, 0.4, 1.0)
  },
  speaking: { 
    morph: 1.0, 
    intensity: 0.7, 
    primary: new THREE.Color(1.0, 0.7, 0.2),
    secondary: new THREE.Color(1.0, 0.95, 0.6),
    core: new THREE.Color(1.0, 0.85, 0.4)
  },
};

// Simplified particle system using THREE.Points with PointsMaterial
const ParticleSystem = memo(({ state, audioLevel }: AtlasCoreProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const currentColorRef = useRef(new THREE.Color(1.0, 0.5, 0.2));
  
  const config = STATE_CONFIGS[state];

  // Generate particle geometry with reduced count for performance
  const geometry = useMemo(() => {
    const count = 2000; // Reduced from 4000 for better performance
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.8 + (Math.random() - 0.5) * 0.4;
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Animation loop
  useFrame((_, delta) => {
    timeRef.current += delta;
    
    // Animate particles
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * (0.1 + config.intensity * 0.2);
      pointsRef.current.rotation.x += delta * 0.02;
      
      // Pulsing scale based on audio
      const pulse = 1 + audioLevel * 0.15 + Math.sin(timeRef.current * 2) * 0.02;
      pointsRef.current.scale.setScalar(pulse);
    }
    
    // Animate core glow
    if (coreRef.current) {
      const corePulse = 0.3 + audioLevel * 0.15 + Math.sin(timeRef.current * 3) * 0.05;
      coreRef.current.scale.setScalar(corePulse + 0.3);
    }
    
    if (glowRef.current) {
      const glowPulse = 0.5 + audioLevel * 0.2 + Math.sin(timeRef.current * 2) * 0.08;
      glowRef.current.scale.setScalar(glowPulse + 0.5);
    }
    
    // Smooth color transition
    if (materialRef.current) {
      currentColorRef.current.lerp(config.primary, 0.08);
      materialRef.current.color.copy(currentColorRef.current);
    }
  });

  return (
    <group>
      {/* Main particle cloud */}
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          ref={materialRef}
          size={0.08}
          sizeAttenuation={true}
          color={config.primary}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Inner core glow */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.4, 24, 24]} />
        <meshBasicMaterial
          color={config.core}
          transparent
          opacity={0.5 + audioLevel * 0.3}
        />
      </mesh>
      
      {/* Outer glow layer */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshBasicMaterial
          color={config.secondary}
          transparent
          opacity={0.2 + audioLevel * 0.15}
        />
      </mesh>
    </group>
  );
});

ParticleSystem.displayName = 'ParticleSystem';

// CSS Fallback orb for when WebGL fails
const CSSFallbackOrb = memo(({ state, audioLevel }: { state: WakeWordState; audioLevel: number }) => {
  const config = STATE_CONFIGS[state];
  const colorHex = '#' + config.primary.getHexString();
  const coreHex = '#' + config.core.getHexString();
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div 
        className="relative w-32 h-32 rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${coreHex}, ${colorHex} 50%, transparent 70%)`,
          boxShadow: `0 0 ${30 + audioLevel * 50}px ${colorHex}, inset 0 0 20px ${coreHex}`,
          transform: `scale(${1 + audioLevel * 0.2})`,
          transition: 'all 0.3s ease-out',
        }}
      >
        <div 
          className="absolute inset-2 rounded-full opacity-60"
          style={{
            background: `radial-gradient(circle at 40% 40%, white 0%, ${coreHex} 30%, transparent 60%)`,
          }}
        />
      </div>
    </div>
  );
});

CSSFallbackOrb.displayName = 'CSSFallbackOrb';

// Main exported component
export const AtlasCoreFixed = memo(({ state, audioLevel, morphProgress }: AtlasCoreProps) => {
  return (
    <div className="w-full h-full min-w-[200px] min-h-[200px]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ 
          antialias: false, // Disabled for performance
          alpha: true,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]} // Reduced max DPR for performance
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        fallback={<CSSFallbackOrb state={state} audioLevel={audioLevel} />}
      >
        <ParticleSystem state={state} audioLevel={audioLevel} morphProgress={morphProgress} />
      </Canvas>
    </div>
  );
});

AtlasCoreFixed.displayName = 'AtlasCoreFixed';

export default AtlasCoreFixed;
