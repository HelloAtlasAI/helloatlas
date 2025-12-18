import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, Sparkles } from 'lucide-react';

interface UserMenuProps {
  userName: string;
  onLogoutClick: () => void;
}

export const UserMenu = ({ userName, onLogoutClick }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: User, label: 'Profile', onClick: () => setIsOpen(false) },
    { icon: Settings, label: 'Settings', onClick: () => setIsOpen(false) },
    { icon: LogOut, label: 'Sign Out', onClick: onLogoutClick },
  ];

  return (
    <div className="relative">
      {/* Avatar Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/50 to-accent/50 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Avatar orb */}
        <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
          <span className="text-sm font-medium text-primary">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Active indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 min-w-[180px]"
            >
              {/* Glass card */}
              <div className="relative rounded-xl overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-card/90 backdrop-blur-xl border border-primary/20" />
                
                {/* HUD corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-primary/40 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-primary/40 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-primary/40 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-primary/40 rounded-br-lg" />

                {/* Content */}
                <div className="relative p-1">
                  {/* User info */}
                  <div className="px-3 py-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-accent" />
                      <span className="text-xs text-muted-foreground">Atlas Member</span>
                    </div>
                    <p className="text-sm font-medium text-foreground mt-0.5 truncate">
                      {userName}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {menuItems.map((item, index) => (
                      <motion.button
                        key={item.label}
                        onClick={item.onClick}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                        whileHover={{ x: 2 }}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
