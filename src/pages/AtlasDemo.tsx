import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Sparkles, Zap, Settings2, Layers, Waves, Wind, MousePointer, Save, Download, Upload, Disc, Droplets, Orbit, Plus, Trash2, X, ChevronDown } from 'lucide-react';
import { AtlasSphere } from '@/components/atlas';
import { WakeWordState } from '@/types';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useAtlasSettings, defaultAtlasSettings, getMergedStateConfig, hasStateCustomizations } from '@/hooks/useAtlasSettings';
import { useAtlasPresets, AtlasPreset } from '@/hooks/useAtlasPresets';
import { CollapsibleSection, StateConfigSection, SliderControl } from '@/components/atlas-demo';

// Performance presets
type PerformanceMode = 'performance' | 'balanced' | 'quality';

const performancePresets: Record<PerformanceMode, { particleCount: number; trailLength: number; enableBloom: boolean; coreParticleCount: number; density: number; particleSize: number; label: string }> = {
  performance: { particleCount: 800, trailLength: 0, enableBloom: false, coreParticleCount: 80, density: 0.9, particleSize: 0.09, label: 'Performance' },
  balanced: { particleCount: 1500, trailLength: 0, enableBloom: true, coreParticleCount: 120, density: 1.0, particleSize: 0.08, label: 'Balanced' },
  quality: { particleCount: 2500, trailLength: 3, enableBloom: true, coreParticleCount: 200, density: 1.0, particleSize: 0.07, label: 'Quality' },
};

const states: WakeWordState[] = ['dormant', 'passive', 'activated', 'listening', 'thinking', 'speaking'];

const stateDescriptions: Record<WakeWordState, { label: string; description: string; color: string }> = {
  dormant: { label: 'Dormant', description: 'Idle state - dim amber particles with slow drift', color: 'bg-amber-600' },
  passive: { label: 'Passive', description: 'Ambient listening - warm orange with gentle orbit', color: 'bg-orange-500' },
  activated: { label: 'Activated', description: 'Wake word detected - bright gold flash, particles rush to center', color: 'bg-yellow-400' },
  listening: { label: 'Listening', description: 'Active speech capture - cyan tinted with dual vortex', color: 'bg-cyan-400' },
  thinking: { label: 'Thinking', description: 'Processing response - purple shift with rapid rotation', color: 'bg-purple-500' },
  speaking: { label: 'Speaking', description: 'TTS playback - audio-reactive gold ripple waves', color: 'bg-amber-400' },
};

interface Preset {
  name: string;
  description: string;
  state: WakeWordState;
  morphProgress: number;
  audioLevel: number;
  autoAudio: boolean;
  icon: string;
  gradient: string;
}

const presets: Preset[] = [
  { name: 'Idle Ambient', description: 'Calm, loosely formed sphere drifting peacefully', state: 'dormant', morphProgress: 0.5, audioLevel: 0, autoAudio: false, icon: '🌙', gradient: 'from-slate-500/20 to-slate-600/20' },
  { name: 'Awaiting Input', description: 'Gentle sphere formation, ready to listen', state: 'passive', morphProgress: 0.7, audioLevel: 0.05, autoAudio: false, icon: '👂', gradient: 'from-orange-500/20 to-amber-500/20' },
  { name: 'Wake Word Detected', description: 'Bright activation burst, particles converge', state: 'activated', morphProgress: 1.0, audioLevel: 0.3, autoAudio: false, icon: '⚡', gradient: 'from-yellow-400/20 to-amber-400/20' },
  { name: 'Active Listening', description: 'Cyan vortex formation, audio-reactive', state: 'listening', morphProgress: 1.0, audioLevel: 0.4, autoAudio: true, icon: '🎙️', gradient: 'from-cyan-500/20 to-blue-500/20' },
  { name: 'Deep Processing', description: 'Purple pulsing sphere, rapid internal rotation', state: 'thinking', morphProgress: 1.0, audioLevel: 0.2, autoAudio: false, icon: '🧠', gradient: 'from-purple-500/20 to-violet-500/20' },
  { name: 'Speaking Response', description: 'Gold ripples emanating with voice output', state: 'speaking', morphProgress: 1.0, audioLevel: 0.6, autoAudio: true, icon: '🔊', gradient: 'from-amber-400/20 to-orange-400/20' },
  { name: 'Loose Formation', description: 'Semi-scattered sphere with audio reactivity', state: 'passive', morphProgress: 0.4, audioLevel: 0.8, autoAudio: true, icon: '🌀', gradient: 'from-red-500/20 to-pink-500/20' },
  { name: 'Perfect Sphere', description: 'Tight formation, minimal movement', state: 'listening', morphProgress: 1.0, audioLevel: 0.0, autoAudio: false, icon: '🔮', gradient: 'from-teal-500/20 to-cyan-500/20' },
];

export default function AtlasDemo() {
  // Use the unified settings hook - single source of truth
  const { 
    settings, 
    setSetting, 
    setMultiple, 
    setStateCustomization,
    resetStateCustomizations,
    reset, 
    resetCurrentState, 
    resetAllCustomizations, 
    exportSettings, 
    importSettings 
  } = useAtlasSettings();
  
  // Custom presets
  const { allPresets, customPresets, savePreset, deletePreset, isBuiltIn } = useAtlasPresets();
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [selectedPresetIcon, setSelectedPresetIcon] = useState('💾');
  
  // Use ref for audioLevel to avoid 60fps re-renders
  const audioLevelRef = useRef(settings.audioLevel);
  const [displayAudioLevel, setDisplayAudioLevel] = useState(settings.audioLevel);
  
  // Local UI state only
  const [isAnimating, setIsAnimating] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('balanced');

  // Simulate audio levels when autoAudio is enabled - uses ref to avoid re-renders
  useEffect(() => {
    if (!settings.autoAudio) {
      audioLevelRef.current = settings.audioLevel;
      return;
    }
    
    let frame: number;
    let lastDisplayUpdate = 0;
    const animate = (time: number) => {
      const noise = Math.sin(time * 0.005) * 0.3 + Math.random() * 0.4;
      audioLevelRef.current = Math.max(0, Math.min(1, noise));
      
      // Only update display every 100ms for UI slider
      if (time - lastDisplayUpdate > 100) {
        setDisplayAudioLevel(audioLevelRef.current);
        lastDisplayUpdate = time;
      }
      
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [settings.autoAudio, settings.audioLevel]);

  // Cycle through states automatically
  const startStateAnimation = () => {
    setIsAnimating(true);
    let index = 0;
    const interval = setInterval(() => {
      setSetting('state', states[index]);
      index++;
      if (index >= states.length) {
        clearInterval(interval);
        setIsAnimating(false);
        setSetting('state', 'dormant');
      }
    }, 2000);
  };

  const applyPreset = (preset: Preset) => {
    audioLevelRef.current = preset.audioLevel;
    setDisplayAudioLevel(preset.audioLevel);
    setMultiple({
      state: preset.state,
      morphProgress: preset.morphProgress,
      audioLevel: preset.audioLevel,
      autoAudio: preset.autoAudio,
    });
    setActivePreset(preset.name);
  };

  const applyPerformanceMode = (mode: PerformanceMode) => {
    const preset = performancePresets[mode];
    setPerformanceMode(mode);
    setMultiple({
      particleCount: preset.particleCount,
      density: preset.density,
      particleSize: preset.particleSize,
      trailLength: preset.trailLength,
      enableBloom: preset.enableBloom,
      coreParticleCount: preset.coreParticleCount,
      enableTrails: preset.trailLength > 0,
    });
    toast.success(`${preset.label} mode applied`);
  };

  const resetToDefaults = () => {
    reset();
    setActivePreset(null);
    toast.success('Reset to defaults');
  };

  const handleResetCurrentState = () => {
    resetCurrentState();
    toast.success(`Reset ${stateDescriptions[settings.state].label} to defaults`);
  };

  const clearCacheAndReload = () => {
    localStorage.removeItem('atlas-demo-settings');
    window.location.reload();
  };

  const handleExport = () => {
    exportSettings();
    toast.success('Settings exported');
  };

  const handleImport = () => {
    importSettings();
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    savePreset(newPresetName, settings, newPresetDescription, selectedPresetIcon);
    toast.success(`Preset "${newPresetName}" saved!`);
    setShowSavePresetModal(false);
    setNewPresetName('');
    setNewPresetDescription('');
    setSelectedPresetIcon('💾');
  };

  const handleApplyPreset = (preset: AtlasPreset) => {
    setMultiple(preset.settings);
    toast.success(`Applied "${preset.name}"`);
  };

  const handleDeletePreset = (preset: AtlasPreset) => {
    if (isBuiltIn(preset.id)) {
      toast.error('Cannot delete built-in presets');
      return;
    }
    deletePreset(preset.id);
    toast.success(`Deleted "${preset.name}"`);
  };

  const presetIcons = ['💾', '🌟', '🎨', '🔥', '💎', '🌈', '⚡', '🌙', '🎯', '🚀'];

  const customizedStatesCount = Object.keys(settings.stateCustomizations).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/30 border-b border-border/20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h1 className="text-lg font-semibold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Atlas Core Demo
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* State customization indicator */}
            {customizedStatesCount > 0 && (
              <button
                onClick={() => {
                  resetAllCustomizations();
                  toast.success('Reset all state customizations');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:border-amber-500/60 text-amber-300 transition-all"
                title="Click to reset all customizations"
              >
                <span className="text-xs font-medium">{customizedStatesCount} customized</span>
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => toast.success('Settings auto-saved!')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:border-amber-500/60 text-amber-300 transition-all"
              title="Settings auto-save"
            >
              <Save className="w-4 h-4" />
              <span className="text-xs font-medium">Auto-saved</span>
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-lg bg-muted/20 border border-border/30 hover:border-border/50 transition-all"
              title="Export Settings"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleImport}
              className="p-2 rounded-lg bg-muted/20 border border-border/30 hover:border-border/50 transition-all"
              title="Import Settings"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="pt-20 flex min-h-screen">
        {/* Main visualization area */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Side-by-side comparison mode */}
            {settings.comparisonView ? (
              <div className="flex items-center gap-8 lg:gap-16">
                {/* Dashboard Size (140px) */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-[140px] h-[140px] flex-shrink-0">
                    <AtlasSphere
                      state={settings.state}
                      audioLevel={displayAudioLevel}
                      context="dashboard"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                    <span className="text-xs text-emerald-300 font-medium">Dashboard (140px)</span>
                  </div>
                </div>

                {/* Tablet Size (280px) */}
                <div className="flex flex-col items-center gap-4 hidden md:flex">
                  <div className="w-[280px] h-[280px] flex-shrink-0">
                    <AtlasSphere
                      state={settings.state}
                      audioLevel={displayAudioLevel}
                      context="demo"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-500/40">
                    <span className="text-xs text-cyan-300 font-medium">Tablet (280px)</span>
                  </div>
                </div>

                {/* Full Size (420px) */}
                <div className="flex flex-col items-center gap-4 hidden lg:flex">
                  <div className="w-[420px] h-[420px] flex-shrink-0">
                    <AtlasSphere
                      state={settings.state}
                      audioLevel={displayAudioLevel}
                      context="demo"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                    <span className="text-xs text-amber-300 font-medium">Desktop (420px)</span>
                  </div>
                </div>
              </div>
            ) : settings.dashboardPreview ? (
              <div className="relative">
                {/* Dashboard preview container */}
                <div className="w-[140px] h-[140px] flex-shrink-0">
                  <AtlasSphere
                    state={settings.state}
                    audioLevel={displayAudioLevel}
                    context="dashboard"
                    className="w-full h-full"
                  />
                </div>
                {/* Dashboard preview indicator */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                  <span className="text-xs text-emerald-300 font-medium">Dashboard Preview</span>
                </div>
              </div>
            ) : (
              <div className="w-[420px] h-[420px] flex-shrink-0">
                <AtlasSphere
                  state={settings.state}
                  audioLevel={displayAudioLevel}
                  context="demo"
                  className="w-full h-full"
                />
              </div>
            )}
          </div>

          {/* Current state indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-xl bg-background/40 border border-border/30"
            key={settings.state}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={`w-3 h-3 rounded-full ${stateDescriptions[settings.state].color} animate-pulse`} />
            <span className="text-sm font-medium">{stateDescriptions[settings.state].label}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">— {stateDescriptions[settings.state].description}</span>
          </motion.div>
        </div>

        {/* Control Panel */}
        <motion.aside 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 lg:w-96 backdrop-blur-xl bg-background/20 border-l border-border/20 p-6 overflow-y-auto max-h-screen"
        >
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Visual Controls</h2>
              <p className="text-sm text-muted-foreground">Adjust parameters to see how Atlas Core responds to different states and inputs.</p>
            </div>

            {/* ==================== GLOBAL SETTINGS ==================== */}
            <CollapsibleSection
              title="Global Settings"
              icon={<Settings2 className="w-4 h-4 text-violet-400" />}
              color="violet"
              defaultOpen={true}
            >
              {/* Visualization Mode Toggle */}
              <div className="space-y-2">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Visualization Mode</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSetting('visualizationMode', 'classic')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      settings.visualizationMode === 'classic'
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-300'
                        : 'bg-muted/20 border border-border/30 hover:border-border/50 text-muted-foreground'
                    }`}
                  >
                    🔥 Classic
                  </button>
                  <button
                    onClick={() => setSetting('visualizationMode', 'nebulaFlow')}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      settings.visualizationMode === 'nebulaFlow'
                        ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/50 text-violet-300'
                        : 'bg-muted/20 border border-border/30 hover:border-border/50 text-muted-foreground'
                    }`}
                  >
                    🌌 Nebula Flow
                  </button>
                </div>
              </div>
              
              {/* View Mode Toggles */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSetting('dashboardPreview', !settings.dashboardPreview);
                    if (!settings.dashboardPreview) setSetting('comparisonView', false);
                  }}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg transition-all ${
                    settings.dashboardPreview && !settings.comparisonView
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                      : 'bg-muted/20 border border-border/30 hover:border-border/50 text-muted-foreground'
                  }`}
                >
                  <span className="text-xs font-medium">📱 Dashboard</span>
                  <span className="text-[10px] opacity-70">140px</span>
                </button>
                
                <button
                  onClick={() => {
                    setSetting('comparisonView', !settings.comparisonView);
                    if (!settings.comparisonView) setSetting('dashboardPreview', false);
                  }}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg transition-all ${
                    settings.comparisonView
                      ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300'
                      : 'bg-muted/20 border border-border/30 hover:border-border/50 text-muted-foreground'
                  }`}
                >
                  <span className="text-xs font-medium">📊 Compare</span>
                  <span className="text-[10px] opacity-70">Side-by-side</span>
                </button>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={startStateAnimation}
                  disabled={isAnimating}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isAnimating
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                      : 'bg-muted/20 border border-border/30 hover:border-border/50'
                  }`}
                >
                  {isAnimating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {isAnimating ? 'Animating...' : 'Cycle States'}
                </button>
                <button
                  onClick={resetToDefaults}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border/30 hover:border-border/50 text-xs transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
            </CollapsibleSection>

            {/* ==================== AI STATE SELECTOR ==================== */}
            <CollapsibleSection
              title="AI State"
              icon={<Zap className="w-4 h-4 text-amber-400" />}
              color="amber"
              defaultOpen={true}
            >
              <div className="grid grid-cols-3 gap-1.5">
                {states.map((state) => (
                  <button
                    key={state}
                    onClick={() => setSetting('state', state)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                      settings.state === state
                        ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/50 ring-1 ring-amber-500/30'
                        : 'bg-muted/20 border border-border/30 hover:border-border/50'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${stateDescriptions[state].color}`} />
                    <span className="text-[10px] font-medium">{stateDescriptions[state].label}</span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            {/* ==================== PER-STATE CONFIGURATIONS ==================== */}
            {settings.visualizationMode === 'nebulaFlow' && (
              <CollapsibleSection
                title="Per-State Configs"
                icon={<Sparkles className="w-4 h-4 text-violet-400" />}
                color="violet"
                isCustomized={customizedStatesCount > 0}
                defaultOpen={true}
                headerAction={
                  customizedStatesCount > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetAllCustomizations();
                        toast.success('Reset all state customizations');
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
                    >
                      Reset All
                    </button>
                  ) : undefined
                }
              >
                <p className="text-[10px] text-muted-foreground mb-3">
                  Customize each AI state's visual appearance independently. Changes to one state won't affect others.
                </p>
                <div className="space-y-2">
                  {states.map((stateName) => (
                    <StateConfigSection
                      key={stateName}
                      stateName={stateName}
                      stateCustomizations={settings.stateCustomizations}
                      isActive={settings.state === stateName}
                      onSetCustomization={(key, value) => setStateCustomization(stateName, key, value)}
                      onResetCustomizations={() => {
                        resetStateCustomizations(stateName);
                        toast.success(`Reset ${stateDescriptions[stateName].label} to defaults`);
                      }}
                      onPreview={() => setSetting('state', stateName)}
                    />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* ==================== NEBULA GLOBAL SETTINGS ==================== */}
            {settings.visualizationMode === 'nebulaFlow' && (
              <CollapsibleSection
                title="Nebula Global"
                icon={<Orbit className="w-4 h-4 text-cyan-400" />}
                color="cyan"
              >
                {/* State Reactive Toggle */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-xs text-foreground">AI State Colors</span>
                    <p className="text-[10px] text-muted-foreground">Auto-adjust colors per AI state</p>
                  </div>
                  <button
                    onClick={() => setSetting('nebulaStateReactive', !settings.nebulaStateReactive)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      settings.nebulaStateReactive
                        ? 'bg-violet-500/30 border border-violet-500/50 text-violet-300'
                        : 'bg-muted/20 border border-border/30 text-muted-foreground'
                    }`}
                  >
                    {settings.nebulaStateReactive ? 'AUTO' : 'MANUAL'}
                  </button>
                </div>

                {/* Particle Configuration */}
                <div className="space-y-2 pt-2 border-t border-border/20">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Particles</span>
                  {/* Particle Mode Toggle */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs text-foreground">Particle Mode</span>
                      <p className="text-[10px] text-muted-foreground">Fixed uses slider value, Density auto-calculates</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSetting('nebulaParticleMode', 'fixed')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                          settings.nebulaParticleMode === 'fixed'
                            ? 'bg-cyan-500/30 border border-cyan-500/50 text-cyan-300'
                            : 'bg-muted/20 border border-border/30 text-muted-foreground'
                        }`}
                      >
                        Fixed
                      </button>
                      <button
                        onClick={() => setSetting('nebulaParticleMode', 'density')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                          settings.nebulaParticleMode === 'density'
                            ? 'bg-amber-500/30 border border-amber-500/50 text-amber-300'
                            : 'bg-muted/20 border border-border/30 text-muted-foreground'
                        }`}
                      >
                        Density
                      </button>
                    </div>
                  </div>
                  <SliderControl 
                    label={`Particle Count${settings.nebulaParticleMode === 'density' ? ' (auto)' : ''}`} 
                    value={settings.nebulaParticleCount} 
                    onChange={(v) => setSetting('nebulaParticleCount', v)} 
                    min={3000} 
                    max={50000} 
                    step={1000} 
                    color="cyan" 
                    hint={['Light', '50K']} 
                  />
                  <SliderControl label="Particle Size" value={settings.nebulaParticleSize} onChange={(v) => setSetting('nebulaParticleSize', v)} min={0.02} max={0.12} step={0.005} color="cyan" decimals={3} />
                  <SliderControl label="Density" value={settings.nebulaDensity} onChange={(v) => setSetting('nebulaDensity', v)} min={0.5} max={2} step={0.05} color="cyan" decimals={2} />
                  <SliderControl label="Rotation Speed" value={settings.nebulaRotationSpeed} onChange={(v) => setSetting('nebulaRotationSpeed', v)} min={0} max={1} step={0.05} color="cyan" decimals={2} />
                </div>

                {/* Band Count & Depth */}
                <div className="space-y-2 pt-2 border-t border-border/20">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Structure</span>
                  <SliderControl label="Band Count" value={settings.nebulaBandCount} onChange={(v) => setSetting('nebulaBandCount', v)} min={3} max={16} step={1} color="cyan" />
                  <SliderControl label="Depth Fade" value={settings.nebulaDepthFade} onChange={(v) => setSetting('nebulaDepthFade', v)} min={0} max={1} step={0.05} color="cyan" decimals={2} />
                  <SliderControl label="Core Glow" value={settings.nebulaCoreGlow} onChange={(v) => setSetting('nebulaCoreGlow', v)} min={0} max={2} step={0.1} color="cyan" decimals={1} />
                </div>

                {/* Solid Surface Mode */}
                <div className="space-y-2 pt-2 border-t border-border/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-foreground">Solid Surface Mode</span>
                      <p className="text-[10px] text-muted-foreground">Particles form continuous surface</p>
                    </div>
                    <button
                      onClick={() => setSetting('nebulaSolidSurface', !settings.nebulaSolidSurface)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        settings.nebulaSolidSurface
                          ? 'bg-emerald-500/30 border border-emerald-500/50 text-emerald-300'
                          : 'bg-muted/20 border border-border/30 text-muted-foreground'
                      }`}
                    >
                      {settings.nebulaSolidSurface ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  
                  {settings.nebulaSolidSurface && (
                    <>
                      <SliderControl label="Surface Blend" value={settings.nebulaSurfaceBlend} onChange={(v) => setSetting('nebulaSurfaceBlend', v)} min={0.5} max={3} step={0.1} color="emerald" decimals={1} />
                      <SliderControl label="Uniform Size" value={settings.nebulaUniformSize} onChange={(v) => setSetting('nebulaUniformSize', v)} min={1} max={3} step={0.1} color="emerald" decimals={1} />
                      <SliderControl label="Coherence" value={settings.nebulaCoherence} onChange={(v) => setSetting('nebulaCoherence', v)} min={0} max={1} step={0.05} color="emerald" decimals={2} />
                    </>
                  )}
                </div>

                {/* State Behaviors */}
                <div className="space-y-2 pt-2 border-t border-border/20">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Behavior</span>
                  <SliderControl label="Transition Speed" value={settings.nebulaTransitionSpeed} onChange={(v) => setSetting('nebulaTransitionSpeed', v)} min={0.5} max={3} step={0.1} color="cyan" decimals={1} />
                  <SliderControl label="Thinking Retraction" value={settings.nebulaThinkingRetraction} onChange={(v) => setSetting('nebulaThinkingRetraction', v)} min={0} max={0.5} step={0.05} color="violet" decimals={2} />
                  <SliderControl label="Audio Breathing" value={settings.nebulaAudioBreathingIntensity} onChange={(v) => setSetting('nebulaAudioBreathingIntensity', v)} min={0} max={0.4} step={0.02} color="amber" decimals={2} />
                </div>
              </CollapsibleSection>
            )}

            {/* ==================== PRESETS ==================== */}
            <CollapsibleSection
              title="Quick Presets"
              icon={<Zap className="w-4 h-4 text-amber-400" />}
              color="amber"
              headerAction={
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSavePresetModal(true);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Save
                </button>
              }
            >
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {presets.map((preset) => (
                  <motion.button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-2 rounded-xl text-left transition-all ${
                      activePreset === preset.name
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 ring-1 ring-amber-500/30'
                        : `bg-gradient-to-r ${preset.gradient} border border-border/30 hover:border-border/50`
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm">{preset.icon}</span>
                      <span className="text-[10px] font-medium text-foreground truncate">{preset.name}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground line-clamp-1">{preset.description}</p>
                  </motion.button>
                ))}
              </div>

              {/* Custom Presets */}
              {customPresets.length > 0 && (
                <div className="pt-2 border-t border-border/20">
                  <span className="text-[10px] text-muted-foreground font-medium">Custom Presets</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {customPresets.map((preset) => (
                      <div key={preset.id} className="group relative">
                        <button
                          onClick={() => handleApplyPreset(preset)}
                          className="w-full px-2 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 hover:border-violet-500/40 text-violet-200 text-[10px] transition-all text-left"
                        >
                          <span className="mr-1">{preset.icon}</span>
                          <span className="truncate">{preset.name}</span>
                        </button>
                        <button
                          onClick={() => handleDeletePreset(preset)}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CollapsibleSection>

            {/* ==================== PERFORMANCE ==================== */}
            <CollapsibleSection
              title="Performance"
              icon={<Layers className="w-4 h-4 text-emerald-400" />}
              color="emerald"
            >
              <div className="grid grid-cols-3 gap-2">
                {(['performance', 'balanced', 'quality'] as PerformanceMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => applyPerformanceMode(mode)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                      performanceMode === mode
                        ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                        : 'bg-muted/20 border border-border/30 hover:border-border/50 text-muted-foreground'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            {/* ==================== AUDIO ==================== */}
            <CollapsibleSection
              title="Audio Level"
              icon={<Waves className="w-4 h-4 text-cyan-400" />}
              color="cyan"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Level</span>
                  <span className="text-sm font-mono text-cyan-400">{displayAudioLevel.toFixed(2)}</span>
                </div>
                <Slider
                  value={[settings.audioLevel]}
                  onValueChange={([v]) => {
                    setSetting('audioLevel', v);
                    setSetting('autoAudio', false);
                  }}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
                <button
                  onClick={() => setSetting('autoAudio', !settings.autoAudio)}
                  className={`w-full px-4 py-2 rounded-xl text-sm transition-all ${
                    settings.autoAudio
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                      : 'bg-muted/20 border border-border/30 hover:border-border/50'
                  }`}
                >
                  {settings.autoAudio ? '🔊 Simulating Audio...' : '🔇 Simulate Audio'}
                </button>
                <SliderControl label="Reactivity Speed" value={settings.audioReactivitySpeed} onChange={(v) => setSetting('audioReactivitySpeed', v)} min={0.2} max={3.0} step={0.1} color="cyan" decimals={1} suffix="x" />
              </div>
            </CollapsibleSection>

            {/* ==================== CLASSIC MODE SETTINGS ==================== */}
            {settings.visualizationMode === 'classic' && (
              <>
                {/* Core Particles */}
                <CollapsibleSection
                  title="Core Particles"
                  icon={<Disc className="w-4 h-4 text-orange-400" />}
                  color="orange"
                >
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs text-foreground">Enable Core</span>
                    <button
                      onClick={() => setSetting('enableCore', !settings.enableCore)}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        settings.enableCore
                          ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300'
                          : 'bg-muted/20 border border-border/30 text-muted-foreground'
                      }`}
                    >
                      {settings.enableCore ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {settings.enableCore && (
                    <>
                      <SliderControl label="Particle Count" value={settings.coreParticleCount} onChange={(v) => setSetting('coreParticleCount', v)} min={50} max={500} step={10} color="orange" />
                      <SliderControl label="Density" value={settings.coreDensity} onChange={(v) => setSetting('coreDensity', v)} min={0.1} max={1} step={0.05} color="orange" decimals={2} />
                      <SliderControl label="Particle Size" value={settings.coreParticleSize} onChange={(v) => setSetting('coreParticleSize', v)} min={0.01} max={0.1} step={0.005} color="orange" decimals={3} />
                      <SliderControl label="Intensity" value={settings.coreIntensity} onChange={(v) => setSetting('coreIntensity', v)} min={0.3} max={2} step={0.1} color="orange" decimals={1} />
                      <SliderControl label="Pulse Speed" value={settings.corePulseSpeed} onChange={(v) => setSetting('corePulseSpeed', v)} min={0.5} max={5} step={0.1} color="orange" decimals={1} />
                      <SliderControl label="Rotation Offset" value={settings.coreRotationOffset} onChange={(v) => setSetting('coreRotationOffset', v)} min={-2} max={2} step={0.1} color="orange" decimals={1} />
                    </>
                  )}
                </CollapsibleSection>

                {/* Ripples */}
                <CollapsibleSection
                  title="Ripples"
                  icon={<Droplets className="w-4 h-4 text-teal-400" />}
                  color="cyan"
                >
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs text-foreground">Enable Ripples</span>
                    <button
                      onClick={() => setSetting('enableRipples', !settings.enableRipples)}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        settings.enableRipples
                          ? 'bg-teal-500/20 border border-teal-500/50 text-teal-300'
                          : 'bg-muted/20 border border-border/30 text-muted-foreground'
                      }`}
                    >
                      {settings.enableRipples ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {settings.enableRipples && (
                    <>
                      <SliderControl label="Speed" value={settings.rippleSpeed} onChange={(v) => setSetting('rippleSpeed', v)} min={0.5} max={4} step={0.1} color="cyan" decimals={1} />
                      <SliderControl label="Count" value={settings.rippleCount} onChange={(v) => setSetting('rippleCount', v)} min={1} max={5} step={1} color="cyan" />
                    </>
                  )}
                </CollapsibleSection>

                {/* Turbulence */}
                <CollapsibleSection
                  title="Turbulence"
                  icon={<Wind className="w-4 h-4 text-emerald-400" />}
                  color="emerald"
                >
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs text-foreground">Enable Turbulence</span>
                    <button
                      onClick={() => setSetting('enableTurbulence', !settings.enableTurbulence)}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        settings.enableTurbulence
                          ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                          : 'bg-muted/20 border border-border/30 text-muted-foreground'
                      }`}
                    >
                      {settings.enableTurbulence ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {settings.enableTurbulence && (
                    <>
                      <SliderControl label="Frequency" value={settings.turbulenceFrequency} onChange={(v) => setSetting('turbulenceFrequency', v)} min={0.1} max={2} step={0.05} color="emerald" decimals={2} />
                      <SliderControl label="Amplitude" value={settings.turbulenceAmplitude} onChange={(v) => setSetting('turbulenceAmplitude', v)} min={0.01} max={0.3} step={0.01} color="emerald" decimals={2} />
                      <SliderControl label="Speed" value={settings.turbulenceSpeed} onChange={(v) => setSetting('turbulenceSpeed', v)} min={0.1} max={1} step={0.05} color="emerald" decimals={2} />
                    </>
                  )}
                </CollapsibleSection>

                {/* Trails */}
                <CollapsibleSection
                  title="Particle Trails"
                  icon={<Waves className="w-4 h-4 text-amber-400" />}
                  color="amber"
                >
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs text-foreground">Enable Trails</span>
                    <button
                      onClick={() => setSetting('enableTrails', !settings.enableTrails)}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        settings.enableTrails
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                          : 'bg-muted/20 border border-border/30 text-muted-foreground'
                      }`}
                    >
                      {settings.enableTrails ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {settings.enableTrails && (
                    <>
                      <SliderControl label="Trail Length" value={settings.trailLength} onChange={(v) => setSetting('trailLength', v)} min={1} max={12} step={1} color="amber" />
                      <SliderControl label="Trail Opacity" value={settings.trailOpacity} onChange={(v) => setSetting('trailOpacity', v)} min={0.1} max={1} step={0.05} color="amber" decimals={2} />
                      
                      <div className="flex items-center justify-between pt-2 border-t border-border/20">
                        <span className="text-xs text-muted-foreground">Color Gradient</span>
                        <button
                          onClick={() => setSetting('trailColorGradient', !settings.trailColorGradient)}
                          className={`px-3 py-1 rounded-lg text-xs transition-all ${
                            settings.trailColorGradient
                              ? 'bg-gradient-to-r from-orange-500/30 to-purple-500/30 border border-orange-500/50 text-orange-300'
                              : 'bg-muted/20 border border-border/30 text-muted-foreground'
                          }`}
                        >
                          {settings.trailColorGradient ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      {settings.trailColorGradient && (
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Start Color</span>
                            <input
                              type="color"
                              value={settings.trailStartColor}
                              onChange={(e) => setSetting('trailStartColor', e.target.value)}
                              className="w-8 h-6 rounded cursor-pointer border border-border/30"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">End Color</span>
                            <input
                              type="color"
                              value={settings.trailEndColor}
                              onChange={(e) => setSetting('trailEndColor', e.target.value)}
                              className="w-8 h-6 rounded cursor-pointer border border-border/30"
                            />
                          </div>
                          <div className="h-2 rounded-full w-full" style={{
                            background: `linear-gradient(to right, ${settings.trailStartColor}, ${settings.trailEndColor})`
                          }} />
                        </div>
                      )}
                    </>
                  )}
                </CollapsibleSection>

                {/* Mouse Interaction */}
                <CollapsibleSection
                  title="Mouse Interaction"
                  icon={<MousePointer className="w-4 h-4 text-rose-400" />}
                  color="rose"
                >
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs text-foreground">Enable Mouse</span>
                    <button
                      onClick={() => setSetting('enableMouseInteraction', !settings.enableMouseInteraction)}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        settings.enableMouseInteraction
                          ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                          : 'bg-muted/20 border border-border/30 text-muted-foreground'
                      }`}
                    >
                      {settings.enableMouseInteraction ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {settings.enableMouseInteraction && (
                    <>
                      <div className="flex gap-2 pb-2">
                        <button
                          onClick={() => setSetting('mouseMode', 'attract')}
                          className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            settings.mouseMode === 'attract'
                              ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                              : 'bg-muted/20 border border-border/30 text-muted-foreground'
                          }`}
                        >
                          🧲 Attract
                        </button>
                        <button
                          onClick={() => setSetting('mouseMode', 'repulse')}
                          className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            settings.mouseMode === 'repulse'
                              ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                              : 'bg-muted/20 border border-border/30 text-muted-foreground'
                          }`}
                        >
                          💨 Repulse
                        </button>
                      </div>
                      <SliderControl label="Strength" value={settings.mouseStrength} onChange={(v) => setSetting('mouseStrength', v)} min={0.1} max={2} step={0.05} color="rose" decimals={2} />
                      <SliderControl label="Influence Radius" value={settings.mouseInfluenceRadius} onChange={(v) => setSetting('mouseInfluenceRadius', v)} min={1} max={5} step={0.1} color="rose" decimals={1} />
                    </>
                  )}
                </CollapsibleSection>

                {/* Particles */}
                <CollapsibleSection
                  title="Particles"
                  icon={<Layers className="w-4 h-4 text-purple-400" />}
                  color="purple"
                >
                  <SliderControl label="Particle Count" value={settings.particleCount} onChange={(v) => setSetting('particleCount', v)} min={500} max={20000} step={500} color="purple" />
                  <SliderControl label="Particle Size" value={settings.particleSize} onChange={(v) => setSetting('particleSize', v)} min={0.02} max={0.2} step={0.01} color="purple" decimals={2} />
                  <SliderControl label="Density" value={settings.density} onChange={(v) => setSetting('density', v)} min={0.3} max={2} step={0.05} color="purple" decimals={2} />
                </CollapsibleSection>

                {/* Fluid Dynamics */}
                <CollapsibleSection
                  title="Fluid Dynamics"
                  icon={<Droplets className="w-4 h-4 text-sky-400" />}
                  color="sky"
                >
                  <SliderControl label="Cohesion" value={settings.fluidCohesion} onChange={(v) => setSetting('fluidCohesion', v)} min={0} max={1} step={0.01} color="sky" decimals={2} />
                  <SliderControl label="Surface Tension" value={settings.surfaceTension} onChange={(v) => setSetting('surfaceTension', v)} min={0} max={1} step={0.05} color="sky" decimals={2} />
                  <SliderControl label="Flow Speed" value={settings.fluidFlow} onChange={(v) => setSetting('fluidFlow', v)} min={0} max={1} step={0.05} color="sky" decimals={2} />
                </CollapsibleSection>
              </>
            )}

            {/* ==================== ANIMATION ==================== */}
            <CollapsibleSection
              title="Animation"
              icon={<Settings2 className="w-4 h-4 text-cyan-400" />}
              color="cyan"
            >
              <SliderControl label="Morph Progress" value={settings.morphProgress} onChange={(v) => setSetting('morphProgress', v)} min={0} max={1} step={0.01} color="amber" decimals={2} hint={['Scattered', 'Sphere']} />
              <SliderControl label="Morph Speed" value={settings.morphSpeed} onChange={(v) => setSetting('morphSpeed', v)} min={0.5} max={5} step={0.1} color="amber" decimals={1} />
              <SliderControl label="Rotation Speed" value={settings.rotationSpeed} onChange={(v) => setSetting('rotationSpeed', v)} min={0} max={2} step={0.05} color="cyan" decimals={2} />
            </CollapsibleSection>

            {/* ==================== EFFECTS ==================== */}
            <CollapsibleSection
              title="Effects"
              icon={<Sparkles className="w-4 h-4 text-pink-400" />}
              color="pink"
            >
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs text-foreground">Bloom Effect</span>
                <button
                  onClick={() => setSetting('enableBloom', !settings.enableBloom)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    settings.enableBloom
                      ? 'bg-pink-500/20 border border-pink-500/50 text-pink-300'
                      : 'bg-muted/20 border border-border/30 text-muted-foreground'
                  }`}
                >
                  {settings.enableBloom ? 'ON' : 'OFF'}
                </button>
              </div>
              {settings.enableBloom && (
                <SliderControl label="Bloom Intensity" value={settings.bloomIntensity} onChange={(v) => setSetting('bloomIntensity', v)} min={0} max={2} step={0.05} color="pink" decimals={2} />
              )}
            </CollapsibleSection>
          </div>
        </motion.aside>
      </div>

      {/* Save Preset Modal */}
      <AnimatePresence>
        {showSavePresetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSavePresetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background/95 border border-border/50 rounded-2xl p-6 w-full max-w-md mx-4 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Save Preset</h3>
                <button
                  onClick={() => setShowSavePresetModal(false)}
                  className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Preset Name</label>
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="My Awesome Preset"
                    className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Description (optional)</label>
                  <input
                    type="text"
                    value={newPresetDescription}
                    onChange={(e) => setNewPresetDescription(e.target.value)}
                    placeholder="Brief description..."
                    className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {presetIcons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setSelectedPresetIcon(icon)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                          selectedPresetIcon === icon
                            ? 'bg-violet-500/30 border border-violet-500/50'
                            : 'bg-muted/20 border border-border/30 hover:border-border/50'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSavePresetModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-muted/30 border border-border/30 hover:border-border/50 text-muted-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreset}
                  className="flex-1 px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-500/50 hover:bg-violet-500/30 text-violet-300 transition-all"
                >
                  Save Preset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
