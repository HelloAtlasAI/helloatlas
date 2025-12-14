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
  children?: React.ReactNode;
}

const hudVertexShader = `
  uniform float uTime;
  uniform float uFormationProgress;
  uniform vec3 uTargetPosition;
  uniform float uWidth;
  uniform float uHeight;
  
  attribute vec3 aOriginalPosition;
  attribute float aDelay;
  
  varying float vAlpha;
  varying float vFormation;
  
  void main() {
    vFormation = uFormationProgress;
    
    // Calculate target position within HUD bounds
    vec3 targetPos = uTargetPosition + vec3(
      (aOriginalPosition.x - 0.5) * uWidth,
      (aOriginalPosition.y - 0.5) * uHeight,
      0.0
    );
    
    // Delayed formation per particle
    float delayedProgress = clamp((uFormationProgress - aDelay * 0.3) / 0.7, 0.0, 1.0);
    delayedProgress = smoothstep(0.0, 1.0, delayedProgress);
    
    // Interpolate from original universe position to HUD position
    vec3 pos = mix(position, targetPos, delayedProgress);
    
    // Add subtle drift when formed
    if (delayedProgress > 0.9) {
      pos += vec3(
        sin(uTime * 2.0 + aDelay * 10.0) * 0.01,
        cos(uTime * 1.5 + aDelay * 8.0) * 0.01,
        0.0
      );
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = (1.5 + delayedProgress) * (100.0 / -mvPosition.z);
    
    vAlpha = 0.2 + delayedProgress * 0.4;
  }
`;

const hudFragmentShader = `
  uniform vec3 uColor;
  
  varying float vAlpha;
  varying float vFormation;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - smoothstep(0.2, 0.5, dist)) * vAlpha;
    
    // Glow effect when forming
    vec3 color = uColor;
    if (vFormation > 0.5 && vFormation < 1.0) {
      color += vec3(0.1, 0.1, 0.2) * (1.0 - abs(vFormation - 0.75) * 4.0);
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export const ParticleHUDElement = ({
  visible,
  position,
  width,
  height,
  particleCount = 500,
  formationDuration = 0.8,
  dissolveDuration = 0.5,
  color = [0.1, 0.3, 0.5],
}: ParticleHUDElementProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [formationProgress, setFormationProgress] = useState(0);
  const targetProgressRef = useRef(0);

  useEffect(() => {
    targetProgressRef.current = visible ? 1 : 0;
  }, [visible]);

  const geometry = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const delays = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Start from random universe positions
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 5;
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      // Target positions within HUD bounds (normalized 0-1)
      originalPositions[i3] = Math.random();
      originalPositions[i3 + 1] = Math.random();
      originalPositions[i3 + 2] = 0;
      
      delays[i] = Math.random();
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aOriginalPosition", new THREE.BufferAttribute(originalPositions, 3));
    geo.setAttribute("aDelay", new THREE.BufferAttribute(delays, 1));
    
    return geo;
  }, [particleCount]);

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
        uColor: { value: new THREE.Vector3(...color) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [position, width, height, color]);

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
