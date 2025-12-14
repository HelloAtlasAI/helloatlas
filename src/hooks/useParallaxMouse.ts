import { useState, useEffect, useCallback, useRef } from 'react';

interface ParallaxPosition {
  x: number;
  y: number;
  rotateX: number;
  rotateY: number;
}

interface UseParallaxMouseOptions {
  intensity?: number;
  rotationIntensity?: number;
  smoothing?: number;
  enabled?: boolean;
}

export const useParallaxMouse = (options: UseParallaxMouseOptions = {}) => {
  const {
    intensity = 0.02,
    rotationIntensity = 0.01,
    smoothing = 0.1,
    enabled = true,
  } = options;

  const [position, setPosition] = useState<ParallaxPosition>({
    x: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
  });

  const targetRef = useRef<ParallaxPosition>({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
  const currentRef = useRef<ParallaxPosition>({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
  const rafRef = useRef<number>();

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enabled) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const deltaX = (e.clientX - centerX) / centerX;
    const deltaY = (e.clientY - centerY) / centerY;

    targetRef.current = {
      x: deltaX * intensity * 100,
      y: deltaY * intensity * 100,
      rotateX: -deltaY * rotationIntensity * 15,
      rotateY: deltaX * rotationIntensity * 15,
    };
  }, [enabled, intensity, rotationIntensity]);

  const animate = useCallback(() => {
    const current = currentRef.current;
    const target = targetRef.current;

    current.x += (target.x - current.x) * smoothing;
    current.y += (target.y - current.y) * smoothing;
    current.rotateX += (target.rotateX - current.rotateX) * smoothing;
    current.rotateY += (target.rotateY - current.rotateY) * smoothing;

    setPosition({ ...current });
    rafRef.current = requestAnimationFrame(animate);
  }, [smoothing]);

  useEffect(() => {
    if (!enabled) {
      setPosition({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
      return;
    }

    window.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [enabled, handleMouseMove, animate]);

  const getLayerStyle = useCallback((depth: number = 1) => ({
    transform: `translate(${position.x * depth}px, ${position.y * depth}px)`,
    transition: 'transform 0.05s ease-out',
  }), [position]);

  const get3DStyle = useCallback((depth: number = 1) => ({
    transform: `
      perspective(1000px)
      translate(${position.x * depth}px, ${position.y * depth}px)
      rotateX(${position.rotateX * depth}deg)
      rotateY(${position.rotateY * depth}deg)
    `,
    transition: 'transform 0.05s ease-out',
  }), [position]);

  return {
    position,
    getLayerStyle,
    get3DStyle,
  };
};
