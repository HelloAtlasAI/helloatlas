import { ReactNode, useRef, useState, useCallback, memo } from 'react';
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

const GlassmorphicCardComponent = ({
  children,
  className = '',
  depth = 0,
  glowColor = 'blue',
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
    
    // Reduced tilt sensitivity for smoother feel
    setTilt({
      x: y * 5,
      y: -x * 5,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const glowColors: Record<string, string> = {
    cyan: 'rgba(6, 182, 212, 0.25)',
    purple: 'rgba(139, 92, 246, 0.25)',
    blue: 'rgba(59, 130, 246, 0.3)',
    green: 'rgba(34, 197, 94, 0.25)',
    orange: 'rgba(249, 115, 22, 0.25)',
    pink: 'rgba(236, 72, 153, 0.25)',
  };

  const baseDepth = 15 + depth * 8;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        rotateX: tilt.x,
        rotateY: tilt.y,
      }}
      transition={{ 
        duration: 0.5, 
        delay: delay * 0.08,
        type: 'spring',
        stiffness: 120,
        damping: 20,
      }}
      whileHover={{ 
        scale: 1.015,
        y: -2,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl
        backdrop-blur-xl
        border border-white/8
        transition-shadow duration-400
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        boxShadow: `
          0 ${baseDepth}px ${baseDepth * 1.5}px rgba(0,0,0,0.25),
          ${isHovered || isFocused ? `0 0 30px ${glowColors[glowColor] || glowColors.blue}` : ''},
          inset 0 1px 0 rgba(255,255,255,0.06)
        `,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {/* Subtle gradient border on hover */}
      <div 
        className="absolute inset-0 rounded-xl transition-opacity duration-400 pointer-events-none"
        style={{
          opacity: isHovered || isFocused ? 0.4 : 0,
          background: `linear-gradient(135deg, ${glowColors[glowColor] || glowColors.blue}, transparent, ${glowColors[glowColor] || glowColors.blue})`,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
        }}
      />
      
      {/* Soft focus pulse effect */}
      {isFocused && (
        <div 
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: `0 0 40px ${glowColors[glowColor] || glowColors.blue}`,
            animation: 'pulse 2.5s ease-in-out infinite',
          }}
        />
      )}
      
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};

export const GlassmorphicCard = memo(GlassmorphicCardComponent);
