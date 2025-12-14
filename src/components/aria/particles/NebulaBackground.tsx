import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface NebulaBackgroundProps {
  state: AIState;
  audioLevel: number;
}

// Cosmic gas stream shader - soft, flowing nebula wisps
const gasStreamVertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uDriftSpeed;
  
  attribute float aStreamIndex;
  attribute float aProgress;
  attribute float aRandomness;
  attribute vec3 aCurveDirection;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    vec3 pos = position;
    
    // Slow, organic drift along curve direction
    float driftPhase = uTime * uDriftSpeed * (0.1 + aRandomness * 0.1);
    float driftAmount = sin(driftPhase + aProgress * 6.28) * 0.5;
    
    pos += aCurveDirection * driftAmount;
    
    // Perpendicular wave motion for gas cloud effect
    vec3 perpendicular = cross(aCurveDirection, vec3(0.0, 1.0, 0.0));
    if (length(perpendicular) < 0.1) {
      perpendicular = cross(aCurveDirection, vec3(1.0, 0.0, 0.0));
    }
    perpendicular = normalize(perpendicular);
    
    float wave = sin(aProgress * 8.0 + uTime * 0.5 + aRandomness * 6.28) * 0.2;
    pos += perpendicular * wave;
    
    // Gentle expansion with audio
    pos *= 1.0 + uAudioLevel * 0.03;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Very soft, large particles for gas effect
    float size = 0.8 + aRandomness * 1.2;
    gl_PointSize = size * (120.0 / -mvPosition.z);
    
    // Fade based on distance and progress
    float distFade = 1.0 - smoothstep(3.0, 7.0, length(pos));
    float streamFade = sin(aProgress * 3.14159) * 0.8 + 0.2;
    vAlpha = distFade * streamFade * 0.25;
    
    // Deep purple/magenta nebula colors
    vec3 colorDeep = vec3(0.08, 0.02, 0.15);
    vec3 colorMid = vec3(0.2, 0.05, 0.25);
    vec3 colorBright = vec3(0.35, 0.1, 0.4);
    
    float colorMix = aRandomness;
    if (colorMix < 0.33) {
      vColor = mix(colorDeep, colorMid, colorMix * 3.0);
    } else if (colorMix < 0.66) {
      vColor = mix(colorMid, colorBright, (colorMix - 0.33) * 3.0);
    } else {
      vColor = mix(colorBright, colorDeep, (colorMix - 0.66) * 3.0);
    }
    
    // Subtle blue tint from audio
    vColor += vec3(0.0, 0.02, 0.05) * uAudioLevel;
  }
`;

const gasStreamFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Very soft falloff for cloud-like appearance
    float alpha = pow(1.0 - dist * 2.0, 0.5) * vAlpha;
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// Star field shader
const starVertexShader = `
  uniform float uTime;
  
  attribute float aBrightness;
  attribute float aTwinklePhase;
  
  varying float vAlpha;
  varying float vBrightness;
  
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Twinkle effect
    float twinkle = sin(uTime * 2.0 + aTwinklePhase * 6.28) * 0.3 + 0.7;
    
    gl_PointSize = (aBrightness * 1.5 + 0.5) * twinkle * (80.0 / -mvPosition.z);
    
    vAlpha = aBrightness * twinkle * 0.8;
    vBrightness = aBrightness;
  }
`;

const starFragmentShader = `
  varying float vAlpha;
  varying float vBrightness;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Sharp core with soft glow
    float core = 1.0 - smoothstep(0.0, 0.15, dist);
    float glow = 1.0 - smoothstep(0.1, 0.5, dist);
    float alpha = (core * 0.8 + glow * 0.2) * vAlpha;
    
    // White-ish blue stars
    vec3 color = vec3(0.8, 0.85, 1.0) * vBrightness + vec3(0.2, 0.15, 0.3);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Bright nebula cores shader
const coreVertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  
  attribute float aPhase;
  attribute float aSize;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    vec3 pos = position;
    
    // Gentle pulsing
    float pulse = sin(uTime * 0.8 + aPhase * 6.28) * 0.1 + 1.0;
    pos *= pulse;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = aSize * (1.0 + uAudioLevel * 0.3) * (150.0 / -mvPosition.z);
    
    vAlpha = 0.5 + sin(uTime * 1.2 + aPhase * 3.14) * 0.2;
    
    // Bright purple/pink cores
    vColor = vec3(0.5, 0.2, 0.6) + vec3(0.2, 0.1, 0.2) * uAudioLevel;
  }
`;

const coreFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Soft glow falloff
    float alpha = pow(1.0 - dist * 2.0, 1.2) * vAlpha;
    
    // Brighter center
    vec3 color = vColor;
    if (dist < 0.2) {
      color += vec3(0.2, 0.15, 0.3);
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

  // Cosmic gas streams - organic flowing shapes
  const gasGeometry = useMemo(() => {
    const streamCount = 25;
    const particlesPerStream = 3000;
    const totalParticles = streamCount * particlesPerStream;
    
    const positions = new Float32Array(totalParticles * 3);
    const streamIndices = new Float32Array(totalParticles);
    const progresses = new Float32Array(totalParticles);
    const randomness = new Float32Array(totalParticles);
    const curveDirections = new Float32Array(totalParticles * 3);
    
    for (let s = 0; s < streamCount; s++) {
      // Each stream is a curved wisp emanating outward
      const baseTheta = (s / streamCount) * Math.PI * 2 + Math.random() * 0.5;
      const basePhi = Math.acos(2 * Math.random() - 1);
      
      // Stream curve direction
      const dirX = Math.sin(basePhi) * Math.cos(baseTheta);
      const dirY = Math.sin(basePhi) * Math.sin(baseTheta);
      const dirZ = Math.cos(basePhi);
      
      for (let p = 0; p < particlesPerStream; p++) {
        const idx = s * particlesPerStream + p;
        const i3 = idx * 3;
        
        const progress = p / particlesPerStream;
        const radius = 1.2 + progress * 4.5; // Streams extend outward
        
        // Position along curved stream with spread
        const spread = 0.3 + progress * 0.8;
        const offsetTheta = (Math.random() - 0.5) * spread;
        const offsetPhi = (Math.random() - 0.5) * spread;
        
        const theta = baseTheta + offsetTheta;
        const phi = basePhi + offsetPhi;
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
        
        streamIndices[idx] = s;
        progresses[idx] = progress;
        randomness[idx] = Math.random();
        
        curveDirections[i3] = dirX;
        curveDirections[i3 + 1] = dirY;
        curveDirections[i3 + 2] = dirZ;
      }
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aStreamIndex", new THREE.BufferAttribute(streamIndices, 1));
    geo.setAttribute("aProgress", new THREE.BufferAttribute(progresses, 1));
    geo.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 1));
    geo.setAttribute("aCurveDirection", new THREE.BufferAttribute(curveDirections, 3));
    
    return geo;
  }, []);

  // Background star field
  const starsGeometry = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const brightness = new Float32Array(count);
    const twinklePhases = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Distant stars distributed in a shell
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 6 + Math.random() * 4;
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      brightness[i] = 0.3 + Math.random() * 0.7;
      twinklePhases[i] = Math.random();
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
    geo.setAttribute("aTwinklePhase", new THREE.BufferAttribute(twinklePhases, 1));
    
    return geo;
  }, []);

  // Bright nebula cores
  const coresGeometry = useMemo(() => {
    const count = 40;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + Math.random() * 3.5;
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      phases[i] = Math.random();
      sizes[i] = 2.0 + Math.random() * 3.0;
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
        uDriftSpeed: { value: 0.3 },
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
    smoothAudioRef.current = THREE.MathUtils.lerp(smoothAudioRef.current, audioLevel, 0.1);

    // State-based drift speed
    let driftSpeed = 0.3;
    switch (state) {
      case "listening": driftSpeed = 0.4; break;
      case "thinking": driftSpeed = 0.6; break;
      case "speaking": driftSpeed = 0.5; break;
    }

    if (gasMaterialRef.current) {
      gasMaterialRef.current.uniforms.uTime.value = time;
      gasMaterialRef.current.uniforms.uAudioLevel.value = smoothAudioRef.current;
      gasMaterialRef.current.uniforms.uDriftSpeed.value = THREE.MathUtils.lerp(
        gasMaterialRef.current.uniforms.uDriftSpeed.value,
        driftSpeed,
        0.05
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
      
      {/* Flowing cosmic gas streams */}
      <points ref={gasRef} geometry={gasGeometry}>
        <primitive object={gasMaterial} ref={gasMaterialRef} attach="material" />
      </points>
      
      {/* Bright nebula cores */}
      <points ref={coresRef} geometry={coresGeometry}>
        <primitive object={coresMaterial} ref={coresMaterialRef} attach="material" />
      </points>
    </group>
  );
};
