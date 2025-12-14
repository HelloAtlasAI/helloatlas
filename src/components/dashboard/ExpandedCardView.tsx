import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface ExpandedCardViewProps {
  children: ReactNode;
  onClose: () => void;
  layoutId: string;
  title?: string;
  glowColor?: string;
  size?: 'default' | 'large' | 'full';
}

export const ExpandedCardView = ({ 
  children, 
  onClose, 
  layoutId, 
  title,
  glowColor = 'rgba(99, 102, 241, 0.15)',
  size = 'default'
}: ExpandedCardViewProps) => {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const sizeClasses = {
    default: 'max-w-4xl max-h-[85vh]',
    large: 'max-w-6xl max-h-[90vh]',
    full: 'max-w-[95vw] max-h-[95vh]'
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-background/90 backdrop-blur-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Expanded Card */}
      <motion.div
        layoutId={layoutId}
        className={`relative w-full ${sizeClasses[size]} overflow-hidden rounded-3xl bg-gradient-to-br from-card/95 via-card/90 to-card/95 backdrop-blur-xl border border-border shadow-2xl`}
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Glow effect */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ background: `radial-gradient(ellipse at top, ${glowColor} 0%, transparent 50%)` }} 
        />
        
        {/* Header with close button */}
        <div className="relative z-10 flex items-center justify-between p-4 sm:p-6 border-b border-border">
          {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
          <motion.button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
        
        {/* Content */}
        <div className="relative z-10 p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-80px)] scrollbar-thin">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};
