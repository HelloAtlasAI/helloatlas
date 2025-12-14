import { memo } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { CleanSphere } from './CleanSphere';

interface MiniAICardProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioLevel: number;
  isRecording?: boolean;
  isProcessing?: boolean;
  onVoicePress?: () => void;
  onVoiceRelease?: () => void;
  onClick?: () => void;
}

const MiniAICardComponent = ({ 
  state, 
  audioLevel, 
  isRecording,
  isProcessing,
  onVoicePress,
  onVoiceRelease,
  onClick 
}: MiniAICardProps) => {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-40"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      <motion.div
        className="relative flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl cursor-pointer"
        whileHover={{ scale: 1.05 }}
        onClick={onClick}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl opacity-40"
          style={{ background: 'radial-gradient(circle at 30% 50%, hsl(var(--primary) / 0.3) 0%, transparent 50%)' }}
        />
        
        {/* Mini Sphere */}
        <div className="w-12 h-12 relative z-10">
          <CleanSphere
            state={state}
            audioLevel={audioLevel}
            className="w-full h-full"
          />
        </div>
        
        {/* Voice button */}
        <motion.button
          className={`
            relative z-10 w-10 h-10 rounded-xl flex items-center justify-center
            transition-colors duration-200
            ${isRecording 
              ? 'bg-red-500/20 border-red-500/50 text-red-400' 
              : isProcessing
              ? 'bg-primary/20 border-primary/50 text-primary'
              : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
            }
            border backdrop-blur-sm
          `}
          onMouseDown={(e) => { e.stopPropagation(); onVoicePress?.(); }}
          onMouseUp={onVoiceRelease}
          onMouseLeave={onVoiceRelease}
          onTouchStart={(e) => { e.stopPropagation(); onVoicePress?.(); }}
          onTouchEnd={onVoiceRelease}
          whileTap={{ scale: 0.95 }}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export const MiniAICard = memo(MiniAICardComponent);
