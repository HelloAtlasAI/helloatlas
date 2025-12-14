import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Mail, Plane, TrendingUp, Calendar, FileText, LucideIcon } from "lucide-react";

export interface CardData {
  id: string;
  type: "email" | "flight" | "stock" | "calendar" | "document";
  title: string;
  subtitle: string;
  content: string;
}

interface ParticleCardProps {
  visible: boolean;
  position: [number, number, number];
  width: number;
  height: number;
  card: CardData;
  particleCount?: number;
}

const iconMap: Record<string, LucideIcon> = {
  email: Mail,
  flight: Plane,
  stock: TrendingUp,
  calendar: Calendar,
  document: FileText,
};

// Vertex shader for card particle formation
const cardVertexShader = `
  uniform float uTime;
  uniform float uFormationProgress;
  uniform vec3 uTargetPosition;
  uniform float uWidth;
  uniform float uHeight;
  
  attribute vec3 aTargetLocal;
  attribute float aDelay;
  attribute float aParticleType;
  
  varying float vAlpha;
  varying float vFormation;
  varying float vParticleType;
  varying vec2 vLocalPos;
  
  void main() {
    vFormation = uFormationProgress;
    vParticleType = aParticleType;
    vLocalPos = aTargetLocal.xy;
    
    vec3 targetPos = uTargetPosition + vec3(
      aTargetLocal.x * uWidth,
      aTargetLocal.y * uHeight,
      0.0
    );
    
    float typeDelay = aParticleType * 0.08;
    float delayedProgress = clamp((uFormationProgress - aDelay * 0.15 - typeDelay) / 0.7, 0.0, 1.0);
    delayedProgress = smoothstep(0.0, 1.0, delayedProgress);
    delayedProgress = delayedProgress * delayedProgress * (3.0 - 2.0 * delayedProgress);
    
    vec3 pos = mix(position, targetPos, delayedProgress);
    
    if (delayedProgress > 0.95) {
      float driftAmount = 0.002;
      pos += vec3(
        sin(uTime * 2.0 + aDelay * 10.0) * driftAmount,
        cos(uTime * 1.5 + aDelay * 8.0) * driftAmount,
        0.0
      );
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float baseSize = 0.6;
    if (aParticleType < 0.5) baseSize = 1.0;
    else if (aParticleType > 1.5 && aParticleType < 2.5) baseSize = 1.2;
    else if (aParticleType > 2.5) baseSize = 1.0;
    
    gl_PointSize = (baseSize + delayedProgress * 0.2) * (100.0 / -mvPosition.z);
    
    float borderDist = min(min(abs(aTargetLocal.x + 0.5), abs(aTargetLocal.x - 0.5)), 
                          min(abs(aTargetLocal.y + 0.5), abs(aTargetLocal.y - 0.5)));
    
    if (aParticleType < 0.5) {
      vAlpha = 0.7 + delayedProgress * 0.2;
    } else if (aParticleType < 1.5) {
      float edgeDist = 1.0 - borderDist * 2.0;
      vAlpha = (0.2 + edgeDist * 0.3) * delayedProgress;
    } else if (aParticleType < 2.5) {
      vAlpha = 0.8 + delayedProgress * 0.15;
    } else {
      vAlpha = 0.5 + delayedProgress * 0.2;
    }
  }
`;

const cardFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uFormationProgress;
  
  varying float vAlpha;
  varying float vFormation;
  varying float vParticleType;
  varying vec2 vLocalPos;
  
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - smoothstep(0.05, 0.5, dist)) * vAlpha;
    
    vec3 color = uColor;
    
    if (vParticleType < 0.5) {
      color = uColor * 1.4 + vec3(0.1, 0.15, 0.2);
    } else if (vParticleType < 1.5) {
      float gradientY = vLocalPos.y + 0.5;
      color = mix(uColor * 0.5, uColor * 0.85, gradientY);
      color += vec3(0.02, 0.03, 0.04);
    } else if (vParticleType < 2.5) {
      color = vec3(0.35, 0.45, 0.55) + uColor * 0.25;
    } else {
      color = uColor * 0.75 + vec3(0.04, 0.06, 0.1);
    }
    
    // Shimmer effect when fully formed
    if (uFormationProgress > 0.9) {
      float shimmer = sin(vLocalPos.x * 20.0 + uTime * 3.0) * 0.5 + 0.5;
      shimmer *= sin(vLocalPos.y * 15.0 - uTime * 2.0) * 0.5 + 0.5;
      color += vec3(0.03, 0.05, 0.08) * shimmer;
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`;

const createCardParticles = (count: number) => {
  const positions = new Float32Array(count * 3);
  const targetLocal = new Float32Array(count * 3);
  const delays = new Float32Array(count);
  const particleTypes = new Float32Array(count);
  
  const borderCount = Math.floor(count * 0.3);
  const interiorCount = Math.floor(count * 0.5);
  const highlightCount = Math.floor(count * 0.12);
  const glowCount = count - borderCount - interiorCount - highlightCount;
  
  let idx = 0;
  
  // Border particles - dense outline
  for (let i = 0; i < borderCount; i++) {
    const t = i / borderCount;
    let x, y;
    
    const perimeter = 4;
    const pos = t * perimeter;
    
    if (pos < 1) {
      x = pos - 0.5; y = 0.5;
    } else if (pos < 2) {
      x = 0.5; y = 0.5 - (pos - 1);
    } else if (pos < 3) {
      x = 0.5 - (pos - 2); y = -0.5;
    } else {
      x = -0.5; y = -0.5 + (pos - 3);
    }
    
    x += (Math.random() - 0.5) * 0.015;
    y += (Math.random() - 0.5) * 0.015;
    
    setParticle(idx, x, y, 0, positions, targetLocal, delays, particleTypes);
    idx++;
  }
  
  // Interior particles - glassmorphic fill
  for (let i = 0; i < interiorCount; i++) {
    let x = (Math.random() - 0.5) * 0.92;
    let y = (Math.random() - 0.5) * 0.92;
    
    // Bias toward edges
    if (Math.random() < 0.35) {
      if (Math.random() < 0.5) {
        x = x > 0 ? 0.32 + Math.random() * 0.12 : -0.32 - Math.random() * 0.12;
      } else {
        y = y > 0 ? 0.32 + Math.random() * 0.12 : -0.32 - Math.random() * 0.12;
      }
    }
    
    setParticle(idx, x, y, 1, positions, targetLocal, delays, particleTypes);
    idx++;
  }
  
  // Top highlight
  for (let i = 0; i < highlightCount; i++) {
    const x = (Math.random() - 0.5) * 0.88;
    const y = 0.44 + Math.random() * 0.04;
    setParticle(idx, x, y, 2, positions, targetLocal, delays, particleTypes);
    idx++;
  }
  
  // Bottom glow
  for (let i = 0; i < glowCount; i++) {
    const x = (Math.random() - 0.5) * 0.85;
    const y = -0.44 - Math.random() * 0.04;
    setParticle(idx, x, y, 3, positions, targetLocal, delays, particleTypes);
    idx++;
  }
  
  return { positions, targetLocal, delays, particleTypes };
};

const setParticle = (
  idx: number, x: number, y: number, type: number,
  positions: Float32Array, targetLocal: Float32Array, 
  delays: Float32Array, particleTypes: Float32Array
) => {
  const i3 = idx * 3;
  
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = 3 + Math.random() * 5;
  
  positions[i3] = r * Math.sin(phi) * Math.cos(theta);
  positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  positions[i3 + 2] = r * Math.cos(phi);
  
  targetLocal[i3] = x;
  targetLocal[i3 + 1] = y;
  targetLocal[i3 + 2] = 0;
  
  delays[idx] = Math.random();
  particleTypes[idx] = type;
};

export const ParticleCard = ({
  visible,
  position,
  width,
  height,
  card,
  particleCount = 8000,
}: ParticleCardProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [formationProgress, setFormationProgress] = useState(0);
  const targetProgressRef = useRef(0);
  
  const Icon = iconMap[card.type] || FileText;

  useEffect(() => {
    targetProgressRef.current = visible ? 1 : 0;
  }, [visible]);

  const geometry = useMemo(() => {
    const { positions, targetLocal, delays, particleTypes } = createCardParticles(particleCount);
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aTargetLocal", new THREE.BufferAttribute(targetLocal, 3));
    geo.setAttribute("aDelay", new THREE.BufferAttribute(delays, 1));
    geo.setAttribute("aParticleType", new THREE.BufferAttribute(particleTypes, 1));
    
    return geo;
  }, [particleCount]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: cardVertexShader,
      fragmentShader: cardFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uFormationProgress: { value: 0 },
        uTargetPosition: { value: new THREE.Vector3(...position) },
        uWidth: { value: width },
        uHeight: { value: height },
        uColor: { value: new THREE.Vector3(0.08, 0.25, 0.4) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [position, width, height]);

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    const time = state.clock.elapsedTime;
    
    const speed = targetProgressRef.current > formationProgress ? 0.8 : 1.5;
    const newProgress = THREE.MathUtils.lerp(
      formationProgress,
      targetProgressRef.current,
      Math.min(delta * speed, 1)
    );
    setFormationProgress(newProgress);

    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uFormationProgress.value = newProgress;
  });

  if (formationProgress < 0.01 && !visible) return null;

  // Calculate screen position for HTML overlay
  const screenWidth = width * 100;
  const screenHeight = height * 100;

  return (
    <group>
      {/* Particle backdrop */}
      <points ref={pointsRef} geometry={geometry}>
        <primitive object={material} ref={materialRef} attach="material" />
      </points>
      
      {/* HTML content overlay - appears when formation is mostly complete */}
      {formationProgress > 0.7 && (
        <Html
          position={position}
          center
          style={{
            width: `${screenWidth}px`,
            opacity: Math.pow((formationProgress - 0.7) / 0.3, 0.5),
            pointerEvents: formationProgress > 0.95 ? 'auto' : 'none',
            transition: 'opacity 0.2s ease-out',
          }}
        >
          <div 
            className="rounded-2xl p-3 overflow-hidden border border-primary/30"
            style={{
              width: `${screenWidth}px`,
              minHeight: `${screenHeight}px`,
              background: 'linear-gradient(135deg, hsl(var(--glass-bg) / 0.85) 0%, hsl(var(--glass-bg) / 0.6) 50%, hsl(var(--glass-bg) / 0.85) 100%)',
              backdropFilter: 'blur(12px)',
              boxShadow: `
                0 0 30px hsl(var(--primary) / 0.15),
                0 15px 30px hsl(var(--background) / 0.4),
                inset 0 1px 0 hsl(var(--foreground) / 0.12)
              `,
            }}
          >
            {/* Top highlight */}
            <div 
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.2), transparent)',
              }}
            />
            
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-primary/25 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-medium text-foreground truncate">{card.title}</h3>
                <p className="text-[10px] text-muted-foreground truncate">{card.subtitle}</p>
              </div>
            </div>

            {/* Content */}
            <p className="text-[10px] text-muted-foreground/85 leading-relaxed line-clamp-2">
              {card.content}
            </p>

            {/* Bottom glow */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)',
              }}
            />
          </div>
        </Html>
      )}
    </group>
  );
};
