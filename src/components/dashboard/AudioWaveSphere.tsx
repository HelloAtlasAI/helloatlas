import { memo } from 'react';
import { motion } from 'framer-motion';

interface AudioWaveSphereProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioLevel?: number;
  size?: number;
  onClick?: () => void;
}

const stateColors = {
  idle: {
    primary: 'rgba(0, 212, 255, 0.8)',
    secondary: 'rgba(0, 150, 255, 0.4)',
    glow: 'rgba(0, 212, 255, 0.3)',
  },
  listening: {
    primary: 'rgba(99, 102, 241, 0.9)',
    secondary: 'rgba(139, 92, 246, 0.5)',
    glow: 'rgba(99, 102, 241, 0.4)',
  },
  thinking: {
    primary: 'rgba(168, 85, 247, 0.9)',
    secondary: 'rgba(192, 132, 252, 0.5)',
    glow: 'rgba(168, 85, 247, 0.4)',
  },
  speaking: {
    primary: 'rgba(34, 197, 94, 0.9)',
    secondary: 'rgba(74, 222, 128, 0.5)',
    glow: 'rgba(34, 197, 94, 0.4)',
  },
};

const AudioWaveSphereComponent = ({ 
  state, 
  audioLevel = 0, 
  size = 120,
  onClick 
}: AudioWaveSphereProps) => {
  const colors = stateColors[state];
  const pulseScale = 1 + audioLevel * 0.15;
  
  return (
    <motion.div
      className="relative cursor-pointer"
      style={{ width: size, height: size }}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
        }}
      />
      
      {/* Middle ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: size * 0.1,
          border: `2px solid ${colors.secondary}`,
        }}
        animate={{
          scale: state === 'idle' ? [1, 1.05, 1] : pulseScale,
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{
          duration: state === 'speaking' ? 0.15 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Inner ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: size * 0.2,
          border: `2px solid ${colors.primary}`,
        }}
        animate={{
          scale: state === 'idle' ? [1, 1.03, 1] : pulseScale * 0.95,
        }}
        transition={{
          duration: state === 'speaking' ? 0.12 : 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Core sphere */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: size * 0.3,
          background: `radial-gradient(circle at 30% 30%, ${colors.primary}, ${colors.secondary})`,
          boxShadow: `
            0 0 ${size * 0.2}px ${colors.glow},
            inset 0 0 ${size * 0.1}px rgba(255, 255, 255, 0.2)
          `,
        }}
        animate={{
          scale: pulseScale,
        }}
        transition={{
          duration: state === 'speaking' ? 0.1 : 0.3,
          ease: "easeOut",
        }}
      />
      
      {/* Highlight */}
      <div
        className="absolute rounded-full opacity-60"
        style={{
          top: size * 0.35,
          left: size * 0.35,
          width: size * 0.15,
          height: size * 0.1,
          background: 'rgba(255, 255, 255, 0.4)',
          filter: 'blur(2px)',
        }}
      />
    </motion.div>
  );
};

export const AudioWaveSphere = memo(AudioWaveSphereComponent);
