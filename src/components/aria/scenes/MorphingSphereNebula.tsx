import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface MorphingSphereNebulaProps {
  state: AIState;
  audioLevel: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uDispersion;
  
  attribute float aRandomness;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float time = uTime * 0.2;
    
    vec3 pos = position;
    
    // Gaseous dispersion
    float disperseAmount = uDispersion * (0.5 + aRandomness);
    pos += normal * sin(time + aRandomness * 10.0) * disperseAmount;
    pos += vec3(
      sin(time * 0.7 + aRandomness * 5.0),
      cos(time * 0.5 + aRandomness * 7.0),
      sin(time * 0.3 + aRandomness * 3.0)
    ) * disperseAmount * 0.5;
    
    // Audio reactivity - gentle expansion
    pos *= 1.0 + uAudioLevel * 0.1;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Varied sizes for cloud effect
    float size = 1.5 + aRandomness * 2.0;
    gl_PointSize = size * (90.0 / -mvPosition.z);
    
    // Distance-based alpha
    float dist = length(pos);
    vAlpha = 0.15 * (1.0 - smoothstep(0.5, 1.5, dist));
    
    // Soft purple-blue nebula colors
    vColor = mix(
      vec3(0.02, 0.03, 0.12),
      vec3(0.15, 0.03, 0.25),
      aRandomness
    );
    vColor += vec3(0.0, 0.1, 0.15) * uAudioLevel;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Very soft falloff for cloud effect
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= vAlpha;
    alpha = pow(alpha, 0.7); // Softer edges
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export const MorphingSphereNebula = ({ state, audioLevel }: MorphingSphereNebulaProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothAudioRef = useRef(0);

  const geometry = useMemo(() => {
    const count = 100000;
    const positions = new Float32Array(count * 3);
    const randomness = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Spherical distribution with gaussian falloff
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.8 * Math.pow(Math.random(), 0.3);
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      randomness[i] = Math.random();
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 1));
    
    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uDispersion: { value: 0.3 },
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

    let targetDispersion = 0.3;
    switch (state) {
      case "listening": targetDispersion = 0.4; break;
      case "thinking": targetDispersion = 0.6; break;
      case "speaking": targetDispersion = 0.5; break;
    }

    const uniforms = materialRef.current.uniforms;
    uniforms.uTime.value = time;
    uniforms.uAudioLevel.value = smoothAudioRef.current;
    uniforms.uDispersion.value = THREE.MathUtils.lerp(uniforms.uDispersion.value, targetDispersion, 0.03);

    pointsRef.current.rotation.y += 0.0005;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
};
