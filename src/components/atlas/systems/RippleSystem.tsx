import { useRef, memo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WakeWordState } from '@/types';
import { STATE_CONFIGS } from '../utils/stateConfigs';

interface Ripple {
  id: number;
  startTime: number;
  color: THREE.Color;
  scale: number;
  opacity: number;
}

interface RippleSystemProps {
  state: WakeWordState;
  enabled: boolean;
  rippleSpeed: number;
  rippleCount: number;
}

const MAX_RIPPLES = 6;

/**
 * Ref-based ring ripples - no React state re-renders
 */
export const RippleSystem = memo(({ 
  state,
  enabled,
  rippleSpeed,
  rippleCount
}: RippleSystemProps) => {
  const prevStateRef = useRef(state);
  const rippleIdRef = useRef(0);
  const ripplesRef = useRef<Ripple[]>([]);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const materialRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  
  const config = STATE_CONFIGS[state];

  // Initialize mesh refs array
  useEffect(() => {
    meshRefs.current = new Array(MAX_RIPPLES).fill(null);
    materialRefs.current = new Array(MAX_RIPPLES).fill(null);
  }, []);

  // Trigger ripples on state change - no setState!
  useEffect(() => {
    if (prevStateRef.current !== state && enabled) {
      const now = performance.now() / 1000;
      const count = Math.min(rippleCount, 2); // Limit ripples
      
      for (let i = 0; i < count; i++) {
        rippleIdRef.current++;
        ripplesRef.current.push({
          id: rippleIdRef.current,
          startTime: now + i * 0.15,
          color: config.primary.clone(),
          scale: 0.5,
          opacity: 0.6
        });
      }
      
      // Keep only recent ripples
      if (ripplesRef.current.length > MAX_RIPPLES) {
        ripplesRef.current = ripplesRef.current.slice(-MAX_RIPPLES);
      }
      
      prevStateRef.current = state;
    }
  }, [state, enabled, rippleCount, config.primary]);

  useFrame(({ clock }) => {
    const now = clock.getElapsedTime();
    const toRemove: number[] = [];
    
    ripplesRef.current.forEach((ripple, index) => {
      const elapsed = now - ripple.startTime;
      if (elapsed < 0) return; // Not started yet
      
      const progress = Math.min(elapsed * rippleSpeed, 1);
      
      if (progress >= 1) {
        toRemove.push(index);
        return;
      }
      
      // Update mesh directly
      const mesh = meshRefs.current[index];
      const material = materialRefs.current[index];
      
      if (mesh && material) {
        const radius = 0.5 + progress * 3;
        mesh.scale.setScalar(radius);
        mesh.visible = true;
        material.opacity = (1 - progress) * 0.5;
        material.color.copy(ripple.color);
      }
    });
    
    // Remove completed ripples
    if (toRemove.length > 0) {
      toRemove.reverse().forEach(idx => {
        ripplesRef.current.splice(idx, 1);
        const mesh = meshRefs.current[idx];
        if (mesh) mesh.visible = false;
      });
    }
  });

  if (!enabled) return null;

  return (
    <group ref={groupRef}>
      {Array.from({ length: MAX_RIPPLES }).map((_, i) => (
        <mesh 
          key={i} 
          ref={(el) => { meshRefs.current[i] = el; }}
          rotation={[Math.PI / 2, 0, 0]}
          visible={false}
        >
          <torusGeometry args={[1, 0.015, 6, 32]} />
          <meshBasicMaterial
            ref={(el) => { materialRefs.current[i] = el; }}
            color={config.primary}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
});

RippleSystem.displayName = 'RippleSystem';
