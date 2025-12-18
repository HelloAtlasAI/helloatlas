import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { AtlasSphere } from '@/components/atlas';

interface AIAssistantCardProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioLevel: number;
  userName?: string;
  isRecording?: boolean;
  isProcessing?: boolean;
  onVoicePress?: () => void;
  onVoiceRelease?: () => void;
  onClick?: () => void;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getStateMessage = (state: string, isRecording?: boolean) => {
  if (isRecording) return "I'm listening...";
  switch (state) {
    case 'listening':
      return "I'm listening...";
    case 'thinking':
      return 'Processing...';
    case 'speaking':
      return 'Speaking...';
    default:
      return 'How can I help?';
  }
};

const AIAssistantCardComponent = ({ 
  state, 
  audioLevel, 
  userName, 
  isRecording,
  isProcessing,
  onVoicePress,
  onVoiceRelease,
  onClick 
}: AIAssistantCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/90 via-card/85 to-card/90 backdrop-blur-xl border border-border/50 shadow-xl h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Subtle background glow */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 30% 50%, hsl(var(--primary) / 0.2) 0%, transparent 50%)',
        }}
        animate={{
          opacity: isHovered ? 0.4 : 0.3,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 p-4 h-full flex items-center gap-4">
        {/* Compact Sphere */}
        <div className="w-20 h-20 flex-shrink-0">
          <AtlasSphere
            state={state}
            audioLevel={audioLevel}
            context="mini"
            onClick={onClick}
            className="w-full h-full"
          />
        </div>
        
        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium text-foreground truncate">
            {getGreeting()}, <span className="text-primary">{userName || 'there'}</span>
          </h3>
          
          <AnimatePresence mode="wait">
            <motion.p
              key={state + (isRecording ? '-rec' : '')}
              className="text-sm text-muted-foreground mt-0.5"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {getStateMessage(state, isRecording)}
            </motion.p>
          </AnimatePresence>
          
          <p className="text-xs text-muted-foreground/60 mt-1 hidden sm:block">
            Hold <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">Space</kbd> to talk
          </p>
        </div>
        
        {/* Voice button */}
        <motion.button
          className={`
            relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
            transition-colors duration-200
            ${isRecording 
              ? 'bg-red-500/20 border-red-500/50 text-red-400' 
              : isProcessing
              ? 'bg-primary/20 border-primary/50 text-primary'
              : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
            }
            border backdrop-blur-sm
          `}
          onMouseDown={onVoicePress}
          onMouseUp={onVoiceRelease}
          onMouseLeave={onVoiceRelease}
          onTouchStart={onVoicePress}
          onTouchEnd={onVoiceRelease}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Pulsing ring when recording */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-red-400"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </AnimatePresence>
          
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export const AIAssistantCard = memo(AIAssistantCardComponent);