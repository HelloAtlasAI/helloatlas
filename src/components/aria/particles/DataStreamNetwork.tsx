import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AIState } from "../AIOrb";

interface DataStreamNetworkProps {
  state: AIState;
  audioLevel: number;
}

// Structured grid shader - aligned data lines with clean intersections
const streamVertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uFlowSpeed;
  
  attribute float aLineIndex;
  attribute float aProgress;
  attribute float aAxis; // 0=X, 1=Y, 2=Z
  attribute float aLinePosition;
  
  varying float vAlpha;
  varying vec3 vColor;
  varying float vPulse;
  
  void main() {
    vec3 pos = position;
    
    // Animate particles along their axis
    float flowOffset = uTime * uFlowSpeed * (0.4 + mod(aLineIndex, 5.0) * 0.1);
    float animatedProgress = mod(aProgress + flowOffset, 1.0);
    
    // Calculate position along the line
    float lineExtent = 4.0;
    float coord = (animatedProgress - 0.5) * lineExtent * 2.0;
    
    if (aAxis < 0.5) {
      pos.x = coord;
    } else if (aAxis < 1.5) {
      pos.y = coord;
    } else {
      pos.z = coord;
    }
    
    // Audio reactivity - subtle expansion
    pos *= 1.0 + uAudioLevel * 0.04;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Data pulse effect - brighter particles traveling along lines
    float pulsePhase = mod(animatedProgress * 3.0 - uTime * 1.5, 1.0);
    float isPulse = smoothstep(0.0, 0.12, pulsePhase) * (1.0 - smoothstep(0.12, 0.25, pulsePhase));
    vPulse = isPulse;
    
    float baseSize = 0.35 + isPulse * 0.6;
    gl_PointSize = baseSize * (140.0 / -mvPosition.z);
    
    // Alpha fades at line endpoints
    float endFade = smoothstep(0.0, 0.08, animatedProgress) * (1.0 - smoothstep(0.92, 1.0, animatedProgress));
    vAlpha = endFade * (0.35 + isPulse * 0.55);
    
    // Color based on axis - cyan/blue/purple gradient
    vec3 xColor = vec3(0.0, 0.55, 0.75);
    vec3 yColor = vec3(0.15, 0.35, 0.65);
    vec3 zColor = vec3(0.3, 0.15, 0.55);
    
    if (aAxis < 0.5) {
      vColor = xColor;
    } else if (aAxis < 1.5) {
      vColor = yColor;
    } else {
      vColor = zColor;
    }
    
    // Brighten pulses
    vColor += vec3(0.2, 0.25, 0.3) * isPulse;
    vColor += vec3(0.04, 0.08, 0.12) * uAudioLevel;
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
    
    vec3 color = vColor;
    if (vPulse > 0.3) {
      color += vec3(0.12, 0.18, 0.25) * vPulse;
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Intersection nodes shader - glowing points at grid crossings
const nodeVertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  
  attribute float aPhase;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    vec3 pos = position;
    
    // Subtle breathing at intersections
    float breathe = sin(uTime * 1.2 + aPhase * 6.28) * 0.04;
    pos *= 1.0 + breathe + uAudioLevel * 0.08;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float pulse = 0.5 + sin(uTime * 1.8 + aPhase * 3.14) * 0.25;
    gl_PointSize = (2.5 + pulse * 1.5 + uAudioLevel * 2.0) * (100.0 / -mvPosition.z);
    
    vAlpha = 0.55 + pulse * 0.35;
    
    // Bright cyan intersection nodes
    vColor = vec3(0.15, 0.55, 0.75) + vec3(0.1, 0.15, 0.2) * uAudioLevel;
  }
`;

const nodeFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = pow(1.0 - dist * 2.0, 1.4) * vAlpha;
    
    vec3 color = vColor;
    if (dist < 0.12) {
      color += vec3(0.25, 0.35, 0.45);
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Atmosphere shader - subtle background particles
const atmosphereVertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  
  attribute float aRandomness;
  attribute float aSpeed;
  
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    vec3 pos = position;
    
    float drift = uTime * aSpeed * 0.08;
    pos.x += sin(drift + aRandomness * 6.28) * 0.2;
    pos.y += cos(drift * 0.7 + aRandomness * 3.14) * 0.2;
    pos.z += sin(drift * 0.5 + aRandomness * 9.42) * 0.15;
    
    float centerPull = uAudioLevel * 0.08;
    pos = mix(pos, normalize(pos) * length(pos) * 0.92, centerPull);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = (0.25 + aRandomness * 0.35) * (100.0 / -mvPosition.z);
    
    float distFromCenter = length(pos);
    vAlpha = 0.12 * (1.0 - smoothstep(2.0, 7.0, distFromCenter));
    
    vColor = mix(
      vec3(0.02, 0.04, 0.1),
      vec3(0.06, 0.02, 0.12),
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

export const DataStreamNetwork = ({ state, audioLevel }: DataStreamNetworkProps) => {
  const streamsRef = useRef<THREE.Points>(null);
  const streamMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const atmosphereRef = useRef<THREE.Points>(null);
  const atmosphereMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const nodesRef = useRef<THREE.Points>(null);
  const nodeMaterialRef = useRef<THREE.ShaderMaterial>(null);
  
  const smoothAudioRef = useRef(0);

  // Generate structured grid of aligned data lines
  const streamGeometry = useMemo(() => {
    const particlesPerLine = 800;
    
    // Grid configuration - 12 lines per axis at different positions
    const gridPositions = [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8];
    const depthLayers = [-0.8, 0, 0.8];
    
    const lines: { axis: number; y: number; z: number; x: number }[] = [];
    
    // Horizontal lines (X-axis) at various Y and Z positions
    for (const y of gridPositions) {
      for (const z of depthLayers) {
        lines.push({ axis: 0, y, z, x: 0 });
      }
    }
    
    // Vertical lines (Y-axis) at various X and Z positions
    for (const x of gridPositions) {
      for (const z of depthLayers) {
        lines.push({ axis: 1, y: 0, z, x });
      }
    }
    
    // Depth lines (Z-axis) at various X and Y positions
    for (const x of [-1.2, 0, 1.2]) {
      for (const y of [-1.2, 0, 1.2]) {
        lines.push({ axis: 2, y, z: 0, x });
      }
    }
    
    const totalParticles = lines.length * particlesPerLine;
    
    const positions = new Float32Array(totalParticles * 3);
    const lineIndices = new Float32Array(totalParticles);
    const progresses = new Float32Array(totalParticles);
    const axes = new Float32Array(totalParticles);
    const linePositions = new Float32Array(totalParticles);
    
    let idx = 0;
    lines.forEach((line, lineIdx) => {
      for (let p = 0; p < particlesPerLine; p++) {
        const i3 = idx * 3;
        const progress = p / particlesPerLine;
        
        // Set fixed position on non-animated axes
        if (line.axis === 0) {
          positions[i3] = 0; // Will be animated
          positions[i3 + 1] = line.y;
          positions[i3 + 2] = line.z;
        } else if (line.axis === 1) {
          positions[i3] = line.x;
          positions[i3 + 1] = 0; // Will be animated
          positions[i3 + 2] = line.z;
        } else {
          positions[i3] = line.x;
          positions[i3 + 1] = line.y;
          positions[i3 + 2] = 0; // Will be animated
        }
        
        lineIndices[idx] = lineIdx;
        progresses[idx] = progress;
        axes[idx] = line.axis;
        linePositions[idx] = line.axis === 0 ? line.y : (line.axis === 1 ? line.x : line.y);
        
        idx++;
      }
    });
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aLineIndex", new THREE.BufferAttribute(lineIndices, 1));
    geo.setAttribute("aProgress", new THREE.BufferAttribute(progresses, 1));
    geo.setAttribute("aAxis", new THREE.BufferAttribute(axes, 1));
    geo.setAttribute("aLinePosition", new THREE.BufferAttribute(linePositions, 1));
    
    return geo;
  }, []);

  // Intersection nodes at grid crossings
  const nodeGeometry = useMemo(() => {
    const nodes: [number, number, number][] = [];
    const gridPositions = [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8];
    const depthLayers = [-0.8, 0, 0.8];
    
    // Create nodes at intersections
    for (const x of gridPositions) {
      for (const y of gridPositions) {
        for (const z of depthLayers) {
          // Only create nodes where lines actually intersect
          const hasHorizontal = gridPositions.includes(y) && depthLayers.includes(z);
          const hasVertical = gridPositions.includes(x) && depthLayers.includes(z);
          if (hasHorizontal && hasVertical) {
            nodes.push([x, y, z]);
          }
        }
      }
    }
    
    const count = nodes.length;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    
    nodes.forEach((node, i) => {
      positions[i * 3] = node[0];
      positions[i * 3 + 1] = node[1];
      positions[i * 3 + 2] = node[2];
      phases[i] = Math.random();
    });
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    
    return geo;
  }, []);

  // Sparse atmosphere particles
  const atmosphereGeometry = useMemo(() => {
    const count = 40000;
    const positions = new Float32Array(count * 3);
    const randomness = new Float32Array(count);
    const speeds = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.8 + Math.random() * 5;
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);
      
      randomness[i] = Math.random();
      speeds[i] = 0.4 + Math.random() * 1.2;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    
    return geo;
  }, []);

  const streamMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: streamVertexShader,
      fragmentShader: streamFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uFlowSpeed: { value: 0.25 },
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

  useFrame((frameState) => {
    const time = frameState.clock.elapsedTime;
    smoothAudioRef.current = THREE.MathUtils.lerp(smoothAudioRef.current, audioLevel, 0.1);

    let flowSpeed = 0.25;
    switch (state) {
      case "listening": flowSpeed = 0.4; break;
      case "thinking": flowSpeed = 0.8; break;
      case "speaking": flowSpeed = 0.55; break;
    }

    if (streamMaterialRef.current) {
      streamMaterialRef.current.uniforms.uTime.value = time;
      streamMaterialRef.current.uniforms.uAudioLevel.value = smoothAudioRef.current;
      streamMaterialRef.current.uniforms.uFlowSpeed.value = THREE.MathUtils.lerp(
        streamMaterialRef.current.uniforms.uFlowSpeed.value,
        flowSpeed,
        0.04
      );
    }

    if (nodeMaterialRef.current) {
      nodeMaterialRef.current.uniforms.uTime.value = time;
      nodeMaterialRef.current.uniforms.uAudioLevel.value = smoothAudioRef.current;
    }

    if (atmosphereMaterialRef.current) {
      atmosphereMaterialRef.current.uniforms.uTime.value = time;
      atmosphereMaterialRef.current.uniforms.uAudioLevel.value = smoothAudioRef.current;
    }
  });

  return (
    <group>
      {/* Background atmosphere */}
      <points ref={atmosphereRef} geometry={atmosphereGeometry}>
        <primitive object={atmosphereMaterial} ref={atmosphereMaterialRef} attach="material" />
      </points>
      
      {/* Aligned data stream grid */}
      <points ref={streamsRef} geometry={streamGeometry}>
        <primitive object={streamMaterial} ref={streamMaterialRef} attach="material" />
      </points>
      
      {/* Intersection nodes */}
      <points ref={nodesRef} geometry={nodeGeometry}>
        <primitive object={nodeMaterial} ref={nodeMaterialRef} attach="material" />
      </points>
    </group>
  );
};