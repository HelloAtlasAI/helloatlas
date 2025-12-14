import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, User, Sparkles, Circle, Waves, Zap, Grid3X3 } from "lucide-react";

export type VisualizationMode = "cyber" | "face" | "hybrid" | "void" | "ocean" | "storm" | "lattice";

interface VisualizationModeSwitchProps {
  mode: VisualizationMode;
  onModeChange: (mode: VisualizationMode) => void;
}

const modes = [
  { id: "cyber" as const, label: "Cyber Nexus", icon: Cpu, description: "Digital core visualization" },
  { id: "face" as const, label: "Neural Persona", icon: User, description: "AI face avatar" },
  { id: "hybrid" as const, label: "Hybrid", icon: Sparkles, description: "Combined experience" },
  { id: "void" as const, label: "Infinite Void", icon: Circle, description: "Cosmic singularity" },
  { id: "ocean" as const, label: "Living Ocean", icon: Waves, description: "Volumetric fluid consciousness" },
  { id: "storm" as const, label: "Storm Mind", icon: Zap, description: "Electrical neural storm" },
  { id: "lattice" as const, label: "Infinite Lattice", icon: Grid3X3, description: "4D crystalline structure" },
];

export const VisualizationModeSwitch = ({ mode, onModeChange }: VisualizationModeSwitchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentMode = modes.find((m) => m.id === mode) || modes[0];
  const CurrentIcon = currentMode.icon;

  const handleModeSelect = useCallback((newMode: VisualizationMode) => {
    onModeChange(newMode);
    setIsOpen(false);
  }, [onModeChange]);

  return (
    <div className="relative">
      {/* Main toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/20 backdrop-blur-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all border border-border/20 hover:border-primary/30"
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="text-xs font-medium hidden sm:inline">{currentMode.label}</span>
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 min-w-[200px] p-1 rounded-xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl shadow-black/20"
            >
              {modes.map((modeOption) => {
                const Icon = modeOption.icon;
                const isActive = mode === modeOption.id;
                
                return (
                  <button
                    key={modeOption.id}
                    onClick={() => handleModeSelect(modeOption.id)}
                    className={`
                      w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left
                      ${isActive 
                        ? "bg-primary/20 text-foreground" 
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    <div className={`
                      p-2 rounded-lg 
                      ${isActive ? "bg-primary/30" : "bg-muted/50"}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{modeOption.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {modeOption.description}
                      </div>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="w-2 h-2 rounded-full bg-primary mt-2"
                      />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};