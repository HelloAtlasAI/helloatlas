import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface NeuralBlobSceneProps {
  state: AIState;
  audioLevel?: number;
  isSpeaking?: boolean;
}

// Simplex 3D Noise GLSL
const noiseGLSL = `
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
`;

const blobVertexShader = `
${noiseGLSL}

uniform float u_time;
uniform float u_audioLevel;
uniform float u_intensity;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplacement;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  
  // Multi-octave noise for organic movement
  float noise1 = snoise(position * 1.5 + u_time * 0.3) * 0.5;
  float noise2 = snoise(position * 3.0 + u_time * 0.5) * 0.25;
  float noise3 = snoise(position * 6.0 + u_time * 0.8) * 0.125;
  
  float displacement = (noise1 + noise2 + noise3) * u_intensity;
  
  // Audio reactivity - pulse outward
  displacement += u_audioLevel * 0.4;
  
  vDisplacement = displacement;
  
  vec3 newPosition = position + normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const blobFragmentShader = `
uniform float u_time;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_colorC;
uniform float u_audioLevel;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vDisplacement;

void main() {
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - abs(dot(vNormal, viewDirection)), 3.0);
  
  // Iridescent color mixing
  vec3 baseColor = mix(u_colorA, u_colorB, fresnel);
  baseColor = mix(baseColor, u_colorC, sin(u_time * 0.5 + vDisplacement * 5.0) * 0.5 + 0.5);
  
  // Rim glow
  float rimGlow = fresnel * (1.0 + u_audioLevel * 2.0);
  vec3 glowColor = mix(u_colorB, u_colorC, sin(u_time) * 0.5 + 0.5);
  
  vec3 finalColor = baseColor + glowColor * rimGlow * 0.6;
  
  // Add subtle pulse based on audio
  finalColor += u_colorC * u_audioLevel * 0.3;
  
  gl_FragColor = vec4(finalColor, 0.92);
}
`;

// Morphing Blob Component
const MorphingBlob = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const stateColors = useMemo(() => {
    switch (state) {
      case "listening":
        return {
          colorA: new THREE.Color("#00d4ff"),
          colorB: new THREE.Color("#0088ff"),
          colorC: new THREE.Color("#00ffcc"),
        };
      case "thinking":
        return {
          colorA: new THREE.Color("#a855f7"),
          colorB: new THREE.Color("#6366f1"),
          colorC: new THREE.Color("#ec4899"),
        };
      case "speaking":
        return {
          colorA: new THREE.Color("#00ff88"),
          colorB: new THREE.Color("#00d4ff"),
          colorC: new THREE.Color("#88ff00"),
        };
      default:
        return {
          colorA: new THREE.Color("#00d4ff"),
          colorB: new THREE.Color("#a855f7"),
          colorC: new THREE.Color("#00ffcc"),
        };
    }
  }, [state]);

  const stateIntensity = useMemo(() => {
    switch (state) {
      case "listening": return 0.15;
      case "thinking": return 0.25;
      case "speaking": return 0.2;
      default: return 0.12;
    }
  }, [state]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
      materialRef.current.uniforms.u_audioLevel.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.u_audioLevel.value,
        audioLevel,
        0.15
      );
      
      // Lerp colors for smooth transitions
      materialRef.current.uniforms.u_colorA.value.lerp(stateColors.colorA, 0.05);
      materialRef.current.uniforms.u_colorB.value.lerp(stateColors.colorB, 0.05);
      materialRef.current.uniforms.u_colorC.value.lerp(stateColors.colorC, 0.05);
      materialRef.current.uniforms.u_intensity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.u_intensity.value,
        stateIntensity,
        0.05
      );
    }
    
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} scale={1.2}>
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={blobVertexShader}
        fragmentShader={blobFragmentShader}
        uniforms={{
          u_time: { value: 0 },
          u_audioLevel: { value: 0 },
          u_intensity: { value: 0.12 },
          u_colorA: { value: new THREE.Color("#00d4ff") },
          u_colorB: { value: new THREE.Color("#a855f7") },
          u_colorC: { value: new THREE.Color("#00ffcc") },
        }}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Data Nodes Component (GPU Instanced)
const DataNodes = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 400;
  
  const { positions, scales, colors } = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const scales: number[] = [];
    const colors: THREE.Color[] = [];
    
    for (let i = 0; i < count; i++) {
      // Spherical distribution around the blob
      const radius = 2 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions.push(new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      ));
      
      scales.push(0.02 + Math.random() * 0.04);
      
      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        colors.push(new THREE.Color("#00d4ff"));
      } else if (colorChoice < 0.7) {
        colors.push(new THREE.Color("#a855f7"));
      } else {
        colors.push(new THREE.Color("#00ff88"));
      }
    }
    
    return { positions, scales, colors };
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    const time = clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    
    const stateSpeed = state === "thinking" ? 2 : state === "speaking" ? 1.5 : 0.5;
    const convergeFactor = state === "thinking" ? 0.8 : 1;
    
    for (let i = 0; i < count; i++) {
      const basePos = positions[i];
      
      // Orbital motion
      const angle = time * stateSpeed * 0.1 + i * 0.1;
      const orbitRadius = basePos.length() * convergeFactor;
      
      dummy.position.set(
        basePos.x * Math.cos(angle * 0.3) - basePos.z * Math.sin(angle * 0.3),
        basePos.y + Math.sin(time * 0.5 + i) * 0.1,
        basePos.x * Math.sin(angle * 0.3) + basePos.z * Math.cos(angle * 0.3)
      );
      dummy.position.normalize().multiplyScalar(orbitRadius);
      
      // Pulse with audio
      const scale = scales[i] * (1 + audioLevel * 0.5);
      dummy.scale.setScalar(scale);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      
      // Color based on state
      color.copy(colors[i]);
      if (state === "speaking") {
        color.lerp(new THREE.Color("#00ff88"), 0.3 + audioLevel * 0.5);
      }
      meshRef.current.setColorAt(i, color);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        emissive="#00d4ff"
        emissiveIntensity={0.8}
        transparent
        opacity={0.9}
      />
    </instancedMesh>
  );
};

// Neural Connections Component
const NeuralConnections = ({ state }: { state: AIState }) => {
  const linesRef = useRef<THREE.Group>(null);
  
  const curves = useMemo(() => {
    const result: THREE.CatmullRomCurve3[] = [];
    
    for (let i = 0; i < 30; i++) {
      const startRadius = 1.5 + Math.random();
      const endRadius = 2.5 + Math.random() * 1.5;
      
      const startTheta = Math.random() * Math.PI * 2;
      const endTheta = startTheta + (Math.random() - 0.5) * Math.PI;
      
      const startPhi = Math.random() * Math.PI;
      const endPhi = startPhi + (Math.random() - 0.5) * 0.5;
      
      const start = new THREE.Vector3(
        startRadius * Math.sin(startPhi) * Math.cos(startTheta),
        startRadius * Math.sin(startPhi) * Math.sin(startTheta),
        startRadius * Math.cos(startPhi)
      );
      
      const end = new THREE.Vector3(
        endRadius * Math.sin(endPhi) * Math.cos(endTheta),
        endRadius * Math.sin(endPhi) * Math.sin(endTheta),
        endRadius * Math.cos(endPhi)
      );
      
      const mid = start.clone().add(end).multiplyScalar(0.5);
      mid.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      ));
      
      result.push(new THREE.CatmullRomCurve3([start, mid, end]));
    }
    
    return result;
  }, []);

  useFrame(({ clock }) => {
    if (!linesRef.current) return;
    
    linesRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    
    linesRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Line) {
        const material = child.material as THREE.LineBasicMaterial;
        material.opacity = 0.3 + Math.sin(clock.getElapsedTime() * 2 + i) * 0.2;
      }
    });
  });

  const connectionColor = state === "thinking" ? "#a855f7" : 
                          state === "speaking" ? "#00ff88" : "#00d4ff";

  return (
    <group ref={linesRef}>
      {curves.map((curve, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={50}
              array={new Float32Array(curve.getPoints(49).flatMap(p => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color={connectionColor}
            transparent 
            opacity={0.4}
            linewidth={1}
          />
        </line>
      ))}
    </group>
  );
};

// Data Particles Component
const DataParticles = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1500;
  
  const { positions, velocities, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];
    const colors = new Float32Array(count * 3);
    
    const colorOptions = [
      new THREE.Color("#00d4ff"),
      new THREE.Color("#a855f7"),
      new THREE.Color("#00ff88"),
      new THREE.Color("#ffffff"),
    ];
    
    for (let i = 0; i < count; i++) {
      const radius = 1.8 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      ));
      
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    
    return { positions, velocities, colors };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    
    const positionAttr = pointsRef.current.geometry.attributes.position;
    const time = clock.getElapsedTime();
    
    const speed = state === "speaking" ? 2 : state === "thinking" ? 1.5 : 0.5;
    const burstFactor = state === "speaking" ? 1 + audioLevel : 1;
    
    for (let i = 0; i < count; i++) {
      const x = positionAttr.getX(i);
      const y = positionAttr.getY(i);
      const z = positionAttr.getZ(i);
      
      const vel = velocities[i];
      
      // Orbital motion
      const angle = time * speed * 0.1;
      const newX = x * Math.cos(angle * 0.01) - z * Math.sin(angle * 0.01);
      const newZ = x * Math.sin(angle * 0.01) + z * Math.cos(angle * 0.01);
      
      // Add velocity and burst effect
      positionAttr.setXYZ(
        i,
        newX + vel.x * burstFactor,
        y + vel.y * burstFactor + Math.sin(time + i) * 0.002,
        newZ + vel.z * burstFactor
      );
      
      // Respawn particles that drift too far
      const dist = Math.sqrt(newX * newX + y * y + newZ * newZ);
      if (dist > 5 || dist < 1.5) {
        const radius = 2 + Math.random() * 2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positionAttr.setXYZ(
          i,
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        );
      }
    }
    
    positionAttr.needsUpdate = true;
    pointsRef.current.rotation.y += 0.001;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Energy Ring Component
const EnergyRing = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const ringRef = useRef<THREE.Mesh>(null);
  
  const ringColor = state === "thinking" ? "#a855f7" : 
                    state === "speaking" ? "#00ff88" : "#00d4ff";

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    
    ringRef.current.rotation.x = Math.PI / 2 + Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    ringRef.current.rotation.z = clock.getElapsedTime() * 0.2;
    
    const scale = 1.8 + audioLevel * 0.3;
    ringRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.02, 16, 100]} />
      <meshStandardMaterial
        color={ringColor}
        emissive={ringColor}
        emissiveIntensity={1.5}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
};

// Main Scene Export
export const NeuralBlobScene = ({ 
  state, 
  audioLevel = 0, 
  isSpeaking = false 
}: NeuralBlobSceneProps) => {
  return (
    <group>
      {/* Central morphing blob */}
      <MorphingBlob state={state} audioLevel={audioLevel} />
      
      {/* Surrounding data network */}
      <DataNodes state={state} audioLevel={audioLevel} />
      <NeuralConnections state={state} />
      <DataParticles state={state} audioLevel={audioLevel} />
      
      {/* Energy ring */}
      <EnergyRing state={state} audioLevel={audioLevel} />
    </group>
  );
};
