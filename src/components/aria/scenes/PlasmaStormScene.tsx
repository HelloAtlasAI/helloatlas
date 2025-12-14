import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AIState } from "../AIOrb";

interface PlasmaStormSceneProps {
  state: AIState;
  audioLevel: number;
}

const plasmaVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vNoise;
  uniform float u_time;
  uniform float u_audio;
  
  // Hash function for jagged noise
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  
  void main() {
    vPosition = position;
    vNormal = normal;
    
    // Chaotic jagged displacement
    float n1 = noise(position * 3.0 + u_time * 2.0);
    float n2 = noise(position * 8.0 - u_time * 3.0);
    float n3 = noise(position * 15.0 + u_time * 5.0);
    
    float displacement = n1 * 0.3 + n2 * 0.15 + n3 * 0.08;
    displacement += u_audio * 0.4 * n1;
    
    vNoise = displacement;
    
    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const plasmaFragmentShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vNoise;
  uniform float u_time;
  uniform float u_audio;
  
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.0);
    
    // Plasma colors: orange -> yellow -> white hot
    vec3 orange = vec3(1.0, 0.27, 0.0);
    vec3 yellow = vec3(1.0, 1.0, 0.0);
    vec3 white = vec3(1.0, 1.0, 1.0);
    vec3 electricBlue = vec3(0.27, 0.53, 1.0);
    
    float heat = vNoise * 2.0;
    vec3 color = mix(orange, yellow, heat);
    color = mix(color, white, fresnel * 0.8);
    
    // Electric crackling
    float crackle = sin(vPosition.x * 20.0 + u_time * 10.0) * 
                    sin(vPosition.y * 20.0 - u_time * 8.0) * 
                    sin(vPosition.z * 20.0 + u_time * 6.0);
    crackle = step(0.7, abs(crackle));
    color = mix(color, electricBlue, crackle * 0.5);
    
    color += white * u_audio * 0.5;
    
    gl_FragColor = vec4(color, 0.9);
  }
`;

// Lightning Core
const PlasmaCore = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_audio: { value: 0 },
  }), []);
  
  useFrame(({ clock }) => {
    if (!materialRef.current || !meshRef.current) return;
    materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
    materialRef.current.uniforms.u_audio.value = audioLevel;
    
    const rotSpeed = state === "speaking" ? 0.02 : 0.005;
    meshRef.current.rotation.x += rotSpeed;
    meshRef.current.rotation.y += rotSpeed * 0.7;
  });
  
  return (
    <mesh ref={meshRef}>
      <dodecahedronGeometry args={[0.8, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={plasmaVertexShader}
        fragmentShader={plasmaFragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// Electric Arcs
const ElectricArcs = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const arcCount = 8;
  
  const arcsRef = useRef<{ active: boolean; points: THREE.Vector3[]; life: number }[]>(
    Array.from({ length: arcCount }, () => ({
      active: false,
      points: [],
      life: 0,
    }))
  );
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    
    // Spawn arcs based on state and audio
    const spawnChance = state === "speaking" ? 0.15 : state === "thinking" ? 0.08 : 0.03;
    const extraChance = audioLevel * 0.1;
    
    arcsRef.current.forEach((arc, i) => {
      if (!arc.active && Math.random() < spawnChance + extraChance) {
        arc.active = true;
        arc.life = 0.3 + Math.random() * 0.2;
        
        // Generate jagged lightning path
        const startAngle = Math.random() * Math.PI * 2;
        const endAngle = startAngle + (Math.random() - 0.5) * Math.PI;
        const startR = 0.8;
        const endR = 2.5 + Math.random() * 1.5;
        
        arc.points = [];
        const segments = 8 + Math.floor(Math.random() * 6);
        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          const r = startR + (endR - startR) * t;
          const angle = startAngle + (endAngle - startAngle) * t;
          const jitter = (1 - t) * 0.3;
          
          arc.points.push(new THREE.Vector3(
            Math.cos(angle) * r + (Math.random() - 0.5) * jitter,
            (Math.random() - 0.5) * jitter + t * 0.5,
            Math.sin(angle) * r + (Math.random() - 0.5) * jitter
          ));
        }
      }
      
      if (arc.active) {
        arc.life -= 0.016;
        if (arc.life <= 0) {
          arc.active = false;
        }
      }
    });
    
    // Update line geometries
    groupRef.current.children.forEach((line, i) => {
      const arc = arcsRef.current[i];
      if (arc.active && arc.points.length > 1) {
        const geometry = new THREE.BufferGeometry().setFromPoints(arc.points);
        (line as THREE.Line).geometry.dispose();
        (line as THREE.Line).geometry = geometry;
        (line as THREE.Line).visible = true;
        
        const mat = (line as THREE.Line).material as THREE.LineBasicMaterial;
        mat.opacity = arc.life * 3;
      } else {
        (line as THREE.Line).visible = false;
      }
    });
  });
  
  return (
    <group ref={groupRef}>
      {Array.from({ length: arcCount }, (_, i) => (
        <line key={i}>
          <bufferGeometry />
          <lineBasicMaterial
            color="#88ccff"
            transparent
            opacity={1}
            blending={THREE.AdditiveBlending}
            linewidth={2}
          />
        </line>
      ))}
    </group>
  );
};

// Charged Particle Clouds
const ChargedParticles = ({ state, audioLevel }: { state: AIState; audioLevel: number }) => {
  const positiveRef = useRef<THREE.Points>(null);
  const negativeRef = useRef<THREE.Points>(null);
  const count = 300;
  
  const { positive, negative } = useMemo(() => {
    const positive = new Float32Array(count * 3);
    const negative = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Positive particles - outer orbit
      const theta1 = Math.random() * Math.PI * 2;
      const r1 = 1.5 + Math.random() * 1.5;
      positive[i * 3] = Math.cos(theta1) * r1;
      positive[i * 3 + 1] = (Math.random() - 0.5) * 2;
      positive[i * 3 + 2] = Math.sin(theta1) * r1;
      
      // Negative particles - different orbit
      const theta2 = Math.random() * Math.PI * 2;
      const r2 = 1.2 + Math.random() * 1.2;
      negative[i * 3] = Math.cos(theta2) * r2;
      negative[i * 3 + 1] = (Math.random() - 0.5) * 2;
      negative[i * 3 + 2] = Math.sin(theta2) * r2;
    }
    
    return { positive, negative };
  }, []);
  
  useFrame(({ clock }) => {
    if (!positiveRef.current || !negativeRef.current) return;
    const t = clock.getElapsedTime();
    
    const speed = state === "speaking" ? 3.0 : state === "thinking" ? 2.0 : 1.0;
    
    const posAttr = positiveRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const negAttr = negativeRef.current.geometry.attributes.position as THREE.BufferAttribute;
    
    for (let i = 0; i < count; i++) {
      // Chaotic swirling
      const angle = t * speed * 0.5 + i * 0.01;
      const chaos = Math.sin(t * 2 + i) * 0.02 * (1 + audioLevel);
      
      posAttr.array[i * 3] += Math.cos(angle) * 0.02 + chaos;
      posAttr.array[i * 3 + 2] += Math.sin(angle) * 0.02 + chaos;
      
      negAttr.array[i * 3] -= Math.cos(angle) * 0.02 + chaos;
      negAttr.array[i * 3 + 2] -= Math.sin(angle) * 0.02 + chaos;
      
      // Keep in bounds
      const maxR = 3.5;
      const pr = Math.sqrt(posAttr.array[i * 3] ** 2 + posAttr.array[i * 3 + 2] ** 2);
      if (pr > maxR) {
        posAttr.array[i * 3] *= maxR / pr;
        posAttr.array[i * 3 + 2] *= maxR / pr;
      }
      const nr = Math.sqrt(negAttr.array[i * 3] ** 2 + negAttr.array[i * 3 + 2] ** 2);
      if (nr > maxR) {
        negAttr.array[i * 3] *= maxR / nr;
        negAttr.array[i * 3 + 2] *= maxR / nr;
      }
    }
    
    posAttr.needsUpdate = true;
    negAttr.needsUpdate = true;
  });
  
  return (
    <>
      <points ref={positiveRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positive, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#ff6600"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={negativeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[negative, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#4488ff"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
};

// Magnetic Field Lines
const MagneticFieldLines = ({ state }: { state: AIState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const lineCount = 6;
  
  const curves = useMemo(() => {
    return Array.from({ length: lineCount }, (_, i) => {
      const angle = (i / lineCount) * Math.PI * 2;
      const points: THREE.Vector3[] = [];
      
      for (let t = 0; t <= 1; t += 0.05) {
        const r = 1 + Math.sin(t * Math.PI) * 2;
        const y = (t - 0.5) * 4;
        points.push(new THREE.Vector3(
          Math.cos(angle) * r,
          y,
          Math.sin(angle) * r
        ));
      }
      
      return new THREE.CatmullRomCurve3(points);
    });
  }, []);
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    
    groupRef.current.rotation.y = t * 0.1;
    
    const pulse = state === "speaking" ? 1.2 : 1.0;
    groupRef.current.scale.setScalar(pulse + Math.sin(t * 2) * 0.05);
  });
  
  return (
    <group ref={groupRef}>
      {curves.map((curve, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(curve.getPoints(50).flatMap(p => [p.x, p.y, p.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#ff4444"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}
    </group>
  );
};

export const PlasmaStormScene = ({ state, audioLevel }: PlasmaStormSceneProps) => {
  return (
    <group>
      <PlasmaCore state={state} audioLevel={audioLevel} />
      <ElectricArcs state={state} audioLevel={audioLevel} />
      <ChargedParticles state={state} audioLevel={audioLevel} />
      <MagneticFieldLines state={state} />
    </group>
  );
};
