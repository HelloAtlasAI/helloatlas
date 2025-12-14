import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface MorphingSphereCrystalProps {
  state: AIState;
  audioLevel: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uFacetStrength;
  
  varying float vFacet;
  varying vec3 vNormal;
  varying float vAudioLevel;
  
  // Quantize position to create faceted look
  vec3 quantize(vec3 p, float steps) {
    return floor(p * steps) / steps;
  }
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vAudioLevel = uAudioLevel;
    
    vec3 pos = position;
    
    // Create angular, crystalline deformation
    float angle = atan(pos.y, pos.x);
    float facetAngle = floor(angle * 8.0) / 8.0 * 3.14159 * 2.0;
    
    // Sharp geometric displacement
    float displacement = sin(facetAngle * 3.0 + uTime * 0.5) * uFacetStrength;
    displacement += cos(pos.z * 5.0 + uTime * 0.3) * uFacetStrength * 0.5;
    
    // Audio adds sharpness
    displacement += uAudioLevel * 0.1;
    
    vFacet = displacement;
    pos += normal * displacement;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float baseSizeMultiplier = 0.8 + uAudioLevel * 0.4;
    gl_PointSize = baseSizeMultiplier * (90.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  varying float vFacet;
  varying vec3 vNormal;
  varying float vAudioLevel;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Crystal color palette - cool blue-white with sharp edges
    vec3 darkBlue = vec3(0.01, 0.02, 0.08);
    vec3 crystalBlue = vec3(0.1, 0.25, 0.4);
    vec3 highlight = vec3(0.4, 0.5, 0.7);
    
    float t = vFacet * 2.0 + 0.5;
    vec3 color = mix(darkBlue, crystalBlue, smoothstep(0.0, 0.5, t));
    color = mix(color, highlight, smoothstep(0.7, 1.0, t) * 0.5);
    
    // Sharp falloff for crystalline look
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    alpha *= 0.4;
    
    // Edge highlighting
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
    alpha += fresnel * 0.08;
    color += highlight * fresnel * 0.3;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export const MorphingSphereCrystal = ({ state, audioLevel }: MorphingSphereCrystalProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const smoothAudioRef = useRef(0);

  const geometry = useMemo(() => {
    // Higher subdivision for more detailed crystalline look
    const ico = new THREE.IcosahedronGeometry(0.8, 7);
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
        uFacetStrength: { value: 0.1 },
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

    let targetFacet = 0.1;
    switch (state) {
      case "listening": targetFacet = 0.15; break;
      case "thinking": targetFacet = 0.25; break;
      case "speaking": targetFacet = 0.2; break;
    }

    const uniforms = materialRef.current.uniforms;
    uniforms.uTime.value = time;
    uniforms.uAudioLevel.value = smoothAudioRef.current;
    uniforms.uFacetStrength.value = THREE.MathUtils.lerp(uniforms.uFacetStrength.value, targetFacet, 0.05);

    // Slower, more deliberate rotation
    pointsRef.current.rotation.y += 0.002;
    pointsRef.current.rotation.x = Math.sin(time * 0.05) * 0.1;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
};
