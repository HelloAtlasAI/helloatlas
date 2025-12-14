import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface StormMindSceneProps {
  state: AIState;
  audioLevel?: number;
}

// Chaotic energy core with extreme noise displacement
const EnergyCore = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
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
    varying float vDisplacement;
    
    uniform float u_time;
    uniform float u_audioLevel;
    uniform float u_state;
    
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
    
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int i = 0; i < 6; i++) {
        value += amplitude * snoise(p);
        p *= 2.1;
        amplitude *= 0.5;
      }
      return value;
    }
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      // Domain warping for chaotic form
      vec3 q = vec3(
        fbm(position + vec3(0.0, 0.0, u_time * 0.5)),
        fbm(position + vec3(5.2, 1.3, u_time * 0.3)),
        fbm(position + vec3(2.1, 7.8, u_time * 0.4))
      );
      
      float chaos = u_state * 0.3 + 0.5;
      float audioBoost = 1.0 + u_audioLevel * 0.8;
      
      // Extreme displacement
      float displacement = fbm(position * 2.0 + q * 4.0 * chaos) * 0.5 * audioBoost;
      displacement += fbm(position * 4.0 - u_time) * 0.2;
      displacement += snoise(position * 8.0 + u_time * 2.0) * 0.1;
      
      vDisplacement = displacement;
      
      vec3 pos = position + normal * displacement;
      vPosition = pos;
      
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
    varying float vDisplacement;
    
    void main() {
      // Energy color gradient based on displacement
      vec3 coreWhite = vec3(1.0, 1.0, 0.95);
      vec3 hotYellow = vec3(1.0, 0.9, 0.2);
      vec3 electricOrange = vec3(1.0, 0.4, 0.1);
      vec3 plasmaBlue = vec3(0.2, 0.5, 1.0);
      vec3 deepPurple = vec3(0.3, 0.0, 0.5);
      
      // Map displacement to color
      float t = clamp(vDisplacement * 2.0, 0.0, 1.0);
      
      vec3 color = mix(deepPurple, plasmaBlue, smoothstep(0.0, 0.3, t));
      color = mix(color, electricOrange, smoothstep(0.3, 0.5, t));
      color = mix(color, hotYellow, smoothstep(0.5, 0.7, t));
      color = mix(color, coreWhite, smoothstep(0.7, 1.0, t));
      
      // Crackling surface effect
      float crackle = sin(vPosition.x * 20.0 + u_time * 10.0) *
                      sin(vPosition.y * 20.0 + u_time * 8.0) *
                      sin(vPosition.z * 20.0 + u_time * 12.0);
      crackle = smoothstep(0.7, 1.0, crackle);
      color += coreWhite * crackle * 0.5;
      
      // Audio pulse
      color *= 1.0 + u_audioLevel * 0.5;
      
      // Fresnel glow
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.0);
      color += plasmaBlue * fresnel * 0.5;
      
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value += delta;
      materialRef.current.uniforms.u_audioLevel.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.u_audioLevel.value,
        audioLevel,
        0.15
      );
      
      const stateValue = state === "idle" ? 0 : state === "listening" ? 1 : state === "thinking" ? 2 : 3;
      materialRef.current.uniforms.u_state.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.u_state.value,
        stateValue,
        0.08
      );
    }
    
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Electric arc connections
const LightningArcs = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const arcCount = 12;

  const arcs = useMemo(() => {
    return Array.from({ length: arcCount }).map(() => ({
      startAngle: Math.random() * Math.PI * 2,
      endAngle: Math.random() * Math.PI * 2,
      startPhi: Math.random() * Math.PI,
      endPhi: Math.random() * Math.PI,
      phase: Math.random() * Math.PI * 2,
      flickerSpeed: 5 + Math.random() * 10,
    }));
  }, []);

  useFrame((rootState) => {
    if (!groupRef.current) return;
    
    const time = rootState.clock.getElapsedTime();
    const intensity = state === "speaking" ? 1.5 : state === "thinking" ? 1.2 : 0.8;

    groupRef.current.children.forEach((line, i) => {
      const arc = arcs[i];
      const mesh = line as THREE.Line;
      
      // Flicker effect
      const flicker = Math.sin(time * arc.flickerSpeed + arc.phase) > 0.3 + audioLevel * 0.3;
      mesh.visible = flicker && Math.random() > 0.3 / intensity;
      
      if (mesh.visible) {
        // Update arc geometry
        const points: THREE.Vector3[] = [];
        const segments = 20;
        
        const startR = 1.2;
        const endR = 2.5 + Math.sin(time + arc.phase) * 0.5;
        
        for (let j = 0; j <= segments; j++) {
          const t = j / segments;
          const r = THREE.MathUtils.lerp(startR, endR, t);
          
          const theta = THREE.MathUtils.lerp(arc.startAngle, arc.endAngle, t);
          const phi = THREE.MathUtils.lerp(arc.startPhi, arc.endPhi, t);
          
          // Add jagged offset for lightning effect
          const jag = (Math.random() - 0.5) * 0.15 * (1 - Math.abs(t - 0.5) * 2);
          
          points.push(new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta) + jag,
            r * Math.cos(phi) + jag,
            r * Math.sin(phi) * Math.sin(theta) + jag
          ));
        }
        
        mesh.geometry.setFromPoints(points);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {arcs.map((_, i) => (
        <line key={i}>
          <bufferGeometry />
          <lineBasicMaterial color="#00aaff" linewidth={2} transparent opacity={0.9} />
        </line>
      ))}
    </group>
  );
};

// Energy shockwaves
const EnergyShockwaves = ({ audioLevel = 0 }: { audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const waveCount = 3;

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    groupRef.current.children.forEach((ring, i) => {
      const mesh = ring as THREE.Mesh;
      const phase = (time * 0.8 + i * 0.6) % 2;
      const scale = 1.3 + phase * 1.5;
      mesh.scale.setScalar(scale);
      const opacity = (1 - phase / 2) * (0.2 + audioLevel * 0.3);
      (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      
      // Distort the ring
      mesh.rotation.x = Math.sin(time + i) * 0.3;
      mesh.rotation.y = Math.cos(time * 0.7 + i) * 0.3;
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: waveCount }).map((_, i) => (
        <mesh key={i}>
          <torusGeometry args={[1, 0.02, 8, 64]} />
          <meshBasicMaterial color="#ff4400" transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
};

// Charged particle clouds
const ChargedParticles = ({ state, audioLevel = 0 }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleCount = 1500;

  const { positions, velocities, charges } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const charges = new Float32Array(particleCount); // -1 or 1

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + Math.random() * 2;
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.1;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
      
      charges[i] = Math.random() > 0.5 ? 1 : -1;
    }

    return { positions, velocities, charges };
  }, []);

  useFrame((rootState, delta) => {
    if (!meshRef.current) return;
    
    const time = rootState.clock.getElapsedTime();
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    
    const chaos = state === "speaking" ? 3 : state === "thinking" ? 2 : 1;

    for (let i = 0; i < particleCount; i++) {
      let x = positions[i * 3];
      let y = positions[i * 3 + 1];
      let z = positions[i * 3 + 2];
      
      // Chaotic orbital motion
      const angle = time * 0.5 * charges[i];
      const orbitRadius = Math.sqrt(x * x + z * z);
      
      x += Math.cos(angle) * delta * chaos * 0.5;
      z += Math.sin(angle) * delta * chaos * 0.5;
      
      // Add velocity
      x += velocities[i * 3] * delta * chaos;
      y += velocities[i * 3 + 1] * delta * chaos;
      z += velocities[i * 3 + 2] * delta * chaos;
      
      // Keep in bounds
      const dist = Math.sqrt(x * x + y * y + z * z);
      if (dist < 1.4 || dist > 4) {
        const targetDist = dist < 1.4 ? 1.5 : 3.5;
        const normalize = targetDist / dist;
        x *= normalize;
        y *= normalize;
        z *= normalize;
        velocities[i * 3] *= -0.5;
        velocities[i * 3 + 1] *= -0.5;
        velocities[i * 3 + 2] *= -0.5;
      }
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      position.set(x, y, z);
      
      const particleScale = 0.02 + audioLevel * 0.015;
      scale.setScalar(particleScale);
      
      matrix.compose(position, rotation, scale);
      meshRef.current.setMatrixAt(i, matrix);
      
      // Set color based on charge
      const color = new THREE.Color(charges[i] > 0 ? "#ff6600" : "#0066ff");
      meshRef.current.setColorAt(i, color);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.9} />
    </instancedMesh>
  );
};

// Magnetic field lines
const MagneticFieldLines = ({ audioLevel = 0 }: { audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const lineCount = 16;

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    groupRef.current.children.forEach((line, i) => {
      const mesh = line as THREE.Line;
      const points: THREE.Vector3[] = [];
      const segments = 40;
      
      const baseAngle = (i / lineCount) * Math.PI * 2;
      
      for (let j = 0; j <= segments; j++) {
        const t = (j / segments) * Math.PI;
        const r = 1.2 + Math.sin(t) * 1.5;
        const angle = baseAngle + Math.sin(time * 0.5 + i) * 0.2;
        
        const wave = Math.sin(t * 3 + time + i) * 0.1 * (1 + audioLevel);
        
        points.push(new THREE.Vector3(
          Math.cos(angle) * r + wave,
          Math.cos(t) * 2.5,
          Math.sin(angle) * r + wave
        ));
      }
      
      mesh.geometry.setFromPoints(points);
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: lineCount }).map((_, i) => (
        <line key={i}>
          <bufferGeometry />
          <lineBasicMaterial color="#8844ff" transparent opacity={0.3} />
        </line>
      ))}
    </group>
  );
};

export const StormMindScene = ({ state, audioLevel = 0 }: StormMindSceneProps) => {
  return (
    <group>
      <EnergyCore state={state} audioLevel={audioLevel} />
      <LightningArcs state={state} audioLevel={audioLevel} />
      <EnergyShockwaves audioLevel={audioLevel} />
      <ChargedParticles state={state} audioLevel={audioLevel} />
      <MagneticFieldLines audioLevel={audioLevel} />
    </group>
  );
};

export default StormMindScene;
