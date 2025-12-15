import { useRef, useMemo, memo, forwardRef, useState, useEffect } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
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
  particleCount?: number;
  particleSize?: number;
  density?: number;
  rotationSpeed?: number;
  enableBloom?: boolean;
  bloomIntensity?: number;
  morphSpeed?: number;
  // Ring Ripple props
  enableRipples?: boolean;
  rippleSpeed?: number;
  rippleCount?: number;
  // Turbulence props
  enableTurbulence?: boolean;
  turbulenceFrequency?: number;
  turbulenceAmplitude?: number;
  turbulenceSpeed?: number;
  // Mouse Interaction props
  enableMouseInteraction?: boolean;
  mouseMode?: 'attract' | 'repulse';
  mouseStrength?: number;
  mouseInfluenceRadius?: number;
}

// State color configurations
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

// Simplex-like noise function for turbulence
const noise3D = (x: number, y: number, z: number, frequency: number): number => {
  const fx = x * frequency;
  const fy = y * frequency;
  const fz = z * frequency;
  return (
    Math.sin(fx * 1.1 + fz * 0.7) * 
    Math.cos(fy * 1.3 + fx * 0.5) * 
    Math.sin(fz * 0.9 + fy * 0.6) +
    Math.sin(fx * 2.1 + fy * 1.4) * 0.5 +
    Math.cos(fy * 1.8 + fz * 1.2) * 0.3
  ) * 0.5;
};

// Easing function for fluid morphing
const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Ripple interface
interface Ripple {
  id: number;
  startTime: number;
  color: THREE.Color;
}

// Ring Ripples component - expanding shockwaves on state changes
const RingRipples = memo(({ 
  ripples, 
  rippleSpeed 
}: { 
  ripples: Ripple[]; 
  rippleSpeed: number;
}) => {
  const ripplesRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<Map<number, THREE.MeshBasicMaterial>>(new Map());
  
  useFrame(({ clock }) => {
    if (!ripplesRef.current) return;
    
    ripplesRef.current.children.forEach((child, index) => {
      const ripple = ripples[index];
      if (!ripple) return;
      
      const elapsed = clock.getElapsedTime() - ripple.startTime;
      const progress = Math.min(elapsed * rippleSpeed, 1);
      
      // Expand radius from 0.5 to 4
      const radius = 0.5 + progress * 3.5;
      child.scale.setScalar(radius);
      
      // Fade out opacity
      const material = materialsRef.current.get(ripple.id);
      if (material) {
        material.opacity = (1 - progress) * 0.6;
      }
    });
  });

  return (
    <group ref={ripplesRef}>
      {ripples.map((ripple) => (
        <mesh key={ripple.id} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1, 0.02, 8, 64]} />
          <meshBasicMaterial
            ref={(mat) => {
              if (mat) materialsRef.current.set(ripple.id, mat);
            }}
            color={ripple.color}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
});

RingRipples.displayName = 'RingRipples';

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

// Main particle system
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
  morphSpeed = 1.5,
  enableRipples = true,
  rippleSpeed = 1.5,
  rippleCount = 2,
  enableTurbulence = true,
  turbulenceFrequency = 0.5,
  turbulenceAmplitude = 0.08,
  turbulenceSpeed = 0.3,
  enableMouseInteraction = true,
  mouseMode = 'attract' as const,
  mouseStrength = 0.5,
  mouseInfluenceRadius = 2.5,
  mousePosition
}: AtlasCoreProps & { mousePosition: React.MutableRefObject<{ x: number; y: number; active: boolean }> }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);
  const currentColorRef = useRef(new THREE.Color(1.0, 0.5, 0.2));
  const frameCountRef = useRef(0);
  const currentMorphRef = useRef(morphProgress ?? 1);
  const prevStateRef = useRef(state);
  
  // Ripple state
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdRef = useRef(0);
  
  // Position history for trails
  const positionHistoryRef = useRef<Float32Array[]>([]);
  const [, forceUpdate] = useState(0);
  
  const config = STATE_CONFIGS[state];

  // Trigger ripples on state change
  useEffect(() => {
    if (prevStateRef.current !== state && enableRipples) {
      const newRipples: Ripple[] = [];
      for (let i = 0; i < rippleCount; i++) {
        rippleIdRef.current++;
        newRipples.push({
          id: rippleIdRef.current,
          startTime: performance.now() / 1000 + i * 0.15,
          color: config.primary.clone()
        });
      }
      setRipples(prev => [...prev.slice(-5), ...newRipples]);
      prevStateRef.current = state;
    }
  }, [state, enableRipples, rippleCount, config.primary]);

  // Clean up old ripples
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now() / 1000;
      setRipples(prev => prev.filter(r => now - r.startTime < 2));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Create circular texture once
  const circleTexture = useMemo(() => generateCircleTexture(), []);

  // Store both sphere and scattered positions
  const { geometry, spherePositions, scatteredPositions, particleOffsets } = useMemo(() => {
    const count = particleCount;
    const sphere = new Float32Array(count * 3);
    const scattered = new Float32Array(count * 3);
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = (1.8 * density) + (Math.random() - 0.5) * 0.4 * density;
      
      sphere[i3] = r * Math.sin(phi) * Math.cos(theta);
      sphere[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      sphere[i3 + 2] = r * Math.cos(phi);
      
      const scatterRadius = 6 * density;
      scattered[i3] = (Math.random() - 0.5) * scatterRadius;
      scattered[i3 + 1] = (Math.random() - 0.5) * scatterRadius;
      scattered[i3 + 2] = (Math.random() - 0.5) * scatterRadius;
      
      positions[i3] = sphere[i3];
      positions[i3 + 1] = sphere[i3 + 1];
      positions[i3 + 2] = sphere[i3 + 2];
      
      offsets[i] = Math.random() * 0.4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geometry: geo, spherePositions: sphere, scatteredPositions: scattered, particleOffsets: offsets };
  }, [particleCount, density]);

  const targetMorph = morphProgress ?? 1;

  // Animation loop
  useFrame((state3D, delta) => {
    timeRef.current += delta;
    frameCountRef.current++;
    
    currentMorphRef.current = THREE.MathUtils.lerp(
      currentMorphRef.current,
      targetMorph,
      delta * morphSpeed * 2
    );
    
    const smoothMorph = currentMorphRef.current;
    
    if (pointsRef.current && geometry) {
      const positions = geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;
      const time = timeRef.current;
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        const particleOffset = particleOffsets[i];
        const adjustedMorph = easeInOutCubic(
          Math.max(0, Math.min(1, smoothMorph * (1 + particleOffset) - particleOffset * 0.5))
        );
        
        // Base interpolated position
        let px = scatteredPositions[i3] + (spherePositions[i3] - scatteredPositions[i3]) * adjustedMorph;
        let py = scatteredPositions[i3 + 1] + (spherePositions[i3 + 1] - scatteredPositions[i3 + 1]) * adjustedMorph;
        let pz = scatteredPositions[i3 + 2] + (spherePositions[i3 + 2] - scatteredPositions[i3 + 2]) * adjustedMorph;
        
        // Apply Perlin noise turbulence
        if (enableTurbulence) {
          const noiseTime = time * turbulenceSpeed;
          const nx = noise3D(px + noiseTime, py, pz, turbulenceFrequency) * turbulenceAmplitude;
          const ny = noise3D(px, py + noiseTime, pz, turbulenceFrequency) * turbulenceAmplitude;
          const nz = noise3D(px, py, pz + noiseTime, turbulenceFrequency) * turbulenceAmplitude;
          
          px += nx;
          py += ny;
          pz += nz;
        }
        
        // Apply mouse interaction
        if (enableMouseInteraction && mousePosition.current.active) {
          const mouseX = mousePosition.current.x * 4;
          const mouseY = mousePosition.current.y * 4;
          const mouseZ = 0;
          
          const dx = mouseX - px;
          const dy = mouseY - py;
          const dz = mouseZ - pz;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (dist < mouseInfluenceRadius && dist > 0.01) {
            const influence = (1 - dist / mouseInfluenceRadius) * mouseStrength * 0.3;
            const dirX = dx / dist;
            const dirY = dy / dist;
            const dirZ = dz / dist;
            
            if (mouseMode === 'attract') {
              px += dirX * influence;
              py += dirY * influence;
              pz += dirZ * influence;
            } else {
              px -= dirX * influence;
              py -= dirY * influence;
              pz -= dirZ * influence;
            }
          }
        }
        
        positions[i3] = px;
        positions[i3 + 1] = py;
        positions[i3 + 2] = pz;
      }
      geometry.attributes.position.needsUpdate = true;
      
      pointsRef.current.rotation.y += delta * rotationSpeed * (0.2 + config.intensity * 0.3);
      pointsRef.current.rotation.x += delta * rotationSpeed * 0.05;
      
      const pulse = 1 + audioLevel * 0.15 + Math.sin(timeRef.current * 2) * 0.02;
      pointsRef.current.scale.setScalar(pulse);
      
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
    
    if (materialRef.current) {
      currentColorRef.current.lerp(config.primary, 0.08);
      materialRef.current.color.copy(currentColorRef.current);
    }
  });

  return (
    <group>
      {/* Ring ripples on state change */}
      {enableRipples && ripples.length > 0 && (
        <RingRipples ripples={ripples} rippleSpeed={rippleSpeed} />
      )}
      
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

      {/* Inner core glow */}
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
  morphSpeed = 1.5,
  enableRipples = true,
  rippleSpeed = 1.5,
  rippleCount = 2,
  enableTurbulence = true,
  turbulenceFrequency = 0.5,
  turbulenceAmplitude = 0.08,
  turbulenceSpeed = 0.3,
  enableMouseInteraction = true,
  mouseMode = 'attract',
  mouseStrength = 0.5,
  mouseInfluenceRadius = 2.5
}, ref) => {
  // Mouse tracking ref
  const mousePositionRef = useRef({ x: 0, y: 0, active: false });
  
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mousePositionRef.current = { x, y, active: true };
  };
  
  const handlePointerLeave = () => {
    mousePositionRef.current.active = false;
  };

  return (
    <div 
      ref={ref} 
      className="w-full h-full min-w-[200px] min-h-[200px]"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
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
          enableRipples={enableRipples}
          rippleSpeed={rippleSpeed}
          rippleCount={rippleCount}
          enableTurbulence={enableTurbulence}
          turbulenceFrequency={turbulenceFrequency}
          turbulenceAmplitude={turbulenceAmplitude}
          turbulenceSpeed={turbulenceSpeed}
          enableMouseInteraction={enableMouseInteraction}
          mouseMode={mouseMode}
          mouseStrength={mouseStrength}
          mouseInfluenceRadius={mouseInfluenceRadius}
          mousePosition={mousePositionRef}
        />
        {enableBloom && <BloomEffect intensity={bloomIntensity} />}
      </Canvas>
    </div>
  );
}));

AtlasCoreFixed.displayName = 'AtlasCoreFixed';

export default AtlasCoreFixed;