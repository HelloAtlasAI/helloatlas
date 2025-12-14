import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useParallaxMouse } from '@/hooks/useParallaxMouse';

interface ParallaxLayerProps {
  children: ReactNode;
  depth?: number;
  className?: string;
  enable3D?: boolean;
}

export const ParallaxLayer = ({
  children,
  depth = 1,
  className = '',
  enable3D = false,
}: ParallaxLayerProps) => {
  const { getLayerStyle, get3DStyle } = useParallaxMouse({
    intensity: 0.03,
    rotationIntensity: 0.015,
    smoothing: 0.08,
  });

  const style = enable3D ? get3DStyle(depth) : getLayerStyle(depth);

  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};
