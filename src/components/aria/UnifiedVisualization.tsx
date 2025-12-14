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
        // Camera positioned for 50-60% face coverage - smaller, more elegant
        return { position: [0, 0, 2.2] as [number, number, number], fov: 42 };
      case "hybrid":
        return { position: [0, 0, 2.4] as [number, number, number], fov: 45 };
      default:
        return { position: [0, 0, 2.8] as [number, number, number], fov: 50 };
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
        
        {/* Enhanced lighting rig for face visibility */}
        {/* Strong key light - main illumination from front-top */}
        <spotLight 
          position={[0, 2.5, 4]} 
          intensity={2.5} 
          color="#ffffff"
          angle={0.7}
          penumbra={0.4}
          distance={12}
          castShadow
        />
        
        {/* Secondary key light - frontal fill */}
        <spotLight 
          position={[0, 0, 5]} 
          intensity={1.8} 
          color="#e8e8ff"
          angle={0.5}
          penumbra={0.6}
          distance={10}
        />
        
        {/* Fill light - softer, from side */}
        <pointLight position={[-2.5, 1, 3]} intensity={0.8} color="#00d4ff" distance={8} />
        <pointLight position={[2.5, 1, 3]} intensity={0.8} color="#00d4ff" distance={8} />
        
        {/* Rim lights - edge definition from behind */}
        <pointLight position={[-1.5, 0, -2]} intensity={1.5} color="#00ffaa" distance={6} />
        <pointLight position={[1.5, 0, -2]} intensity={1.5} color="#00ffaa" distance={6} />
        
        {/* Top rim for head contour */}
        <pointLight position={[0, 2, -1]} intensity={1} color="#00d4ff" distance={5} />
        
        {/* Bottom fill to illuminate dark areas */}
        <pointLight position={[0, -2, 2]} intensity={0.6} color="#a855f7" distance={5} />
        
        {/* Accent lights */}
        <pointLight position={[3, 2, 2]} intensity={0.6} color="#a855f7" distance={6} />
        <pointLight position={[-3, 2, 2]} intensity={0.6} color="#ec4899" distance={6} />
        
        {/* Subtle ambient - slightly brighter for visibility */}
        <ambientLight intensity={0.12} color="#112233" />
        
        {/* Face-specific spotlight - brighter center focus */}
        {mode === "face" && (
          <>
            <spotLight 
              position={[0, 0.3, 3]} 
              intensity={2.5} 
              color="#ffffff"
              angle={0.4}
              penumbra={0.7}
              distance={5}
            />
            <spotLight 
              position={[0, -0.5, 2.5]} 
              intensity={1} 
              color="#00d4ff"
              angle={0.5}
              penumbra={0.8}
              distance={4}
            />
          </>
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