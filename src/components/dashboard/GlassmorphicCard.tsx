import { ReactNode, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface GlassmorphicCardProps {
  children: ReactNode;
  className?: string;
  depth?: number;
  glowColor?: string;
  isFocused?: boolean;
  onClick?: () => void;
  delay?: number;
}

export const GlassmorphicCard = ({
  children,
  className = '',
  depth = 0,
  glowColor = 'cyan',
  isFocused = false,
  onClick,
  delay = 0,
}: GlassmorphicCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    setTilt({
      x: y * 10,
      y: -x * 10,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const glowColors: Record<string, string> = {
    cyan: 'rgba(6, 182, 212, 0.4)',
    purple: 'rgba(139, 92, 246, 0.4)',
    blue: 'rgba(59, 130, 246, 0.4)',
    green: 'rgba(34, 197, 94, 0.4)',
    orange: 'rgba(249, 115, 22, 0.4)',
    pink: 'rgba(236, 72, 153, 0.4)',
  };

  const baseDepth = 20 + depth * 10;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        rotateX: tilt.x,
        rotateY: tilt.y,
      }}
      transition={{ 
        duration: 0.6, 
        delay: delay * 0.1,
        type: 'spring',
        stiffness: 100,
      }}
      whileHover={{ 
        scale: 1.02,
        z: 20,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        backdrop-blur-xl
        border border-white/10
        transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        boxShadow: `
          0 ${baseDepth}px ${baseDepth * 2}px rgba(0,0,0,0.4),
          ${isHovered || isFocused ? `0 0 40px ${glowColors[glowColor] || glowColors.cyan}` : ''},
          inset 0 1px 0 rgba(255,255,255,0.1)
        `,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {/* Animated gradient border */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300"
        style={{
          opacity: isHovered || isFocused ? 0.6 : 0,
          background: `linear-gradient(135deg, ${glowColors[glowColor] || glowColors.cyan}, transparent, ${glowColors[glowColor] || glowColors.cyan})`,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
        }}
      />
      
      {/* Shine effect on hover */}
      <div 
        className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none"
        style={{
          opacity: isHovered ? 0.1 : 0,
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
          transform: 'translateX(-100%)',
          animation: isHovered ? 'shine 0.8s ease forwards' : 'none',
        }}
      />
      
      {/* Focus pulse effect */}
      {isFocused && (
        <div 
          className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none"
          style={{
            boxShadow: `0 0 60px ${glowColors[glowColor] || glowColors.cyan}`,
          }}
        />
      )}
      
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};
