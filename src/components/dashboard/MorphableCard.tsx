import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type NotchPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'none';

interface MorphableCardProps {
  children: ReactNode;
  className?: string;
  notch?: NotchPosition;
  notchSize?: number;
  glowColor?: string;
  onClick?: () => void;
  layoutId?: string;
  enabled?: boolean;
}

export const MorphableCard = ({ 
  children, 
  className = '',
  notch = 'none',
  notchSize = 25,
  glowColor = 'hsl(var(--primary) / 0.15)',
  onClick,
  layoutId,
  enabled = true
}: MorphableCardProps) => {
  
  // If morphing disabled or no notch, render standard card
  if (notch === 'none' || !enabled) {
    return (
      <motion.div
        layoutId={layoutId}
        className={`relative h-full ${className}`}
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  // Calculate overlay positioning based on notch position
  const getOverlayStyle = (): React.CSSProperties => {
    const size = `${notchSize}%`;
    
    switch (notch) {
      case 'top-left':
        return { top: 0, left: 0, width: size, height: size };
      case 'top-right':
        return { top: 0, right: 0, width: size, height: size };
      case 'bottom-left':
        return { bottom: 0, left: 0, width: size, height: size };
      case 'bottom-right':
        return { bottom: 0, right: 0, width: size, height: size };
      default:
        return {};
    }
  };

  // Get the accent line positioning
  const getAccentStyle = (): React.CSSProperties => {
    switch (notch) {
      case 'top-left':
        return { 
          top: `${notchSize}%`, 
          left: 0, 
          width: `${notchSize}%`, 
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${glowColor})`
        };
      case 'top-right':
        return { 
          top: `${notchSize}%`, 
          right: 0, 
          width: `${notchSize}%`, 
          height: '2px',
          background: `linear-gradient(90deg, ${glowColor}, transparent)`
        };
      case 'bottom-left':
        return { 
          bottom: `${notchSize}%`, 
          left: 0, 
          width: `${notchSize}%`, 
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${glowColor})`
        };
      case 'bottom-right':
        return { 
          bottom: `${notchSize}%`, 
          right: 0, 
          width: `${notchSize}%`, 
          height: '2px',
          background: `linear-gradient(90deg, ${glowColor}, transparent)`
        };
      default:
        return {};
    }
  };

  // Get vertical accent for the notch edge
  const getVerticalAccentStyle = (): React.CSSProperties => {
    switch (notch) {
      case 'top-left':
        return { 
          top: 0, 
          left: `${notchSize}%`, 
          width: '2px', 
          height: `${notchSize}%`,
          background: `linear-gradient(180deg, transparent, ${glowColor})`
        };
      case 'top-right':
        return { 
          top: 0, 
          right: `${notchSize}%`, 
          width: '2px', 
          height: `${notchSize}%`,
          background: `linear-gradient(180deg, transparent, ${glowColor})`
        };
      case 'bottom-left':
        return { 
          bottom: 0, 
          left: `${notchSize}%`, 
          width: '2px', 
          height: `${notchSize}%`,
          background: `linear-gradient(0deg, transparent, ${glowColor})`
        };
      case 'bottom-right':
        return { 
          bottom: 0, 
          right: `${notchSize}%`, 
          width: '2px', 
          height: `${notchSize}%`,
          background: `linear-gradient(0deg, transparent, ${glowColor})`
        };
      default:
        return {};
    }
  };

  // Get corner radius classes for overlay
  const getOverlayRoundedClass = () => {
    switch (notch) {
      case 'top-left': return 'rounded-br-2xl';
      case 'top-right': return 'rounded-bl-2xl';
      case 'bottom-left': return 'rounded-tr-2xl';
      case 'bottom-right': return 'rounded-tl-2xl';
      default: return '';
    }
  };

  return (
    <motion.div
      layoutId={layoutId}
      className={`relative h-full ${className}`}
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      {/* Main card content */}
      {children}
      
      {/* Corner overlay that creates the notch illusion */}
      <div 
        className={`absolute bg-background ${getOverlayRoundedClass()} pointer-events-none z-10`}
        style={getOverlayStyle()}
      />
      
      {/* Horizontal accent line on the notch edge */}
      <div 
        className="absolute pointer-events-none z-20"
        style={getAccentStyle()}
      />
      
      {/* Vertical accent line on the notch edge */}
      <div 
        className="absolute pointer-events-none z-20"
        style={getVerticalAccentStyle()}
      />
      
      {/* Subtle glow at the notch corner */}
      <div 
        className="absolute pointer-events-none z-10 opacity-60"
        style={{
          ...getOverlayStyle(),
          background: `radial-gradient(circle at ${
            notch.includes('left') ? 'right' : 'left'
          } ${
            notch.includes('top') ? 'bottom' : 'top'
          }, ${glowColor} 0%, transparent 70%)`
        }}
      />
    </motion.div>
  );
};
