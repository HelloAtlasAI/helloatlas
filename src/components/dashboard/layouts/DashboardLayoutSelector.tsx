import { motion } from 'framer-motion';
import { Target, Globe, LayoutGrid, Cloud, Focus } from 'lucide-react';

export type LayoutType = 'command' | 'orbit' | 'split' | 'ambient' | 'focus';

interface DashboardLayoutSelectorProps {
  activeLayout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

const layouts: { id: LayoutType; icon: typeof Target; label: string }[] = [
  { id: 'command', icon: Target, label: 'Command Center' },
  { id: 'orbit', icon: Globe, label: 'Orbit' },
  { id: 'split', icon: LayoutGrid, label: 'Split View' },
  { id: 'ambient', icon: Cloud, label: 'Ambient' },
  { id: 'focus', icon: Focus, label: 'Focus Mode' },
];

export const DashboardLayoutSelector = ({ 
  activeLayout, 
  onLayoutChange 
}: DashboardLayoutSelectorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div className="flex items-center gap-1 p-1.5 rounded-full bg-card/80 backdrop-blur-xl border border-border/50">
        {layouts.map((layout) => {
          const Icon = layout.icon;
          const isActive = activeLayout === layout.id;
          
          return (
            <motion.button
              key={layout.id}
              onClick={() => onLayoutChange(layout.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                isActive 
                  ? 'text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeLayout"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" />
              <span className="text-sm font-medium relative z-10 hidden md:block">
                {layout.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};
