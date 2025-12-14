import { memo } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { AudioWaveSphere } from './AudioWaveSphere';

interface AIAssistantCardProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioLevel?: number;
  userName?: string;
  onClick?: () => void;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getStateMessage = (state: string) => {
  switch (state) {
    case 'listening':
      return "I'm listening...";
    case 'thinking':
      return 'Let me think about that...';
    case 'speaking':
      return 'Speaking...';
    default:
      return 'How can I help you today?';
  }
};

const AIAssistantCardComponent = ({ 
  state, 
  audioLevel = 0,
  userName,
  onClick 
}: AIAssistantCardProps) => {
  const greeting = getGreeting();
  const stateMessage = getStateMessage(state);
  
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-card border border-border/50 p-6 cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      
      <div className="relative flex items-center gap-6">
        <AudioWaveSphere 
          state={state} 
          audioLevel={audioLevel}
          size={100}
        />
        
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold text-foreground mb-1">
            {greeting}{userName ? `, ${userName}` : ''}
          </h2>
          <p className="text-muted-foreground">{stateMessage}</p>
          
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Mic className="w-4 h-4" />
            <span>Click or press space to talk</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AIAssistantCard = memo(AIAssistantCardComponent);
