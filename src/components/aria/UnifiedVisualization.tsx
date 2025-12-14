import { Suspense, lazy, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { AIState } from "./AIOrb";

// Lazy load heavy visualization scenes
const CyberGridScene = lazy(() => import("./scenes/CyberGridScene").then(m => ({ default: m.CyberGridScene })));
const DigitalFaceScene = lazy(() => import("./scenes/DigitalFaceScene").then(m => ({ default: m.DigitalFaceScene })));
const HybridScene = lazy(() => import("./scenes/HybridScene").then(m => ({ default: m.HybridScene })));
const BackgroundScene = lazy(() => import("./scenes/BackgroundScene").then(m => ({ default: m.BackgroundScene })));
const HUDScene = lazy(() => import("./scenes/HUDScene").then(m => ({ default: m.HUDScene })));

// Data network visualization scenes
const NeuralPathwaysScene = lazy(() => import("./scenes/NeuralPathwaysScene").then(m => ({ default: m.NeuralPathwaysScene })));
const DigitalCircuitScene = lazy(() => import("./scenes/DigitalCircuitScene").then(m => ({ default: m.DigitalCircuitScene })));
const OrganicGrowthScene = lazy(() => import("./scenes/OrganicGrowthScene").then(m => ({ default: m.OrganicGrowthScene })));
const CosmicWebScene = lazy(() => import("./scenes/CosmicWebScene").then(m => ({ default: m.CosmicWebScene })));

export type VisualizationMode = "cyber" | "face" | "hybrid" | "neural" | "circuit" | "organic" | "cosmic";

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
        return { position: [0, 0, 1.8] as [number, number, number], fov: 38 };
      case "hybrid":
        return { position: [0, 0, 2.2] as [number, number, number], fov: 42 };
      case "neural":
        return { position: [0, 0, 7] as [number, number, number], fov: 60 };
      case "circuit":
        return { position: [0, 0, 8] as [number, number, number], fov: 55 };
      case "organic":
        return { position: [0, 0, 7] as [number, number, number], fov: 55 };
      case "cosmic":
        return { position: [0, 0, 10] as [number, number, number], fov: 65 };
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
        
        {/* ========== ENHANCED LIGHTING RIG ========== */}
        
        {/* KEY LIGHT - Strong frontal illumination (intensity 3.5) */}
        <spotLight 
          position={[0, 2, 4.5]} 
          intensity={3.5} 
          color="#ffffff"
          angle={0.65}
          penumbra={0.35}
          distance={14}
          castShadow
        />
        
        {/* SECONDARY KEY - Frontal fill for face visibility */}
        <spotLight 
          position={[0, 0.2, 5.5]} 
          intensity={2.5} 
          color="#f0f0ff"
          angle={0.5}
          penumbra={0.55}
          distance={12}
        />
        
        {/* FILL LIGHTS - Cyan accent from sides */}
        <pointLight position={[-2, 0.8, 3.5]} intensity={1.2} color="#00d4ff" distance={9} />
        <pointLight position={[2, 0.8, 3.5]} intensity={1.2} color="#00d4ff" distance={9} />
        
        {/* RIM LIGHTS - Edge definition (intensity 1.2) */}
        <pointLight position={[-1.2, 0, -2.5]} intensity={1.2} color="#00ffaa" distance={7} />
        <pointLight position={[1.2, 0, -2.5]} intensity={1.2} color="#00ffaa" distance={7} />
        
        {/* TOP RIM - Head contour definition */}
        <pointLight position={[0, 2.2, -1.5]} intensity={1.1} color="#00d4ff" distance={6} />
        
        {/* BOTTOM FILL - Purple accent from below */}
        <pointLight position={[0, -2.5, 2.5]} intensity={0.8} color="#a855f7" distance={6} />
        
        {/* ACCENT LIGHTS - Subtle color variation */}
        <pointLight position={[2.8, 1.8, 2.2]} intensity={0.7} color="#a855f7" distance={7} />
        <pointLight position={[-2.8, 1.8, 2.2]} intensity={0.7} color="#ec4899" distance={7} />
        
        {/* AMBIENT - Brighter for overall visibility */}
        <ambientLight intensity={0.18} color="#1a2a3a" />
        
        {/* FACE-SPECIFIC SPOTLIGHT - Enhanced center focus */}
        {mode === "face" && (
          <>
            <spotLight 
              position={[0, 0.5, 3.5]} 
              intensity={3.2} 
              color="#ffffff"
              angle={0.38}
              penumbra={0.65}
              distance={6}
            />
            <spotLight 
              position={[0, -0.8, 3]} 
              intensity={1.4} 
              color="#00d4ff"
              angle={0.45}
              penumbra={0.75}
              distance={5}
            />
            {/* Eye highlight light */}
            <pointLight position={[0, 0.1, 2]} intensity={0.6} color="#ffffff" distance={3} />
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
          {mode === "neural" && (
            <NeuralPathwaysScene state={state} audioLevel={audioLevel} />
          )}
          {mode === "circuit" && (
            <DigitalCircuitScene state={state} audioLevel={audioLevel} />
          )}
          {mode === "organic" && (
            <OrganicGrowthScene state={state} audioLevel={audioLevel} />
          )}
          {mode === "cosmic" && (
            <CosmicWebScene state={state} audioLevel={audioLevel} />
          )}
        </Suspense>

        {/* Post-processing effects - enhanced per mode */}
        <EffectComposer>
          <Bloom 
            intensity={mode === "cosmic" ? 1.8 : mode === "neural" ? 1.5 : mode === "circuit" ? 1.4 : 1.2} 
            luminanceThreshold={0.15} 
            luminanceSmoothing={0.95}
            mipmapBlur
          />
          <ChromaticAberration 
            offset={new THREE.Vector2(mode === "circuit" ? 0.002 : 0.001, mode === "circuit" ? 0.002 : 0.001)} 
            radialModulation={false}
            modulationOffset={0}
          />
          <Vignette offset={0.25} darkness={mode === "cosmic" ? 0.7 : 0.5} />
          <Noise opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
        </EffectComposer>

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