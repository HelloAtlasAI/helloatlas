import { useRef, memo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WakeWordState } from '@/hooks/useWakeWord';
import { STATE_CONFIGS } from '../utils/stateConfigs';

interface Ripple {
  id: number;
  startTime: number;
  color: THREE.Color;
}

interface RippleSystemProps {
  state: WakeWordState;
  enabled: boolean;
  rippleSpeed: number;
  rippleCount: number;
}

/**
 * Ring ripples that expand on state changes
 */
export const RippleSystem = memo(({ 
  state,
  enabled,
  rippleSpeed,
  rippleCount
}: RippleSystemProps) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const prevStateRef = useRef(state);
  const rippleIdRef = useRef(0);
  const ripplesRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<Map<number, THREE.MeshBasicMaterial>>(new Map());
  
  const config = STATE_CONFIGS[state];

  // Trigger ripples on state change
  useEffect(() => {
    if (prevStateRef.current !== state && enabled) {
      const newRipples: Ripple[] = [];
      for (let i = 0; i < rippleCount; i++) {
        rippleIdRef.current++;
        newRipples.push({
          id: rippleIdRef.current,
          startTime: performance.now() / 1000 + i * 0.15,
          color: config.primary.clone()
        });
      }
      setRipples(prev => [...prev.slice(-5), ...newRipples]);
      prevStateRef.current = state;
    }
  }, [state, enabled, rippleCount, config.primary]);

  // Clean up old ripples
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now() / 1000;
      setRipples(prev => prev.filter(r => now - r.startTime < 2));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useFrame(({ clock }) => {
    if (!ripplesRef.current) return;
    
    ripplesRef.current.children.forEach((child, index) => {
      const ripple = ripples[index];
      if (!ripple) return;
      
      const elapsed = clock.getElapsedTime() - ripple.startTime;
      const progress = Math.min(elapsed * rippleSpeed, 1);
      
      const radius = 0.5 + progress * 3.5;
      child.scale.setScalar(radius);
      
      const material = materialsRef.current.get(ripple.id);
      if (material) {
        material.opacity = (1 - progress) * 0.6;
      }
    });
  });

  if (!enabled || ripples.length === 0) return null;

  return (
    <group ref={ripplesRef}>
      {ripples.map((ripple) => (
        <mesh key={ripple.id} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1, 0.02, 8, 64]} />
          <meshBasicMaterial
            ref={(mat) => {
              if (mat) materialsRef.current.set(ripple.id, mat);
            }}
            color={ripple.color}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
});

RippleSystem.displayName = 'RippleSystem';
