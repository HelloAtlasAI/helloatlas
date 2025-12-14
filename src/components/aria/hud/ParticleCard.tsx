import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Mail, Plane, TrendingUp, Calendar, FileText, LucideIcon, X } from "lucide-react";

export interface CardData {
  id: string;
  type: "email" | "flight" | "stock" | "calendar" | "document";
  title: string;
  subtitle: string;
  content: string;
  expandedContent?: string;
}

interface ParticleCardProps {
  visible: boolean;
  position: [number, number, number];
  width: number;
  height: number;
  card: CardData;
  particleCount?: number;
  onExpand?: (cardId: string) => void;
}

const iconMap: Record<string, LucideIcon> = {
  email: Mail,
  flight: Plane,
  stock: TrendingUp,
  calendar: Calendar,
  document: FileText,
};

// Vertex shader - particles lock perfectly when formed
const cardVertexShader = `
  uniform float uTime;
  uniform float uFormationProgress;
  uniform vec3 uTargetPosition;
  uniform float uWidth;
  uniform float uHeight;
  uniform float uScale;
  
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
      aTargetLocal.x * uWidth * uScale,
      aTargetLocal.y * uHeight * uScale,
      0.0
    );
    
    float typeDelay = aParticleType * 0.06;
    float delayedProgress = clamp((uFormationProgress - aDelay * 0.12 - typeDelay) / 0.7, 0.0, 1.0);
    delayedProgress = smoothstep(0.0, 1.0, delayedProgress);
    delayedProgress = delayedProgress * delayedProgress * (3.0 - 2.0 * delayedProgress);
    
    vec3 pos;
    
    // PERFECT LOCK: When fully formed, particles snap to exact positions
    if (delayedProgress >= 0.99) {
      pos = targetPos;
    } else {
      pos = mix(position, targetPos, delayedProgress);
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    float baseSize = 0.5;
    if (aParticleType < 0.5) baseSize = 0.9;
    else if (aParticleType > 1.5 && aParticleType < 2.5) baseSize = 1.0;
    else if (aParticleType > 2.5) baseSize = 0.85;
    
    gl_PointSize = (baseSize + delayedProgress * 0.15) * uScale * (100.0 / -mvPosition.z);
    
    float borderDist = min(min(abs(aTargetLocal.x + 0.5), abs(aTargetLocal.x - 0.5)), 
                          min(abs(aTargetLocal.y + 0.5), abs(aTargetLocal.y - 0.5)));
    
    if (aParticleType < 0.5) {
      vAlpha = 0.65 + delayedProgress * 0.25;
    } else if (aParticleType < 1.5) {
      float edgeDist = 1.0 - borderDist * 2.0;
      vAlpha = (0.15 + edgeDist * 0.25) * delayedProgress;
    } else if (aParticleType < 2.5) {
      vAlpha = 0.75 + delayedProgress * 0.2;
    } else {
      vAlpha = 0.45 + delayedProgress * 0.25;
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
      color = uColor * 1.3 + vec3(0.08, 0.12, 0.18);
    } else if (vParticleType < 1.5) {
      float gradientY = vLocalPos.y + 0.5;
      color = mix(uColor * 0.45, uColor * 0.8, gradientY);
      color += vec3(0.015, 0.025, 0.035);
    } else if (vParticleType < 2.5) {
      color = vec3(0.3, 0.4, 0.5) + uColor * 0.2;
    } else {
      color = uColor * 0.7 + vec3(0.03, 0.05, 0.08);
    }
    
    gl_FragColor = vec4(color, alpha);
  }
`;

const createCardParticles = (count: number) => {
  const positions = new Float32Array(count * 3);
  const targetLocal = new Float32Array(count * 3);
  const delays = new Float32Array(count);
  const particleTypes = new Float32Array(count);
  
  const borderCount = Math.floor(count * 0.35);
  const interiorCount = Math.floor(count * 0.45);
  const highlightCount = Math.floor(count * 0.12);
  const glowCount = count - borderCount - interiorCount - highlightCount;
  
  let idx = 0;
  
  // Border particles - PERFECT aligned outline
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
    
    // NO random offset for perfect alignment
    setParticle(idx, x, y, 0, positions, targetLocal, delays, particleTypes);
    idx++;
  }
  
  // Interior particles - aligned grid pattern
  const gridSize = Math.floor(Math.sqrt(interiorCount));
  for (let i = 0; i < interiorCount; i++) {
    const gx = (i % gridSize) / gridSize;
    const gy = Math.floor(i / gridSize) / gridSize;
    const x = (gx - 0.5) * 0.88;
    const y = (gy - 0.5) * 0.88;
    
    setParticle(idx, x, y, 1, positions, targetLocal, delays, particleTypes);
    idx++;
  }
  
  // Top highlight - aligned horizontal line
  for (let i = 0; i < highlightCount; i++) {
    const x = (i / highlightCount - 0.5) * 0.88;
    const y = 0.44;
    setParticle(idx, x, y, 2, positions, targetLocal, delays, particleTypes);
    idx++;
  }
  
  // Bottom glow - aligned horizontal line
  for (let i = 0; i < glowCount; i++) {
    const x = (i / glowCount - 0.5) * 0.85;
    const y = -0.44;
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
  const r = 2 + Math.random() * 4;
  
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
  onExpand,
}: ParticleCardProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [formationProgress, setFormationProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const targetProgressRef = useRef(0);
  const scaleRef = useRef(1);
  
  const Icon = iconMap[card.type] || FileText;

  const handleClick = useCallback(() => {
    setIsExpanded(prev => !prev);
    onExpand?.(card.id);
  }, [card.id, onExpand]);

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
        uScale: { value: 1 },
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

    // Animate scale for expansion
    const targetScale = isExpanded ? 1.4 : 1;
    scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, targetScale, delta * 5);

    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uFormationProgress.value = newProgress;
    materialRef.current.uniforms.uScale.value = scaleRef.current;
  });

  if (formationProgress < 0.01 && !visible) return null;

  const screenWidth = width * 100;
  const screenHeight = height * 100;
  const currentScale = scaleRef.current;

  return (
    <group>
      {/* Particle backdrop */}
      <points ref={pointsRef} geometry={geometry}>
        <primitive object={material} ref={materialRef} attach="material" />
      </points>
      
      {/* HTML content overlay */}
      {formationProgress > 0.7 && (
        <Html
          position={position}
          center
          style={{
            width: `${screenWidth * currentScale}px`,
            opacity: Math.pow((formationProgress - 0.7) / 0.3, 0.5),
            pointerEvents: formationProgress > 0.95 ? 'auto' : 'none',
            transition: 'width 0.3s ease-out, opacity 0.2s ease-out',
            cursor: 'pointer',
          }}
        >
          <div 
            onClick={handleClick}
            className="rounded-2xl p-3 overflow-hidden border border-primary/30 relative transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
            style={{
              width: `${screenWidth * currentScale}px`,
              minHeight: `${screenHeight * currentScale}px`,
              background: 'linear-gradient(135deg, hsl(var(--glass-bg) / 0.9) 0%, hsl(var(--glass-bg) / 0.65) 50%, hsl(var(--glass-bg) / 0.9) 100%)',
              backdropFilter: 'blur(12px)',
              boxShadow: isExpanded 
                ? `0 0 50px hsl(var(--primary) / 0.25), 0 20px 40px hsl(var(--background) / 0.5), inset 0 1px 0 hsl(var(--foreground) / 0.15)`
                : `0 0 30px hsl(var(--primary) / 0.15), 0 15px 30px hsl(var(--background) / 0.4), inset 0 1px 0 hsl(var(--foreground) / 0.12)`,
              transform: `scale(${isExpanded ? 1.02 : 1})`,
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
              <div className="w-7 h-7 rounded-lg bg-primary/25 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-medium text-foreground truncate">{card.title}</h3>
                <p className="text-[10px] text-muted-foreground truncate">{card.subtitle}</p>
              </div>
              {isExpanded && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                  className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Content */}
            <p className={`text-[10px] text-muted-foreground/85 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
              {card.content}
            </p>

            {/* Expanded content */}
            {isExpanded && card.expandedContent && (
              <div className="mt-2 pt-2 border-t border-border/30">
                <p className="text-[10px] text-muted-foreground/75 leading-relaxed">
                  {card.expandedContent}
                </p>
              </div>
            )}

            {/* Click hint when not expanded */}
            {!isExpanded && formationProgress > 0.95 && (
              <p className="text-[8px] text-muted-foreground/50 mt-1.5 text-center">
                Click to expand
              </p>
            )}

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