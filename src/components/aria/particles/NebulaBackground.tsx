import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface NebulaBackgroundProps {
  state: AIState;
  audioLevel: number;
}

// Optimized cosmic gas stream shader
const gasStreamVertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uDriftSpeed;
  
  attribute float aProgress;
  attribute float aRandomness;
  attribute vec3 aCurveDirection;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    vec3 pos = position;
    
    // Simplified drift
    float driftPhase = uTime * uDriftSpeed * 0.12;
    float driftAmount = sin(driftPhase + aProgress * 6.28) * 0.4;
    pos += aCurveDirection * driftAmount;
    
    // Gentle wave
    vec3 perp = normalize(cross(aCurveDirection, vec3(0.0, 1.0, 0.0)));
    float wave = sin(aProgress * 6.0 + uTime * 0.4) * 0.15;
    pos += perp * wave;
    
    pos *= 1.0 + uAudioLevel * 0.025;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float size = 0.6 + aRandomness * 0.9;
    gl_PointSize = size * (100.0 / -mvPosition.z);
    
    float distFade = 1.0 - smoothstep(2.5, 6.0, length(pos));
    float streamFade = sin(aProgress * 3.14159) * 0.7 + 0.3;
    vAlpha = distFade * streamFade * 0.2;
    
    // Purple/magenta colors
    vec3 colorDeep = vec3(0.06, 0.015, 0.12);
    vec3 colorMid = vec3(0.18, 0.04, 0.22);
    vec3 colorBright = vec3(0.3, 0.08, 0.35);
    
    float colorMix = aRandomness;
    if (colorMix < 0.33) {
      vColor = mix(colorDeep, colorMid, colorMix * 3.0);
    } else if (colorMix < 0.66) {
      vColor = mix(colorMid, colorBright, (colorMix - 0.33) * 3.0);
    } else {
      vColor = mix(colorBright, colorDeep, (colorMix - 0.66) * 3.0);
    }
    
    vColor += vec3(0.0, 0.015, 0.04) * uAudioLevel;
  }
`;

const gasStreamFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = pow(1.0 - dist * 2.0, 0.6) * vAlpha;
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// Optimized star field shader
const starVertexShader = `
  uniform float uTime;
  
  attribute float aBrightness;
  attribute float aTwinklePhase;
  
  varying float vAlpha;
  varying float vBrightness;
  
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float twinkle = sin(uTime * 1.5 + aTwinklePhase * 6.28) * 0.25 + 0.75;
    
    gl_PointSize = (aBrightness * 1.2 + 0.4) * twinkle * (70.0 / -mvPosition.z);
    
    vAlpha = aBrightness * twinkle * 0.7;
    vBrightness = aBrightness;
  }
`;

const starFragmentShader = `
  varying float vAlpha;
  varying float vBrightness;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float core = 1.0 - smoothstep(0.0, 0.12, dist);
    float glow = 1.0 - smoothstep(0.08, 0.5, dist);
    float alpha = (core * 0.75 + glow * 0.25) * vAlpha;
    
    vec3 color = vec3(0.75, 0.8, 0.95) * vBrightness + vec3(0.18, 0.12, 0.25);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Optimized nebula cores shader
const coreVertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  
  attribute float aPhase;
  attribute float aSize;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    vec3 pos = position;
    
    float pulse = sin(uTime * 0.6 + aPhase * 6.28) * 0.08 + 1.0;
    pos *= pulse;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = aSize * (1.0 + uAudioLevel * 0.25) * (120.0 / -mvPosition.z);
    
    vAlpha = 0.45 + sin(uTime * 1.0 + aPhase * 3.14) * 0.18;
    
    vColor = vec3(0.45, 0.18, 0.55) + vec3(0.15, 0.08, 0.15) * uAudioLevel;
  }
`;

const coreFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = pow(1.0 - dist * 2.0, 1.1) * vAlpha;
    
    vec3 color = vColor;
    if (dist < 0.18) {
      color += vec3(0.18, 0.12, 0.25);
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export const NebulaBackground = ({ state, audioLevel }: NebulaBackgroundProps) => {
  const gasRef = useRef<THREE.Points>(null);
  const gasMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const starsRef = useRef<THREE.Points>(null);
  const starsMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const coresRef = useRef<THREE.Points>(null);
  const coresMaterialRef = useRef<THREE.ShaderMaterial>(null);
  
  const smoothAudioRef = useRef(0);

  // OPTIMIZED: Reduced from 75k to 20k particles
  const gasGeometry = useMemo(() => {
    const streamCount = 18;
    const particlesPerStream = 1100;
    const totalParticles = streamCount * particlesPerStream;
    
    const positions = new Float32Array(totalParticles * 3);
    const progresses = new Float32Array(totalParticles);
    const randomness = new Float32Array(totalParticles);
    const curveDirections = new Float32Array(totalParticles * 3);
    
    for (let s = 0; s < streamCount; s++) {
      const baseTheta = (s / streamCount) * Math.PI * 2 + Math.random() * 0.4;
      const basePhi = Math.acos(2 * Math.random() - 1);
      
      const dirX = Math.sin(basePhi) * Math.cos(baseTheta);
      const dirY = Math.sin(basePhi) * Math.sin(baseTheta);
      const dirZ = Math.cos(basePhi);
      
      for (let p = 0; p < particlesPerStream; p++) {
        const idx = s * particlesPerStream + p;
        const i3 = idx * 3;
        
        const progress = p / particlesPerStream;
        const radius = 1.0 + progress * 4.0;
        
        const spread = 0.25 + progress * 0.7;
        const offsetTheta = (Math.random() - 0.5) * spread;
        const offsetPhi = (Math.random() - 0.5) * spread;
        
        const theta = baseTheta + offsetTheta;
        const phi = basePhi + offsetPhi;
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
        
        progresses[idx] = progress;
        randomness[idx] = Math.random();
        
        curveDirections[i3] = dirX;
        curveDirections[i3 + 1] = dirY;
        curveDirections[i3 + 2] = dirZ;
      }
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aProgress", new THREE.BufferAttribute(progresses, 1));
    geo.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 1));
    geo.setAttribute("aCurveDirection", new THREE.BufferAttribute(curveDirections, 3));
    
    return geo;
  }, []);

  // OPTIMIZED: Reduced from 3k to 1.5k stars
  const starsGeometry = useMemo(() => {
    const count = 1500;
    const positions = new Float32Array(count * 3);
    const brightness = new Float32Array(count);
    const twinklePhases = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 5 + Math.random() * 4;
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      brightness[i] = 0.25 + Math.random() * 0.75;
      twinklePhases[i] = Math.random();
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
    geo.setAttribute("aTwinklePhase", new THREE.BufferAttribute(twinklePhases, 1));
    
    return geo;
  }, []);

  // OPTIMIZED: Reduced from 40 to 20 cores
  const coresGeometry = useMemo(() => {
    const count = 20;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.3 + Math.random() * 3.0;
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      phases[i] = Math.random();
      sizes[i] = 1.8 + Math.random() * 2.5;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    
    return geo;
  }, []);

  const gasMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: gasStreamVertexShader,
      fragmentShader: gasStreamFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uDriftSpeed: { value: 0.25 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  const starsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  const coresMaterial = useMemo(() => {
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
    const time = frameState.clock.elapsedTime;
    smoothAudioRef.current = THREE.MathUtils.lerp(smoothAudioRef.current, audioLevel, 0.08);

    let driftSpeed = 0.25;
    switch (state) {
      case "listening": driftSpeed = 0.35; break;
      case "thinking": driftSpeed = 0.5; break;
      case "speaking": driftSpeed = 0.42; break;
    }

    if (gasMaterialRef.current) {
      gasMaterialRef.current.uniforms.uTime.value = time;
      gasMaterialRef.current.uniforms.uAudioLevel.value = smoothAudioRef.current;
      gasMaterialRef.current.uniforms.uDriftSpeed.value = THREE.MathUtils.lerp(
        gasMaterialRef.current.uniforms.uDriftSpeed.value,
        driftSpeed,
        0.04
      );
    }

    if (starsMaterialRef.current) {
      starsMaterialRef.current.uniforms.uTime.value = time;
    }

    if (coresMaterialRef.current) {
      coresMaterialRef.current.uniforms.uTime.value = time;
      coresMaterialRef.current.uniforms.uAudioLevel.value = smoothAudioRef.current;
    }
  });

  return (
    <group>
      {/* Background stars */}
      <points ref={starsRef} geometry={starsGeometry}>
        <primitive object={starsMaterial} ref={starsMaterialRef} attach="material" />
      </points>
      
      {/* Cosmic gas streams */}
      <points ref={gasRef} geometry={gasGeometry}>
        <primitive object={gasMaterial} ref={gasMaterialRef} attach="material" />
      </points>
      
      {/* Nebula cores */}
      <points ref={coresRef} geometry={coresGeometry}>
        <primitive object={coresMaterial} ref={coresMaterialRef} attach="material" />
      </points>
    </group>
  );
};