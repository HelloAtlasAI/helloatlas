import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2 } from 'lucide-react';
import { ReactNode, useEffect, useCallback } from 'react';
import { useParallaxMouse } from '@/hooks/useParallaxMouse';
import { ParallaxLayer } from './effects/ParallaxLayer';

interface ImmersiveCardShellProps {
  children: ReactNode;
  onClose: () => void;
  layoutId: string;
  title?: string;
  // Background layers
  backgroundElement?: ReactNode;
  ambientElement?: ReactNode;
  // Theme
  glowColor?: string;
  accentColor?: string;
  // Options
  enableParallax?: boolean;
  showHUD?: boolean;
}

export const ImmersiveCardShell = ({
  children,
  onClose,
  layoutId,
  title,
  backgroundElement,
  ambientElement,
  glowColor = 'hsl(var(--primary) / 0.15)',
  accentColor = 'hsl(var(--primary))',
  enableParallax = true,
  showHUD = true,
}: ImmersiveCardShellProps) => {
  const { position } = useParallaxMouse({
    intensity: 0.02,
    rotationIntensity: 0.01,
    enabled: enableParallax,
  });

  // Keyboard navigation - Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Layer 0: Environment Background */}
      <div className="absolute inset-0">
        {/* Base background */}
        <motion.div 
          className="absolute inset-0 bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
        
        {/* Custom background element (3D scene, particles, etc.) */}
        {backgroundElement && (
          <ParallaxLayer depth={0.3} className="absolute inset-0">
            {backgroundElement}
          </ParallaxLayer>
        )}
        
        {/* Ambient glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full opacity-30"
            style={{ 
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              transform: enableParallax ? `translate(${position.x * 0.5}px, ${position.y * 0.5}px)` : undefined,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ duration: 0.8 }}
          />
          <motion.div
            className="absolute -bottom-1/4 -right-1/4 w-2/3 h-2/3 rounded-full opacity-20"
            style={{ 
              background: `radial-gradient(circle, hsl(var(--accent) / 0.3) 0%, transparent 70%)`,
              transform: enableParallax ? `translate(${-position.x * 0.3}px, ${-position.y * 0.3}px)` : undefined,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          />
          <motion.div
            className="absolute top-1/3 right-1/4 w-1/3 h-1/3 rounded-full opacity-15"
            style={{ 
              background: `radial-gradient(circle, hsl(var(--secondary) / 0.25) 0%, transparent 70%)`,
              transform: enableParallax ? `translate(${position.x * 0.7}px, ${-position.y * 0.4}px)` : undefined,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Layer 1: Ambient Elements */}
      {ambientElement && (
        <ParallaxLayer depth={1} className="absolute inset-0 pointer-events-none">
          {ambientElement}
        </ParallaxLayer>
      )}

      {/* Layer 2: Holographic HUD Overlay */}
      {showHUD && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner decorations */}
          <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-primary/20 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-primary/20 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-primary/20 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-primary/20 rounded-br-lg" />
          
          {/* Scan lines effect */}
          <motion.div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--foreground)) 2px, hsl(var(--foreground)) 3px)',
              backgroundSize: '100% 4px',
            }}
            animate={{
              backgroundPosition: ['0 0', '0 4px'],
            }}
            transition={{
              duration: 0.1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      )}

      {/* Header bar */}
      <motion.header
        className="relative z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 border-b border-border/30 backdrop-blur-xl bg-background/40"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          {/* Accent line */}
          <motion.div
            className="w-1 h-6 rounded-full"
            style={{ background: accentColor }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.3 }}
          />
          {title && (
            <motion.h1 
              className="text-xl sm:text-2xl font-semibold text-foreground"
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {title}
            </motion.h1>
          )}
        </div>
        
        <motion.button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all border border-border/30 backdrop-blur-sm"
          whileHover={{ scale: 1.02, backgroundColor: 'hsl(var(--foreground) / 0.1)' }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Minimize2 className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Close</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-background/50 rounded border border-border/30">
            Esc
          </kbd>
        </motion.button>
      </motion.header>
      
      {/* Layer 3: Main Content */}
      <motion.main
        layoutId={layoutId}
        className="relative z-10 flex-1 overflow-hidden"
        initial={{ y: 40, opacity: 0, filter: 'blur(10px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        exit={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
        transition={{ 
          type: 'spring', 
          damping: 25, 
          stiffness: 200,
          delay: 0.15,
        }}
      >
        <div className="h-full w-full overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 scrollbar-thin">
          <ParallaxLayer depth={1.5} className="max-w-[1800px] mx-auto h-full">
            {children}
          </ParallaxLayer>
        </div>
      </motion.main>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/80 to-transparent pointer-events-none z-10" />
    </motion.div>
  );
};
