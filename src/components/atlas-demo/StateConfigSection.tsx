import { WakeWordState } from '@/types';
import { NebulaStateConfig, NEBULA_STATE_CONFIGS } from '@/components/atlas/utils/nebulaStateConfigs';
import { getMergedStateConfig, hasStateCustomizations, StateCustomizations } from '@/hooks/useAtlasSettings';
import { CollapsibleSection } from './CollapsibleSection';
import { SliderControl } from './SliderControl';
import { RotateCcw, Play } from 'lucide-react';

interface StateConfigSectionProps {
  stateName: WakeWordState;
  stateCustomizations: StateCustomizations;
  isActive: boolean;
  onSetCustomization: (key: keyof NebulaStateConfig, value: string | number | boolean) => void;
  onResetCustomizations: () => void;
  onPreview: () => void;
}

const stateInfo: Record<WakeWordState, { label: string; description: string; colorClass: string; color: string }> = {
  dormant: { label: 'Dormant', description: 'Idle state - dim particles', colorClass: 'bg-amber-600', color: 'amber' },
  passive: { label: 'Passive', description: 'Ambient listening', colorClass: 'bg-orange-500', color: 'orange' },
  activated: { label: 'Activated', description: 'Wake word detected', colorClass: 'bg-yellow-400', color: 'amber' },
  listening: { label: 'Listening', description: 'Active speech capture', colorClass: 'bg-cyan-400', color: 'cyan' },
  thinking: { label: 'Thinking', description: 'Processing response', colorClass: 'bg-purple-500', color: 'purple' },
  speaking: { label: 'Speaking', description: 'TTS playback', colorClass: 'bg-amber-400', color: 'amber' },
};

export function StateConfigSection({
  stateName,
  stateCustomizations,
  isActive,
  onSetCustomization,
  onResetCustomizations,
  onPreview,
}: StateConfigSectionProps) {
  const info = stateInfo[stateName];
  const mergedConfig = getMergedStateConfig(stateName, stateCustomizations);
  const isCustomized = hasStateCustomizations(stateName, stateCustomizations);

  return (
    <CollapsibleSection
      title={info.label}
      icon={<div className={`w-2.5 h-2.5 rounded-full ${info.colorClass}`} />}
      color={info.color}
      isCustomized={isCustomized}
      isActive={isActive}
      defaultOpen={isActive}
      headerAction={
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {!isActive && (
            <button
              onClick={onPreview}
              className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Preview this state"
            >
              <Play className="w-3 h-3" />
            </button>
          )}
          {isCustomized && (
            <button
              onClick={onResetCustomizations}
              className="p-1 rounded hover:bg-muted/50 text-amber-400 hover:text-amber-300 transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      }
    >
      <p className="text-[10px] text-muted-foreground mb-3">{info.description}</p>
      
      {/* Flow Settings */}
      <div className="space-y-2">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Flow</span>
        <SliderControl
          label="Flow Speed"
          value={mergedConfig.flowSpeed}
          onChange={(v) => onSetCustomization('flowSpeed', v)}
          min={0.1}
          max={2}
          step={0.05}
          color={info.color}
          decimals={2}
        />
        <SliderControl
          label="Flow Strength"
          value={mergedConfig.flowStrength}
          onChange={(v) => onSetCustomization('flowStrength', v)}
          min={0}
          max={1}
          step={0.05}
          color={info.color}
          decimals={2}
        />
      </div>

      {/* Lighting Settings */}
      <div className="space-y-2 pt-2 border-t border-border/20">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Lighting</span>
        <SliderControl
          label="Glow Intensity"
          value={mergedConfig.glowIntensity}
          onChange={(v) => onSetCustomization('glowIntensity', v)}
          min={0.3}
          max={2}
          step={0.1}
          color={info.color}
          decimals={1}
        />
        <SliderControl
          label="Rim Intensity"
          value={mergedConfig.rimIntensity}
          onChange={(v) => onSetCustomization('rimIntensity', v)}
          min={0}
          max={3}
          step={0.1}
          color={info.color}
          decimals={1}
        />
        <SliderControl
          label="Hot Spot"
          value={mergedConfig.hotSpotIntensity}
          onChange={(v) => onSetCustomization('hotSpotIntensity', v)}
          min={0}
          max={2}
          step={0.1}
          color={info.color}
          decimals={1}
        />
      </div>

      {/* Breathing Settings */}
      <div className="space-y-2 pt-2 border-t border-border/20">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Breathing</span>
        <SliderControl
          label="Speed"
          value={mergedConfig.breathingSpeed}
          onChange={(v) => onSetCustomization('breathingSpeed', v)}
          min={0.1}
          max={2}
          step={0.1}
          color={info.color}
          decimals={1}
        />
        <SliderControl
          label="Amount"
          value={mergedConfig.breathingAmount}
          onChange={(v) => onSetCustomization('breathingAmount', v)}
          min={0}
          max={0.2}
          step={0.01}
          color={info.color}
          decimals={2}
        />
        <SliderControl
          label="Radius Noise"
          value={mergedConfig.radiusNoise}
          onChange={(v) => onSetCustomization('radiusNoise', v)}
          min={0}
          max={0.4}
          step={0.02}
          color={info.color}
          decimals={2}
        />
      </div>

      {/* Colors */}
      <div className="space-y-2 pt-2 border-t border-border/20">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Colors</span>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Start</label>
            <input
              type="color"
              value={mergedConfig.colorStart}
              onChange={(e) => onSetCustomization('colorStart', e.target.value)}
              className="w-full h-7 rounded cursor-pointer border border-border/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">Mid</label>
            <input
              type="color"
              value={mergedConfig.colorMid}
              onChange={(e) => onSetCustomization('colorMid', e.target.value)}
              className="w-full h-7 rounded cursor-pointer border border-border/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">End</label>
            <input
              type="color"
              value={mergedConfig.colorEnd}
              onChange={(e) => onSetCustomization('colorEnd', e.target.value)}
              className="w-full h-7 rounded cursor-pointer border border-border/30"
            />
          </div>
        </div>
        {/* Gradient Preview */}
        <div 
          className="h-2 rounded-full w-full mt-1" 
          style={{
            background: `linear-gradient(to right, ${mergedConfig.colorStart}, ${mergedConfig.colorMid}, ${mergedConfig.colorEnd})`
          }} 
        />
      </div>

      {/* State-specific behaviors */}
      {(stateName === 'thinking' || stateName === 'speaking') && (
        <div className="space-y-2 pt-2 border-t border-border/20">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">State Behavior</span>
          {stateName === 'thinking' && (
            <SliderControl
              label="Core Retraction"
              value={mergedConfig.coreRetraction}
              onChange={(v) => onSetCustomization('coreRetraction', v)}
              min={0}
              max={0.5}
              step={0.05}
              color={info.color}
              decimals={2}
              hint={['None', 'Deep']}
            />
          )}
          {stateName === 'speaking' && (
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-foreground">Audio Reactive</span>
              <button
                onClick={() => onSetCustomization('audioReactive', !mergedConfig.audioReactive)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                  mergedConfig.audioReactive
                    ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300'
                    : 'bg-muted/20 border border-border/30 text-muted-foreground'
                }`}
              >
                {mergedConfig.audioReactive ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
}
