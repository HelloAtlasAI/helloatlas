import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AtmosphericFogProps {
  density?: number;
  color?: string;
  speed?: number;
  layers?: number;
}

export const AtmosphericFog = ({
  density = 0.3,
  color = '#8899aa',
  speed = 0.1,
  layers = 3
}: AtmosphericFogProps) => {
  const groupRef = useRef<THREE.Group>(null);

  const fogLayers = useMemo(() => {
    return Array.from({ length: layers }, (_, i) => ({
      z: -5 - i * 3,
      y: -1 + i * 0.5,
      opacity: density * (1 - i * 0.2),
      speed: speed * (1 + i * 0.3),
      scale: 1 + i * 0.5
    }));
  }, [layers, density, speed]);

  const fogMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: density },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        // Simplex noise for organic movement
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        
        void main() {
          // Multi-layer noise for organic fog
          float noise1 = snoise(vUv * 2.0 + uTime * 0.1) * 0.5 + 0.5;
          float noise2 = snoise(vUv * 4.0 - uTime * 0.05) * 0.5 + 0.5;
          float noise3 = snoise(vUv * 8.0 + uTime * 0.02) * 0.5 + 0.5;
          
          float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
          
          // Vertical gradient - more fog at bottom
          float verticalGradient = 1.0 - pow(vUv.y, 0.5);
          
          // Horizontal variation
          float horizontalVariation = sin(vUv.x * 3.14159) * 0.3 + 0.7;
          
          float alpha = uOpacity * combinedNoise * verticalGradient * horizontalVariation;
          
          // Soft edges
          float edgeFade = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
          alpha *= edgeFade;
          
          gl_FragColor = vec4(uColor, alpha * 0.6);
        }
      `
    });
  }, [color, density]);

  useFrame((state) => {
    if (!groupRef.current) return;
    fogMaterial.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group ref={groupRef}>
      {fogLayers.map((layer, i) => (
        <mesh
          key={i}
          position={[0, layer.y, layer.z]}
          scale={[25 * layer.scale, 8, 1]}
          material={fogMaterial}
        >
          <planeGeometry args={[1, 1, 32, 32]} />
        </mesh>
      ))}
    </group>
  );
};
