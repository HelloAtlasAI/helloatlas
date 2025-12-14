import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface LivingOceanSceneProps {
  state: AIState;
  audioLevel?: number;
}

// Volumetric fluid body with raymarched interior
const FluidBody = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_audioLevel: { value: 0 },
    u_state: { value: 0 },
  }), []);

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    
    uniform float u_time;
    uniform float u_audioLevel;
    
    // Simplex noise functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
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
    
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 5; i++) {
        value += amplitude * snoise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      // Organic displacement using FBM
      vec3 pos = position;
      float breathe = sin(u_time * 0.8) * 0.1 + sin(u_time * 1.3) * 0.05;
      float displacement = fbm(pos * 1.5 + u_time * 0.2) * 0.3;
      displacement += fbm(pos * 3.0 - u_time * 0.3) * 0.15;
      displacement *= (1.0 + u_audioLevel * 0.5);
      displacement += breathe;
      
      pos += normal * displacement;
      
      vPosition = pos;
      vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float u_time;
    uniform float u_audioLevel;
    uniform float u_state;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    
    // Noise functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    
    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
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
      // Fresnel for translucent edge glow
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
      
      // Internal caustic patterns
      float caustic1 = snoise(vPosition * 4.0 + u_time * 0.5);
      float caustic2 = snoise(vPosition * 6.0 - u_time * 0.3);
      float caustics = (caustic1 * 0.5 + 0.5) * (caustic2 * 0.5 + 0.5);
      
      // Bioluminescent spots
      float spots = smoothstep(0.6, 0.8, snoise(vPosition * 8.0 + u_time * 0.2));
      
      // Color palette - deep ocean to bioluminescent
      vec3 deepBlue = vec3(0.0, 0.1, 0.2);
      vec3 oceanTeal = vec3(0.0, 0.5, 0.6);
      vec3 bioluminescent = vec3(0.0, 1.0, 0.8);
      vec3 highlight = vec3(0.8, 1.0, 1.0);
      
      // Layer colors
      vec3 color = deepBlue;
      color = mix(color, oceanTeal, caustics * 0.6);
      color = mix(color, bioluminescent, fresnel * 0.7);
      color += bioluminescent * spots * 0.8;
      color += highlight * fresnel * fresnel * 0.5;
      
      // Audio reactivity
      color += bioluminescent * u_audioLevel * 0.4;
      
      // State-based glow
      float stateGlow = u_state * 0.15;
      color += bioluminescent * stateGlow;
      
      // Subsurface scattering simulation
      float sss = pow(max(dot(viewDir, -vNormal), 0.0), 2.0) * 0.3;
      color += oceanTeal * sss;
      
      float alpha = 0.7 + fresnel * 0.3;
      
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
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.3, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};

// Bioluminescent cells floating inside
const BioluminescentCells = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleCount = 2000;

  const { positions, velocities, phases } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Distribute within a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * 1.1;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      
      phases[i] = Math.random() * Math.PI * 2;
    }

    return { positions, velocities, phases };
  }, []);

  useFrame((clock, delta) => {
    if (!meshRef.current) return;
    
    const time = clock.getElapsedTime();
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    
    const turbulence = state === "thinking" ? 2 : state === "speaking" ? 1.5 : 1;

    for (let i = 0; i < particleCount; i++) {
      // Current position
      let x = positions[i * 3];
      let y = positions[i * 3 + 1];
      let z = positions[i * 3 + 2];
      
      // Add velocity with turbulence
      x += velocities[i * 3] * delta * turbulence;
      y += velocities[i * 3 + 1] * delta * turbulence;
      z += velocities[i * 3 + 2] * delta * turbulence;
      
      // Organic swirl motion
      const angle = time * 0.3 + phases[i];
      x += Math.sin(angle) * 0.002;
      y += Math.cos(angle * 1.3) * 0.002;
      z += Math.sin(angle * 0.7) * 0.002;
      
      // Keep within bounds
      const dist = Math.sqrt(x * x + y * y + z * z);
      if (dist > 1.1) {
        const scale = 1.1 / dist;
        x *= scale;
        y *= scale;
        z *= scale;
        velocities[i * 3] *= -0.5;
        velocities[i * 3 + 1] *= -0.5;
        velocities[i * 3 + 2] *= -0.5;
      }
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      position.set(x, y, z);
      
      // Pulsing size based on phase and audio
      const pulse = Math.sin(time * 2 + phases[i]) * 0.5 + 0.5;
      const particleScale = 0.008 + pulse * 0.006 + audioLevel * 0.008;
      scale.setScalar(particleScale);
      
      matrix.compose(position, rotation, scale);
      meshRef.current.setMatrixAt(i, matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#00ffcc" transparent opacity={0.8} />
    </instancedMesh>
  );
};

// Pressure wave pulses
const PressureWaves = ({ audioLevel = 0 }: { audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const waveCount = 4;

  useFrame((clock) => {
    if (!groupRef.current) return;
    
    const time = clock.getElapsedTime();
    
    groupRef.current.children.forEach((ring, i) => {
      const mesh = ring as THREE.Mesh;
      const phase = (time * 0.4 + i * 0.5) % 2.5;
      const scale = 1.3 + phase * 0.8;
      mesh.scale.setScalar(scale);
      const opacity = (1 - phase / 2.5) * (0.1 + audioLevel * 0.15);
      (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: waveCount }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#00ffcc" transparent opacity={0.1} wireframe />
        </mesh>
      ))}
    </group>
  );
};

// Deep current particles
const DeepCurrents = ({ state }: { state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 800;

  const { positions, velocities, opacities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      
      velocities[i * 3] = 0.2 + Math.random() * 0.3;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
      
      opacities[i] = 0.3 + Math.random() * 0.4;
    }

    return { positions, velocities, opacities };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    
    const positionAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const speed = state === "speaking" ? 1.5 : 1;

    for (let i = 0; i < particleCount; i++) {
      let x = positionAttr.getX(i) + velocities[i * 3] * delta * speed;
      const y = positionAttr.getY(i) + velocities[i * 3 + 1] * delta;
      const z = positionAttr.getZ(i) + velocities[i * 3 + 2] * delta;
      
      if (x > 4) x = -4;
      
      positionAttr.setXYZ(i, x, y, z);
    }
    
    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#0088aa" size={0.02} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
};

export const LivingOceanScene = ({ state, audioLevel = 0 }: LivingOceanSceneProps) => {
  return (
    <group>
      <FluidBody state={state} audioLevel={audioLevel} />
      <BioluminescentCells state={state} audioLevel={audioLevel} />
      <PressureWaves audioLevel={audioLevel} />
      <DeepCurrents state={state} />
    </group>
  );
};

export default LivingOceanScene;
