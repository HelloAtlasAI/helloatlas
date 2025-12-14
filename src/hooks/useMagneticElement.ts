import { useState, useCallback, useRef, RefObject } from 'react';

interface MagneticPosition {
  x: number;
  y: number;
}

interface UseMagneticElementOptions {
  strength?: number;
  radius?: number;
  smoothing?: number;
}

export const useMagneticElement = <T extends HTMLElement>(
  options: UseMagneticElementOptions = {}
) => {
  const {
    strength = 0.3,
    radius = 100,
    smoothing = 0.15,
  } = options;

  const elementRef = useRef<T>(null);
  const [position, setPosition] = useState<MagneticPosition>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const rafRef = useRef<number>();
  const targetRef = useRef<MagneticPosition>({ x: 0, y: 0 });
  const currentRef = useRef<MagneticPosition>({ x: 0, y: 0 });

  const animate = useCallback(() => {
    const current = currentRef.current;
    const target = targetRef.current;

    current.x += (target.x - current.x) * smoothing;
    current.y += (target.y - current.y) * smoothing;

    if (Math.abs(current.x - target.x) > 0.01 || Math.abs(current.y - target.y) > 0.01) {
      setPosition({ ...current });
      rafRef.current = requestAnimationFrame(animate);
    } else {
      setPosition(target);
    }
  }, [smoothing]);

  const handleMouseMove = useCallback((e: React.MouseEvent<T>) => {
    if (!elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance < radius) {
      const factor = (1 - distance / radius) * strength;
      targetRef.current = {
        x: deltaX * factor,
        y: deltaY * factor,
      };
    } else {
      targetRef.current = { x: 0, y: 0 };
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
  }, [radius, strength, animate]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    targetRef.current = { x: 0, y: 0 };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const magneticStyle = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    transition: isHovered ? 'none' : 'transform 0.3s ease-out',
  };

  const magneticProps = {
    ref: elementRef as RefObject<T>,
    onMouseMove: handleMouseMove,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    style: magneticStyle,
  };

  return {
    elementRef,
    position,
    isHovered,
    magneticStyle,
    magneticProps,
  };
};
