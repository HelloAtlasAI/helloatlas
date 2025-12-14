import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ParticleHUDElementProps {
  visible: boolean;
  position: [number, number, number];
  width: number;
  height: number;
  particleCount?: number;
  formationDuration?: number;
  dissolveDuration?: number;
  color?: [number, number, number];
  cornerRadius?: number;
}

const hudVertexShader = `
  uniform float uTime;
  uniform float uFormationProgress;
  uniform vec3 uTargetPosition;
  uniform float uWidth;
  uniform float uHeight;
  uniform float uCornerRadius;
  
  attribute vec3 aTargetLocal;
  attribute float aDelay;
  attribute float aParticleType; // 0: border, 1: interior, 2: highlight, 3: glow
  
  varying float vAlpha;
  varying float vFormation;
  varying float vParticleType;
  varying vec2 vLocalPos;
  
  void main() {
    vFormation = uFormationProgress;
    vParticleType = aParticleType;
    vLocalPos = aTargetLocal.xy;
    
    // Calculate target position within HUD bounds
    vec3 targetPos = uTargetPosition + vec3(
      aTargetLocal.x * uWidth,
      aTargetLocal.y * uHeight,
      0.0
    );
    
    // Staggered formation per particle type
    float typeDelay = aParticleType * 0.1;
    float delayedProgress = clamp((uFormationProgress - aDelay * 0.2 - typeDelay) / 0.6, 0.0, 1.0);
    delayedProgress = smoothstep(0.0, 1.0, delayedProgress);
    delayedProgress = delayedProgress * delayedProgress * (3.0 - 2.0 * delayedProgress); // Smooth cubic
    
    // Interpolate from original universe position to HUD position
    vec3 pos = mix(position, targetPos, delayedProgress);
    
    // Add subtle drift when formed
    if (delayedProgress > 0.9) {
      float driftAmount = 0.003;
      pos += vec3(
        sin(uTime * 2.0 + aDelay * 10.0) * driftAmount,
        cos(uTime * 1.5 + aDelay * 8.0) * driftAmount,
        0.0
      );
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size varies by particle type
    float baseSize = 0.8;
    if (aParticleType < 0.5) {
      baseSize = 1.2; // Border particles slightly larger
    } else if (aParticleType > 1.5 && aParticleType < 2.5) {
      baseSize = 1.5; // Highlight particles
    } else if (aParticleType > 2.5) {
      baseSize = 1.3; // Glow particles
    }
    
    gl_PointSize = (baseSize + delayedProgress * 0.3) * (120.0 / -mvPosition.z);
    
    // Alpha varies by type and position
    float borderDist = min(min(abs(aTargetLocal.x + 0.5), abs(aTargetLocal.x - 0.5)), 
                          min(abs(aTargetLocal.y + 0.5), abs(aTargetLocal.y - 0.5)));
    
    if (aParticleType < 0.5) {
      vAlpha = 0.6 + delayedProgress * 0.3; // Border: high opacity
    } else if (aParticleType < 1.5) {
      // Interior: gradient from edges to center (glassmorphic effect)
      float edgeDist = 1.0 - borderDist * 2.0;
      vAlpha = (0.15 + edgeDist * 0.25) * delayedProgress;
    } else if (aParticleType < 2.5) {
      vAlpha = 0.7 + delayedProgress * 0.2; // Top highlight
    } else {
      vAlpha = 0.4 + delayedProgress * 0.2; // Bottom glow
    }
  }
`;

const hudFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  
  varying float vAlpha;
  varying float vFormation;
  varying float vParticleType;
  varying vec2 vLocalPos;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - smoothstep(0.1, 0.5, dist)) * vAlpha;
    
    // Color varies by particle type
    vec3 color = uColor;
    
    if (vParticleType < 0.5) {
      // Border: brighter, more saturated
      color = uColor * 1.5 + vec3(0.1, 0.15, 0.2);
    } else if (vParticleType < 1.5) {
      // Interior: subtle gradient
      float gradientY = vLocalPos.y + 0.5;
      color = mix(uColor * 0.6, uColor * 0.9, gradientY);
      color += vec3(0.02, 0.03, 0.05); // Slight frosted look
    } else if (vParticleType < 2.5) {
      // Top highlight: white-ish glow
      color = vec3(0.4, 0.5, 0.6) + uColor * 0.3;
    } else {
      // Bottom glow: subtle reflection
      color = uColor * 0.8 + vec3(0.05, 0.08, 0.12);
    }
    
    // Formation glow effect
    if (vFormation > 0.3 && vFormation < 0.95) {
      float glowIntensity = sin((vFormation - 0.3) * 3.14159 / 0.65) * 0.3;
      color += vec3(0.1, 0.15, 0.25) * glowIntensity;
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Helper to distribute particles in a glassmorphic card shape
const createCardParticles = (
  count: number, 
  width: number, 
  height: number, 
  cornerRadius: number
): { positions: Float32Array; targetLocal: Float32Array; delays: Float32Array; particleTypes: Float32Array } => {
  const positions = new Float32Array(count * 3);
  const targetLocal = new Float32Array(count * 3);
  const delays = new Float32Array(count);
  const particleTypes = new Float32Array(count);
  
  const borderCount = Math.floor(count * 0.25);
  const interiorCount = Math.floor(count * 0.55);
  const highlightCount = Math.floor(count * 0.12);
  const glowCount = count - borderCount - interiorCount - highlightCount;
  
  let idx = 0;
  
  // Border particles (25%)
  for (let i = 0; i < borderCount; i++) {
    const t = i / borderCount;
    let x, y;
    
    // Distribute along perimeter with rounded corners
    const perimeter = 2 * (width + height);
    const pos = t * perimeter;
    
    if (pos < width) {
      x = pos / width - 0.5;
      y = 0.5;
    } else if (pos < width + height) {
      x = 0.5;
      y = 0.5 - (pos - width) / height;
    } else if (pos < 2 * width + height) {
      x = 0.5 - (pos - width - height) / width;
      y = -0.5;
    } else {
      x = -0.5;
      y = -0.5 + (pos - 2 * width - height) / height;
    }
    
    // Add slight randomness
    x += (Math.random() - 0.5) * 0.02;
    y += (Math.random() - 0.5) * 0.02;
    
    setParticle(idx, x, y, 0, positions, targetLocal, delays, particleTypes);
    idx++;
  }
  
  // Interior particles (55%) - gradient density
  for (let i = 0; i < interiorCount; i++) {
    // Bias toward edges for glassmorphic effect
    let x = Math.random() - 0.5;
    let y = Math.random() - 0.5;
    
    // Push particles toward edges
    const edgeBias = 0.3;
    if (Math.random() < edgeBias) {
      if (Math.random() < 0.5) {
        x = x > 0 ? 0.3 + Math.random() * 0.15 : -0.3 - Math.random() * 0.15;
      } else {
        y = y > 0 ? 0.3 + Math.random() * 0.15 : -0.3 - Math.random() * 0.15;
      }
    }
    
    // Keep within bounds with corner radius
    x = Math.max(-0.45, Math.min(0.45, x));
    y = Math.max(-0.45, Math.min(0.45, y));
    
    setParticle(idx, x, y, 1, positions, targetLocal, delays, particleTypes);
    idx++;
  }
  
  // Top highlight particles (12%)
  for (let i = 0; i < highlightCount; i++) {
    const x = (Math.random() - 0.5) * 0.85;
    const y = 0.42 + Math.random() * 0.06;
    
    setParticle(idx, x, y, 2, positions, targetLocal, delays, particleTypes);
    idx++;
  }
  
  // Bottom glow particles (8%)
  for (let i = 0; i < glowCount; i++) {
    const x = (Math.random() - 0.5) * 0.8;
    const y = -0.42 - Math.random() * 0.06;
    
    setParticle(idx, x, y, 3, positions, targetLocal, delays, particleTypes);
    idx++;
  }
  
  return { positions, targetLocal, delays, particleTypes };
};

const setParticle = (
  idx: number, 
  x: number, 
  y: number, 
  type: number,
  positions: Float32Array,
  targetLocal: Float32Array,
  delays: Float32Array,
  particleTypes: Float32Array
) => {
  const i3 = idx * 3;
  
  // Random starting positions in universe
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = 4 + Math.random() * 6;
  
  positions[i3] = r * Math.sin(phi) * Math.cos(theta);
  positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  positions[i3 + 2] = r * Math.cos(phi);
  
  targetLocal[i3] = x;
  targetLocal[i3 + 1] = y;
  targetLocal[i3 + 2] = 0;
  
  delays[idx] = Math.random();
  particleTypes[idx] = type;
};

export const ParticleHUDElement = ({
  visible,
  position,
  width,
  height,
  particleCount = 6000,
  formationDuration = 1.2,
  dissolveDuration = 0.6,
  color = [0.1, 0.3, 0.5],
  cornerRadius = 0.1,
}: ParticleHUDElementProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [formationProgress, setFormationProgress] = useState(0);
  const targetProgressRef = useRef(0);

  useEffect(() => {
    targetProgressRef.current = visible ? 1 : 0;
  }, [visible]);

  const geometry = useMemo(() => {
    const { positions, targetLocal, delays, particleTypes } = createCardParticles(
      particleCount, width, height, cornerRadius
    );
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aTargetLocal", new THREE.BufferAttribute(targetLocal, 3));
    geo.setAttribute("aDelay", new THREE.BufferAttribute(delays, 1));
    geo.setAttribute("aParticleType", new THREE.BufferAttribute(particleTypes, 1));
    
    return geo;
  }, [particleCount, width, height, cornerRadius]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: hudVertexShader,
      fragmentShader: hudFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uFormationProgress: { value: 0 },
        uTargetPosition: { value: new THREE.Vector3(...position) },
        uWidth: { value: width },
        uHeight: { value: height },
        uCornerRadius: { value: cornerRadius },
        uColor: { value: new THREE.Vector3(...color) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [position, width, height, cornerRadius, color]);

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    const time = state.clock.elapsedTime;
    
    // Smooth formation/dissolution
    const speed = targetProgressRef.current > formationProgress 
      ? 1 / formationDuration 
      : 1 / dissolveDuration;
    
    const newProgress = THREE.MathUtils.lerp(
      formationProgress,
      targetProgressRef.current,
      Math.min(delta * speed * 2, 1)
    );
    setFormationProgress(newProgress);

    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uFormationProgress.value = newProgress;
  });

  if (formationProgress < 0.01 && !visible) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
};