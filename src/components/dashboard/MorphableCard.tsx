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
    
    switch (notch) {
      case 'top-left':
        return `polygon(${n}% 0%, ${full}% 0%, ${full}% ${full}%, 0% ${full}%, 0% ${n}%, ${n}% ${n}%)`;
      case 'top-right':
        return `polygon(0% 0%, ${full - n}% 0%, ${full - n}% ${n}%, ${full}% ${n}%, ${full}% ${full}%, 0% ${full}%)`;
      case 'bottom-left':
        return `polygon(0% 0%, ${full}% 0%, ${full}% ${full}%, ${n}% ${full}%, ${n}% ${full - n}%, 0% ${full - n}%)`;
      case 'bottom-right':
        return `polygon(0% 0%, ${full}% 0%, ${full}% ${full - n}%, ${full - n}% ${full - n}%, ${full - n}% ${full}%, 0% ${full}%)`;
      default:
        return 'none';
    }
  }, [notch, notchSize]);

  return (
    <motion.div
      layoutId={layoutId}
      className={`relative overflow-hidden rounded-2xl h-full bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={{ clipPath: clipPath !== 'none' ? clipPath : undefined }}
      whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.2)' }}
      transition={{ duration: 0.2 }}
    >
      {/* Glow effect */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none" 
        style={{ background: `radial-gradient(ellipse at top, ${glowColor} 0%, transparent 60%)` }} 
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};
