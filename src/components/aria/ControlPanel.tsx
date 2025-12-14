import { useState } from "react";
import { Settings, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface ControlPanelProps {
  particleDensity: number;
  trailLength: number;
  morphIntensity: number;
  onParticleDensityChange: (value: number) => void;
  onTrailLengthChange: (value: number) => void;
  onMorphIntensityChange: (value: number) => void;
}

const DEFAULTS = {
  particleDensity: 75,
  trailLength: 6,
  morphIntensity: 50,
};

export const ControlPanel = ({
  particleDensity,
  trailLength,
  morphIntensity,
  onParticleDensityChange,
  onTrailLengthChange,
  onMorphIntensityChange,
}: ControlPanelProps) => {
  const [expanded, setExpanded] = useState(true);

  const handleReset = () => {
    onParticleDensityChange(DEFAULTS.particleDensity);
    onTrailLengthChange(DEFAULTS.trailLength);
    onMorphIntensityChange(DEFAULTS.morphIntensity);
  };

  return (
    <div className="backdrop-blur-md bg-muted/20 border border-border/30 rounded-xl p-3 w-44">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5" />
          Controls
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4">
          {/* Particle Density */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-muted-foreground">Density</label>
              <span className="text-[10px] text-primary font-medium">{particleDensity}%</span>
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-muted-foreground">Trails</label>
              <span className="text-[10px] text-primary font-medium">{trailLength}</span>
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-muted-foreground">Morph</label>
              <span className="text-[10px] text-primary font-medium">{morphIntensity}%</span>
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
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] rounded-lg bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors border border-border/20"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      )}
    </div>
  );
};