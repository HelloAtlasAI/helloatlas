import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface MorphingSphereClassicProps {
  state: AIState;
  audioLevel: number;
}

const vertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uMorphStrength;
  uniform float uNoiseSpeed;
  
  varying float vDisplacement;
  varying vec3 vNormal;
  varying float vAudioLevel;
  
  // Simplex noise
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

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vAudioLevel = uAudioLevel;
    
    float time = uTime * uNoiseSpeed;
    vec3 pos = position;
    
    float noise1 = snoise(pos * 1.5 + time * 0.3);
    float noise2 = snoise(pos * 3.0 + time * 0.5) * 0.5;
    float noise3 = snoise(pos * 6.0 + time * 0.7) * 0.25;
    
    float displacement = (noise1 + noise2 + noise3) * uMorphStrength;
    displacement += uAudioLevel * 0.15;
    
    vDisplacement = displacement;
    pos += normal * displacement;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float baseSizeMultiplier = 1.2 + uAudioLevel * 0.8;
    gl_PointSize = baseSizeMultiplier * (200.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  varying float vDisplacement;
  varying vec3 vNormal;
  varying float vAudioLevel;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Dimmer color palette
    vec3 deepBlue = vec3(0.008, 0.02, 0.1);
    vec3 cyan = vec3(0.0, 0.4, 0.6);
    vec3 purple = vec3(0.25, 0.05, 0.4);
    vec3 white = vec3(0.7, 0.7, 0.85);
    
    float t = vDisplacement * 0.5 + 0.5;
    vec3 color = mix(deepBlue, cyan, smoothstep(0.0, 0.4, t));
    color = mix(color, purple, smoothstep(0.4, 0.7, t));
    color = mix(color, white, smoothstep(0.8, 1.0, t) * 0.3);
    
    color += vec3(0.0, 0.05, 0.1) * vAudioLevel;
    
    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
    alpha *= 0.35;
    
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
    alpha += fresnel * 0.05;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export const MorphingSphereClassic = ({ state, audioLevel }: MorphingSphereClassicProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const smoothAudioRef = useRef(0);
  const targetMorphRef = useRef(0.15);
  const targetSpeedRef = useRef(0.3);

  const geometry = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(0.8, 7);
    const positions = ico.attributes.position.array;
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    particleGeometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(ico.attributes.normal.array), 3));
    return particleGeometry;
  }, []);

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
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((frameState, delta) => {
    if (!materialRef.current || !pointsRef.current) return;

    const time = frameState.clock.elapsedTime;

    switch (state) {
      case "listening": targetMorphRef.current = 0.25; targetSpeedRef.current = 0.5; break;
      case "thinking": targetMorphRef.current = 0.35; targetSpeedRef.current = 0.8; break;
      case "speaking": targetMorphRef.current = 0.3; targetSpeedRef.current = 0.6; break;
      default: targetMorphRef.current = 0.15; targetSpeedRef.current = 0.3;
    }

    smoothAudioRef.current = THREE.MathUtils.lerp(smoothAudioRef.current, audioLevel, 0.1);

    const uniforms = materialRef.current.uniforms;
    uniforms.uTime.value = time;
    uniforms.uAudioLevel.value = smoothAudioRef.current;
    uniforms.uMorphStrength.value = THREE.MathUtils.lerp(uniforms.uMorphStrength.value, targetMorphRef.current, 0.05);
    uniforms.uNoiseSpeed.value = THREE.MathUtils.lerp(uniforms.uNoiseSpeed.value, targetSpeedRef.current, 0.05);

    pointsRef.current.rotation.y += 0.001;
    pointsRef.current.rotation.x = Math.sin(time * 0.1) * 0.05;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} ref={materialRef} attach="material" />
    </points>
  );
};
