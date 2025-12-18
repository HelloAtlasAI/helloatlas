import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Sparkles, Zap, Settings2, Layers, Waves, Wind, MousePointer, Save, Download, Upload, Disc, Droplets, Orbit, Plus, Trash2, X } from 'lucide-react';
import { AtlasSphere } from '@/components/atlas';
import { WakeWordState } from '@/hooks/useWakeWord';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useAtlasSettings, defaultAtlasSettings, AtlasSettings } from '@/hooks/useAtlasSettings';
import { useAtlasPresets, AtlasPreset } from '@/hooks/useAtlasPresets';

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
  const { settings, setSetting, setMultiple, reset, exportSettings, importSettings } = useAtlasSettings();
  
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
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Visual Controls</h2>
              <p className="text-sm text-muted-foreground">Adjust parameters to see how Atlas Core responds to different states and inputs.</p>
            </div>

            {/* Visualization Mode Toggle */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                <Orbit className="w-4 h-4 text-violet-400" />
                Visualization Mode
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSetting('visualizationMode', 'classic')}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    settings.visualizationMode === 'classic'
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-300'
                      : 'bg-muted/20 border border-border/30 hover:border-border/50 text-muted-foreground'
                  }`}
                >
                  🔥 Classic
                </button>
                <button
                  onClick={() => setSetting('visualizationMode', 'nebulaFlow')}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    settings.visualizationMode === 'nebulaFlow'
                      ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/50 text-violet-300'
                      : 'bg-muted/20 border border-border/30 hover:border-border/50 text-muted-foreground'
                  }`}
                >
                  🌌 Nebula Flow
                </button>
              </div>
              
              {/* View Mode Toggles */}
              <div className="grid grid-cols-2 gap-2">
                {/* Dashboard Preview Toggle */}
                <button
                  onClick={() => {
                    setSetting('dashboardPreview', !settings.dashboardPreview);
                    if (!settings.dashboardPreview) setSetting('comparisonView', false);
                  }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                    settings.dashboardPreview && !settings.comparisonView
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                      : 'bg-muted/20 border border-border/30 hover:border-border/50 text-muted-foreground'
                  }`}
                >
                  <span className="text-xs font-medium">📱 Dashboard</span>
                  <span className="text-[10px] opacity-70">140px</span>
                </button>
                
                {/* Comparison View Toggle */}
                <button
                  onClick={() => {
                    setSetting('comparisonView', !settings.comparisonView);
                    if (!settings.comparisonView) setSetting('dashboardPreview', false);
                  }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                    settings.comparisonView
                      ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300'
                      : 'bg-muted/20 border border-border/30 hover:border-border/50 text-muted-foreground'
                  }`}
                >
                  <span className="text-xs font-medium">📊 Compare</span>
                  <span className="text-[10px] opacity-70">Side-by-side</span>
                </button>
              </div>
              
              {/* Dashboard indicator */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs text-primary">Synced with Dashboard</span>
                </div>
                <span className="text-xs text-primary/70 font-medium">
                  {settings.visualizationMode === 'classic' ? '🔥 Classic' : '🌌 Nebula'}
                </span>
              </div>
            </div>

            {/* Nebula Flow Controls - only show when in nebulaFlow mode */}
            {settings.visualizationMode === 'nebulaFlow' && (
              <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
                <h3 className="text-sm font-medium text-violet-300 uppercase tracking-wider flex items-center gap-2">
                  🌌 Nebula Flow Settings
                </h3>
                
                {/* Presets - Dynamic from useAtlasPresets */}
                <div className="space-y-2 pb-3 border-b border-violet-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-violet-300 font-medium">Quick Presets</span>
                    <button
                      onClick={() => setShowSavePresetModal(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 text-[10px] transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Save Current
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                    {allPresets.filter(p => p.settings.visualizationMode === 'nebulaFlow' || !p.settings.visualizationMode).map((preset) => (
                      <div key={preset.id} className="group relative">
                        <button
                          onClick={() => handleApplyPreset(preset)}
                          className="w-full px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 hover:border-violet-500/40 text-violet-200 text-xs transition-all text-left"
                        >
                          <span className="mr-1">{preset.icon}</span>
                          <span className="truncate">{preset.name}</span>
                        </button>
                        {!isBuiltIn(preset.id) && (
                          <button
                            onClick={() => handleDeletePreset(preset)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* State Reactive Toggle */}
                <div className="flex items-center justify-between pb-3 border-b border-violet-500/20">
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
                <div className="space-y-3">
                  <span className="text-xs text-violet-300 font-medium">Particle Configuration</span>
                  <SliderControl label="Particle Count" value={settings.nebulaParticleCount} onChange={(v) => setSetting('nebulaParticleCount', v)} min={3000} max={50000} step={1000} color="violet" hint={['Light', '50K']} />
                  <SliderControl label="Particle Size" value={settings.nebulaParticleSize} onChange={(v) => setSetting('nebulaParticleSize', v)} min={0.02} max={0.12} step={0.005} color="violet" decimals={3} />
                  <SliderControl label="Density" value={settings.nebulaDensity} onChange={(v) => setSetting('nebulaDensity', v)} min={0.5} max={2} step={0.05} color="violet" decimals={2} />
                  <SliderControl label="Rotation Speed" value={settings.nebulaRotationSpeed} onChange={(v) => setSetting('nebulaRotationSpeed', v)} min={0} max={1} step={0.05} color="violet" decimals={2} />
                </div>
                
                {/* Flow Settings */}
                <div className="space-y-3 pt-2 border-t border-violet-500/20">
                  <span className="text-xs text-violet-300 font-medium">Flow Dynamics</span>
                  <SliderControl label="Flow Strength" value={settings.nebulaFlowStrength} onChange={(v) => setSetting('nebulaFlowStrength', v)} min={0} max={1} step={0.05} color="violet" decimals={2} hint={['Subtle', 'Strong']} />
                  <SliderControl label="Flow Speed" value={settings.nebulaFlowSpeed} onChange={(v) => setSetting('nebulaFlowSpeed', v)} min={0.1} max={2} step={0.1} color="violet" decimals={1} />
                  <SliderControl label="Band Count" value={settings.nebulaBandCount} onChange={(v) => setSetting('nebulaBandCount', v)} min={3} max={16} step={1} color="violet" />
                </div>
                
                {/* Quality & Effects */}
                <div className="space-y-3 pt-2 border-t border-violet-500/20">
                  <span className="text-xs text-cyan-300 font-medium">Quality & Effects</span>
                  <SliderControl label="Glow Intensity" value={settings.nebulaGlowIntensity} onChange={(v) => setSetting('nebulaGlowIntensity', v)} min={0.3} max={2} step={0.1} color="cyan" decimals={1} hint={['Subtle', 'Bright']} />
                  <SliderControl label="Core Glow" value={settings.nebulaCoreGlow} onChange={(v) => setSetting('nebulaCoreGlow', v)} min={0} max={2} step={0.1} color="cyan" decimals={1} />
                  <SliderControl label="Rim Intensity" value={settings.nebulaRimIntensity} onChange={(v) => setSetting('nebulaRimIntensity', v)} min={0} max={3} step={0.1} color="cyan" decimals={1} />
                  <SliderControl label="Hot Spot Intensity" value={settings.nebulaHotSpotIntensity} onChange={(v) => setSetting('nebulaHotSpotIntensity', v)} min={0} max={2} step={0.1} color="cyan" decimals={1} />
                  <SliderControl label="Depth Fade" value={settings.nebulaDepthFade} onChange={(v) => setSetting('nebulaDepthFade', v)} min={0} max={1} step={0.05} color="cyan" decimals={2} />
                </div>
                
                {/* Breathing */}
                <div className="space-y-3 pt-2 border-t border-violet-500/20">
                  <span className="text-xs text-indigo-300 font-medium">Breathing Animation</span>
                  <SliderControl label="Breathing Speed" value={settings.nebulaBreathingSpeed} onChange={(v) => setSetting('nebulaBreathingSpeed', v)} min={0.1} max={2} step={0.1} color="indigo" decimals={1} />
                  <SliderControl label="Breathing Amount" value={settings.nebulaBreathingAmount} onChange={(v) => setSetting('nebulaBreathingAmount', v)} min={0} max={0.2} step={0.01} color="indigo" decimals={2} />
                  <SliderControl label="Radius Noise" value={settings.nebulaRadiusNoise} onChange={(v) => setSetting('nebulaRadiusNoise', v)} min={0} max={0.4} step={0.02} color="indigo" decimals={2} hint={['Smooth', 'Organic']} />
                </div>
                
                {/* Solid Surface Mode */}
                <div className="space-y-3 pt-2 border-t border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-300 font-medium">Solid Surface Mode</span>
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
                      <SliderControl label="Surface Blend" value={settings.nebulaSurfaceBlend} onChange={(v) => setSetting('nebulaSurfaceBlend', v)} min={0.5} max={3} step={0.1} color="emerald" decimals={1} hint={['Sharp', 'Smooth']} />
                      <SliderControl label="Uniform Size" value={settings.nebulaUniformSize} onChange={(v) => setSetting('nebulaUniformSize', v)} min={1} max={3} step={0.1} color="emerald" decimals={1} hint={['Small', 'Large']} />
                      <SliderControl label="Coherence" value={settings.nebulaCoherence} onChange={(v) => setSetting('nebulaCoherence', v)} min={0} max={1} step={0.05} color="emerald" decimals={2} hint={['Varied', 'Unified']} />
                    </>
                  )}
                </div>
                
                {/* State Behaviors */}
                <div className="space-y-3 pt-2 border-t border-amber-500/20">
                  <span className="text-xs text-amber-300 font-medium">State Behaviors</span>
                  <div className="text-[10px] text-muted-foreground space-y-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>Speaking: Audio-reactive pulse</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span>Thinking: Core retraction</span>
                    </div>
                  </div>
                  <SliderControl label="Transition Speed" value={settings.nebulaTransitionSpeed} onChange={(v) => setSetting('nebulaTransitionSpeed', v)} min={0.5} max={3} step={0.1} color="cyan" decimals={1} hint={['Slow', 'Fast']} />
                  <SliderControl label="Thinking Retraction" value={settings.nebulaThinkingRetraction} onChange={(v) => setSetting('nebulaThinkingRetraction', v)} min={0} max={0.5} step={0.05} color="violet" decimals={2} hint={['None', 'Deep']} />
                  <SliderControl label="Audio Breathing" value={settings.nebulaAudioBreathingIntensity} onChange={(v) => setSetting('nebulaAudioBreathingIntensity', v)} min={0} max={0.4} step={0.02} color="amber" decimals={2} hint={['Subtle', 'Strong']} />
                </div>
                
                {/* Color Pickers - only show in manual mode */}
                {!settings.nebulaStateReactive && (
                  <div className="space-y-3 pt-2 border-t border-violet-500/20">
                    <span className="text-xs text-muted-foreground">Manual Gradient Colors</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Start</label>
                        <input
                          type="color"
                          value={settings.nebulaColorStart}
                          onChange={(e) => setSetting('nebulaColorStart', e.target.value)}
                          className="w-full h-8 rounded cursor-pointer border border-border/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Mid</label>
                        <input
                          type="color"
                          value={settings.nebulaColorMid}
                          onChange={(e) => setSetting('nebulaColorMid', e.target.value)}
                          className="w-full h-8 rounded cursor-pointer border border-border/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">End</label>
                        <input
                          type="color"
                          value={settings.nebulaColorEnd}
                          onChange={(e) => setSetting('nebulaColorEnd', e.target.value)}
                          className="w-full h-8 rounded cursor-pointer border border-border/30"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preset Configurations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Presets
                </h3>
                {activePreset && (
                  <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    {activePreset}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {presets.map((preset) => (
                  <motion.button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-2.5 rounded-xl text-left transition-all ${
                      activePreset === preset.name
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 ring-1 ring-amber-500/30'
                        : `bg-gradient-to-r ${preset.gradient} border border-border/30 hover:border-border/50`
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm">{preset.icon}</span>
                      <span className="text-xs font-medium text-foreground truncate">{preset.name}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{preset.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Quick Actions</h3>
              <div className="flex gap-2">
                <button
                  onClick={startStateAnimation}
                  disabled={isAnimating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all disabled:opacity-50"
                >
                  {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="text-sm">{isAnimating ? 'Playing...' : 'Cycle States'}</span>
                </button>
                <button
                  onClick={resetToDefaults}
                  className="px-4 py-2.5 rounded-xl bg-muted/30 border border-border/30 hover:border-border/50 transition-all"
                  title="Reset to defaults"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={clearCacheAndReload}
                className="w-full mt-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 hover:border-red-500/50 text-red-400 text-xs transition-all"
              >
                Clear Saved Settings & Reload
              </button>
            </div>

            {/* Performance Mode */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-400" />
                Performance Mode
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(performancePresets) as PerformanceMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => applyPerformanceMode(mode)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      performanceMode === mode
                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                        : 'bg-muted/30 border border-border/30 hover:border-border/50 text-muted-foreground'
                    }`}
                  >
                    {performancePresets[mode].label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {performanceMode === 'performance' && '~2K particles, no trails/bloom for smooth 60fps'}
                {performanceMode === 'balanced' && '~5K particles, shorter trails, bloom enabled'}
                {performanceMode === 'quality' && '~12K particles, full trails, all effects enabled'}
              </p>
            </div>

            {/* AI State Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider">AI State</h3>
              <div className="grid grid-cols-2 gap-2">
                {states.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSetting('state', s);
                      setActivePreset(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      settings.state === s
                        ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-500/50 text-amber-300'
                        : 'bg-muted/20 border border-border/30 hover:border-border/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stateDescriptions[s].color}`} />
                      {stateDescriptions[s].label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Core Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                  <Disc className="w-4 h-4 text-orange-400" />
                  Core Particles
                </h3>
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
                  <SliderControl label="Core Particle Count" value={settings.coreParticleCount} onChange={(v) => setSetting('coreParticleCount', v)} min={100} max={1000} step={50} color="orange" />
                  <SliderControl label="Core Density" value={settings.coreDensity} onChange={(v) => setSetting('coreDensity', v)} min={0.1} max={0.6} step={0.02} color="orange" decimals={2} hint={['Tight', 'Spread']} />
                  <SliderControl label="Core Particle Size" value={settings.coreParticleSize} onChange={(v) => setSetting('coreParticleSize', v)} min={0.02} max={0.1} step={0.005} color="orange" decimals={2} />
                  <SliderControl label="Core Intensity" value={settings.coreIntensity} onChange={(v) => setSetting('coreIntensity', v)} min={0.5} max={2.0} step={0.1} color="orange" decimals={1} />
                  <SliderControl label="Core Pulse Speed" value={settings.corePulseSpeed} onChange={(v) => setSetting('corePulseSpeed', v)} min={0.5} max={3.0} step={0.1} color="orange" decimals={1} />
                  <SliderControl label="Core Rotation" value={settings.coreRotationOffset} onChange={(v) => setSetting('coreRotationOffset', v)} min={-2} max={2} step={0.1} color="orange" decimals={1} hint={['Counter', 'Same']} />
                </>
              )}
            </div>

            {/* Ring Ripples Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                  <Waves className="w-4 h-4 text-teal-400" />
                  Ring Ripples
                </h3>
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
                  <SliderControl label="Ripple Speed" value={settings.rippleSpeed} onChange={(v) => setSetting('rippleSpeed', v)} min={0.5} max={3} step={0.1} color="teal" decimals={1} />
                  <SliderControl label="Ripples per Change" value={settings.rippleCount} onChange={(v) => setSetting('rippleCount', v)} min={1} max={5} step={1} color="teal" />
                </>
              )}
            </div>

            {/* Turbulence Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                  <Wind className="w-4 h-4 text-emerald-400" />
                  Turbulence
                </h3>
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
                  <SliderControl label="Frequency" value={settings.turbulenceFrequency} onChange={(v) => setSetting('turbulenceFrequency', v)} min={0.1} max={2} step={0.05} color="emerald" decimals={2} hint={['Smooth', 'Chunky']} />
                  <SliderControl label="Amplitude" value={settings.turbulenceAmplitude} onChange={(v) => setSetting('turbulenceAmplitude', v)} min={0.01} max={0.3} step={0.01} color="emerald" decimals={2} hint={['Subtle', 'Strong']} />
                  <SliderControl label="Speed" value={settings.turbulenceSpeed} onChange={(v) => setSetting('turbulenceSpeed', v)} min={0.1} max={1} step={0.05} color="emerald" decimals={2} />
                </>
              )}
            </div>

            {/* Fluid Dynamics Controls */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-400" />
                Fluid Dynamics
              </h3>
              <SliderControl label="Cohesion" value={settings.fluidCohesion} onChange={(v) => setSetting('fluidCohesion', v)} min={0} max={1} step={0.01} color="sky" decimals={2} hint={['Scattered', 'Solid']} />
              <SliderControl label="Surface Tension" value={settings.surfaceTension} onChange={(v) => setSetting('surfaceTension', v)} min={0} max={1} step={0.05} color="sky" decimals={2} />
              <SliderControl label="Flow Speed" value={settings.fluidFlow} onChange={(v) => setSetting('fluidFlow', v)} min={0} max={1} step={0.05} color="sky" decimals={2} />
            </div>

            {/* Mouse Interaction Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-rose-400" />
                  Mouse Interaction
                </h3>
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSetting('mouseMode', 'attract')}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        settings.mouseMode === 'attract'
                          ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                          : 'bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      🧲 Attract
                    </button>
                    <button
                      onClick={() => setSetting('mouseMode', 'repulse')}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        settings.mouseMode === 'repulse'
                          ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                          : 'bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      💨 Repulse
                    </button>
                  </div>
                  <SliderControl label="Strength" value={settings.mouseStrength} onChange={(v) => setSetting('mouseStrength', v)} min={0.1} max={2} step={0.05} color="rose" decimals={2} />
                  <SliderControl label="Influence Radius" value={settings.mouseInfluenceRadius} onChange={(v) => setSetting('mouseInfluenceRadius', v)} min={1} max={5} step={0.1} color="rose" decimals={1} />
                </>
              )}
            </div>

            {/* Animation Controls */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                Animation
              </h3>
              <SliderControl label="Morph Progress" value={settings.morphProgress} onChange={(v) => setSetting('morphProgress', v)} min={0} max={1} step={0.01} color="amber" decimals={2} hint={['Scattered', 'Sphere']} />
              <SliderControl label="Morph Speed" value={settings.morphSpeed} onChange={(v) => setSetting('morphSpeed', v)} min={0.5} max={5} step={0.1} color="amber" decimals={1} />
              <SliderControl label="Rotation Speed" value={settings.rotationSpeed} onChange={(v) => setSetting('rotationSpeed', v)} min={0} max={2} step={0.05} color="cyan" decimals={2} />
            </div>

            {/* Particle Controls */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Particles
              </h3>
              <SliderControl label="Particle Count" value={settings.particleCount} onChange={(v) => setSetting('particleCount', v)} min={500} max={20000} step={500} color="purple" />
              <SliderControl label="Particle Size" value={settings.particleSize} onChange={(v) => setSetting('particleSize', v)} min={0.02} max={0.2} step={0.01} color="purple" decimals={2} />
              <SliderControl label="Density" value={settings.density} onChange={(v) => setSetting('density', v)} min={0.3} max={2} step={0.05} color="purple" decimals={2} hint={['Tight', 'Spread']} />
            </div>

            {/* Audio Level */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Audio Level</h3>
                <span className="text-sm font-mono text-cyan-400">{settings.audioLevel.toFixed(2)}</span>
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
              <SliderControl label="Reactivity Speed" value={settings.audioReactivitySpeed} onChange={(v) => setSetting('audioReactivitySpeed', v)} min={0.2} max={3.0} step={0.1} color="cyan" decimals={1} hint={['Slow', 'Fast']} suffix="x" />
            </div>

            {/* Effects Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Bloom Effect</h3>
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
            </div>

            {/* Trail Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Particle Trails</h3>
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

                  {/* Color Gradient Toggle */}
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
                    <div className="space-y-3 pt-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Start Color (Bright)</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={settings.trailStartColor}
                              onChange={(e) => setSetting('trailStartColor', e.target.value)}
                              className="w-6 h-6 rounded cursor-pointer border border-border/30"
                            />
                            <span className="text-xs font-mono text-amber-400">{settings.trailStartColor}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">End Color (Dark)</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={settings.trailEndColor}
                              onChange={(e) => setSetting('trailEndColor', e.target.value)}
                              className="w-6 h-6 rounded cursor-pointer border border-border/30"
                            />
                            <span className="text-xs font-mono text-purple-400">{settings.trailEndColor}</span>
                          </div>
                        </div>
                      </div>

                      {/* Gradient Preview */}
                      <div className="h-3 rounded-full w-full" style={{
                        background: `linear-gradient(to right, ${settings.trailStartColor}, ${settings.trailEndColor})`
                      }} />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Info Panel */}
            <div className="p-4 rounded-xl bg-muted/10 border border-border/20 space-y-3">
              <h3 className="text-sm font-medium text-foreground/80">About Atlas Core</h3>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  <span>Particle-based core with independent rotation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400">•</span>
                  <span>Ring ripples expand on state changes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>Perlin noise turbulence for organic movement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400">•</span>
                  <span>Mouse interaction with attract/repulse modes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Morphing particle trails that follow the animation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Settings auto-save to localStorage</span>
                </li>
              </ul>
            </div>
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

// Reusable Slider Control Component
interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  color: string;
  decimals?: number;
  hint?: [string, string];
  suffix?: string;
}

function SliderControl({ label, value, onChange, min, max, step, color, decimals = 0, hint, suffix = '' }: SliderControlProps) {
  // Safeguard against undefined values from old localStorage settings
  const safeValue = typeof value === 'number' ? value : min;
  const displayValue = decimals > 0 ? safeValue.toFixed(decimals) : safeValue;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-xs font-mono text-${color}-400`}>{displayValue}{suffix}</span>
      </div>
      <Slider
        value={[safeValue]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      {hint && (
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{hint[0]}</span>
          <span>{hint[1]}</span>
        </div>
      )}
    </div>
  );
}
