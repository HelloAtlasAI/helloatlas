import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
  onClose?: () => void;
  glowing?: boolean;
  floating?: boolean;
}

export const GlassCard = ({
  children,
  className,
  title,
  icon,
  onClose,
  glowing = false,
  floating = false,
}: GlassCardProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-4",
        "bg-card/40 backdrop-blur-xl border border-border/50",
        "shadow-lg shadow-background/50",
        "transition-all duration-300 ease-out",
        "hover:border-border/70 hover:bg-card/50",
        glowing && "glass-card-glow",
        floating && "animate-float",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      {(title || icon || onClose) && (
        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            {title && (
              <h3 className="text-sm font-medium text-foreground">{title}</h3>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="relative">{children}</div>

      {/* Bottom highlight */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
};
