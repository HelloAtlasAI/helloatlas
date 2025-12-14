import { motion } from 'framer-motion';
import { ReactNode, useMemo } from 'react';

type NotchPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';
type MorphShape = 'notch' | 'l-shape' | 'wave' | 'stepped';

interface MorphableCardProps {
  children: ReactNode;
  className?: string;
  notch?: NotchPosition;
  shape?: MorphShape;
  notchSize?: number;
  glowColor?: string;
  onClick?: () => void;
  layoutId?: string;
  enabled?: boolean; // Control whether morphing is applied
}

export const MorphableCard = ({ 
  children, 
  className = '',
  notch = 'none',
  shape = 'notch',
  notchSize = 25,
  glowColor = 'rgba(99, 102, 241, 0.15)',
  onClick,
  layoutId,
  enabled = true // Only morph on larger screens by default
}: MorphableCardProps) => {
  
  // Generate SVG path for rounded notch with smooth curves
  const svgPath = useMemo(() => {
    if (notch === 'none' || !enabled) return null;
    
    const n = notchSize;
    const r = 16; // Border radius
    const nr = 12; // Notch corner radius
    
    // Create path based on notch position with rounded corners
    switch (notch) {
      case 'top-left':
        return `
          M ${r} 0
          L calc(100% - ${r}px) 0
          Q 100% 0 100% ${r}
          L 100% calc(100% - ${r}px)
          Q 100% 100% calc(100% - ${r}px) 100%
          L ${r} 100%
          Q 0 100% 0 calc(100% - ${r}px)
          L 0 ${n}%
          Q 0 calc(${n}% - ${nr}px) ${nr}px calc(${n}% - ${nr}px)
          L calc(${n}% - ${nr}px) calc(${n}% - ${nr}px)
          Q ${n}% calc(${n}% - ${nr}px) ${n}% calc(${n}% - ${nr * 2}px)
          L ${n}% ${r}
          Q ${n}% 0 calc(${n}% + ${r}px) 0
          Z
        `;
      case 'top-right':
        return `
          M ${r} 0
          L calc(${100 - n}% - ${r}px) 0
          Q calc(${100 - n}%) 0 calc(${100 - n}%) ${r}
          L calc(${100 - n}%) calc(${n}% - ${nr * 2}px)
          Q calc(${100 - n}%) calc(${n}% - ${nr}px) calc(${100 - n}% + ${nr}px) calc(${n}% - ${nr}px)
          L calc(100% - ${nr}px) calc(${n}% - ${nr}px)
          Q 100% calc(${n}% - ${nr}px) 100% ${n}%
          L 100% calc(100% - ${r}px)
          Q 100% 100% calc(100% - ${r}px) 100%
          L ${r} 100%
          Q 0 100% 0 calc(100% - ${r}px)
          L 0 ${r}
          Q 0 0 ${r} 0
          Z
        `;
      case 'bottom-left':
        return `
          M ${r} 0
          L calc(100% - ${r}px) 0
          Q 100% 0 100% ${r}
          L 100% calc(100% - ${r}px)
          Q 100% 100% calc(100% - ${r}px) 100%
          L calc(${n}% + ${r}px) 100%
          Q ${n}% 100% ${n}% calc(100% - ${r}px)
          L ${n}% calc(${100 - n}% + ${nr * 2}px)
          Q ${n}% calc(${100 - n}% + ${nr}px) calc(${n}% - ${nr}px) calc(${100 - n}% + ${nr}px)
          L ${nr}px calc(${100 - n}% + ${nr}px)
          Q 0 calc(${100 - n}% + ${nr}px) 0 calc(${100 - n}%)
          L 0 ${r}
          Q 0 0 ${r} 0
          Z
        `;
      case 'bottom-right':
        return `
          M ${r} 0
          L calc(100% - ${r}px) 0
          Q 100% 0 100% ${r}
          L 100% calc(${100 - n}%)
          Q 100% calc(${100 - n}% + ${nr}px) calc(100% - ${nr}px) calc(${100 - n}% + ${nr}px)
          L calc(${100 - n}% + ${nr}px) calc(${100 - n}% + ${nr}px)
          Q calc(${100 - n}%) calc(${100 - n}% + ${nr}px) calc(${100 - n}%) calc(${100 - n}% + ${nr * 2}px)
          L calc(${100 - n}%) calc(100% - ${r}px)
          Q calc(${100 - n}%) 100% calc(${100 - n}% - ${r}px) 100%
          L ${r} 100%
          Q 0 100% 0 calc(100% - ${r}px)
          L 0 ${r}
          Q 0 0 ${r} 0
          Z
        `;
      default:
        return null;
    }
  }, [notch, notchSize, enabled]);

  // If no morphing, render children directly
  if (notch === 'none' || !enabled) {
    return (
      <motion.div
        layoutId={layoutId}
        className={`relative h-full ${className}`}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  // Render with morphable shape using clip-path
  const clipPathStyle = useMemo(() => {
    const n = notchSize;
    
    // Use simple polygon for now with rounded effect simulated
    switch (notch) {
      case 'top-left':
        return {
          clipPath: `polygon(${n}% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${n}%, ${n}% ${n}%)`
        };
      case 'top-right':
        return {
          clipPath: `polygon(0% 0%, ${100 - n}% 0%, ${100 - n}% ${n}%, 100% ${n}%, 100% 100%, 0% 100%)`
        };
      case 'bottom-left':
        return {
          clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, ${n}% 100%, ${n}% ${100 - n}%, 0% ${100 - n}%)`
        };
      case 'bottom-right':
        return {
          clipPath: `polygon(0% 0%, 100% 0%, 100% ${100 - n}%, ${100 - n}% ${100 - n}%, ${100 - n}% 100%, 0% 100%)`
        };
      default:
        return {};
    }
  }, [notch, notchSize]);

  return (
    <motion.div
      layoutId={layoutId}
      className={`relative h-full ${className}`}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      {/* Background layer with clip-path */}
      <div 
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={clipPathStyle}
      >
        {/* Gradient glow in the notch area */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(ellipse at ${
              notch === 'top-left' ? 'top left' :
              notch === 'top-right' ? 'top right' :
              notch === 'bottom-left' ? 'bottom left' :
              'bottom right'
            }, ${glowColor} 0%, transparent 50%)`
          }}
        />
      </div>
      
      {/* Content wrapper with matching clip-path */}
      <div 
        className="relative h-full"
        style={clipPathStyle}
      >
        {children}
      </div>

      {/* Subtle border accent on the notch edge */}
      <div 
        className="absolute pointer-events-none"
        style={{
          ...getNotchBorderStyle(notch, notchSize),
          background: `linear-gradient(${
            notch === 'top-left' ? '135deg' :
            notch === 'top-right' ? '-135deg' :
            notch === 'bottom-left' ? '45deg' :
            '-45deg'
          }, hsl(var(--primary) / 0.3), transparent)`
        }}
      />
    </motion.div>
  );
};

// Helper to position the accent border on the notch edge
function getNotchBorderStyle(notch: NotchPosition, size: number): React.CSSProperties {
  const thickness = 2;
  
  switch (notch) {
    case 'top-left':
      return {
        top: `${size}%`,
        left: 0,
        width: `${size}%`,
        height: thickness,
        transform: 'translateY(-50%)'
      };
    case 'top-right':
      return {
        top: `${size}%`,
        right: 0,
        width: `${size}%`,
        height: thickness,
        transform: 'translateY(-50%)'
      };
    case 'bottom-left':
      return {
        bottom: `${size}%`,
        left: 0,
        width: `${size}%`,
        height: thickness,
        transform: 'translateY(50%)'
      };
    case 'bottom-right':
      return {
        bottom: `${size}%`,
        right: 0,
        width: `${size}%`,
        height: thickness,
        transform: 'translateY(50%)'
      };
    default:
      return {};
  }
}
