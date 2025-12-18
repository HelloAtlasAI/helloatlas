import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { WakeWordState } from '@/types';

interface AmbientAudioVisualizerProps {
  audioLevel: number;
  isActive: boolean;
  state: WakeWordState;
}

const getStateColor = (state: WakeWordState): string => {
  const colors: Record<WakeWordState, string> = {
    dormant: 'hsl(30, 80%, 50%)',
    passive: 'hsl(35, 90%, 55%)',
    activated: 'hsl(40, 100%, 60%)',
    listening: 'hsl(190, 90%, 55%)',
    thinking: 'hsl(270, 80%, 60%)',
    speaking: 'hsl(45, 95%, 55%)',
  };
  return colors[state];
};

const AmbientAudioVisualizerComponent = ({ 
  audioLevel, 
  isActive, 
  state 
}: AmbientAudioVisualizerProps) => {
  const barCount = 32;
  const color = getStateColor(state);

  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => {
      // Create a wave pattern
      const position = i / barCount;
      const centerDistance = Math.abs(position - 0.5) * 2;
      const baseHeight = 1 - centerDistance * 0.7;
      
      return {
        index: i,
        baseHeight,
        delay: i * 0.02,
      };
    });
  }, [barCount]);

  return (
    <div className="w-full h-full flex items-end justify-center gap-[2px] px-4">
      {bars.map((bar) => {
        const dynamicHeight = isActive 
          ? bar.baseHeight * (0.3 + audioLevel * 0.7 + Math.sin(bar.index * 0.5) * 0.1)
          : 0.1;
        
        return (
          <motion.div
            key={bar.index}
            className="flex-1 max-w-[4px] rounded-full"
            style={{
              background: `linear-gradient(to top, ${color}, transparent)`,
              opacity: isActive ? 0.6 + audioLevel * 0.4 : 0.2,
            }}
            animate={{
              height: `${Math.max(2, dynamicHeight * 100)}%`,
              opacity: isActive ? 0.4 + audioLevel * 0.6 : 0.15,
            }}
            transition={{
              height: {
                duration: 0.1,
                ease: 'easeOut',
              },
              opacity: {
                duration: 0.2,
              },
            }}
          />
        );
      })}
    </div>
  );
};

export const AmbientAudioVisualizer = memo(AmbientAudioVisualizerComponent);
