import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RainParticlesProps {
  count?: number;
  intensity?: number;
  speed?: number;
  color?: string;
}

export const RainParticles = ({ 
  count = 800, 
  intensity = 1, 
  speed = 1,
  color = '#a8c8e8'
}: RainParticlesProps) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate particle data
  const { positions, velocities, sizes, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread across viewport
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = Math.random() * 15 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;

      // Varied fall speeds for depth
      velocities[i] = 8 + Math.random() * 6;
      
      // Larger drops in foreground, smaller in back
      const depth = (positions[i * 3 + 2] + 10) / 20;
      sizes[i] = (0.02 + Math.random() * 0.03) * (0.5 + depth * 0.5);
      
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, velocities, sizes, phases };
  }, [count]);

  // Shader material for realistic raindrops
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: intensity * 0.4 },
        uTime: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float velocity;
        attribute float phase;
        
        varying float vVelocity;
        varying float vDepth;
        varying float vPhase;
        
        void main() {
          vVelocity = velocity;
          vPhase = phase;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vDepth = -mvPosition.z;
          
          // Size attenuation with depth
          float depthScale = 300.0 / -mvPosition.z;
          gl_PointSize = size * depthScale * 100.0;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        
        varying float vVelocity;
        varying float vDepth;
        varying float vPhase;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          
          // Elongated raindrop shape with motion blur
          float stretchFactor = 2.5 + vVelocity * 0.1;
          center.y *= stretchFactor;
          
          float dist = length(center);
          
          // Soft edges with Gaussian-like falloff
          float alpha = exp(-dist * dist * 8.0);
          
          // Motion blur fade at edges
          float motionBlur = 1.0 - abs(center.y) * 0.5;
          alpha *= motionBlur;
          
          // Depth-based atmospheric fade
          float atmosphericFade = clamp(1.0 - vDepth * 0.03, 0.3, 1.0);
          alpha *= atmosphericFade;
          
          // Subtle shimmer
          float shimmer = 0.9 + sin(uTime * 10.0 + vPhase) * 0.1;
          
          // Color with slight blue tint variation
          vec3 finalColor = uColor * (0.9 + vDepth * 0.01);
          
          gl_FragColor = vec4(finalColor, alpha * uOpacity * shimmer);
        }
      `
    });
  }, [color, intensity]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const time = state.clock.elapsedTime;
    shaderMaterial.uniforms.uTime.value = time;

    const positionArray = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Fall with velocity and speed multiplier
      positionArray[i * 3 + 1] -= velocities[i] * delta * speed * intensity;

      // Slight horizontal drift for realism
      positionArray[i * 3] += Math.sin(time + phases[i]) * 0.01;

      // Reset when below ground
      if (positionArray[i * 3 + 1] < -3) {
        positionArray[i * 3] = (Math.random() - 0.5) * 25;
        positionArray[i * 3 + 1] = 12 + Math.random() * 3;
        positionArray[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} material={shaderMaterial}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-velocity"
          count={count}
          array={velocities}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-phase"
          count={count}
          array={phases}
          itemSize={1}
        />
      </bufferGeometry>
    </points>
  );
};
