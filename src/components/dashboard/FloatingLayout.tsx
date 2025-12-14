import { ReactNode, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface FloatingLayoutProps {
  children: ReactNode;
}

export const FloatingLayout = ({ children }: FloatingLayoutProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    });
  }, []);
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);
  
  return (
    <motion.div 
      className="relative w-full h-full"
      style={{
        perspective: '2000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        className="w-full h-full"
        animate={{
          rotateY: (mousePosition.x - 0.5) * 3,
          rotateX: -(mousePosition.y - 0.5) * 3,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 30 }}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

interface FloatingElementProps {
  children: ReactNode;
  depth?: number;
  offsetX?: number;
  offsetY?: number;
  className?: string;
  floatAmplitude?: number;
  floatSpeed?: number;
}

export const FloatingElement = ({
  children,
  depth = 0,
  offsetX = 0,
  offsetY = 0,
  className = '',
  floatAmplitude = 10,
  floatSpeed = 3,
}: FloatingElementProps) => {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{ duration: 0.6, delay: depth * 0.1 }}
      style={{
        transform: `translateZ(${depth * 30}px) translateX(${offsetX}px) translateY(${offsetY}px)`,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        animate={{
          y: [0, floatAmplitude, 0],
        }}
        transition={{
          duration: floatSpeed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
