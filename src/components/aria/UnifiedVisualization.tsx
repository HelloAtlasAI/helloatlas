import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";
import { AIState } from "./AIOrb";
import { MorphingSphereScene } from "./scenes/MorphingSphereScene";

interface UnifiedVisualizationProps {
  state: AIState;
  audioLevel?: number;
  className?: string;
}

export const UnifiedVisualization = ({
  state,
  audioLevel = 0,
  className = "",
}: UnifiedVisualizationProps) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        style={{ background: "#000000" }}
        performance={{ min: 0.5 }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        
        {/* Minimal lighting - sphere is self-illuminated via additive blending */}
        <ambientLight intensity={0.1} color="#0a1020" />
        
        {/* Main morphing sphere */}
        <Suspense fallback={null}>
          <MorphingSphereScene state={state} audioLevel={audioLevel} />
        </Suspense>

        {/* Post-processing for ethereal glow */}
        <EffectComposer>
          <Bloom 
            intensity={2.0}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <ChromaticAberration 
            offset={new THREE.Vector2(0.0008, 0.0008)}
            radialModulation={false}
            modulationOffset={0}
          />
          <Vignette offset={0.3} darkness={0.7} />
        </EffectComposer>

        <Preload all />
      </Canvas>
    </div>
  );
};