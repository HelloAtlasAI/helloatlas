import { motion } from 'framer-motion';
import { Mic, MicOff, Wifi } from 'lucide-react';
import { UserMenu } from './UserMenu';

interface DashboardHeaderProps {
  userName?: string;
  onLogoutClick?: () => void;
  voiceEnabled?: boolean;
  onEnableVoice?: () => void;
}

export const DashboardHeader = ({ 
  userName = 'User', 
  onLogoutClick = () => {},
  voiceEnabled = false,
  onEnableVoice
}: DashboardHeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative z-50"
    >
      {/* Glass container */}
      <div className="relative mx-4 mt-4 rounded-2xl overflow-visible">
        {/* Background with blur */}
        <div className="absolute inset-0 bg-card/40 backdrop-blur-xl" />
        
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-2xl border border-primary/20" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        {/* HUD corner accents */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-primary/40 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-primary/40 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-primary/40 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-primary/40 rounded-br-2xl" />

        {/* Content */}
        <div className="relative px-4 py-3 flex items-center justify-between">
          {/* Left - Atlas Brand */}
          <div className="flex items-center gap-3">
            {/* Animated logo orb */}
            <motion.div
              className="relative"
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              {/* Outer glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent blur-lg opacity-50" />
              
              {/* Inner orb */}
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 via-accent/60 to-primary/80 flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/20">
                {/* Core */}
                <motion.div
                  className="w-4 h-4 rounded-full bg-gradient-to-br from-white/90 to-primary/50"
                  animate={{ 
                    opacity: [0.8, 1, 0.8],
                    scale: [0.9, 1, 0.9]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              </div>
            </motion.div>

            {/* Brand text */}
            <div className="hidden sm:block">
              <motion.h1 
                className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto]"
                animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                Atlas
              </motion.h1>
              <p className="text-[10px] text-muted-foreground/60 tracking-widest uppercase">
                AI Assistant
              </p>
            </div>
          </div>

          {/* Center - Status indicator (desktop only) */}
          <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-background/30 border border-border/30">
            <motion.div
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ 
                opacity: [1, 0.5, 1],
                scale: [1, 0.9, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            <span className="text-xs text-muted-foreground">System Online</span>
            <Wifi className="w-3 h-3 text-green-500" />
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            {/* Voice Toggle */}
            <motion.button
              onClick={onEnableVoice}
              className="relative group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Pulsing glow ring when active */}
              {voiceEnabled && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/40 blur-md"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.2, 0.5]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              )}
              
              {/* Button */}
              <div className={`
                relative w-9 h-9 rounded-full flex items-center justify-center
                transition-all duration-300 border
                ${voiceEnabled 
                  ? 'bg-primary/20 border-primary/50 text-primary' 
                  : 'bg-background/30 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary'
                }
              `}>
                {voiceEnabled ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </div>

              {/* Tooltip */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-card/90 border border-border/50 text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {voiceEnabled ? 'Voice Active' : 'Enable Voice'}
              </div>
            </motion.button>

            {/* Separator */}
            <div className="w-px h-6 bg-border/50" />

            {/* User Menu */}
            <UserMenu userName={userName} onLogoutClick={onLogoutClick} />
          </div>
        </div>
      </div>
    </motion.header>
  );
};
