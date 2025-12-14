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

// Consciousness Sphere Vertex Shader - Organic wave displacement
const consciousnessVertexShader = `
${noiseGLSL}

uniform float u_time;
uniform float u_audioLevel;
uniform float u_breathe;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vDisplacement;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  
  // Organic wave displacement - like breathing
  float wave1 = sin(position.x * 3.0 + u_time * 0.8) * cos(position.y * 2.5 + u_time * 0.6);
  float wave2 = sin(position.y * 2.8 + u_time * 0.7) * cos(position.z * 3.2 + u_time * 0.5);
  float wave3 = sin(position.z * 2.2 + u_time * 0.9) * cos(position.x * 2.7 + u_time * 0.4);
  
  // Multi-octave noise for organic texture
  float noise1 = snoise(position * 1.2 + u_time * 0.15) * 0.4;
  float noise2 = snoise(position * 2.5 + u_time * 0.25) * 0.2;
  float noise3 = snoise(position * 5.0 + u_time * 0.4) * 0.1;
  
  // Combine waves and noise
  float waveDisplacement = (wave1 * wave2 * wave3) * 0.12;
  float noiseDisplacement = (noise1 + noise2 + noise3);
  
  // Breathing effect
  float breathe = sin(u_time * 0.5) * 0.05 * u_breathe;
  
  // Audio pulse
  float audioPulse = u_audioLevel * 0.25;
  
  float displacement = waveDisplacement + noiseDisplacement * 0.15 + breathe + audioPulse;
  vDisplacement = displacement;
  
  vec3 newPosition = position + normal * displacement;
  vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

// Consciousness Sphere Fragment Shader - Holographic ethereal look
const consciousnessFragmentShader = `
uniform float u_time;
uniform vec3 u_coreColor;
uniform vec3 u_glowColor;
uniform vec3 u_accentColor;
uniform float u_audioLevel;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying float vDisplacement;

void main() {
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  
  // Enhanced Fresnel for ethereal glow
  float fresnel = pow(1.0 - abs(dot(vNormal, viewDirection)), 4.0);
  
  // Soft scan lines - horizontal waves
  float scanLine = sin(vPosition.y * 40.0 + u_time * 2.0) * 0.5 + 0.5;
  scanLine = smoothstep(0.4, 0.6, scanLine) * 0.08;
  
  // Inner glow pattern
  float innerGlow = sin(vDisplacement * 20.0 + u_time) * 0.5 + 0.5;
  
  // Color mixing - ethereal gradient
  vec3 baseColor = mix(u_coreColor, u_glowColor, fresnel * 0.7);
  baseColor = mix(baseColor, u_accentColor, innerGlow * 0.3);
  
  // Add scan line subtly
  baseColor += u_glowColor * scanLine;
  
  // Rim glow - brighter edges
  vec3 rimGlow = u_glowColor * fresnel * 1.8;
  rimGlow += u_accentColor * fresnel * u_audioLevel * 2.0;
  
  // Audio reactive pulse
  vec3 audioPulse = u_accentColor * u_audioLevel * 0.4 * (1.0 - fresnel);
  
  vec3 finalColor = baseColor + rimGlow + audioPulse;
  
  // Soft alpha for translucency
  float alpha = 0.85 + fresnel * 0.15;
  
  gl_FragColor = vec4(finalColor, alpha);
}
`;

// Inner Essence Shader - glowing core
const essenceFragmentShader = `
uniform float u_time;
uniform vec3 u_color;
uniform float u_audioLevel;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - abs(dot(vNormal, viewDirection)), 2.0);
  
  // Pulsing glow
  float pulse = sin(u_time * 3.0) * 0.3 + 0.7;
  pulse += u_audioLevel * 0.5;
  
  vec3 finalColor = u_color * pulse * (1.5 + fresnel);
  
  gl_FragColor = vec4(finalColor, 0.6 + fresnel * 0.4);
}
`;

// Consciousness Sphere - Multi-layered breathing entity
const ConsciousnessSphere = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const outerRef = useRef<THREE.Mesh>(null);
  const middleRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const innerMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const stateConfig = useMemo(() => {
    switch (state) {
      case "listening":
        return {
          coreColor: new THREE.Color("#0088ff"),
          glowColor: new THREE.Color("#00d4ff"),
          accentColor: new THREE.Color("#00ffee"),
          breathe: 1.2,
          rotationSpeed: 0.003,
        };
      case "thinking":
        return {
          coreColor: new THREE.Color("#4466ff"),
          glowColor: new THREE.Color("#8855ff"),
          accentColor: new THREE.Color("#aa88ff"),
          breathe: 1.8,
          rotationSpeed: 0.008,
        };
      case "speaking":
        return {
          coreColor: new THREE.Color("#00ddaa"),
          glowColor: new THREE.Color("#00ffcc"),
          accentColor: new THREE.Color("#88ffee"),
          breathe: 1.5,
          rotationSpeed: 0.005,
        };
      default:
        return {
          coreColor: new THREE.Color("#0066ff"),
          glowColor: new THREE.Color("#00aaff"),
          accentColor: new THREE.Color("#00ddff"),
          breathe: 1.0,
          rotationSpeed: 0.002,
        };
    }
  }, [state]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    
    // Update main shader uniforms
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = time;
      materialRef.current.uniforms.u_audioLevel.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.u_audioLevel.value,
        audioLevel,
        0.12
      );
      materialRef.current.uniforms.u_breathe.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.u_breathe.value,
        stateConfig.breathe,
        0.05
      );
      materialRef.current.uniforms.u_coreColor.value.lerp(stateConfig.coreColor, 0.04);
      materialRef.current.uniforms.u_glowColor.value.lerp(stateConfig.glowColor, 0.04);
      materialRef.current.uniforms.u_accentColor.value.lerp(stateConfig.accentColor, 0.04);
    }
    
    // Inner essence shader
    if (innerMaterialRef.current) {
      innerMaterialRef.current.uniforms.u_time.value = time;
      innerMaterialRef.current.uniforms.u_audioLevel.value = audioLevel;
      innerMaterialRef.current.uniforms.u_color.value.lerp(stateConfig.accentColor, 0.05);
    }
    
    // Rotate layers at different speeds
    if (outerRef.current) {
      outerRef.current.rotation.y += stateConfig.rotationSpeed * 0.5;
      outerRef.current.rotation.x = Math.sin(time * 0.15) * 0.08;
    }
    if (middleRef.current) {
      middleRef.current.rotation.y -= stateConfig.rotationSpeed * 0.3;
      middleRef.current.rotation.z = Math.cos(time * 0.2) * 0.05;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y += stateConfig.rotationSpeed * 0.8;
      innerRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y -= stateConfig.rotationSpeed;
      const coreScale = 0.3 + audioLevel * 0.15 + Math.sin(time * 2) * 0.03;
      coreRef.current.scale.setScalar(coreScale);
    }
  });

  return (
    <group>
      {/* Outer membrane - ethereal wireframe */}
      <mesh ref={outerRef} scale={1.35}>
        <icosahedronGeometry args={[1, 3]} />
        <meshBasicMaterial 
          color="#00d4ff"
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>
      
      {/* Middle layer - main consciousness surface */}
      <mesh ref={middleRef} scale={1.2}>
        <icosahedronGeometry args={[1, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={consciousnessVertexShader}
          fragmentShader={consciousnessFragmentShader}
          uniforms={{
            u_time: { value: 0 },
            u_audioLevel: { value: 0 },
            u_breathe: { value: 1 },
            u_coreColor: { value: new THREE.Color("#0066ff") },
            u_glowColor: { value: new THREE.Color("#00aaff") },
            u_accentColor: { value: new THREE.Color("#00ddff") },
          }}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Inner structure - nested dodecahedron */}
      <mesh ref={innerRef} scale={0.7}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshBasicMaterial 
          color="#00ffee"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>
      
      {/* Core essence - glowing center */}
      <mesh ref={coreRef} scale={0.3}>
        <icosahedronGeometry args={[1, 32]} />
        <shaderMaterial
          ref={innerMaterialRef}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vPosition;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={essenceFragmentShader}
          uniforms={{
            u_time: { value: 0 },
            u_color: { value: new THREE.Color("#00ffee") },
            u_audioLevel: { value: 0 },
          }}
          transparent
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// Knowledge Clusters - Orbital geometric forms with gravitational behavior
const KnowledgeClusters = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 350;
  
  const { basePositions, velocities, scales, phases, geometryTypes } = useMemo(() => {
    const basePositions: THREE.Vector3[] = [];
    const velocities: THREE.Vector3[] = [];
    const scales: number[] = [];
    const phases: number[] = [];
    const geometryTypes: number[] = [];
    
    // Create organic clusters in shells
    const shells = [
      { radius: 2.2, count: 80, spread: 0.4 },
      { radius: 3.0, count: 100, spread: 0.5 },
      { radius: 3.8, count: 100, spread: 0.6 },
      { radius: 4.5, count: 70, spread: 0.7 },
    ];
    
    let index = 0;
    shells.forEach(shell => {
      for (let i = 0; i < shell.count && index < count; i++) {
        const theta = (i / shell.count) * Math.PI * 2 + Math.random() * 0.5;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = shell.radius + (Math.random() - 0.5) * shell.spread;
        
        basePositions.push(new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ));
        
        velocities.push(new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ));
        
        scales.push(0.03 + Math.random() * 0.05);
        phases.push(Math.random() * Math.PI * 2);
        geometryTypes.push(Math.floor(Math.random() * 3));
        index++;
      }
    });
    
    return { basePositions, velocities, scales, phases, geometryTypes };
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    const time = clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    
    // State-based behavior
    const convergeFactor = state === "thinking" ? 0.7 : state === "listening" ? 0.9 : 1.0;
    const orbitSpeed = state === "thinking" ? 0.4 : state === "speaking" ? 0.25 : 0.15;
    const pulseIntensity = state === "speaking" ? 1.5 : 1.0;
    
    for (let i = 0; i < count; i++) {
      const basePos = basePositions[i];
      const phase = phases[i];
      
      // Orbital motion with organic drift
      const angle = time * orbitSpeed + phase;
      const drift = Math.sin(time * 0.3 + phase) * 0.1;
      
      const targetRadius = basePos.length() * convergeFactor;
      
      dummy.position.set(
        basePos.x * Math.cos(angle * 0.2) - basePos.z * Math.sin(angle * 0.2),
        basePos.y + Math.sin(time * 0.5 + phase) * 0.15 + drift,
        basePos.x * Math.sin(angle * 0.2) + basePos.z * Math.cos(angle * 0.2)
      );
      dummy.position.normalize().multiplyScalar(targetRadius);
      
      // Breathing scale
      const breatheScale = 1 + Math.sin(time * 2 + phase) * 0.2;
      const audioScale = 1 + audioLevel * 0.4 * pulseIntensity;
      dummy.scale.setScalar(scales[i] * breatheScale * audioScale);
      
      // Rotation
      dummy.rotation.set(time * 0.5 + phase, time * 0.3 + phase * 0.5, 0);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      
      // Color based on distance and state
      const dist = dummy.position.length();
      const hue = state === "thinking" ? 0.75 : state === "speaking" ? 0.45 : 0.55;
      const saturation = 0.8 - (dist - 2) * 0.1;
      const lightness = 0.5 + audioLevel * 0.2;
      color.setHSL(hue + Math.sin(phase) * 0.05, saturation, lightness);
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
        emissive="#00aaff"
        emissiveIntensity={0.6}
        transparent
        opacity={0.85}
        metalness={0.3}
        roughness={0.4}
      />
    </instancedMesh>
  );
};

// Energy Streams - Aurora-like flowing ribbons
const EnergyStreams = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const streamCount = 8;
  
  const streams = useMemo(() => {
    const result: { points: THREE.Vector3[]; phase: number; speed: number }[] = [];
    
    for (let s = 0; s < streamCount; s++) {
      const points: THREE.Vector3[] = [];
      const baseAngle = (s / streamCount) * Math.PI * 2;
      const phase = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.3;
      
      for (let i = 0; i < 60; i++) {
        const t = i / 59;
        const radius = 1.8 + t * 2.5;
        const spiralAngle = baseAngle + t * Math.PI * 1.5;
        const height = (t - 0.5) * 2 + Math.sin(t * Math.PI * 3) * 0.5;
        
        points.push(new THREE.Vector3(
          radius * Math.cos(spiralAngle),
          height,
          radius * Math.sin(spiralAngle)
        ));
      }
      
      result.push({ points, phase, speed });
    }
    
    return result;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    
    const time = clock.getElapsedTime();
    const rotationSpeed = state === "thinking" ? 0.15 : state === "speaking" ? 0.1 : 0.05;
    
    groupRef.current.rotation.y += rotationSpeed * 0.01;
    
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Line) {
        const material = child.material as THREE.LineBasicMaterial;
        const stream = streams[i];
        const opacity = 0.2 + Math.sin(time * stream.speed + stream.phase) * 0.15;
        material.opacity = opacity + audioLevel * 0.2;
      }
    });
  });

  const streamColor = state === "thinking" ? "#8866ff" : 
                      state === "speaking" ? "#00ffaa" : "#00d4ff";

  return (
    <group ref={groupRef}>
      {streams.map((stream, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={stream.points.length}
              array={new Float32Array(stream.points.flatMap(p => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color={streamColor}
            transparent 
            opacity={0.25}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}
    </group>
  );
};

// Digital Spores - Drifting atmospheric particles
const DigitalSpores = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 800;
  
  const { positions, velocities, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const radius = 2 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.003,
        Math.random() * 0.008 + 0.002,
        (Math.random() - 0.5) * 0.003
      ));
      
      sizes[i] = 1 + Math.random() * 3;
    }
    
    return { positions, velocities, sizes };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    
    const positionAttr = pointsRef.current.geometry.attributes.position;
    const time = clock.getElapsedTime();
    
    const driftSpeed = state === "thinking" ? 0.5 : state === "speaking" ? 1.5 : 1.0;
    
    for (let i = 0; i < count; i++) {
      let x = positionAttr.getX(i);
      let y = positionAttr.getY(i);
      let z = positionAttr.getZ(i);
      
      const vel = velocities[i];
      
      // Upward drift with slight orbital motion
      x += vel.x * driftSpeed;
      y += vel.y * driftSpeed + audioLevel * 0.01;
      z += vel.z * driftSpeed;
      
      // Gentle spiral
      const angle = time * 0.1;
      const newX = x * Math.cos(angle * 0.01) - z * Math.sin(angle * 0.01);
      const newZ = x * Math.sin(angle * 0.01) + z * Math.cos(angle * 0.01);
      
      positionAttr.setXYZ(i, newX, y, newZ);
      
      // Respawn at bottom when too high
      if (y > 5 || Math.sqrt(newX * newX + newZ * newZ) > 6) {
        const radius = 2 + Math.random() * 2;
        const theta = Math.random() * Math.PI * 2;
        positionAttr.setXYZ(
          i,
          radius * Math.cos(theta),
          -2 - Math.random() * 2,
          radius * Math.sin(theta)
        );
      }
    }
    
    positionAttr.needsUpdate = true;
    pointsRef.current.rotation.y += 0.0005;
  });

  const sporeColor = state === "thinking" ? "#aa88ff" : 
                     state === "speaking" ? "#88ffcc" : "#88ddff";

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
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        color={sporeColor}
        size={0.03}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Wave Ripples - Concentric interference patterns
const WaveRipples = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const ringsRef = useRef<THREE.Group>(null);
  const ringCount = 5;
  
  useFrame(({ clock }) => {
    if (!ringsRef.current) return;
    
    const time = clock.getElapsedTime();
    const expansionSpeed = state === "speaking" ? 1.5 : state === "thinking" ? 1.2 : 0.8;
    
    ringsRef.current.children.forEach((ring, i) => {
      const mesh = ring as THREE.Mesh;
      const material = mesh.material as THREE.MeshBasicMaterial;
      
      // Expand and fade
      const phase = (time * expansionSpeed * 0.3 + i * 0.4) % 2;
      const scale = 1.5 + phase * 1.5;
      const opacity = Math.max(0, 0.3 - phase * 0.15) + audioLevel * 0.1;
      
      mesh.scale.setScalar(scale);
      material.opacity = opacity;
      mesh.rotation.x = Math.PI / 2;
    });
  });

  const ringColor = state === "thinking" ? "#8866ff" : 
                    state === "speaking" ? "#00ffcc" : "#00d4ff";

  return (
    <group ref={ringsRef}>
      {Array.from({ length: ringCount }).map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1, 0.01, 8, 64]} />
          <meshBasicMaterial
            color={ringColor}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

// Crystalline Growth - Temporary formations during thinking
const CrystallineGrowth = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const crystalCount = 6;
  
  const crystals = useMemo(() => {
    return Array.from({ length: crystalCount }).map((_, i) => ({
      position: new THREE.Vector3(
        Math.cos((i / crystalCount) * Math.PI * 2) * 1.8,
        (Math.random() - 0.5) * 0.5,
        Math.sin((i / crystalCount) * Math.PI * 2) * 1.8
      ),
      rotation: new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ),
      scale: 0.1 + Math.random() * 0.15,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    
    const time = clock.getElapsedTime();
    const showCrystals = state === "thinking";
    const targetOpacity = showCrystals ? 0.4 : 0;
    
    groupRef.current.children.forEach((crystal, i) => {
      const mesh = crystal as THREE.Mesh;
      const material = mesh.material as THREE.MeshStandardMaterial;
      const config = crystals[i];
      
      // Grow/shrink animation
      const growFactor = showCrystals ? 
        Math.min(1, (Math.sin(time * 2 + config.phase) * 0.5 + 0.5)) : 0;
      
      mesh.scale.setScalar(config.scale * growFactor * (1 + audioLevel * 0.5));
      
      // Rotation
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.015;
      
      // Opacity
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity * growFactor, 0.1);
    });
  });

  return (
    <group ref={groupRef}>
      {crystals.map((crystal, i) => (
        <mesh
          key={i}
          position={crystal.position}
          rotation={crystal.rotation}
        >
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#aa88ff"
            emissive="#6644cc"
            emissiveIntensity={0.5}
            transparent
            opacity={0}
            wireframe
          />
        </mesh>
      ))}
    </group>
  );
};

// Enhanced Particle System - Multi-behavior particles
const EnhancedParticles = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 2000;
  
  const { positions, colors, behaviors, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const behaviors: ('orbit' | 'seek' | 'wander')[] = [];
    const phases: number[] = [];
    
    const colorPalette = [
      new THREE.Color("#00d4ff"),
      new THREE.Color("#00ffee"),
      new THREE.Color("#88aaff"),
      new THREE.Color("#ffffff"),
    ];
    
    for (let i = 0; i < count; i++) {
      const radius = 1.5 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Assign behavior
      const behaviorRoll = Math.random();
      if (behaviorRoll < 0.5) behaviors.push('orbit');
      else if (behaviorRoll < 0.8) behaviors.push('seek');
      else behaviors.push('wander');
      
      phases.push(Math.random() * Math.PI * 2);
    }
    
    return { positions, colors, behaviors, phases };
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    
    const positionAttr = pointsRef.current.geometry.attributes.position;
    const colorAttr = pointsRef.current.geometry.attributes.color;
    const time = clock.getElapsedTime();
    
    const orbitSpeed = state === "thinking" ? 0.4 : state === "speaking" ? 0.2 : 0.1;
    const seekStrength = state === "thinking" ? 0.02 : 0.005;
    
    for (let i = 0; i < count; i++) {
      let x = positionAttr.getX(i);
      let y = positionAttr.getY(i);
      let z = positionAttr.getZ(i);
      
      const behavior = behaviors[i];
      const phase = phases[i];
      
      if (behavior === 'orbit') {
        // Orbital motion
        const angle = time * orbitSpeed * 0.1;
        const newX = x * Math.cos(angle) - z * Math.sin(angle);
        const newZ = x * Math.sin(angle) + z * Math.cos(angle);
        x = newX;
        z = newZ;
        y += Math.sin(time + phase) * 0.002;
      } else if (behavior === 'seek') {
        // Seek toward center when thinking
        const dist = Math.sqrt(x * x + y * y + z * z);
        if (state === "thinking" && dist > 1.5) {
          x -= x * seekStrength;
          y -= y * seekStrength;
          z -= z * seekStrength;
        } else if (state === "speaking") {
          // Burst outward
          x += x * audioLevel * 0.02;
          y += y * audioLevel * 0.02;
          z += z * audioLevel * 0.02;
        }
      } else {
        // Wander
        x += Math.sin(time * 0.5 + phase) * 0.005;
        y += Math.cos(time * 0.3 + phase * 1.5) * 0.005;
        z += Math.sin(time * 0.4 + phase * 0.7) * 0.005;
      }
      
      positionAttr.setXYZ(i, x, y, z);
      
      // Color shift based on state
      const baseHue = state === "thinking" ? 0.75 : state === "speaking" ? 0.45 : 0.55;
      const hue = baseHue + Math.sin(phase) * 0.1;
      const tempColor = new THREE.Color().setHSL(hue, 0.8, 0.6 + audioLevel * 0.2);
      colorAttr.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
      
      // Respawn if too far
      const dist = Math.sqrt(x * x + y * y + z * z);
      if (dist > 6 || dist < 1) {
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
    colorAttr.needsUpdate = true;
    pointsRef.current.rotation.y += 0.0003;
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
        size={0.02}
        transparent
        opacity={0.7}
        vertexColors
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Main Scene Export
export const NeuralBlobScene = ({ state, audioLevel = 0, isSpeaking = false }: NeuralBlobSceneProps) => {
  return (
    <group>
      {/* Core consciousness entity */}
      <ConsciousnessSphere state={state} audioLevel={audioLevel} />
      
      {/* Orbital knowledge clusters */}
      <KnowledgeClusters state={state} audioLevel={audioLevel} />
      
      {/* Flowing energy streams */}
      <EnergyStreams state={state} audioLevel={audioLevel} />
      
      {/* Atmospheric spores */}
      <DigitalSpores state={state} audioLevel={audioLevel} />
      
      {/* Wave interference ripples */}
      <WaveRipples state={state} audioLevel={audioLevel} />
      
      {/* Crystalline formations (thinking state) */}
      <CrystallineGrowth state={state} audioLevel={audioLevel} />
      
      {/* Enhanced particle system */}
      <EnhancedParticles state={state} audioLevel={audioLevel} />
    </group>
  );
};

export default NeuralBlobScene;
