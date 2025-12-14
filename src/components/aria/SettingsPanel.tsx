import { useState } from "react";
import { Settings, ChevronUp, ChevronDown, RotateCcw, Sparkles, Layers } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { SphereVariant } from "./VariantVisualization";

interface SettingsPanelProps {
  sphereVariant: SphereVariant;
  showHUD: boolean;
  particleDensity: number;
  trailLength: number;
  morphIntensity: number;
  onVariantChange: (variant: SphereVariant) => void;
  onShowHUDChange: (show: boolean) => void;
  onParticleDensityChange: (value: number) => void;
  onTrailLengthChange: (value: number) => void;
  onMorphIntensityChange: (value: number) => void;
}

const VARIANTS: { id: SphereVariant; label: string; description: string }[] = [
  { id: "classic", label: "Classic", description: "Clean morphing sphere" },
  { id: "nebula", label: "Nebula", description: "Cosmic gas clouds" },
  { id: "crystal", label: "Crystal", description: "Crystalline structure" },
  { id: "pulse", label: "Pulse", description: "Pulsing energy waves" },
  { id: "dataflow", label: "Data Flow", description: "Network data streams" },
];

const DEFAULTS = {
  particleDensity: 75,
  trailLength: 6,
  morphIntensity: 50,
};

export const SettingsPanel = ({
  sphereVariant,
  showHUD,
  particleDensity,
  trailLength,
  morphIntensity,
  onVariantChange,
  onShowHUDChange,
  onParticleDensityChange,
  onTrailLengthChange,
  onMorphIntensityChange,
}: SettingsPanelProps) => {
  const [expanded, setExpanded] = useState(true);
  const [section, setSection] = useState<"variants" | "controls">("variants");

  const handleReset = () => {
    onParticleDensityChange(DEFAULTS.particleDensity);
    onTrailLengthChange(DEFAULTS.trailLength);
    onMorphIntensityChange(DEFAULTS.morphIntensity);
  };

  const supportsHUD = sphereVariant === "pulse" || sphereVariant === "dataflow";

  return (
    <div 
      className="backdrop-blur-xl border border-border/40 rounded-2xl overflow-hidden w-52 transition-all duration-300"
      style={{
        background: 'linear-gradient(145deg, hsl(var(--card) / 0.85) 0%, hsl(var(--card) / 0.7) 100%)',
        boxShadow: '0 8px 32px hsl(var(--background) / 0.5), inset 0 1px 0 hsl(var(--foreground) / 0.08)',
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 border-b border-border/30 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xs font-medium text-foreground flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Visualization
        </span>
        <button className="p-1 rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* Section Tabs */}
          <div className="flex gap-1 p-0.5 bg-muted/30 rounded-lg">
            <button
              onClick={() => setSection("variants")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                section === "variants"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3 h-3" />
              Variants
            </button>
            <button
              onClick={() => setSection("controls")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                section === "controls"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="w-3 h-3" />
              Controls
            </button>
          </div>

          {/* Variants Section */}
          {section === "variants" && (
            <div className="space-y-2">
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onVariantChange(v.id)}
                  className={`w-full p-2 rounded-xl text-left transition-all border ${
                    sphereVariant === v.id
                      ? "bg-primary/15 border-primary/40 shadow-sm"
                      : "bg-muted/10 border-transparent hover:bg-muted/30 hover:border-border/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${sphereVariant === v.id ? "text-primary" : "text-foreground"}`}>
                      {v.label}
                    </span>
                    {sphereVariant === v.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{v.description}</p>
                </button>
              ))}

              {/* HUD Toggle */}
              {supportsHUD && (
                <button
                  onClick={() => onShowHUDChange(!showHUD)}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl transition-all border ${
                    showHUD
                      ? "bg-accent/15 border-accent/40"
                      : "bg-muted/10 border-transparent hover:bg-muted/30"
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${showHUD ? "text-accent" : "text-muted-foreground"}`} />
                  <div className="flex-1 text-left">
                    <span className={`text-xs font-medium ${showHUD ? "text-accent" : "text-foreground"}`}>
                      Particle HUD
                    </span>
                    <p className="text-[9px] text-muted-foreground">Interactive data cards</p>
                  </div>
                  <div className={`w-8 h-4 rounded-full transition-colors relative ${showHUD ? "bg-accent" : "bg-muted/50"}`}>
                    <div 
                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-background shadow-sm transition-all ${
                        showHUD ? "left-4" : "left-0.5"
                      }`}
                    />
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Controls Section */}
          {section === "controls" && (
            <div className="space-y-4">
              {/* Particle Density */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-muted-foreground font-medium">Particle Density</label>
                  <span className="text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">{particleDensity}%</span>
                </div>
                <Slider
                  value={[particleDensity]}
                  onValueChange={(v) => onParticleDensityChange(v[0])}
                  min={25}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Trail Length */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-muted-foreground font-medium">Trail Length</label>
                  <span className="text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">{trailLength}</span>
                </div>
                <Slider
                  value={[trailLength]}
                  onValueChange={(v) => onTrailLengthChange(v[0])}
                  min={0}
                  max={12}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Morph Intensity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-muted-foreground font-medium">Morph Intensity</label>
                  <span className="text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">{morphIntensity}%</span>
                </div>
                <Slider
                  value={[morphIntensity]}
                  onValueChange={(v) => onMorphIntensityChange(v[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-medium rounded-xl bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors border border-border/30 hover:border-border/50"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to Defaults
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};