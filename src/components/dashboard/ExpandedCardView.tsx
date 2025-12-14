import { motion } from 'framer-motion';
import { X, Minimize2 } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

interface ExpandedCardViewProps {
  children: ReactNode;
  onClose: () => void;
  layoutId: string;
  title?: string;
  glowColor?: string;
}

export const ExpandedCardView = ({ 
  children, 
  onClose, 
  layoutId, 
  title,
  glowColor = 'hsl(var(--primary) / 0.15)'
}: ExpandedCardViewProps) => {
  // Keyboard navigation - Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    // Prevent body scroll when expanded
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Animated backdrop with blur */}
      <motion.div 
        className="absolute inset-0 bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      {/* Ambient glow effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full opacity-30"
          style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, hsl(var(--accent) / 0.3) 0%, transparent 70%)` }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </div>

      {/* Header bar */}
      <motion.header
        className="relative z-10 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 border-b border-border/50 backdrop-blur-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          {title && (
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              {title}
            </h1>
          )}
        </div>
        
        <motion.button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Minimize2 className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Close</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-background/50 rounded border border-border/50">
            Esc
          </kbd>
        </motion.button>
      </motion.header>
      
      {/* Full-screen content area */}
      <motion.main
        layoutId={layoutId}
        className="relative z-10 flex-1 overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300, delay: 0.05 }}
      >
        <div className="h-full w-full overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-[1800px] mx-auto h-full">
            {children}
          </div>
        </div>
      </motion.main>
    </motion.div>
  );
};
