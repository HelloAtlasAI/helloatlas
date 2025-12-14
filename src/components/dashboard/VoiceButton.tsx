import { memo } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onPress: () => void;
  onRelease: () => void;
  className?: string;
}

const VoiceButtonComponent = ({
  isRecording,
  isProcessing,
  onPress,
  onRelease,
  className = '',
}: VoiceButtonProps) => {
  return (
    <motion.button
      className={`relative flex items-center justify-center w-16 h-16 rounded-full 
        ${isRecording 
          ? 'bg-primary/30 border-primary/60' 
          : 'bg-card/80 border-border hover:bg-muted/60'
        } border-2 backdrop-blur-sm transition-colors ${className}`}
      onMouseDown={onPress}
      onMouseUp={onRelease}
      onMouseLeave={isRecording ? onRelease : undefined}
      onTouchStart={onPress}
      onTouchEnd={onRelease}
      disabled={isProcessing}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Pulse rings when recording */}
      {isRecording && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/40"
            animate={{ scale: [1, 1.5, 1.5], opacity: [0.6, 0, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/40"
            animate={{ scale: [1, 1.8, 1.8], opacity: [0.4, 0, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
          />
        </>
      )}
      
      {/* Icon */}
      {isProcessing ? (
        <motion.div
          className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : isRecording ? (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Mic className="w-6 h-6 text-primary" />
        </motion.div>
      ) : (
        <MicOff className="w-6 h-6 text-muted-foreground" />
      )}
      
      {/* Label */}
      <span className="sr-only">
        {isRecording ? 'Release to send' : 'Hold to speak'}
      </span>
    </motion.button>
  );
};

export const VoiceButton = memo(VoiceButtonComponent);
