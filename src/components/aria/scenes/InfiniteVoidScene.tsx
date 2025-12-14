import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface InfiniteVoidSceneProps {
  state: AIState;
  audioLevel?: number;
}

// Raymarched singularity with gravitational lensing
const SingularityCore = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_audioLevel: { value: 0 },
    u_state: { value: 0 },
    u_resolution: { value: new THREE.Vector2(1, 1) },
  }), []);

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float u_time;
    uniform float u_audioLevel;
    uniform float u_state;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    // 4D Simplex noise
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    float permute(float x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float taylorInvSqrt(float r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    vec4 grad4(float j, vec4 ip) {
      const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
      vec4 p,s;
      p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
      p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
      s = vec4(lessThan(p, vec4(0.0)));
      p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;
      return p;
    }
    
    float snoise(vec4 v) {
      const vec4 C = vec4( 0.138196601125011, 0.276393202250021, 0.414589803375032, -0.447213595499958);
      vec4 i  = floor(v + dot(v, vec4(.309016994374947451)) );
      vec4 x0 = v -   i + dot(i, C.xxxx);
      vec4 i0;
      vec3 isX = step( x0.yzw, x0.xxx );
      vec3 isYZ = step( x0.zww, x0.yyz );
      i0.x = isX.x + isX.y + isX.z;
      i0.yzw = 1.0 - isX;
      i0.y += isYZ.x + isYZ.y;
      i0.zw += 1.0 - isYZ.xy;
      i0.z += isYZ.z;
      i0.w += 1.0 - isYZ.z;
      vec4 i3 = clamp( i0, 0.0, 1.0 );
      vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
      vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );
      vec4 x1 = x0 - i1 + C.xxxx;
      vec4 x2 = x0 - i2 + C.yyyy;
      vec4 x3 = x0 - i3 + C.zzzz;
      vec4 x4 = x0 + C.wwww;
      i = mod289(i);
      float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
      vec4 j1 = permute( permute( permute( permute (
                i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
              + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
              + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
              + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
      vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;
      vec4 p0 = grad4(j0,   ip);
      vec4 p1 = grad4(j1.x, ip);
      vec4 p2 = grad4(j1.y, ip);
      vec4 p3 = grad4(j1.z, ip);
      vec4 p4 = grad4(j1.w, ip);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      p4 *= taylorInvSqrt(dot(p4,p4));
      vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
      vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
      m0 = m0 * m0;
      m1 = m1 * m1;
      return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
                   + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) );
    }
    
    float fbm(vec4 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 6; i++) {
        value += amplitude * snoise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    void main() {
      vec2 uv = vUv * 2.0 - 1.0;
      float dist = length(uv);
      
      // Event horizon effect
      float eventHorizon = smoothstep(0.8, 0.2, dist);
      
      // Gravitational lensing distortion
      vec2 distortedUv = uv * (1.0 + 0.3 * sin(dist * 10.0 - u_time * 2.0) * eventHorizon);
      
      // 4D noise for the singularity
      float noise = fbm(vec4(distortedUv * 3.0, u_time * 0.3, u_audioLevel * 2.0));
      
      // Core color - from deep purple to white hot
      vec3 deepVoid = vec3(0.05, 0.0, 0.15);
      vec3 eventColor = vec3(0.2, 0.0, 0.5);
      vec3 accretion = vec3(0.0, 0.6, 1.0);
      vec3 whiteHot = vec3(1.0, 0.95, 0.9);
      
      // Layer colors based on distance and noise
      float coreIntensity = smoothstep(0.5, 0.0, dist) * (1.0 + u_audioLevel * 0.5);
      float ringIntensity = smoothstep(0.3, 0.5, dist) * smoothstep(0.7, 0.5, dist);
      
      vec3 color = deepVoid;
      color = mix(color, eventColor, eventHorizon * 0.8);
      color = mix(color, accretion, ringIntensity * (0.5 + noise * 0.5));
      color = mix(color, whiteHot, coreIntensity * (0.8 + noise * 0.2));
      
      // Accretion disk glow
      float diskAngle = atan(uv.y, uv.x);
      float diskNoise = sin(diskAngle * 8.0 + u_time * 3.0 + noise * 5.0);
      color += accretion * diskNoise * ringIntensity * 0.4;
      
      // Pulsing based on audio
      color *= 1.0 + u_audioLevel * 0.3;
      
      // State-based intensity
      float stateMultiplier = 1.0 + u_state * 0.2;
      color *= stateMultiplier;
      
      // Alpha for the event horizon fade
      float alpha = smoothstep(1.0, 0.3, dist);
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value += delta;
      materialRef.current.uniforms.u_audioLevel.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.u_audioLevel.value,
        audioLevel,
        0.1
      );
      
      const stateValue = state === "idle" ? 0 : state === "listening" ? 1 : state === "thinking" ? 2 : 3;
      materialRef.current.uniforms.u_state.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.u_state.value,
        stateValue,
        0.05
      );
    }
    
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 0.1;
      const scale = 1 + audioLevel * 0.15;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// GPU-instanced accretion disk particles
const AccretionDisk = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleCount = 4000;

  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.8 + Math.random() * 2.5;
      const height = (Math.random() - 0.5) * 0.15;
      
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      
      velocities[i] = 0.3 + Math.random() * 0.5;
      
      // Color based on distance - blue outer, white inner
      const t = (radius - 1.8) / 2.5;
      colors[i * 3] = 0.2 + (1 - t) * 0.8;
      colors[i * 3 + 1] = 0.6 + (1 - t) * 0.4;
      colors[i * 3 + 2] = 1.0;
    }

    return { positions, velocities, colors };
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    
    const speedMultiplier = state === "speaking" ? 2 : state === "thinking" ? 1.5 : 1;

    for (let i = 0; i < particleCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      
      const radius = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x) + delta * velocities[i] * speedMultiplier / radius;
      
      // Spiral inward slowly
      const newRadius = Math.max(1.6, radius - delta * 0.02);
      
      positions[i * 3] = Math.cos(angle) * newRadius;
      positions[i * 3 + 2] = Math.sin(angle) * newRadius;
      
      // Reset particles that get too close
      if (newRadius < 1.7) {
        const resetAngle = Math.random() * Math.PI * 2;
        const resetRadius = 3.5 + Math.random() * 0.8;
        positions[i * 3] = Math.cos(resetAngle) * resetRadius;
        positions[i * 3 + 2] = Math.sin(resetAngle) * resetRadius;
      }
      
      position.set(positions[i * 3], y, positions[i * 3 + 2]);
      
      const particleScale = 0.015 + (1 - (newRadius - 1.6) / 2.5) * 0.02 + audioLevel * 0.01;
      scale.setScalar(particleScale);
      
      matrix.compose(position, rotation, scale);
      meshRef.current.setMatrixAt(i, matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#00aaff" transparent opacity={0.9} />
    </instancedMesh>
  );
};

// Gravitational waves
const GravitationalWaves = ({ audioLevel = 0 }: { audioLevel: number }) => {
  const ringsRef = useRef<THREE.Group>(null);
  const ringCount = 5;

  useFrame((clock) => {
    if (!ringsRef.current) return;
    
    const time = clock.getElapsedTime();
    
    ringsRef.current.children.forEach((ring, i) => {
      const mesh = ring as THREE.Mesh;
      const phase = (time * 0.5 + i * 0.4) % 3;
      const scale = 2 + phase * 2;
      mesh.scale.setScalar(scale);
      (mesh.material as THREE.MeshBasicMaterial).opacity = (1 - phase / 3) * (0.15 + audioLevel * 0.1);
    });
  });

  return (
    <group ref={ringsRef}>
      {Array.from({ length: ringCount }).map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.95, 1, 64]} />
          <meshBasicMaterial color="#8800ff" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

export const InfiniteVoidScene = ({ state, audioLevel = 0 }: InfiniteVoidSceneProps) => {
  return (
    <group>
      <SingularityCore state={state} audioLevel={audioLevel} />
      <AccretionDisk state={state} audioLevel={audioLevel} />
      <GravitationalWaves audioLevel={audioLevel} />
    </group>
  );
};

export default InfiniteVoidScene;
