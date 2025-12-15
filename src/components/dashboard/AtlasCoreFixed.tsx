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
  trailColorGradient?: boolean;
  trailStartColor?: string;
  trailEndColor?: string;
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
  // Core props
  enableCore?: boolean;
  coreParticleCount?: number;
  coreDensity?: number;
  coreParticleSize?: number;
  coreIntensity?: number;
  corePulseSpeed?: number;
  coreRotationOffset?: number;
  // Fluid dynamics props
  fluidCohesion?: number;
  surfaceTension?: number;
  fluidFlow?: number;
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

// Enhanced trail shader - dense glowing particle trails with smooth fading
const trailVertexShader = `
  attribute float trailIndex;
  attribute float opacity;
  attribute float randomSize;
  varying float vOpacity;
  varying float vTrailIndex;
  varying float vGlow;
  
  void main() {
    vOpacity = opacity;
    vTrailIndex = trailIndex;
    
    // Glow intensity based on trail position (newer = more glow)
    vGlow = 1.0 - trailIndex;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Larger base size, gradual shrinking with trail age
    float baseSize = 0.12 * (1.0 - trailIndex * 0.4);
    // Add size variation for more organic look
    float sizeVariation = 0.8 + randomSize * 0.4;
    gl_PointSize = baseSize * sizeVariation * (350.0 / -mvPosition.z);
  }
`;

const trailFragmentShader = `
  uniform vec3 uColorStart;
  uniform vec3 uColorEnd;
  uniform float uBaseOpacity;
  uniform float uEnableGradient;
  varying float vOpacity;
  varying float vTrailIndex;
  varying float vGlow;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Soft circular gradient with glowing core
    float coreFalloff = 1.0 - smoothstep(0.0, 0.25, dist);
    float outerFalloff = 1.0 - smoothstep(0.15, 0.5, dist);
    
    // Combine for soft glow effect
    float intensity = mix(outerFalloff, coreFalloff, vGlow * 0.5);
    
    // Color gradient from start to end based on trail position
    vec3 baseColor = mix(uColorStart, uColorEnd, vTrailIndex * uEnableGradient);
    
    // Add glow boost for newer trails
    vec3 glowColor = baseColor + vec3(0.15, 0.1, 0.05) * vGlow;
    
    // Smooth exponential opacity falloff
    float trailFade = pow(vOpacity, 0.7);
    float alpha = intensity * trailFade * uBaseOpacity * 0.85;
    
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

// Optimized particle trails - single buffer, no React re-renders
const OptimizedParticleTrails = memo(({ 
  particleCount,
  trailLength, 
  trailOpacity, 
  colorStart,
  colorEnd,
  enableGradient,
  geometryRef
}: { 
  particleCount: number;
  trailLength: number;
  trailOpacity: number;
  colorStart: THREE.Color;
  colorEnd: THREE.Color;
  enableGradient: boolean;
  geometryRef: React.MutableRefObject<THREE.BufferGeometry | null>;
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Pre-allocate single geometry for all trails
  const geometry = useMemo(() => {
    const totalParticles = particleCount * trailLength;
    const positions = new Float32Array(totalParticles * 3);
    const indices = new Float32Array(totalParticles);
    const opacityArray = new Float32Array(totalParticles);
    const randomSizes = new Float32Array(totalParticles);
    
    // Initialize attributes with smooth exponential fade
    for (let trail = 0; trail < trailLength; trail++) {
      const trailProgress = trail / trailLength;
      // Exponential fade for more natural trail appearance
      const fadeOpacity = Math.pow(1 - trailProgress, 1.5);
      
      for (let i = 0; i < particleCount; i++) {
        const idx = trail * particleCount + i;
        indices[idx] = trailProgress;
        opacityArray[idx] = fadeOpacity;
        randomSizes[idx] = Math.random();
      }
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('trailIndex', new THREE.BufferAttribute(indices, 1));
    geo.setAttribute('opacity', new THREE.BufferAttribute(opacityArray, 1));
    geo.setAttribute('randomSize', new THREE.BufferAttribute(randomSizes, 1));
    
    return geo;
  }, [particleCount, trailLength]);

  // Store geometry ref for parent to update positions directly
  useEffect(() => {
    geometryRef.current = geometry;
    return () => { geometryRef.current = null; };
  }, [geometry, geometryRef]);

  // Shader material - created once
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: trailVertexShader,
      fragmentShader: trailFragmentShader,
      uniforms: {
        uColorStart: { value: colorStart.clone() },
        uColorEnd: { value: colorEnd.clone() },
        uBaseOpacity: { value: trailOpacity },
        uEnableGradient: { value: enableGradient ? 1.0 : 0.0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, []);

  // Update color and opacity uniforms
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColorStart.value.lerp(colorStart, 0.1);
      materialRef.current.uniforms.uColorEnd.value.lerp(colorEnd, 0.1);
      materialRef.current.uniforms.uBaseOpacity.value = trailOpacity;
      materialRef.current.uniforms.uEnableGradient.value = enableGradient ? 1.0 : 0.0;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
});

OptimizedParticleTrails.displayName = 'OptimizedParticleTrails';

// Core particle system - dense inner particles with independent behavior
const CoreParticleSystem = memo(({
  state,
  audioLevel,
  morphProgress,
  coreParticleCount = 400,
  coreDensity = 0.25,
  coreParticleSize = 0.04,
  coreIntensity = 1.2,
  corePulseSpeed = 1.5,
  coreRotationOffset = -0.5,
  circleTexture
}: {
  state: WakeWordState;
  audioLevel: number;
  morphProgress: number;
  coreParticleCount?: number;
  coreDensity?: number;
  coreParticleSize?: number;
  coreIntensity?: number;
  corePulseSpeed?: number;
  coreRotationOffset?: number;
  circleTexture: THREE.CanvasTexture;
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const timeRef = useRef(0);
  const currentColorRef = useRef(new THREE.Color());
  
  const config = STATE_CONFIGS[state];
  
  // Generate core particle positions - using same morphing logic as main particles for consistency
  const { geometry, spherePositions, scatteredPositions, particleOffsets } = useMemo(() => {
    const count = coreParticleCount;
    const sphere = new Float32Array(count * 3);
    const scattered = new Float32Array(count * 3);
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Use consistent theta/phi for both states so particles follow same path
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Sphere state - dense core with exponential distribution
      const baseR = Math.pow(Math.random(), 0.5);
      const sphereR = baseR * coreDensity * 1.5;
      
      sphere[i3] = sphereR * Math.sin(phi) * Math.cos(theta);
      sphere[i3 + 1] = sphereR * Math.sin(phi) * Math.sin(theta);
      sphere[i3 + 2] = sphereR * Math.cos(phi);
      
      // Scattered state - same direction, larger radius for consistent morphing path
      const scatterR = (1.5 + Math.random() * 1.5) * coreDensity;
      scattered[i3] = scatterR * Math.sin(phi) * Math.cos(theta);
      scattered[i3 + 1] = scatterR * Math.sin(phi) * Math.sin(theta);
      scattered[i3 + 2] = scatterR * Math.cos(phi);
      
      positions[i3] = sphere[i3];
      positions[i3 + 1] = sphere[i3 + 1];
      positions[i3 + 2] = sphere[i3 + 2];
      
      // Same offset logic as main particles
      offsets[i] = Math.random() * 0.4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geometry: geo, spherePositions: sphere, scatteredPositions: scattered, particleOffsets: offsets };
  }, [coreParticleCount, coreDensity]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    
    if (pointsRef.current && geometry) {
      const positions = geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;
      const time = timeRef.current;
      
      // Core uses same morphing logic as main particles for consistency
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // Use same offset-based timing as main particles
        const particleOffset = particleOffsets[i];
        const adjustedMorph = easeInOutCubic(
          Math.max(0, Math.min(1, morphProgress * (1 + particleOffset) - particleOffset * 0.5))
        );
        
        // Base interpolated position along consistent path
        let px = scatteredPositions[i3] + (spherePositions[i3] - scatteredPositions[i3]) * adjustedMorph;
        let py = scatteredPositions[i3 + 1] + (spherePositions[i3 + 1] - scatteredPositions[i3 + 1]) * adjustedMorph;
        let pz = scatteredPositions[i3 + 2] + (spherePositions[i3 + 2] - scatteredPositions[i3 + 2]) * adjustedMorph;
        
        // Core-specific turbulence - faster, smaller scale
        const turbTime = time * 2;
        const nx = noise3D(px * 3 + turbTime, py * 3, pz * 3, 1.5) * 0.02;
        const ny = noise3D(px * 3, py * 3 + turbTime, pz * 3, 1.5) * 0.02;
        const nz = noise3D(px * 3, py * 3, pz * 3 + turbTime, 1.5) * 0.02;
        
        positions[i3] = px + nx;
        positions[i3 + 1] = py + ny;
        positions[i3 + 2] = pz + nz;
      }
      geometry.attributes.position.needsUpdate = true;
      
      // Counter-rotate core
      pointsRef.current.rotation.y += delta * coreRotationOffset;
      pointsRef.current.rotation.z += delta * 0.1;
      
      // Core pulse - independent rhythm
      const corePulse = 1 + Math.sin(time * corePulseSpeed * 2) * 0.1 + audioLevel * 0.2;
      pointsRef.current.scale.setScalar(corePulse);
    }
    
    if (materialRef.current) {
      currentColorRef.current.lerp(config.core, 0.1);
      materialRef.current.color.copy(currentColorRef.current);
      // Intensity affects opacity
      materialRef.current.opacity = 0.6 + audioLevel * 0.3 * coreIntensity;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        size={coreParticleSize}
        sizeAttenuation={true}
        color={config.core}
        map={circleTexture}
        alphaTest={0.01}
        transparent
        opacity={0.7 * coreIntensity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
});

CoreParticleSystem.displayName = 'CoreParticleSystem';

// Main particle system
const ParticleSystem = memo(({ 
  state, 
  audioLevel, 
  morphProgress, 
  enableTrails = true, 
  trailLength = 6,
  trailOpacity = 0.5,
  trailColorGradient = false,
  trailStartColor = '#ffffff',
  trailEndColor = '#1a1a2e',
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
  enableCore = true,
  coreParticleCount = 400,
  coreDensity = 0.25,
  coreParticleSize = 0.04,
  coreIntensity = 1.2,
  corePulseSpeed = 1.5,
  coreRotationOffset = -0.5,
  fluidCohesion = 0,
  surfaceTension = 0.5,
  fluidFlow = 0.3,
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
  
  // Trail history - stores final rendered positions (optimized)
  const trailHistoryRef = useRef<Float32Array[]>([]);
  const trailGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  
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
      
      // Use same theta/phi for both states so particles morph along consistent paths
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Sphere state - tight formation
      const sphereR = (1.8 * density) + (Math.random() - 0.5) * 0.4 * density;
      sphere[i3] = sphereR * Math.sin(phi) * Math.cos(theta);
      sphere[i3 + 1] = sphereR * Math.sin(phi) * Math.sin(theta);
      sphere[i3 + 2] = sphereR * Math.cos(phi);
      
      // Scattered state - same direction, larger radius for consistent morphing path
      const scatterR = (3 + Math.random() * 3) * density;
      scattered[i3] = scatterR * Math.sin(phi) * Math.cos(theta);
      scattered[i3 + 1] = scatterR * Math.sin(phi) * Math.sin(theta);
      scattered[i3 + 2] = scatterR * Math.cos(phi);
      
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
      
      // Target radius for fluid cohesion (when cohesion is high, all particles aim for same radius)
      const baseRadius = 1.8 * density;
      
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
        
        // Apply fluid cohesion - push particles toward uniform radius
        if (fluidCohesion > 0) {
          const currentDist = Math.sqrt(px * px + py * py + pz * pz);
          if (currentDist > 0.01) {
            // Normalize to unit sphere direction
            const nx = px / currentDist;
            const ny = py / currentDist;
            const nz = pz / currentDist;
            
            // Target radius with reduced variation based on cohesion
            const radiusVariation = (1 - fluidCohesion) * 0.4;
            const targetRadius = baseRadius + (particleOffset - 0.2) * radiusVariation * baseRadius;
            
            // Surface tension pulls toward target radius
            const radiusDiff = targetRadius - currentDist;
            const tensionForce = radiusDiff * surfaceTension * fluidCohesion;
            
            px += nx * tensionForce;
            py += ny * tensionForce;
            pz += nz * tensionForce;
            
            // Fluid flow - particles glide along surface
            if (fluidFlow > 0 && fluidCohesion > 0.3) {
              const flowSpeed = fluidFlow * fluidCohesion * 0.02;
              const flowAngle = time * flowSpeed + particleOffset * Math.PI * 2;
              
              // Tangent direction for flow (perpendicular to normal)
              const tangentX = -ny * Math.cos(flowAngle) + (-nx * nz) * Math.sin(flowAngle);
              const tangentY = nx * Math.cos(flowAngle) + (-ny * nz) * Math.sin(flowAngle);
              const tangentZ = (nx * nx + ny * ny) * Math.sin(flowAngle);
              
              const flowMagnitude = flowSpeed * currentDist;
              px += tangentX * flowMagnitude;
              py += tangentY * flowMagnitude;
              pz += tangentZ * flowMagnitude;
            }
          }
        }
        
        // Apply Perlin noise turbulence (reduced when cohesion is high)
        if (enableTurbulence) {
          const turbulenceScale = 1 - fluidCohesion * 0.7; // Reduce turbulence with cohesion
          const noiseTime = time * turbulenceSpeed;
          const nx = noise3D(px + noiseTime, py, pz, turbulenceFrequency) * turbulenceAmplitude * turbulenceScale;
          const ny = noise3D(px, py + noiseTime, pz, turbulenceFrequency) * turbulenceAmplitude * turbulenceScale;
          const nz = noise3D(px, py, pz + noiseTime, turbulenceFrequency) * turbulenceAmplitude * turbulenceScale;
          
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
      
      // Store trail positions - copy final rendered positions (optimized: no re-morph needed)
      if (enableTrails && frameCountRef.current % 5 === 0) {
        // Create snapshot of current rendered positions with transform applied
        const snapshot = new Float32Array(count * 3);
        const quaternion = new THREE.Quaternion().setFromEuler(pointsRef.current.rotation);
        const tempVec = new THREE.Vector3();
        
        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          tempVec.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
          tempVec.applyQuaternion(quaternion);
          tempVec.multiplyScalar(pulse);
          snapshot[i3] = tempVec.x;
          snapshot[i3 + 1] = tempVec.y;
          snapshot[i3 + 2] = tempVec.z;
        }
        
        trailHistoryRef.current.unshift(snapshot);
        if (trailHistoryRef.current.length > trailLength) {
          trailHistoryRef.current.pop();
        }
        
        // Update trail geometry directly (no React re-render)
        if (trailGeometryRef.current) {
          const trailPositions = trailGeometryRef.current.attributes.position.array as Float32Array;
          for (let trail = 0; trail < trailLength; trail++) {
            const historyFrame = trailHistoryRef.current[trail];
            if (!historyFrame) continue;
            const offset = trail * count * 3;
            for (let i = 0; i < count * 3; i++) {
              trailPositions[offset + i] = historyFrame[i];
            }
          }
          trailGeometryRef.current.attributes.position.needsUpdate = true;
        }
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
      
      {/* Optimized particle trails */}
      {enableTrails && (
        <OptimizedParticleTrails
          particleCount={particleCount}
          trailLength={trailLength}
          trailOpacity={trailOpacity}
          colorStart={trailColorGradient ? new THREE.Color(trailStartColor) : config.secondary}
          colorEnd={trailColorGradient ? new THREE.Color(trailEndColor) : config.secondary}
          enableGradient={trailColorGradient}
          geometryRef={trailGeometryRef}
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

      {/* Particle-based core system */}
      {enableCore && (
        <CoreParticleSystem
          state={state}
          audioLevel={audioLevel}
          morphProgress={currentMorphRef.current}
          coreParticleCount={coreParticleCount}
          coreDensity={coreDensity}
          coreParticleSize={coreParticleSize}
          coreIntensity={coreIntensity}
          corePulseSpeed={corePulseSpeed}
          coreRotationOffset={coreRotationOffset}
          circleTexture={circleTexture}
        />
      )}
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

// Edge glow removed - glow effect is now applied directly to particles via bloom

// Bloom wrapper component
const BloomEffect = memo(({ intensity }: { intensity: number }) => (
  <EffectComposer>
    <Bloom
      intensity={intensity}
      luminanceThreshold={0.15}
      luminanceSmoothing={0.95}
      radius={1.0}
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
  mouseInfluenceRadius = 2.5,
  enableCore = true,
  coreParticleCount = 400,
  coreDensity = 0.25,
  coreParticleSize = 0.04,
  coreIntensity = 1.2,
  corePulseSpeed = 1.5,
  coreRotationOffset = -0.5,
  fluidCohesion = 0,
  surfaceTension = 0.5,
  fluidFlow = 0.3
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
          enableCore={enableCore}
          coreParticleCount={coreParticleCount}
          coreDensity={coreDensity}
          coreParticleSize={coreParticleSize}
          coreIntensity={coreIntensity}
          corePulseSpeed={corePulseSpeed}
          coreRotationOffset={coreRotationOffset}
          fluidCohesion={fluidCohesion}
          surfaceTension={surfaceTension}
          fluidFlow={fluidFlow}
          mousePosition={mousePositionRef}
        />
        
        {enableBloom && <BloomEffect intensity={bloomIntensity} />}
      </Canvas>
    </div>
  );
}));

AtlasCoreFixed.displayName = 'AtlasCoreFixed';

export default AtlasCoreFixed;
