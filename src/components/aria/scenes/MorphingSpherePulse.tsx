import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";
import { ParticlePool, ParticleState } from "../particles/useParticlePool";

interface MorphingSpherePulseProps {
  state: AIState;
  audioLevel: number;
  pool?: ParticlePool;
  hudVisible?: boolean;
}

const vertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uPulseStrength;
  uniform float uRippleSpeed;
  
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
    
    float baseSizeMultiplier = 1.0 + uAudioLevel * 0.6;
    gl_PointSize = baseSizeMultiplier * (100.0 / -mvPosition.z);
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
    
    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
    alpha *= 0.35;
    
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    alpha += fresnel * 0.06;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export const MorphingSpherePulse = ({ state, audioLevel, pool, hudVisible }: MorphingSpherePulseProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothAudioRef = useRef(0);

  const geometry = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(0.8, 8);
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
        uPulseStrength: { value: 0.05 },
        uRippleSpeed: { value: 2.0 },
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

    let targetPulse = 0.05;
    let targetSpeed = 2.0;
    
    switch (state) {
      case "listening":
        targetPulse = 0.08;
        targetSpeed = 3.0;
        break;
      case "thinking":
        targetPulse = 0.12;
        targetSpeed = 4.0;
        break;
      case "speaking":
        targetPulse = 0.1;
        targetSpeed = 3.5;
        break;
    }

    const uniforms = materialRef.current.uniforms;
    uniforms.uTime.value = time;
    uniforms.uAudioLevel.value = smoothAudioRef.current;
    uniforms.uPulseStrength.value = THREE.MathUtils.lerp(uniforms.uPulseStrength.value, targetPulse, 0.05);
    uniforms.uRippleSpeed.value = THREE.MathUtils.lerp(uniforms.uRippleSpeed.value, targetSpeed, 0.05);

    pointsRef.current.rotation.y += 0.001;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
};
