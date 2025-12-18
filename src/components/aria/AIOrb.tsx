import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { AIState } from "@/types";

export type { AIState };

interface AIOrbProps {
  state: AIState;
  className?: string;
}

export const AIOrb = ({ state, className }: AIOrbProps) => {
  const stateStyles = useMemo(() => {
    switch (state) {
      case "listening":
        return {
          pulseSpeed: "1.5s",
          glowIntensity: "0.7",
          ringAnimation: true,
        };
      case "thinking":
        return {
          pulseSpeed: "0.8s",
          glowIntensity: "0.9",
          ringAnimation: false,
        };
      case "speaking":
        return {
          pulseSpeed: "0.5s",
          glowIntensity: "1",
          ringAnimation: false,
        };
      default:
        return {
          pulseSpeed: "3s",
          glowIntensity: "0.5",
          ringAnimation: false,
        };
    }
  }, [state]);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer glow layers */}
      <div className="absolute w-80 h-80 rounded-full bg-gradient-radial from-orb-outer/20 via-transparent to-transparent animate-pulse-glow" />
      <div className="absolute w-64 h-64 rounded-full bg-gradient-radial from-orb-inner/30 via-transparent to-transparent animate-pulse-glow" style={{ animationDelay: "0.5s" }} />
      <div className="absolute w-48 h-48 rounded-full bg-gradient-radial from-orb-core/40 via-transparent to-transparent animate-pulse-glow" style={{ animationDelay: "1s" }} />

      {/* Orbiting particles */}
      <div className="absolute w-60 h-60 animate-rotate-slow">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary"
            style={{
              top: "50%",
              left: "50%",
              transform: `rotate(${i * 60}deg) translateX(120px)`,
              opacity: 0.6 + (i * 0.1),
              boxShadow: "0 0 10px hsl(var(--primary))",
            }}
          />
        ))}
      </div>

      {/* Secondary orbit */}
      <div className="absolute w-48 h-48 animate-rotate-slow" style={{ animationDirection: "reverse", animationDuration: "15s" }}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-accent"
            style={{
              top: "50%",
              left: "50%",
              transform: `rotate(${i * 90}deg) translateX(90px)`,
              opacity: 0.5 + (i * 0.15),
              boxShadow: "0 0 8px hsl(var(--accent))",
            }}
          />
        ))}
      </div>

      {/* Listening ripple effect */}
      {state === "listening" && (
        <>
          <div className="absolute w-40 h-40 rounded-full border-2 border-primary/50 animate-ripple" />
          <div className="absolute w-40 h-40 rounded-full border-2 border-primary/50 animate-ripple" style={{ animationDelay: "0.5s" }} />
          <div className="absolute w-40 h-40 rounded-full border-2 border-primary/50 animate-ripple" style={{ animationDelay: "1s" }} />
        </>
      )}

      {/* Neural network lines */}
      <svg className="absolute w-72 h-72 animate-rotate-slow" style={{ animationDuration: "30s" }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {[...Array(8)].map((_, i) => (
          <line
            key={i}
            x1="144"
            y1="144"
            x2={144 + Math.cos((i * Math.PI * 2) / 8) * 130}
            y2={144 + Math.sin((i * Math.PI * 2) / 8) * 130}
            stroke="url(#lineGradient)"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Main orb container */}
      <div className="relative w-32 h-32 rounded-full orb-glow">
        {/* Gradient background */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-conic from-primary via-accent to-secondary animate-rotate-slow"
          style={{ 
            animationDuration: stateStyles.pulseSpeed === "0.5s" ? "2s" : "8s",
          }}
        />
        
        {/* Inner glass layer */}
        <div className="absolute inset-1 rounded-full bg-gradient-radial from-orb-core/80 via-orb-inner/60 to-orb-outer/40 backdrop-blur-sm" />
        
        {/* Core highlight */}
        <div className="absolute inset-4 rounded-full bg-gradient-radial from-foreground/20 via-transparent to-transparent" />
        
        {/* Top highlight */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-8 rounded-full bg-gradient-radial from-foreground/30 via-foreground/10 to-transparent blur-sm" />

        {/* Speaking waveform */}
        {state === "speaking" && (
          <div className="absolute inset-0 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-foreground/80 rounded-full animate-wave"
                style={{
                  height: "20px",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Thinking spinner */}
        {state === "thinking" && (
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-accent animate-spin" style={{ animationDuration: "0.8s" }} />
        )}
      </div>

      {/* State label */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {state === "idle" && "Ready"}
          {state === "listening" && "Listening..."}
          {state === "thinking" && "Processing..."}
          {state === "speaking" && "Speaking"}
        </span>
      </div>
    </div>
  );
};
