import { Settings, LogOut, Bell, Search, Menu, ChevronDown, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  userName?: string;
  onLogoutClick?: () => void;
  voiceEnabled?: boolean;
  onEnableVoice?: () => void;
}

export const DashboardHeader = ({ userName, onLogoutClick, voiceEnabled, onEnableVoice }: DashboardHeaderProps) => {
  return (
    <motion.header
      className="relative overflow-hidden border-b border-border"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-card to-background" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2 rounded-xl bg-secondary hover:bg-accent transition-colors">
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
              animate={{ 
                boxShadow: ['0 0 20px hsl(var(--primary) / 0.3)', '0 0 30px hsl(var(--primary) / 0.5)', '0 0 20px hsl(var(--primary) / 0.3)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </motion.div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Atlas</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Dashboard</p>
            </div>
          </div>
        </div>
        
        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-accent transition-all"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-mono hidden lg:block">
              ⌘K
            </kbd>
          </div>
        </div>
        
        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Voice Toggle */}
          <motion.button
            onClick={onEnableVoice}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative p-2.5 rounded-xl transition-colors ${
              voiceEnabled 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'bg-secondary hover:bg-accent text-muted-foreground'
            }`}
            title={voiceEnabled ? 'Voice enabled' : 'Click to enable voice'}
          >
            {voiceEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            {voiceEnabled && (
              <motion.span 
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>
          
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2.5 rounded-xl bg-secondary hover:bg-accent transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
          </motion.button>
          
          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-secondary hover:bg-accent transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          
          {/* Divider */}
          <div className="w-px h-8 bg-border mx-2" />
          
          {/* User menu */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-secondary transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">
                {userName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-foreground">{userName || 'User'}</p>
              <p className="text-[10px] text-muted-foreground">Premium Plan</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground hidden lg:block" />
          </motion.button>
          
          {/* Logout */}
          <motion.button
            onClick={onLogoutClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-secondary hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};
