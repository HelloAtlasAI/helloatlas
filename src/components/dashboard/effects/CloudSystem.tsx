import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CloudSystemProps {
  count?: number;
  coverage?: number;
  speed?: number;
  darkness?: number;
}

interface CloudCluster {
  position: [number, number, number];
  scale: number;
  speed: number;
  phase: number;
  spheres: Array<{
    offset: [number, number, number];
    scale: number;
    opacity: number;
  }>;
}

export const CloudSystem = ({ 
  count = 8, 
  coverage = 0.5, 
  speed = 0.3,
  darkness = 0.2 
}: CloudSystemProps) => {
  const groupRef = useRef<THREE.Group>(null);

  // Generate cloud clusters with multiple overlapping spheres for volumetric effect
  const cloudClusters = useMemo<CloudCluster[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const sphereCount = 5 + Math.floor(Math.random() * 4);
      const spheres = Array.from({ length: sphereCount }, () => ({
        offset: [
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 1.5
        ] as [number, number, number],
        scale: 0.6 + Math.random() * 0.8,
        opacity: 0.3 + Math.random() * 0.4
      }));

      return {
        position: [
          (Math.random() - 0.5) * 20,
          3 + Math.random() * 4,
          -5 - Math.random() * 10
        ] as [number, number, number],
        scale: 1.5 + Math.random() * 2,
        speed: 0.1 + Math.random() * speed,
        phase: Math.random() * Math.PI * 2,
        spheres
      };
    });
  }, [count, speed]);

  // Soft cloud material with gradient edges
  const cloudMaterial = useMemo(() => {
    const baseColor = new THREE.Color().setHSL(0, 0, 1 - darkness * 0.3);
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: baseColor },
        uOpacity: { value: coverage * 0.6 },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        // Simplex noise for wispy edges
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
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
        
        void main() {
          // Soft edge falloff based on view angle
          float edgeFalloff = pow(abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 0.5);
          
          // Add noise for wispy edges
          float noise = snoise(vPosition * 0.5 + uTime * 0.1) * 0.3 + 0.7;
          
          // Gradient from center to edge
          float centerFalloff = 1.0 - length(vPosition) * 0.3;
          centerFalloff = clamp(centerFalloff, 0.0, 1.0);
          
          float alpha = uOpacity * edgeFalloff * noise * centerFalloff;
          
          // Subtle color variation
          vec3 finalColor = uColor + vec3(noise * 0.05);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `
    });
  }, [darkness, coverage]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime;
    cloudMaterial.uniforms.uTime.value = time;

    groupRef.current.children.forEach((cluster, i) => {
      const data = cloudClusters[i];
      if (!data) return;

      // Horizontal drift
      cluster.position.x = data.position[0] + Math.sin(time * data.speed + data.phase) * 0.5;
      cluster.position.x += time * data.speed * 0.1;

      // Wrap around
      if (cluster.position.x > 15) {
        cluster.position.x = -15;
      }

      // Gentle vertical bob
      cluster.position.y = data.position[1] + Math.sin(time * 0.2 + data.phase) * 0.3;
    });
  });

  return (
    <group ref={groupRef}>
      {cloudClusters.map((cluster, i) => (
        <group
          key={i}
          position={cluster.position}
          scale={cluster.scale}
        >
          {cluster.spheres.map((sphere, j) => (
            <mesh
              key={j}
              position={sphere.offset}
              scale={sphere.scale}
              material={cloudMaterial}
            >
              <sphereGeometry args={[1, 16, 16]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};
