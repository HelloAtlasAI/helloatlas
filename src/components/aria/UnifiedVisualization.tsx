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
        // Camera closer to see larger face
        return { position: [0, 0, 1.4] as [number, number, number], fov: 48 };
      case "hybrid":
        return { position: [0, 0, 1.8] as [number, number, number], fov: 50 };
      default:
        return { position: [0, 0, 2.4] as [number, number, number], fov: 52 };
    }
  }, [mode]);

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: cameraConfig.position, fov: cameraConfig.fov }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        style={{ background: "transparent" }}
        performance={{ min: 0.5 }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        
        {/* Shared lighting setup */}
        <ambientLight intensity={0.15} />
        <pointLight position={[0, 0, 3]} intensity={1.2} color="#00d4ff" distance={8} />
        <pointLight position={[-2, 2, 2]} intensity={0.6} color="#00ff88" />
        <pointLight position={[2, -1, 2]} intensity={0.4} color="#a855f7" />

        {/* Background layer - always visible, low opacity */}
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
