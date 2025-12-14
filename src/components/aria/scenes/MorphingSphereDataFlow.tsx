import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";
import { ParticlePool } from "../particles/useParticlePool";

interface MorphingSphereDataFlowProps {
  state: AIState;
  audioLevel: number;
  pool?: ParticlePool;
  hudVisible?: boolean;
}

// Core sphere shader
const coreVertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  
  varying float vDisplacement;
  varying vec3 vNormal;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    
    vec3 pos = position;
    float displacement = sin(pos.x * 5.0 + uTime) * cos(pos.y * 5.0 + uTime * 0.7) * 0.05;
    displacement += uAudioLevel * 0.08;
    
    vDisplacement = displacement;
    pos += normal * displacement;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = (0.8 + uAudioLevel * 0.4) * (80.0 / -mvPosition.z);
  }
`;

const coreFragmentShader = `
  varying float vDisplacement;
  varying vec3 vNormal;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    vec3 core = vec3(0.01, 0.02, 0.08);
    vec3 glow = vec3(0.0, 0.3, 0.5);
    
    float t = vDisplacement * 5.0 + 0.5;
    vec3 color = mix(core, glow, smoothstep(0.3, 0.7, t));
    
    float alpha = (1.0 - smoothstep(0.2, 0.5, dist)) * 0.4;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Orbital ring shader
const ringVertexShader = `
  uniform float uTime;
  uniform float uRingIndex;
  uniform float uAudioLevel;
  uniform float uOrbitSpeed;
  
  attribute float aAngle;
  attribute float aSpeed;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float angle = aAngle + uTime * aSpeed * uOrbitSpeed;
    float radius = 1.2 + uRingIndex * 0.3;
    
    // Orbital position
    vec3 pos;
    if (uRingIndex < 0.5) {
      // XY plane
      pos = vec3(cos(angle) * radius, sin(angle) * radius, 0.0);
    } else if (uRingIndex < 1.5) {
      // XZ plane
      pos = vec3(cos(angle) * radius, 0.0, sin(angle) * radius);
    } else {
      // Tilted plane
      pos = vec3(
        cos(angle) * radius,
        sin(angle) * radius * 0.5,
        sin(angle) * radius * 0.866
      );
    }
    
    // Add wave motion
    pos += normalize(pos) * sin(angle * 3.0 + uTime * 2.0) * 0.05 * (1.0 + uAudioLevel);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = (1.0 + uAudioLevel * 0.5) * (60.0 / -mvPosition.z);
    
    vAlpha = 0.3 + sin(angle * 2.0) * 0.1;
    
    // Color based on ring
    vec3 colors[3];
    colors[0] = vec3(0.0, 0.3, 0.5);
    colors[1] = vec3(0.2, 0.1, 0.4);
    colors[2] = vec3(0.1, 0.3, 0.3);
    
    int idx = int(uRingIndex);
    vColor = colors[idx];
  }
`;

const ringFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - smoothstep(0.2, 0.5, dist)) * vAlpha;
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

const OrbitalRing = ({ ringIndex, audioLevel, state }: { ringIndex: number; audioLevel: number; state: AIState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const count = 800;
    const positions = new Float32Array(count * 3);
    const angles = new Float32Array(count);
    const speeds = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      angles[i] = (i / count) * Math.PI * 2;
      speeds[i] = 0.8 + Math.random() * 0.4;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: ringVertexShader,
      fragmentShader: ringFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uRingIndex: { value: ringIndex },
        uAudioLevel: { value: 0 },
        uOrbitSpeed: { value: 0.5 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [ringIndex]);

  useFrame((frameState) => {
    if (!materialRef.current) return;

    let targetSpeed = 0.5;
    switch (state) {
      case "listening": targetSpeed = 0.8; break;
      case "thinking": targetSpeed = 1.5; break;
      case "speaking": targetSpeed = 1.0; break;
    }

    const uniforms = materialRef.current.uniforms;
    uniforms.uTime.value = frameState.clock.elapsedTime;
    uniforms.uAudioLevel.value = audioLevel;
    uniforms.uOrbitSpeed.value = THREE.MathUtils.lerp(uniforms.uOrbitSpeed.value, targetSpeed, 0.05);
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
};

export const MorphingSphereDataFlow = ({ state, audioLevel, pool, hudVisible }: MorphingSphereDataFlowProps) => {
  const coreRef = useRef<THREE.Points>(null);
  const coreMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothAudioRef = useRef(0);

  const coreGeometry = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(0.5, 7);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(ico.attributes.position.array), 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(ico.attributes.normal.array), 3));
    return geo;
  }, []);

  const coreMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((frameState) => {
    if (!coreMaterialRef.current || !coreRef.current) return;

    const time = frameState.clock.elapsedTime;
    smoothAudioRef.current = THREE.MathUtils.lerp(smoothAudioRef.current, audioLevel, 0.1);

    coreMaterialRef.current.uniforms.uTime.value = time;
    coreMaterialRef.current.uniforms.uAudioLevel.value = smoothAudioRef.current;

    coreRef.current.rotation.y += 0.002;
  });

  return (
    <group>
      {/* Central core */}
      <points ref={coreRef} geometry={coreGeometry}>
        <primitive object={coreMaterial} ref={coreMaterialRef} attach="material" />
      </points>
      
      {/* Orbital rings */}
      <OrbitalRing ringIndex={0} audioLevel={smoothAudioRef.current} state={state} />
      <OrbitalRing ringIndex={1} audioLevel={smoothAudioRef.current} state={state} />
      <OrbitalRing ringIndex={2} audioLevel={smoothAudioRef.current} state={state} />
    </group>
  );
};
