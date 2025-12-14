import { useMemo } from "react";
import { AIState } from "./AIOrb";

interface ImmersiveBackgroundProps {
  state: AIState;
}

export const ImmersiveBackground = ({ state }: ImmersiveBackgroundProps) => {
  // Dynamic intensity based on AI state
  const intensity = useMemo(() => {
    switch (state) {
      case "thinking": return { glow: 0.4, pulse: 1.5 };
      case "speaking": return { glow: 0.3, pulse: 1.2 };
      case "listening": return { glow: 0.25, pulse: 1 };
      default: return { glow: 0.15, pulse: 0.8 };
    }
  }, [state]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* Deep space gradient base */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse at 50% 50%,
              hsl(230 30% 8% / 0.5) 0%,
              hsl(230 25% 5%) 50%,
              hsl(230 20% 3%) 100%
            )
          `,
        }}
      />

      {/* Central energy glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "600px",
          height: "600px",
          background: `
            radial-gradient(
              circle,
              hsl(var(--primary) / ${intensity.glow}) 0%,
              hsl(var(--secondary) / ${intensity.glow * 0.5}) 30%,
              transparent 70%
            )
          `,
          filter: "blur(60px)",
          transition: "all 0.5s ease-out",
        }}
      />

      {/* Pulsing rings */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
          style={{
            width: `${300 + i * 200}px`,
            height: `${300 + i * 200}px`,
            animation: `pulse-ring ${3 + i}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
            opacity: intensity.pulse * 0.3,
          }}
        />
      ))}

      {/* Ambient particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              background: i % 3 === 0 
                ? "hsl(var(--primary) / 0.6)" 
                : i % 3 === 1 
                ? "hsl(var(--secondary) / 0.5)" 
                : "hsl(var(--accent) / 0.4)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${5 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, hsl(var(--background)) 100%)`,
          opacity: 0.6,
        }}
      />

      {/* Styles */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
            opacity: 0.1;
          }
        }
        
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
            opacity: 0.8;
          }
          75% {
            transform: translateY(-30px) translateX(5px);
          }
        }
      `}</style>
    </div>
  );
};
