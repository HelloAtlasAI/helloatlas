import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

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
  glowColor = 'rgba(99, 102, 241, 0.15)'
}: ExpandedCardViewProps) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      
      {/* Expanded Card */}
      <motion.div
        layoutId={layoutId}
        className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl"
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Glow effect */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none" 
          style={{ background: `radial-gradient(ellipse at top, ${glowColor} 0%, transparent 60%)` }} 
        />
        
        {/* Header with close button */}
        <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/10">
          {title && <h2 className="text-xl font-semibold text-white">{title}</h2>}
          <motion.button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
        
        {/* Content */}
        <div className="relative z-10 p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};
