import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface MorphingSphereSceneProps {
  state: AIState;
  audioLevel: number;
}

// Simplex 3D Noise GLSL
const simplexNoise = `
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

const vertexShader = `
  ${simplexNoise}
  
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uMorphStrength;
  uniform float uNoiseSpeed;
  
  varying float vDisplacement;
  varying float vDistanceFromCenter;
  varying vec3 vNormal;
  
  void main() {
    vec3 pos = position;
    vec3 nPos = normalize(position);
    
    // Multi-octave noise for organic deformation
    float noise1 = snoise(pos * 1.5 + uTime * uNoiseSpeed * 0.3) * 0.6;
    float noise2 = snoise(pos * 3.0 + uTime * uNoiseSpeed * 0.5) * 0.3;
    float noise3 = snoise(pos * 6.0 + uTime * uNoiseSpeed * 0.7) * 0.1;
    float totalNoise = noise1 + noise2 + noise3;
    
    // Audio-reactive morph intensity
    float morphAmount = uMorphStrength * (1.0 + uAudioLevel * 2.5);
    
    // Breathing effect
    float breathing = sin(uTime * 0.8) * 0.05 + 1.0;
    
    // Displace along normal direction
    pos += nPos * totalNoise * morphAmount * breathing;
    
    vDisplacement = totalNoise;
    vDistanceFromCenter = length(pos);
    vNormal = nPos;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Dynamic particle size based on depth and audio (reduced)
    float baseSizeMultiplier = 1.5 + uAudioLevel * 1.0;
    gl_PointSize = baseSizeMultiplier * (250.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  
  varying float vDisplacement;
  varying float vDistanceFromCenter;
  varying vec3 vNormal;
  
  void main() {
    // Circular particle shape with soft edges
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Color palette: deep blue → cyan → purple (muted)
    vec3 deepBlue = vec3(0.01, 0.03, 0.15);
    vec3 cyan = vec3(0.0, 0.55, 0.8);
    vec3 purple = vec3(0.35, 0.08, 0.55);
    vec3 white = vec3(0.9, 0.9, 1.0);
    
    // Gradient based on displacement height
    float t = vDisplacement * 0.5 + 0.5;
    vec3 color = mix(deepBlue, cyan, smoothstep(0.0, 0.5, t));
    color = mix(color, purple, smoothstep(0.4, 0.8, abs(vDisplacement)));
    
    // Add white highlights on peaks
    color = mix(color, white, smoothstep(0.65, 1.0, t) * 0.5);
    
    // Add subtle audio-reactive color shift
    color += vec3(0.0, 0.1, 0.15) * uAudioLevel;
    
    // Soft circular falloff
    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
    alpha *= 0.5;
    
    // Fresnel-like edge glow (reduced)
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    alpha += fresnel * 0.08;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export const MorphingSphereScene = ({ state, audioLevel }: MorphingSphereSceneProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Smooth interpolation targets
  const smoothAudio = useRef(0);
  const smoothMorph = useRef(0.15);
  const smoothNoiseSpeed = useRef(0.3);
  
  // Create particle geometry from icosahedron
  const geometry = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(0.8, 7); // 60% smaller
    const positions = ico.attributes.position.array;
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    
    // Add random attribute for variation
    const count = positions.length / 3;
    const randoms = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      randoms[i] = Math.random();
    }
    particleGeometry.setAttribute(
      "aRandom",
      new THREE.Float32BufferAttribute(randoms, 1)
    );
    
    return particleGeometry;
  }, []);
  
  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uMorphStrength: { value: 0.15 },
        uNoiseSpeed: { value: 0.3 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);
  
  useFrame((rootState) => {
    if (!materialRef.current || !pointsRef.current) return;
    
    const elapsed = rootState.clock.getElapsedTime();
    
    // State-based morph parameters
    let targetMorph = 0.15;
    let targetNoiseSpeed = 0.3;
    
    switch (state) {
      case "listening":
        targetMorph = 0.25;
        targetNoiseSpeed = 0.5;
        break;
      case "thinking":
        targetMorph = 0.4;
        targetNoiseSpeed = 0.8;
        break;
      case "speaking":
        targetMorph = 0.55 + audioLevel * 0.4;
        targetNoiseSpeed = 1.0 + audioLevel * 0.5;
        break;
      default: // idle
        targetMorph = 0.15;
        targetNoiseSpeed = 0.3;
    }
    
    // Smooth interpolation
    smoothAudio.current = THREE.MathUtils.lerp(smoothAudio.current, audioLevel, 0.12);
    smoothMorph.current = THREE.MathUtils.lerp(smoothMorph.current, targetMorph, 0.06);
    smoothNoiseSpeed.current = THREE.MathUtils.lerp(smoothNoiseSpeed.current, targetNoiseSpeed, 0.08);
    
    // Update uniforms
    materialRef.current.uniforms.uTime.value = elapsed;
    materialRef.current.uniforms.uAudioLevel.value = smoothAudio.current;
    materialRef.current.uniforms.uMorphStrength.value = smoothMorph.current;
    materialRef.current.uniforms.uNoiseSpeed.value = smoothNoiseSpeed.current;
    
    // Gentle rotation
    const rotationSpeed = 0.03 + smoothAudio.current * 0.05;
    pointsRef.current.rotation.y = elapsed * rotationSpeed;
    pointsRef.current.rotation.x = Math.sin(elapsed * 0.15) * 0.1;
  });
  
  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
};