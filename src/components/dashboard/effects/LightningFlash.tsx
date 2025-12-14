import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LightningFlashProps {
  intensity?: number;
  frequency?: number;
  enabled?: boolean;
}

export const LightningFlash = ({
  intensity = 1,
  frequency = 0.02,
  enabled = true,
}: LightningFlashProps) => {
  const lightRef = useRef<THREE.PointLight>(null);
  const [flashing, setFlashing] = useState(false);
  const flashTimeRef = useRef(0);
  const nextFlashRef = useRef(Math.random() * 5 + 2);

  useFrame((state, delta) => {
    if (!enabled || !lightRef.current) return;

    flashTimeRef.current += delta;

    if (!flashing && flashTimeRef.current > nextFlashRef.current) {
      setFlashing(true);
      flashTimeRef.current = 0;
      nextFlashRef.current = (Math.random() * 10 + 5) / (frequency * 10);
    }

    if (flashing) {
      const progress = flashTimeRef.current * 10;
      
      if (progress < 0.3) {
        lightRef.current.intensity = intensity * 50 * Math.random();
      } else if (progress < 0.5) {
        lightRef.current.intensity = intensity * 20 * Math.random();
      } else if (progress < 0.8) {
        lightRef.current.intensity = intensity * 40 * Math.random();
      } else if (progress > 1) {
        lightRef.current.intensity = 0;
        setFlashing(false);
      }
    }
  });

  if (!enabled) return null;

  return (
    <pointLight
      ref={lightRef}
      position={[0, 10, -5]}
      color="#ffffff"
      intensity={0}
      distance={50}
      decay={2}
    />
  );
};

// 2D overlay component for lightning effect
export const LightningOverlay = ({ 
  flashing, 
  intensity = 1 
}: { 
  flashing: boolean; 
  intensity?: number;
}) => {
  if (!flashing) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50 bg-white/20"
      style={{
        opacity: intensity * 0.3,
        animation: 'lightning-flash 0.15s ease-out',
      }}
    />
  );
};
