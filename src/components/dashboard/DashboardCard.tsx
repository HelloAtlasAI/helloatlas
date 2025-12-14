import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  glowing?: boolean;
  header?: ReactNode;
  onClick?: () => void;
}

export const DashboardCard = ({ 
  children, 
  className, 
  glowing = false,
  header,
  onClick,
}: DashboardCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative h-full rounded-2xl overflow-hidden transition-all duration-300",
        "bg-dashboard-card/90 backdrop-blur-xl",
        "border border-dashboard-border",
        "shadow-lg shadow-dashboard-shadow/10",
        glowing && "ring-2 ring-dashboard-primary/30 shadow-dashboard-primary/20",
        onClick && "cursor-pointer hover:border-dashboard-primary/50",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-dashboard-card-highlight/5 to-transparent pointer-events-none" />
      
      {header && (
        <div className="relative px-5 py-4 border-b border-dashboard-border">
          {header}
        </div>
      )}
      
      <div className={cn("relative", header ? "p-5" : "p-5 h-full")}>
        {children}
      </div>
    </div>
  );
};
