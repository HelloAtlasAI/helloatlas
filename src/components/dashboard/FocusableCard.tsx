import { memo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface FocusableCardProps {
  id: string;
  isFocused: boolean;
  hasFocusedSibling: boolean;
  children: ReactNode;
  color?: string;
  onClick?: () => void;
  className?: string;
  delay?: number;
}

const FocusableCardComponent = ({
  id,
  isFocused,
  hasFocusedSibling,
  children,
  color = 'primary',
  onClick,
  className = '',
  delay = 0,
}: FocusableCardProps) => {
  return (
    <motion.div
      layoutId={`card-${id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: hasFocusedSibling && !isFocused ? 0.4 : 1,
        y: 0,
        scale: isFocused ? 1.05 : 1,
        zIndex: isFocused ? 20 : 1,
      }}
      transition={{ 
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay,
      }}
      onClick={onClick}
      className={`relative rounded-2xl overflow-hidden cursor-pointer ${className}`}
    >
      {/* Glass background */}
      <div className="absolute inset-0 bg-card/60 backdrop-blur-xl border border-border/50" />
      
      {/* Focus glow effect */}
      {isFocused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `0 0 40px 10px hsl(var(--${color}) / 0.3), inset 0 0 20px hsl(var(--${color}) / 0.1)`,
          }}
        />
      )}
      
      {/* Accent border on focus */}
      {isFocused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-2xl border-2 pointer-events-none"
          style={{ borderColor: `hsl(var(--${color}) / 0.6)` }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};

export const FocusableCard = memo(FocusableCardComponent);
