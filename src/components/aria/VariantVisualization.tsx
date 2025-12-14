import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, AdaptiveEvents, Preload } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";
import { AIState } from "./AIOrb";
import { MorphingSphereClassic } from "./scenes/MorphingSphereClassic";
import { MorphingSphereNebula } from "./scenes/MorphingSphereNebula";
import { MorphingSphereCrystal } from "./scenes/MorphingSphereCrystal";
import { MorphingSpherePulse } from "./scenes/MorphingSpherePulse";
import { MorphingSphereDataFlow } from "./scenes/MorphingSphereDataFlow";
import { ParticleUniverseSystem } from "./particles/ParticleUniverseSystem";
import { ParticleHUDElement } from "./hud/ParticleHUDElement";
import { useParticlePool } from "./particles/useParticlePool";

export type SphereVariant = "classic" | "nebula" | "crystal" | "pulse" | "dataflow";

interface VariantVisualizationProps {
  state: AIState;
  audioLevel?: number;
  variant?: SphereVariant;
  showHUD?: boolean;
  className?: string;
}

const VariantScene = ({ 
  state, 
  audioLevel, 
  variant, 
  showHUD 
}: { 
  state: AIState; 
  audioLevel: number; 
  variant: SphereVariant;
  showHUD: boolean;
}) => {
  const { pool } = useParticlePool({
    count: 30000,
    universeRadius: 12,
    sphereRadius: 0.8,
  });

  const renderSphere = () => {
    switch (variant) {
      case "nebula":
        return <MorphingSphereNebula state={state} audioLevel={audioLevel} />;
      case "crystal":
        return <MorphingSphereCrystal state={state} audioLevel={audioLevel} />;
      case "pulse":
        return <MorphingSpherePulse state={state} audioLevel={audioLevel} pool={pool} hudVisible={showHUD} />;
      case "dataflow":
        return <MorphingSphereDataFlow state={state} audioLevel={audioLevel} pool={pool} hudVisible={showHUD} />;
      default:
        return <MorphingSphereClassic state={state} audioLevel={audioLevel} />;
    }
  };

  // Show particle HUD for pulse and dataflow variants
  const showParticleHUD = (variant === "pulse" || variant === "dataflow") && showHUD;

  return (
    <>
      {/* Ambient universe particles */}
      <ParticleUniverseSystem pool={pool} audioLevel={audioLevel} />
      
      {/* Main sphere */}
      {renderSphere()}
      
      {/* Massive glassmorphic particle HUD elements */}
      {showParticleHUD && (
        <>
          <ParticleHUDElement
            visible={showHUD}
            position={[2.2, 0.9, 0]}
            width={1.4}
            height={0.9}
            particleCount={8000}
            color={[0.05, 0.25, 0.4]}
            cornerRadius={0.12}
          />
          <ParticleHUDElement
            visible={showHUD}
            position={[-2.3, -0.4, 0]}
            width={1.2}
            height={1.0}
            particleCount={7000}
            color={[0.2, 0.08, 0.35]}
            cornerRadius={0.1}
          />
          <ParticleHUDElement
            visible={showHUD}
            position={[1.8, -1.3, 0]}
            width={1.0}
            height={0.6}
            particleCount={5000}
            color={[0.08, 0.3, 0.35]}
            cornerRadius={0.08}
          />
          <ParticleHUDElement
            visible={showHUD}
            position={[-1.5, 1.2, 0]}
            width={0.9}
            height={0.5}
            particleCount={4000}
            color={[0.15, 0.2, 0.4]}
            cornerRadius={0.1}
          />
        </>
      )}
    </>
  );
};

export const VariantVisualization = ({
  state,
  audioLevel = 0,
  variant = "classic",
  showHUD = false,
  className = "",
}: VariantVisualizationProps) => {
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
        
        <ambientLight intensity={0.05} color="#050a15" />
        
        <Suspense fallback={null}>
          <VariantScene 
            state={state} 
            audioLevel={audioLevel} 
            variant={variant}
            showHUD={showHUD}
          />
        </Suspense>

        <EffectComposer>
          <Bloom 
            intensity={0.5}
            luminanceThreshold={0.25}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <ChromaticAberration 
            offset={new THREE.Vector2(0.0005, 0.0005)}
            radialModulation={false}
            modulationOffset={0}
          />
          <Vignette offset={0.35} darkness={0.75} />
        </EffectComposer>

        <Preload all />
      </Canvas>
    </div>
  );
};