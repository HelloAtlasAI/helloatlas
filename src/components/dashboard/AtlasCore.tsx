import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { WakeWordState } from '@/hooks/useWakeWord';

interface AtlasCoreProps {
  state: WakeWordState;
  audioLevel: number;
  morphProgress?: number;
}

// Vertex shader for particles
const particleVertexShader = `
  uniform float uTime;
  uniform float uMorphProgress;
  uniform float uAudioLevel;
  uniform float uStateIntensity;
  
  attribute float aSize;
  attribute float aRandom;
  attribute vec3 aScatteredPosition;
  
  varying float vAlpha;
  varying float vRandom;
  varying vec3 vColor;
  
  void main() {
    vRandom = aRandom;
    
    // Scattered wave position
    vec3 scattered = aScatteredPosition;
    scattered.x += sin(scattered.y * 2.0 + uTime * 0.5) * 1.5;
    scattered.z += cos(scattered.x * 2.0 + uTime * 0.3) * 1.5;
    scattered.y += sin(uTime * 0.2 + aRandom * 6.28) * 0.5;
    
    // Sphere position
    vec3 spherePos = normalize(position) * 2.0;
    
    // Audio-reactive displacement
    float audioDisplacement = uAudioLevel * 0.5 * sin(aRandom * 6.28 + uTime * 3.0);
    spherePos += normalize(position) * audioDisplacement;
    
    // Morph between scattered and sphere
    vec3 finalPos = mix(scattered, spherePos, uMorphProgress);
    
    // State-based rotation
    float angle = uTime * (0.1 + uStateIntensity * 0.3);
    mat3 rotY = mat3(
      cos(angle), 0.0, sin(angle),
      0.0, 1.0, 0.0,
      -sin(angle), 0.0, cos(angle)
    );
    finalPos = rotY * finalPos;
    
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    
    // Size based on distance and state
    float size = aSize * (1.0 + uAudioLevel * 0.5 + uStateIntensity * 0.3);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    
    gl_Position = projectionMatrix * mvPosition;
    
    // Alpha based on morph progress and state
    vAlpha = 0.3 + uMorphProgress * 0.5 + uStateIntensity * 0.2;
    
    // Color gradient based on position
    float heightFactor = (finalPos.y + 2.0) / 4.0;
    vColor = mix(
      vec3(1.0, 0.3, 0.0),  // Orange/red
      vec3(1.0, 0.8, 0.2),  // Gold
      heightFactor
    );
  }
`;

// Fragment shader for particles
const particleFragmentShader = `
  varying float vAlpha;
  varying float vRandom;
  varying vec3 vColor;
  
  void main() {
    // Circular particle with soft edges
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
    
    // Add glow
    vec3 glowColor = vColor + vec3(0.2, 0.1, 0.0) * (1.0 - dist * 2.0);
    
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

// Lattice wireframe shader
const latticeVertexShader = `
  uniform float uTime;
  uniform float uStateIntensity;
  
  varying float vEdgeFactor;
  
  void main() {
    vec3 pos = position;
    
    // Rotate independently
    float angle = uTime * 0.15;
    mat3 rotY = mat3(
      cos(angle), 0.0, sin(angle),
      0.0, 1.0, 0.0,
      -sin(angle), 0.0, cos(angle)
    );
    pos = rotY * pos;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    vEdgeFactor = 1.0;
  }
`;

const latticeFragmentShader = `
  uniform float uStateIntensity;
  uniform vec3 uLatticeColor;
  
  varying float vEdgeFactor;
  
  void main() {
    float alpha = 0.1 + uStateIntensity * 0.4;
    gl_FragColor = vec4(uLatticeColor, alpha * vEdgeFactor);
  }
`;

// Get state configuration
const getStateConfig = (state: WakeWordState) => {
  const configs: Record<WakeWordState, { morph: number; intensity: number; color: [number, number, number]; latticeColor: [number, number, number] }> = {
    dormant: { morph: 0.2, intensity: 0.1, color: [1.0, 0.6, 0.2], latticeColor: [1.0, 0.5, 0.2] },
    passive: { morph: 0.4, intensity: 0.2, color: [1.0, 0.5, 0.1], latticeColor: [1.0, 0.6, 0.3] },
    activated: { morph: 1.0, intensity: 0.8, color: [1.0, 0.8, 0.3], latticeColor: [1.0, 0.9, 0.5] },
    listening: { morph: 1.0, intensity: 0.6, color: [0.3, 0.8, 1.0], latticeColor: [0.4, 0.9, 1.0] },
    thinking: { morph: 1.0, intensity: 0.9, color: [0.7, 0.4, 1.0], latticeColor: [0.8, 0.5, 1.0] },
    speaking: { morph: 1.0, intensity: 0.7, color: [1.0, 0.85, 0.4], latticeColor: [1.0, 0.9, 0.6] },
  };
  return configs[state];
};

// Main particle system component
const ParticleSystem = ({ state, audioLevel, morphProgress }: AtlasCoreProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const latticeRef = useRef<THREE.LineSegments>(null);
  const latticeMaterialRef = useRef<THREE.ShaderMaterial>(null);
  
  const config = getStateConfig(state);
  const targetMorph = morphProgress !== undefined ? morphProgress : config.morph;

  // Generate particle geometry
  const { geometry, latticeGeometry } = useMemo(() => {
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const scatteredPositions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.0 + (Math.random() - 0.5) * 0.3;
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      // Scattered positions (wave-like distribution)
      scatteredPositions[i3] = (Math.random() - 0.5) * 8;
      scatteredPositions[i3 + 1] = (Math.random() - 0.5) * 6;
      scatteredPositions[i3 + 2] = (Math.random() - 0.5) * 8;
      
      sizes[i] = Math.random() * 15 + 5;
      randoms[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aScatteredPosition', new THREE.BufferAttribute(scatteredPositions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

    // Create icosahedron lattice
    const icosahedron = new THREE.IcosahedronGeometry(1.8, 1);
    const latticeGeo = new THREE.EdgesGeometry(icosahedron);

    return { geometry: geo, latticeGeometry: latticeGeo };
  }, []);

  // Animation loop
  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      
      // Smooth transitions
      const currentMorph = materialRef.current.uniforms.uMorphProgress.value;
      materialRef.current.uniforms.uMorphProgress.value += (targetMorph - currentMorph) * 0.05;
      
      const currentIntensity = materialRef.current.uniforms.uStateIntensity.value;
      materialRef.current.uniforms.uStateIntensity.value += (config.intensity - currentIntensity) * 0.08;
      
      materialRef.current.uniforms.uAudioLevel.value = audioLevel;
    }

    if (latticeMaterialRef.current) {
      latticeMaterialRef.current.uniforms.uTime.value += delta;
      latticeMaterialRef.current.uniforms.uStateIntensity.value = config.intensity;
      latticeMaterialRef.current.uniforms.uLatticeColor.value.set(...config.latticeColor);
    }
  });

  return (
    <group>
      {/* Lattice wireframe */}
      <lineSegments ref={latticeRef} geometry={latticeGeometry}>
        <shaderMaterial
          ref={latticeMaterialRef}
          vertexShader={latticeVertexShader}
          fragmentShader={latticeFragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={{
            uTime: { value: 0 },
            uStateIntensity: { value: config.intensity },
            uLatticeColor: { value: new THREE.Vector3(...config.latticeColor) },
          }}
        />
      </lineSegments>

      {/* Main particle field */}
      <points ref={pointsRef} geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={particleVertexShader}
          fragmentShader={particleFragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={{
            uTime: { value: 0 },
            uMorphProgress: { value: targetMorph },
            uAudioLevel: { value: audioLevel },
            uStateIntensity: { value: config.intensity },
          }}
        />
      </points>

      {/* Core glow */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial
          color={new THREE.Color(...config.color)}
          transparent
          opacity={0.15 + audioLevel * 0.2 + config.intensity * 0.1}
        />
      </mesh>
    </group>
  );
};

// Main exported component
export const AtlasCore = ({ state, audioLevel, morphProgress }: AtlasCoreProps) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.2} />
        <ParticleSystem state={state} audioLevel={audioLevel} morphProgress={morphProgress} />
        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            radius={0.8}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
