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
import { ParticleCard, CardData } from "./hud/ParticleCard";
import { useParticlePool } from "./particles/useParticlePool";

export type SphereVariant = "classic" | "nebula" | "crystal" | "pulse" | "dataflow";

interface VariantVisualizationProps {
  state: AIState;
  audioLevel?: number;
  variant?: SphereVariant;
  showHUD?: boolean;
  particleDensity?: number;
  trailLength?: number;
  morphIntensity?: number;
  className?: string;
}

// Demo card data for particle cards
const demoCards: CardData[] = [
  {
    id: "1",
    type: "email",
    title: "3 Unread Emails",
    subtitle: "from today",
    content: "Meeting reminder from Sarah, Project update from Dev Team",
  },
  {
    id: "2",
    type: "flight",
    title: "Paris Flight",
    subtitle: "Dec 20, 2024",
    content: "Air France AF1234 departing at 10:30 AM. Gate B42.",
  },
  {
    id: "3",
    type: "stock",
    title: "AAPL Stock",
    subtitle: "+2.4% today",
    content: "Apple Inc. trading at $195.42. Market cap: $3.01T.",
  },
  {
    id: "4",
    type: "calendar",
    title: "Next Meeting",
    subtitle: "in 2 hours",
    content: "Product Review with Marketing Team. 3 attendees.",
  },
];

const VariantScene = ({ 
  state, 
  audioLevel, 
  variant, 
  showHUD,
  particleDensity,
  trailLength,
  morphIntensity,
}: { 
  state: AIState; 
  audioLevel: number; 
  variant: SphereVariant;
  showHUD: boolean;
  particleDensity: number;
  trailLength: number;
  morphIntensity: number;
}) => {
  const { pool } = useParticlePool({
    count: 30000,
    universeRadius: 12,
    sphereRadius: 0.8,
  });

  const renderSphere = () => {
    const commonProps = { state, audioLevel, particleDensity, trailLength, morphIntensity };
    switch (variant) {
      case "nebula":
        return <MorphingSphereNebula {...commonProps} />;
      case "crystal":
        return <MorphingSphereCrystal {...commonProps} />;
      case "pulse":
        return <MorphingSpherePulse {...commonProps} pool={pool} hudVisible={showHUD} />;
      case "dataflow":
        return <MorphingSphereDataFlow {...commonProps} pool={pool} hudVisible={showHUD} />;
      default:
        return <MorphingSphereClassic {...commonProps} />;
    }
  };

  // Show particle cards for pulse and dataflow variants
  const showParticleCards = (variant === "pulse" || variant === "dataflow") && showHUD;

  return (
    <>
      {/* Ambient universe particles */}
      <ParticleUniverseSystem pool={pool} audioLevel={audioLevel} />
      
      {/* Main sphere */}
      {renderSphere()}
      
      {/* Pixel-perfect particle cards with HTML content overlay */}
      {showParticleCards && (
        <>
          <ParticleCard
            visible={showHUD}
            position={[2.3, 0.8, 0]}
            width={1.5}
            height={0.95}
            card={demoCards[0]}
            particleCount={9000}
          />
          <ParticleCard
            visible={showHUD}
            position={[-2.4, -0.5, 0]}
            width={1.35}
            height={1.0}
            card={demoCards[1]}
            particleCount={8000}
          />
          <ParticleCard
            visible={showHUD}
            position={[2.0, -1.2, 0]}
            width={1.2}
            height={0.8}
            card={demoCards[2]}
            particleCount={7000}
          />
          <ParticleCard
            visible={showHUD}
            position={[-1.8, 1.1, 0]}
            width={1.1}
            height={0.75}
            card={demoCards[3]}
            particleCount={6000}
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
  particleDensity = 75,
  trailLength = 6,
  morphIntensity = 50,
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
            particleDensity={particleDensity}
            trailLength={trailLength}
            morphIntensity={morphIntensity}
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