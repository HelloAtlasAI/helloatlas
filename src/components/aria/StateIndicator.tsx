import { useMemo } from "react";
import { AIState } from "./AIOrb";
import { cn } from "@/lib/utils";

interface StateIndicatorProps {
  state: AIState;
  className?: string;
}

export const StateIndicator = ({ state, className }: StateIndicatorProps) => {
  const stateConfig = useMemo(() => {
    switch (state) {
      case "listening":
        return {
          label: "Listening",
          color: "text-primary",
          bgColor: "bg-primary/20",
          pulseColor: "bg-primary",
        };
      case "thinking":
        return {
          label: "Processing",
          color: "text-secondary",
          bgColor: "bg-secondary/20",
          pulseColor: "bg-secondary",
        };
      case "speaking":
        return {
          label: "Responding",
          color: "text-accent",
          bgColor: "bg-accent/20",
          pulseColor: "bg-accent",
        };
      default:
        return {
          label: "Ready",
          color: "text-muted-foreground",
          bgColor: "bg-muted/20",
          pulseColor: "bg-muted-foreground",
        };
    }
  }, [state]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Pulsing dot */}
      <div className="relative">
        <div className={cn("w-2 h-2 rounded-full", stateConfig.pulseColor)} />
        {state !== "idle" && (
          <div 
            className={cn(
              "absolute inset-0 rounded-full animate-ping",
              stateConfig.pulseColor,
              "opacity-50"
            )} 
          />
        )}
      </div>
      
      {/* State label */}
      <span className={cn(
        "text-xs font-medium tracking-wide uppercase",
        stateConfig.color
      )}>
        {stateConfig.label}
      </span>
    </div>
  );
};
