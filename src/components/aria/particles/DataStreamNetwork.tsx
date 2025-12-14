import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface DataStreamNetworkProps {
  state: AIState;
  audioLevel: number;
}

// Vertex shader for flowing data particles along bezier curves
const streamVertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uFlowSpeed;
  
  attribute float aStreamIndex;
  attribute float aProgress;
  attribute float aRandomness;
  attribute vec3 aControlPoint1;
  attribute vec3 aControlPoint2;
  attribute vec3 aEndPoint;
  
  varying float vAlpha;
  varying vec3 vColor;
  varying float vPulse;
  
  // Cubic bezier interpolation
  vec3 cubicBezier(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
    float t2 = t * t;
    float t3 = t2 * t;
    float mt = 1.0 - t;
    float mt2 = mt * mt;
    float mt3 = mt2 * mt;
    return mt3 * p0 + 3.0 * mt2 * t * p1 + 3.0 * mt * t2 * p2 + t3 * p3;
  }
  
  void main() {
    // Animate progress along the stream
    float animatedProgress = mod(aProgress + uTime * uFlowSpeed * (0.3 + aRandomness * 0.4), 1.0);
    
    // Starting point (from sphere surface)
    vec3 startPoint = position;
    
    // Interpolate along bezier curve
    vec3 pos = cubicBezier(startPoint, aControlPoint1, aControlPoint2, aEndPoint, animatedProgress);
    
    // Add subtle wave motion perpendicular to stream direction
    float waveOffset = sin(animatedProgress * 12.0 + uTime * 3.0 + aStreamIndex) * 0.03;
    pos.x += waveOffset * cos(aStreamIndex);
    pos.y += waveOffset * sin(aStreamIndex);
    
    // Audio reactivity
    pos *= 1.0 + uAudioLevel * 0.05;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size varies along stream - brighter/larger at "data pulses"
    float pulsePhase = mod(animatedProgress * 5.0 - uTime * 2.0, 1.0);
    float isPulse = smoothstep(0.0, 0.1, pulsePhase) * (1.0 - smoothstep(0.1, 0.2, pulsePhase));
    vPulse = isPulse;
    
    float baseSize = 0.4 + isPulse * 0.8;
    gl_PointSize = baseSize * (150.0 / -mvPosition.z);
    
    // Alpha fades at endpoints
    float endFade = smoothstep(0.0, 0.1, animatedProgress) * (1.0 - smoothstep(0.9, 1.0, animatedProgress));
    vAlpha = endFade * (0.4 + isPulse * 0.5);
    
    // Color gradient along stream - cyan to blue to purple
    vec3 colorStart = vec3(0.0, 0.5, 0.7);
    vec3 colorMid = vec3(0.1, 0.3, 0.6);
    vec3 colorEnd = vec3(0.3, 0.1, 0.5);
    
    if (animatedProgress < 0.5) {
      vColor = mix(colorStart, colorMid, animatedProgress * 2.0);
    } else {
      vColor = mix(colorMid, colorEnd, (animatedProgress - 0.5) * 2.0);
    }
    
    // Brighten pulses
    vColor += vec3(0.2, 0.3, 0.4) * isPulse;
    vColor += vec3(0.05, 0.1, 0.15) * uAudioLevel;
  }
`;

const streamFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vPulse;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * vAlpha;
    
    // Add glow for pulses
    vec3 color = vColor;
    if (vPulse > 0.3) {
      color += vec3(0.1, 0.2, 0.3) * vPulse;
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Background atmosphere shader
const atmosphereVertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  
  attribute float aRandomness;
  attribute float aSpeed;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    vec3 pos = position;
    
    // Slow drift motion
    float drift = uTime * aSpeed * 0.1;
    pos.x += sin(drift + aRandomness * 6.28) * 0.3;
    pos.y += cos(drift * 0.7 + aRandomness * 3.14) * 0.3;
    pos.z += sin(drift * 0.5 + aRandomness * 9.42) * 0.2;
    
    // Subtle pull toward center when audio
    float centerPull = uAudioLevel * 0.1;
    pos = mix(pos, normalize(pos) * length(pos) * 0.9, centerPull);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = (0.3 + aRandomness * 0.4) * (100.0 / -mvPosition.z);
    
    // Very subtle alpha for atmosphere
    float distFromCenter = length(pos);
    vAlpha = 0.15 * (1.0 - smoothstep(2.0, 8.0, distFromCenter));
    
    // Deep blue/purple atmosphere
    vColor = mix(
      vec3(0.02, 0.05, 0.12),
      vec3(0.08, 0.03, 0.15),
      aRandomness
    );
  }
`;

const atmosphereFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - smoothstep(0.1, 0.5, dist)) * vAlpha;
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// Connection nodes shader
const nodeVertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  
  attribute float aPhase;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    vec3 pos = position;
    
    // Subtle breathing
    float breathe = sin(uTime * 1.5 + aPhase * 6.28) * 0.05;
    pos *= 1.0 + breathe + uAudioLevel * 0.1;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Larger glowing nodes
    float pulse = 0.5 + sin(uTime * 2.0 + aPhase * 3.14) * 0.3;
    gl_PointSize = (2.0 + pulse * 1.5 + uAudioLevel * 2.0) * (100.0 / -mvPosition.z);
    
    vAlpha = 0.6 + pulse * 0.3;
    
    // Bright cyan nodes
    vColor = vec3(0.1, 0.5, 0.7) + vec3(0.1, 0.2, 0.2) * uAudioLevel;
  }
`;

const nodeFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    // Soft glow falloff
    float alpha = pow(1.0 - dist * 2.0, 1.5) * vAlpha;
    
    // Core is brighter
    vec3 color = vColor;
    if (dist < 0.15) {
      color += vec3(0.3, 0.4, 0.5);
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export const DataStreamNetwork = ({ state, audioLevel }: DataStreamNetworkProps) => {
  const streamsRef = useRef<THREE.Points>(null);
  const streamMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const atmosphereRef = useRef<THREE.Points>(null);
  const atmosphereMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const nodesRef = useRef<THREE.Points>(null);
  const nodeMaterialRef = useRef<THREE.ShaderMaterial>(null);
  
  const smoothAudioRef = useRef(0);

  // Generate data stream geometry
  const streamGeometry = useMemo(() => {
    const streamCount = 30; // 30 streams
    const particlesPerStream = 1500; // Dense particles per stream
    const totalParticles = streamCount * particlesPerStream;
    
    const positions = new Float32Array(totalParticles * 3);
    const streamIndices = new Float32Array(totalParticles);
    const progresses = new Float32Array(totalParticles);
    const randomness = new Float32Array(totalParticles);
    const controlPoints1 = new Float32Array(totalParticles * 3);
    const controlPoints2 = new Float32Array(totalParticles * 3);
    const endPoints = new Float32Array(totalParticles * 3);
    
    for (let s = 0; s < streamCount; s++) {
      // Random start point on sphere surface
      const startTheta = Math.random() * Math.PI * 2;
      const startPhi = Math.acos(2 * Math.random() - 1);
      const startRadius = 0.6 + Math.random() * 0.2;
      
      const startX = startRadius * Math.sin(startPhi) * Math.cos(startTheta);
      const startY = startRadius * Math.sin(startPhi) * Math.sin(startTheta);
      const startZ = startRadius * Math.cos(startPhi);
      
      // Generate bezier control points for organic curves
      const endTheta = Math.random() * Math.PI * 2;
      const endPhi = Math.acos(2 * Math.random() - 1);
      const endRadius = 2.5 + Math.random() * 2.0;
      
      const endX = endRadius * Math.sin(endPhi) * Math.cos(endTheta);
      const endY = endRadius * Math.sin(endPhi) * Math.sin(endTheta);
      const endZ = endRadius * Math.cos(endPhi);
      
      // Control points create organic curved paths
      const midRadius = (startRadius + endRadius) * 0.5;
      const curveOffset = 0.5 + Math.random() * 1.0;
      
      const cp1X = startX + (endX - startX) * 0.3 + (Math.random() - 0.5) * curveOffset;
      const cp1Y = startY + (endY - startY) * 0.3 + (Math.random() - 0.5) * curveOffset;
      const cp1Z = startZ + (endZ - startZ) * 0.3 + (Math.random() - 0.5) * curveOffset;
      
      const cp2X = startX + (endX - startX) * 0.7 + (Math.random() - 0.5) * curveOffset;
      const cp2Y = startY + (endY - startY) * 0.7 + (Math.random() - 0.5) * curveOffset;
      const cp2Z = startZ + (endZ - startZ) * 0.7 + (Math.random() - 0.5) * curveOffset;
      
      for (let p = 0; p < particlesPerStream; p++) {
        const idx = s * particlesPerStream + p;
        const i3 = idx * 3;
        
        // Start position (will be animated along curve)
        positions[i3] = startX;
        positions[i3 + 1] = startY;
        positions[i3 + 2] = startZ;
        
        streamIndices[idx] = s;
        progresses[idx] = p / particlesPerStream; // Spread along stream
        randomness[idx] = Math.random();
        
        controlPoints1[i3] = cp1X;
        controlPoints1[i3 + 1] = cp1Y;
        controlPoints1[i3 + 2] = cp1Z;
        
        controlPoints2[i3] = cp2X;
        controlPoints2[i3 + 1] = cp2Y;
        controlPoints2[i3 + 2] = cp2Z;
        
        endPoints[i3] = endX;
        endPoints[i3 + 1] = endY;
        endPoints[i3 + 2] = endZ;
      }
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aStreamIndex", new THREE.BufferAttribute(streamIndices, 1));
    geo.setAttribute("aProgress", new THREE.BufferAttribute(progresses, 1));
    geo.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 1));
    geo.setAttribute("aControlPoint1", new THREE.BufferAttribute(controlPoints1, 3));
    geo.setAttribute("aControlPoint2", new THREE.BufferAttribute(controlPoints2, 3));
    geo.setAttribute("aEndPoint", new THREE.BufferAttribute(endPoints, 3));
    
    return geo;
  }, []);

  // Atmosphere particles (100k for dense background)
  const atmosphereGeometry = useMemo(() => {
    const count = 100000;
    const positions = new Float32Array(count * 3);
    const randomness = new Float32Array(count);
    const speeds = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Distribute in a large volume around the scene
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + Math.random() * 6; // From just outside sphere to far out
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      randomness[i] = Math.random();
      speeds[i] = 0.5 + Math.random() * 1.5;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    
    return geo;
  }, []);

  // Connection node geometry
  const nodeGeometry = useMemo(() => {
    const count = 60; // Glowing connection nodes
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Distribute nodes around the data streams
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.0 + Math.random() * 3.0;
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      phases[i] = Math.random();
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    
    return geo;
  }, []);

  const streamMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: streamVertexShader,
      fragmentShader: streamFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uFlowSpeed: { value: 0.3 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  const nodeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: nodeVertexShader,
      fragmentShader: nodeFragmentShader,
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

    // State-based flow speed
    let flowSpeed = 0.3;
    switch (state) {
      case "listening": flowSpeed = 0.5; break;
      case "thinking": flowSpeed = 1.0; break;
      case "speaking": flowSpeed = 0.7; break;
    }

    if (streamMaterialRef.current) {
      streamMaterialRef.current.uniforms.uTime.value = time;
      streamMaterialRef.current.uniforms.uAudioLevel.value = smoothAudioRef.current;
      streamMaterialRef.current.uniforms.uFlowSpeed.value = THREE.MathUtils.lerp(
        streamMaterialRef.current.uniforms.uFlowSpeed.value,
        flowSpeed,
        0.05
      );
    }

    if (atmosphereMaterialRef.current) {
      atmosphereMaterialRef.current.uniforms.uTime.value = time;
      atmosphereMaterialRef.current.uniforms.uAudioLevel.value = smoothAudioRef.current;
    }

    if (nodeMaterialRef.current) {
      nodeMaterialRef.current.uniforms.uTime.value = time;
      nodeMaterialRef.current.uniforms.uAudioLevel.value = smoothAudioRef.current;
    }
  });

  return (
    <group>
      {/* Dense atmosphere background */}
      <points ref={atmosphereRef} geometry={atmosphereGeometry}>
        <primitive object={atmosphereMaterial} ref={atmosphereMaterialRef} attach="material" />
      </points>
      
      {/* Flowing data streams */}
      <points ref={streamsRef} geometry={streamGeometry}>
        <primitive object={streamMaterial} ref={streamMaterialRef} attach="material" />
      </points>
      
      {/* Glowing connection nodes */}
      <points ref={nodesRef} geometry={nodeGeometry}>
        <primitive object={nodeMaterial} ref={nodeMaterialRef} attach="material" />
      </points>
    </group>
  );
};
