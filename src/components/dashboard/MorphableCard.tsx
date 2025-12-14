import { motion } from 'framer-motion';
import { ReactNode, useMemo } from 'react';

type NotchPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';

interface MorphableCardProps {
  children: ReactNode;
  className?: string;
  notch?: NotchPosition;
  notchSize?: number; // percentage of card size
  glowColor?: string;
  onClick?: () => void;
  layoutId?: string;
}

export const MorphableCard = ({ 
  children, 
  className = '',
  notch = 'none',
  notchSize = 30,
  glowColor = 'rgba(99, 102, 241, 0.15)',
  onClick,
  layoutId
}: MorphableCardProps) => {
  const clipPath = useMemo(() => {
    if (notch === 'none') return 'none';
    
    const n = notchSize;
    const full = 100;
    
    // Create polygon clip-paths for non-rectangular shapes
    switch (notch) {
      case 'top-left':
        // Cut out top-left corner
        return `polygon(${n}% 0%, ${full}% 0%, ${full}% ${full}%, 0% ${full}%, 0% ${n}%, ${n}% ${n}%)`;
      case 'top-right':
        // Cut out top-right corner
        return `polygon(0% 0%, ${full - n}% 0%, ${full - n}% ${n}%, ${full}% ${n}%, ${full}% ${full}%, 0% ${full}%)`;
      case 'bottom-left':
        // Cut out bottom-left corner
        return `polygon(0% 0%, ${full}% 0%, ${full}% ${full}%, ${n}% ${full}%, ${n}% ${full - n}%, 0% ${full - n}%)`;
      case 'bottom-right':
        // Cut out bottom-right corner
        return `polygon(0% 0%, ${full}% 0%, ${full}% ${full - n}%, ${full - n}% ${full - n}%, ${full - n}% ${full}%, 0% ${full}%)`;
      default:
        return 'none';
    }
  }, [notch, notchSize]);

  return (
    <motion.div
      layoutId={layoutId}
      className={`relative h-full ${className}`}
      style={{ clipPath: clipPath !== 'none' ? clipPath : undefined }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {/* Content - renders the child card with its own styling */}
      {children}
    </motion.div>
  );
};
