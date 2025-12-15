import { useRef, useMemo, memo, forwardRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { WakeWordState } from '@/hooks/useWakeWord';

interface AtlasCoreProps {
  state: WakeWordState;
  audioLevel: number;
  morphProgress?: number;
  enableTrails?: boolean;
  trailLength?: number;
  trailOpacity?: number;
  // New controls
  particleCount?: number;
  particleSize?: number;
  density?: number;
  rotationSpeed?: number;
  enableBloom?: boolean;
  bloomIntensity?: number;
  morphSpeed?: number;
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

// Generate circular particle texture
const generateCircleTexture = (): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.3)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

// Easing function for fluid morphing
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Trail system component
const ParticleTrails = memo(({ 
  positionHistory, 
  trailLength, 
  trailOpacity, 
  color,
  circleTexture
}: { 
  positionHistory: Float32Array[];
  trailLength: number;
  trailOpacity: number;
  color: THREE.Color;
  circleTexture: THREE.CanvasTexture;
}) => {
  const trailGeometries = useMemo(() => {
    return positionHistory.slice(0, trailLength).map((positions, index) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      return { geo, opacity: (1 - (index + 1) / (trailLength + 1)) * trailOpacity };
    });
  }, [positionHistory, trailLength, trailOpacity]);

  return (
    <group>
      {trailGeometries.map((trail, index) => (
        <points key={index} geometry={trail.geo}>
          <pointsMaterial
            size={0.06 + (trailLength - index) * 0.008}
            sizeAttenuation={true}
            color={color}
            map={circleTexture}
            alphaTest={0.01}
            transparent
            opacity={trail.opacity * 0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      ))}
    </group>
  );
});

ParticleTrails.displayName = 'ParticleTrails';

// Simplified particle system using THREE.Points with PointsMaterial
const ParticleSystem = memo(({ 
  state, 
  audioLevel, 
  morphProgress, 
  enableTrails = true, 
  trailLength = 6,
  trailOpacity = 0.5,
  particleCount = 2000,
  particleSize = 0.08,
  density = 1.0,
  rotationSpeed = 0.5,
  morphSpeed = 1.5
}: AtlasCoreProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);
  const currentColorRef = useRef(new THREE.Color(1.0, 0.5, 0.2));
  const frameCountRef = useRef(0);
  const currentMorphRef = useRef(morphProgress ?? 1);
  
  // Position history for trails
  const positionHistoryRef = useRef<Float32Array[]>([]);
  const [, forceUpdate] = useState(0);
  
  const config = STATE_CONFIGS[state];

  // Create circular texture once
  const circleTexture = useMemo(() => generateCircleTexture(), []);

  // Store both sphere and scattered positions
  const { geometry, spherePositions, scatteredPositions, particleOffsets } = useMemo(() => {
    const count = particleCount;
    const sphere = new Float32Array(count * 3);
    const scattered = new Float32Array(count * 3);
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count); // Per-particle offset for wave morphing

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Sphere distribution with density control
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = (1.8 * density) + (Math.random() - 0.5) * 0.4 * density;
      
      sphere[i3] = r * Math.sin(phi) * Math.cos(theta);
      sphere[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      sphere[i3 + 2] = r * Math.cos(phi);
      
      // Scattered positions (random cloud)
      const scatterRadius = 6 * density;
      scattered[i3] = (Math.random() - 0.5) * scatterRadius;
      scattered[i3 + 1] = (Math.random() - 0.5) * scatterRadius;
      scattered[i3 + 2] = (Math.random() - 0.5) * scatterRadius;
      
      // Initial positions
      positions[i3] = sphere[i3];
      positions[i3 + 1] = sphere[i3 + 1];
      positions[i3 + 2] = sphere[i3 + 2];
      
      // Random offset for wave effect (0 to 0.4)
      offsets[i] = Math.random() * 0.4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geometry: geo, spherePositions: sphere, scatteredPositions: scattered, particleOffsets: offsets };
  }, [particleCount, density]);

  // Target morph value
  const targetMorph = morphProgress ?? 1;

  // Animation loop
  useFrame((_, delta) => {
    timeRef.current += delta;
    frameCountRef.current++;
    
    // Smooth lerp morph value over time for fluid animation
    currentMorphRef.current = THREE.MathUtils.lerp(
      currentMorphRef.current,
      targetMorph,
      delta * morphSpeed * 2
    );
    
    const smoothMorph = currentMorphRef.current;
    
    // Interpolate particle positions with easing and per-particle offset
    if (pointsRef.current && geometry) {
      const positions = geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Apply per-particle offset for wave effect
        const particleOffset = particleOffsets[i];
        const adjustedMorph = easeInOutCubic(
          Math.max(0, Math.min(1, smoothMorph * (1 + particleOffset) - particleOffset * 0.5))
        );
        
        positions[i3] = scatteredPositions[i3] + (spherePositions[i3] - scatteredPositions[i3]) * adjustedMorph;
        positions[i3 + 1] = scatteredPositions[i3 + 1] + (spherePositions[i3 + 1] - scatteredPositions[i3 + 1]) * adjustedMorph;
        positions[i3 + 2] = scatteredPositions[i3 + 2] + (spherePositions[i3 + 2] - scatteredPositions[i3 + 2]) * adjustedMorph;
      }
      geometry.attributes.position.needsUpdate = true;
      
      // Rotation with configurable speed
      pointsRef.current.rotation.y += delta * rotationSpeed * (0.2 + config.intensity * 0.3);
      pointsRef.current.rotation.x += delta * rotationSpeed * 0.05;
      
      // Pulsing scale based on audio
      const pulse = 1 + audioLevel * 0.15 + Math.sin(timeRef.current * 2) * 0.02;
      pointsRef.current.scale.setScalar(pulse);
      
      // Update position history for trails (every 3rd frame for performance)
      if (enableTrails && frameCountRef.current % 3 === 0) {
        const rotatedPositions = new Float32Array(positions.length);
        const rotation = new THREE.Euler(
          pointsRef.current.rotation.x,
          pointsRef.current.rotation.y,
          pointsRef.current.rotation.z
        );
        const quaternion = new THREE.Quaternion().setFromEuler(rotation);
        const tempVec = new THREE.Vector3();
        
        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          tempVec.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
          tempVec.applyQuaternion(quaternion);
          tempVec.multiplyScalar(pulse);
          rotatedPositions[i3] = tempVec.x;
          rotatedPositions[i3 + 1] = tempVec.y;
          rotatedPositions[i3 + 2] = tempVec.z;
        }
        
        positionHistoryRef.current.unshift(rotatedPositions);
        if (positionHistoryRef.current.length > trailLength) {
          positionHistoryRef.current.pop();
        }
        forceUpdate(f => f + 1);
      }
    }
    
    // Smooth color transition
    if (materialRef.current) {
      currentColorRef.current.lerp(config.primary, 0.08);
      materialRef.current.color.copy(currentColorRef.current);
    }
  });

  return (
    <group>
      {/* Particle trails */}
      {enableTrails && positionHistoryRef.current.length > 0 && (
        <ParticleTrails
          positionHistory={positionHistoryRef.current}
          trailLength={trailLength}
          trailOpacity={trailOpacity}
          color={config.secondary}
          circleTexture={circleTexture}
        />
      )}
      
      {/* Main particle cloud */}
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          ref={materialRef}
          size={particleSize}
          sizeAttenuation={true}
          color={config.primary}
          map={circleTexture}
          alphaTest={0.01}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Inner core glow - very subtle with additive blending */}
      <mesh>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshBasicMaterial
          color={config.core}
          transparent
          opacity={0.15 + audioLevel * 0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
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

// Bloom wrapper component
const BloomEffect = memo(({ intensity }: { intensity: number }) => (
  <EffectComposer>
    <Bloom
      intensity={intensity}
      luminanceThreshold={0.2}
      luminanceSmoothing={0.9}
      radius={0.8}
      mipmapBlur
    />
  </EffectComposer>
));

BloomEffect.displayName = 'BloomEffect';

// Main exported component with forwardRef
export const AtlasCoreFixed = memo(forwardRef<HTMLDivElement, AtlasCoreProps>(({ 
  state, 
  audioLevel, 
  morphProgress,
  enableTrails = true,
  trailLength = 6,
  trailOpacity = 0.5,
  particleCount = 2000,
  particleSize = 0.08,
  density = 1.0,
  rotationSpeed = 0.5,
  enableBloom = true,
  bloomIntensity = 0.8,
  morphSpeed = 1.5
}, ref) => {
  return (
    <div ref={ref} className="w-full h-full min-w-[200px] min-h-[200px]">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        fallback={<CSSFallbackOrb state={state} audioLevel={audioLevel} />}
      >
        <ParticleSystem 
          state={state} 
          audioLevel={audioLevel} 
          morphProgress={morphProgress}
          enableTrails={enableTrails}
          trailLength={trailLength}
          trailOpacity={trailOpacity}
          particleCount={particleCount}
          particleSize={particleSize}
          density={density}
          rotationSpeed={rotationSpeed}
          morphSpeed={morphSpeed}
        />
        {enableBloom && <BloomEffect intensity={bloomIntensity} />}
      </Canvas>
    </div>
  );
}));

AtlasCoreFixed.displayName = 'AtlasCoreFixed';

export default AtlasCoreFixed;