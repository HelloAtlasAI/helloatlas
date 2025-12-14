import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";
import { ParticlePool } from "../particles/useParticlePool";
import { ParticleTrails } from "../particles/ParticleTrails";

interface MorphingSpherePulseProps {
  state: AIState;
  audioLevel: number;
  pool?: ParticlePool;
  hudVisible?: boolean;
  particleDensity?: number;
  trailLength?: number;
  morphIntensity?: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uPulseStrength;
  uniform float uRippleSpeed;
  uniform float uDensityDivisor;
  
  varying float vPulse;
  varying vec3 vNormal;
  varying float vAudioLevel;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vAudioLevel = uAudioLevel;
    
    vec3 pos = position;
    float dist = length(pos);
    
    // Concentric ripple waves from center
    float ripple1 = sin(dist * 10.0 - uTime * uRippleSpeed) * uPulseStrength;
    float ripple2 = sin(dist * 15.0 - uTime * uRippleSpeed * 1.3) * uPulseStrength * 0.5;
    float ripple3 = sin(dist * 20.0 - uTime * uRippleSpeed * 0.7) * uPulseStrength * 0.25;
    
    float totalRipple = ripple1 + ripple2 + ripple3;
    totalRipple *= (1.0 + uAudioLevel * 2.0);
    
    vPulse = totalRipple;
    pos += normal * totalRipple;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Dynamic density
    float baseSizeMultiplier = 0.35 + uAudioLevel * 0.15;
    gl_PointSize = baseSizeMultiplier * (uDensityDivisor / -mvPosition.z);
  }
`;

const fragmentShader = `
  varying float vPulse;
  varying vec3 vNormal;
  varying float vAudioLevel;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Pulse-reactive colors
    vec3 core = vec3(0.01, 0.015, 0.06);
    vec3 pulse = vec3(0.0, 0.35, 0.5);
    vec3 peak = vec3(0.2, 0.1, 0.4);
    
    float t = vPulse * 3.0 + 0.5;
    vec3 color = mix(core, pulse, smoothstep(0.3, 0.6, t));
    color = mix(color, peak, smoothstep(0.7, 1.0, t) * 0.6);
    
    // Higher alpha for solid appearance
    float alpha = 1.0 - smoothstep(0.1, 0.5, dist);
    alpha *= 0.7;
    
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    alpha += fresnel * 0.1;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export const MorphingSpherePulse = ({ 
  state, 
  audioLevel, 
  pool, 
  hudVisible,
  particleDensity = 75,
  trailLength = 6,
  morphIntensity = 50,
}: MorphingSpherePulseProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothAudioRef = useRef(0);
  const rotationRef = useRef(new THREE.Euler());
  
  // Map morphIntensity (0-100) to pulse and speed
  const basePulseStrength = 0.02 + (morphIntensity / 100) * 0.15;
  const baseRippleSpeed = 1.0 + (morphIntensity / 100) * 4.0;
  
  // Map particleDensity (25-100) to divisor
  const densityDivisor = 200 + (particleDensity / 100) * 200;

  const geometry = useMemo(() => {
    // Detail level 9 for ultra-dense sphere (~655k particles)
    const ico = new THREE.IcosahedronGeometry(0.8, 9);
    const positions = ico.attributes.position.array;
    const normals = ico.attributes.normal.array;
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normals), 3));
    
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uPulseStrength: { value: basePulseStrength },
        uRippleSpeed: { value: baseRippleSpeed },
        uDensityDivisor: { value: densityDivisor },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((frameState) => {
    if (!materialRef.current || !pointsRef.current) return;

    const time = frameState.clock.elapsedTime;
    smoothAudioRef.current = THREE.MathUtils.lerp(smoothAudioRef.current, audioLevel, 0.1);

    // State-based modifiers
    let pulseMultiplier = 1.0;
    let speedMultiplier = 1.0;
    
    switch (state) {
      case "listening":
        pulseMultiplier = 1.4;
        speedMultiplier = 1.3;
        break;
      case "thinking":
        pulseMultiplier = 2.0;
        speedMultiplier = 1.6;
        break;
      case "speaking":
        pulseMultiplier = 1.7;
        speedMultiplier = 1.5;
        break;
    }
    
    const targetPulse = basePulseStrength * pulseMultiplier;
    const targetSpeed = baseRippleSpeed * speedMultiplier;

    const uniforms = materialRef.current.uniforms;
    uniforms.uTime.value = time;
    uniforms.uAudioLevel.value = smoothAudioRef.current;
    uniforms.uPulseStrength.value = THREE.MathUtils.lerp(uniforms.uPulseStrength.value, targetPulse, 0.05);
    uniforms.uRippleSpeed.value = THREE.MathUtils.lerp(uniforms.uRippleSpeed.value, targetSpeed, 0.05);
    uniforms.uDensityDivisor.value = THREE.MathUtils.lerp(uniforms.uDensityDivisor.value, densityDivisor, 0.05);

    pointsRef.current.rotation.y += 0.001;
    rotationRef.current.copy(pointsRef.current.rotation);
  });

  return (
    <group>
      <points ref={pointsRef} geometry={geometry}>
        <primitive object={material} ref={materialRef} attach="material" />
      </points>
      <ParticleTrails 
        state={state} 
        audioLevel={smoothAudioRef.current} 
        sphereGeometry={geometry}
        sphereRotation={rotationRef.current}
        trailLength={trailLength}
      />
    </group>
  );
};