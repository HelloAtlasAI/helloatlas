import { Suspense, lazy, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import * as THREE from "three";
import { AIState } from "./AIOrb";

// Lazy load heavy visualization scenes
const CyberGridScene = lazy(() => import("./scenes/CyberGridScene").then(m => ({ default: m.CyberGridScene })));
const DigitalFaceScene = lazy(() => import("./scenes/DigitalFaceScene").then(m => ({ default: m.DigitalFaceScene })));
const HybridScene = lazy(() => import("./scenes/HybridScene").then(m => ({ default: m.HybridScene })));
const BackgroundScene = lazy(() => import("./scenes/BackgroundScene").then(m => ({ default: m.BackgroundScene })));
const HUDScene = lazy(() => import("./scenes/HUDScene").then(m => ({ default: m.HUDScene })));

export type VisualizationMode = "cyber" | "face" | "hybrid";

interface UnifiedVisualizationProps {
  mode: VisualizationMode;
  state: AIState;
  audioLevel?: number;
  isSpeaking?: boolean;
  className?: string;
}

// Loading fallback for 3D scenes
const SceneLoader = () => null;

export const UnifiedVisualization = ({
  mode,
  state,
  audioLevel = 0,
  isSpeaking = false,
  className = "",
}: UnifiedVisualizationProps) => {
  const cameraConfig = useMemo(() => {
    switch (mode) {
      case "face":
        // Camera positioned for 60-70% face coverage
        return { position: [0, 0, 3.2] as [number, number, number], fov: 50 };
      case "hybrid":
        return { position: [0, 0, 2.8] as [number, number, number], fov: 50 };
      default:
        return { position: [0, 0, 3] as [number, number, number], fov: 55 };
    }
  }, [mode]);

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: cameraConfig.position, fov: cameraConfig.fov }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        style={{ background: "linear-gradient(180deg, #050510 0%, #0a0a1a 50%, #0f0f25 100%)" }}
        performance={{ min: 0.5 }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        
        {/* Enhanced lighting rig */}
        {/* Key light - main illumination from front-top */}
        <spotLight 
          position={[0, 3, 4]} 
          intensity={1.5} 
          color="#ffffff"
          angle={0.6}
          penumbra={0.5}
          distance={15}
        />
        
        {/* Fill light - softer, from side */}
        <pointLight position={[-3, 1, 3]} intensity={0.6} color="#00d4ff" distance={10} />
        
        {/* Rim light - dramatic backlight for edge definition */}
        <pointLight position={[0, 0, -3]} intensity={1.2} color="#00ffaa" distance={8} />
        
        {/* Accent lights */}
        <pointLight position={[3, 2, 2]} intensity={0.5} color="#a855f7" distance={8} />
        <pointLight position={[-2, -2, 2]} intensity={0.4} color="#ec4899" distance={6} />
        
        {/* Subtle ambient */}
        <ambientLight intensity={0.08} color="#001122" />
        
        {/* Face-specific spotlight */}
        {mode === "face" && (
          <spotLight 
            position={[0, 0.5, 3]} 
            intensity={2} 
            color="#00d4ff"
            angle={0.5}
            penumbra={0.8}
            distance={6}
          />
        )}

        {/* Background layer - always visible, immersive cosmic environment */}
        <Suspense fallback={<SceneLoader />}>
          <BackgroundScene state={state} />
        </Suspense>

        {/* Main visualization based on mode */}
        <Suspense fallback={<SceneLoader />}>
          {mode === "cyber" && (
            <CyberGridScene state={state} audioLevel={audioLevel} />
          )}
          {mode === "face" && (
            <DigitalFaceScene 
              state={state} 
              audioLevel={audioLevel}
              isSpeaking={isSpeaking}
            />
          )}
          {mode === "hybrid" && (
            <HybridScene 
              state={state} 
              audioLevel={audioLevel}
              isSpeaking={isSpeaking}
            />
          )}
        </Suspense>

        {/* HUD overlay layer */}
        <Suspense fallback={<SceneLoader />}>
          <HUDScene state={state} />
        </Suspense>

        <Environment preset="night" />
        <Preload all />
      </Canvas>
    </div>
  );
};