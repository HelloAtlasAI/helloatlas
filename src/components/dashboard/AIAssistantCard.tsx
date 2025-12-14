import { memo } from 'react';
import { motion } from 'framer-motion';
import { Mic, Sparkles, MessageCircle } from 'lucide-react';
import { CleanSphere } from './CleanSphere';

interface AIAssistantCardProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  audioLevel: number;
  userName?: string;
  onClick: () => void;
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
      return 'Processing your request...';
    case 'speaking':
      return 'Speaking...';
    default:
      return 'How can I help you today?';
  }
};

const AIAssistantCardComponent = ({ state, audioLevel, userName, onClick }: AIAssistantCardProps) => {
  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card/95 via-card/90 to-card/95 backdrop-blur-xl border border-border shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 w-full h-full opacity-30"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 60%)',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-30"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.3) 0%, transparent 60%)',
          }}
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Sphere */}
          <div className="w-48 h-48 lg:w-56 lg:h-56">
            <CleanSphere
              state={state}
              audioLevel={audioLevel}
              onClick={onClick}
              className="w-full h-full"
            />
          </div>
          
          {/* Text content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/20 mb-4"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Atlas AI Assistant</span>
            </motion.div>
            
            <h2 className="text-2xl lg:text-3xl font-light text-foreground mb-2">
              {getGreeting()}, <span className="font-semibold">{userName || 'there'}</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-6">
              {getStateMessage(state)}
            </p>
            
            {/* Action buttons */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <motion.button
                onClick={onClick}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium shadow-lg hover:opacity-90 transition-opacity"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Mic className="w-4 h-4" />
                Start Speaking
              </motion.button>
              
              <motion.button
                onClick={onClick}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-medium border border-border hover:bg-accent transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MessageCircle className="w-4 h-4" />
                Type a Message
              </motion.button>
            </div>
            
            {/* Keyboard shortcut hint */}
            <p className="mt-4 text-xs text-muted-foreground">
              Press and hold <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">Space</kbd> to talk
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AIAssistantCard = memo(AIAssistantCardComponent);
