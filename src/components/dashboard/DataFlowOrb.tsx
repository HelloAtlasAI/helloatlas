import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { AIState } from "@/components/aria/AIOrb";
import { MorphingSphereDataFlow } from "@/components/aria/scenes/MorphingSphereDataFlow";
import { cn } from "@/lib/utils";

interface DataFlowOrbProps {
  state: AIState;
  audioLevel: number;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
}

export const DataFlowOrb = ({ 
  state, 
  audioLevel, 
  size = "md",
  onClick,
  className,
}: DataFlowOrbProps) => {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-32 h-32",
    lg: "w-full h-full max-w-[280px] max-h-[280px]",
  };

  const cameraDistance = size === "sm" ? 3 : size === "md" ? 4 : 5;
  
  // Enhanced morph intensity when speaking
  const morphIntensity = state === "speaking" ? 85 : state === "thinking" ? 70 : 50;

  return (
    <div 
      className={cn(
        sizeClasses[size],
        "rounded-full overflow-hidden cursor-pointer transition-all duration-300",
        state !== "idle" && "ring-2 ring-dashboard-primary/30",
        className
      )}
      onClick={onClick}
    >
      <Canvas
        camera={{ position: [0, 0, cameraDistance], fov: 50 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        
        <ambientLight intensity={0.2} color="#1a365d" />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#3b82f6" />
        
        <Suspense fallback={null}>
          <MorphingSphereDataFlow 
            state={state} 
            audioLevel={audioLevel}
            particleDensity={size === "sm" ? 50 : 75}
            morphIntensity={morphIntensity}
          />
        </Suspense>

        <EffectComposer>
          <Bloom 
            intensity={0.6}
            luminanceThreshold={0.3}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
