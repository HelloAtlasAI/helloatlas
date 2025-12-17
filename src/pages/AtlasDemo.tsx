import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Sparkles, Zap, Settings2, Layers, Waves, Wind, MousePointer, Save, Download, Upload, Disc, Droplets } from 'lucide-react';
import { AtlasCoreFixed } from '@/components/dashboard/AtlasCoreFixed';
import { WakeWordState } from '@/hooks/useWakeWord';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

const STORAGE_KEY = 'atlas-demo-settings';

// Settings interface for persistence
interface AtlasDemoSettings {
  state: WakeWordState;
  morphProgress: number;
  audioLevel: number;
  autoAudio: boolean;
  enableTrails: boolean;
  trailLength: number;
  trailOpacity: number;
  trailColorGradient: boolean;
  trailStartColor: string;
  trailEndColor: string;
  particleCount: number;
  particleSize: number;
  density: number;
  rotationSpeed: number;
  enableBloom: boolean;
  bloomIntensity: number;
  morphSpeed: number;
  enableRipples: boolean;
  rippleSpeed: number;
  rippleCount: number;
  enableTurbulence: boolean;
  turbulenceFrequency: number;
  turbulenceAmplitude: number;
  turbulenceSpeed: number;
  enableMouseInteraction: boolean;
  mouseMode: 'attract' | 'repulse';
  mouseStrength: number;
  mouseInfluenceRadius: number;
  // Core settings
  enableCore: boolean;
  coreParticleCount: number;
  coreDensity: number;
  coreParticleSize: number;
  coreIntensity: number;
  corePulseSpeed: number;
  coreRotationOffset: number;
  // Fluid dynamics settings
  fluidCohesion: number;
  surfaceTension: number;
  fluidFlow: number;
  // Audio reactivity settings
  audioReactivitySpeed: number;
}

// Performance presets
type PerformanceMode = 'performance' | 'balanced' | 'quality';

// Optimized for 460px sphere
const performancePresets: Record<PerformanceMode, { particleCount: number; trailLength: number; enableBloom: boolean; coreParticleCount: number; density: number; particleSize: number; label: string }> = {
  performance: { particleCount: 2500, trailLength: 0, enableBloom: false, coreParticleCount: 200, density: 0.9, particleSize: 0.07, label: 'Performance' },
  balanced: { particleCount: 5200, trailLength: 2, enableBloom: true, coreParticleCount: 350, density: 0.98, particleSize: 0.065, label: 'Balanced' },
  quality: { particleCount: 8000, trailLength: 4, enableBloom: true, coreParticleCount: 500, density: 1.0, particleSize: 0.06, label: 'Quality' },
};

// Optimized defaults for 460px sphere
const defaultSettings: AtlasDemoSettings = {
  state: 'dormant',
  morphProgress: 0.2,
  audioLevel: 0,
  autoAudio: false,
  enableTrails: true,
  trailLength: 2,
  trailOpacity: 0.5,
  trailColorGradient: true,
  trailStartColor: '#ff9500',
  trailEndColor: '#1a0a2e',
  particleCount: 5200,       // Optimized for 460px
  particleSize: 0.065,       // Balanced size for density
  density: 0.98,             // High density for fuller sphere
  rotationSpeed: 0.5,
  enableBloom: true,
  bloomIntensity: 0.8,
  morphSpeed: 1.5,
  enableRipples: true,
  rippleSpeed: 1.5,
  rippleCount: 2,
  enableTurbulence: true,
  turbulenceFrequency: 0.5,
  turbulenceAmplitude: 0.08,
  turbulenceSpeed: 0.3,
  enableMouseInteraction: true,
  mouseMode: 'attract',
  mouseStrength: 0.5,
  mouseInfluenceRadius: 2.5,
  enableCore: true,
  coreParticleCount: 300,
  coreDensity: 0.25,
  coreParticleSize: 0.04,
  coreIntensity: 1.2,
  corePulseSpeed: 1.5,
  coreRotationOffset: -0.5,
  fluidCohesion: 0,
  surfaceTension: 0.5,
  fluidFlow: 0.3,
  audioReactivitySpeed: 1.0,
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
  {
    name: 'Idle Ambient',
    description: 'Calm, scattered particles drifting peacefully',
    state: 'dormant',
    morphProgress: 0.15,
    audioLevel: 0,
    autoAudio: false,
    icon: '🌙',
    gradient: 'from-slate-500/20 to-slate-600/20',
  },
  {
    name: 'Awaiting Input',
    description: 'Gentle sphere formation, ready to listen',
    state: 'passive',
    morphProgress: 0.5,
    audioLevel: 0.05,
    autoAudio: false,
    icon: '👂',
    gradient: 'from-orange-500/20 to-amber-500/20',
  },
  {
    name: 'Wake Word Detected',
    description: 'Bright activation burst, particles converge',
    state: 'activated',
    morphProgress: 1.0,
    audioLevel: 0.3,
    autoAudio: false,
    icon: '⚡',
    gradient: 'from-yellow-400/20 to-amber-400/20',
  },
  {
    name: 'Active Listening',
    description: 'Cyan vortex formation, audio-reactive',
    state: 'listening',
    morphProgress: 1.0,
    audioLevel: 0.4,
    autoAudio: true,
    icon: '🎙️',
    gradient: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    name: 'Deep Processing',
    description: 'Purple pulsing sphere, rapid internal rotation',
    state: 'thinking',
    morphProgress: 1.0,
    audioLevel: 0.2,
    autoAudio: false,
    icon: '🧠',
    gradient: 'from-purple-500/20 to-violet-500/20',
  },
  {
    name: 'Speaking Response',
    description: 'Gold ripples emanating with voice output',
    state: 'speaking',
    morphProgress: 1.0,
    audioLevel: 0.6,
    autoAudio: true,
    icon: '🔊',
    gradient: 'from-amber-400/20 to-orange-400/20',
  },
  {
    name: 'Scattered Chaos',
    description: 'Maximum dispersion with audio reactivity',
    state: 'passive',
    morphProgress: 0.0,
    audioLevel: 0.8,
    autoAudio: true,
    icon: '🌀',
    gradient: 'from-red-500/20 to-pink-500/20',
  },
  {
    name: 'Perfect Sphere',
    description: 'Tight formation, minimal movement',
    state: 'listening',
    morphProgress: 1.0,
    audioLevel: 0.0,
    autoAudio: false,
    icon: '🔮',
    gradient: 'from-teal-500/20 to-cyan-500/20',
  },
];

export default function AtlasDemo() {
  const [state, setState] = useState<WakeWordState>(defaultSettings.state);
  const [morphProgress, setMorphProgress] = useState(defaultSettings.morphProgress);
  const [audioLevel, setAudioLevel] = useState(defaultSettings.audioLevel);
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoAudio, setAutoAudio] = useState(defaultSettings.autoAudio);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('balanced');
  
  // Trail controls
  const [enableTrails, setEnableTrails] = useState(defaultSettings.enableTrails);
  const [trailLength, setTrailLength] = useState(defaultSettings.trailLength);
  const [trailOpacity, setTrailOpacity] = useState(defaultSettings.trailOpacity);
  const [trailColorGradient, setTrailColorGradient] = useState(defaultSettings.trailColorGradient);
  const [trailStartColor, setTrailStartColor] = useState(defaultSettings.trailStartColor);
  const [trailEndColor, setTrailEndColor] = useState(defaultSettings.trailEndColor);
  
  // Particle controls
  const [particleCount, setParticleCount] = useState(defaultSettings.particleCount);
  const [particleSize, setParticleSize] = useState(defaultSettings.particleSize);
  const [density, setDensity] = useState(defaultSettings.density);
  const [rotationSpeed, setRotationSpeed] = useState(defaultSettings.rotationSpeed);
  
  // Effects controls
  const [enableBloom, setEnableBloom] = useState(defaultSettings.enableBloom);
  const [bloomIntensity, setBloomIntensity] = useState(defaultSettings.bloomIntensity);
  
  // Animation controls
  const [morphSpeed, setMorphSpeed] = useState(defaultSettings.morphSpeed);
  
  // Ring Ripple controls
  const [enableRipples, setEnableRipples] = useState(defaultSettings.enableRipples);
  const [rippleSpeed, setRippleSpeed] = useState(defaultSettings.rippleSpeed);
  const [rippleCount, setRippleCount] = useState(defaultSettings.rippleCount);
  
  // Turbulence controls
  const [enableTurbulence, setEnableTurbulence] = useState(defaultSettings.enableTurbulence);
  const [turbulenceFrequency, setTurbulenceFrequency] = useState(defaultSettings.turbulenceFrequency);
  const [turbulenceAmplitude, setTurbulenceAmplitude] = useState(defaultSettings.turbulenceAmplitude);
  const [turbulenceSpeed, setTurbulenceSpeed] = useState(defaultSettings.turbulenceSpeed);
  
  // Mouse Interaction controls
  const [enableMouseInteraction, setEnableMouseInteraction] = useState(defaultSettings.enableMouseInteraction);
  const [mouseMode, setMouseMode] = useState<'attract' | 'repulse'>(defaultSettings.mouseMode);
  const [mouseStrength, setMouseStrength] = useState(defaultSettings.mouseStrength);
  const [mouseInfluenceRadius, setMouseInfluenceRadius] = useState(defaultSettings.mouseInfluenceRadius);
  
  // Core controls
  const [enableCore, setEnableCore] = useState(defaultSettings.enableCore);
  const [coreParticleCount, setCoreParticleCount] = useState(defaultSettings.coreParticleCount);
  const [coreDensity, setCoreDensity] = useState(defaultSettings.coreDensity);
  const [coreParticleSize, setCoreParticleSize] = useState(defaultSettings.coreParticleSize);
  const [coreIntensity, setCoreIntensity] = useState(defaultSettings.coreIntensity);
  const [corePulseSpeed, setCorePulseSpeed] = useState(defaultSettings.corePulseSpeed);
  const [coreRotationOffset, setCoreRotationOffset] = useState(defaultSettings.coreRotationOffset);
  
  // Fluid dynamics controls
  const [fluidCohesion, setFluidCohesion] = useState(defaultSettings.fluidCohesion);
  const [surfaceTension, setSurfaceTension] = useState(defaultSettings.surfaceTension);
  const [fluidFlow, setFluidFlow] = useState(defaultSettings.fluidFlow);
  
  // Audio reactivity controls
  const [audioReactivitySpeed, setAudioReactivitySpeed] = useState(defaultSettings.audioReactivitySpeed);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings: AtlasDemoSettings = JSON.parse(saved);
        setState(settings.state);
        setMorphProgress(settings.morphProgress);
        setAudioLevel(settings.audioLevel);
        setAutoAudio(settings.autoAudio);
        setEnableTrails(settings.enableTrails);
        setTrailLength(settings.trailLength);
        setTrailOpacity(settings.trailOpacity);
        setParticleCount(settings.particleCount);
        setParticleSize(settings.particleSize);
        setDensity(settings.density);
        setRotationSpeed(settings.rotationSpeed);
        setEnableBloom(settings.enableBloom);
        setBloomIntensity(settings.bloomIntensity);
        setMorphSpeed(settings.morphSpeed);
        setEnableRipples(settings.enableRipples);
        setRippleSpeed(settings.rippleSpeed);
        setRippleCount(settings.rippleCount);
        setEnableTurbulence(settings.enableTurbulence);
        setTurbulenceFrequency(settings.turbulenceFrequency);
        setTurbulenceAmplitude(settings.turbulenceAmplitude);
        setTurbulenceSpeed(settings.turbulenceSpeed);
        setEnableMouseInteraction(settings.enableMouseInteraction);
        setMouseMode(settings.mouseMode);
        setMouseStrength(settings.mouseStrength);
        setMouseInfluenceRadius(settings.mouseInfluenceRadius);
        setEnableCore(settings.enableCore ?? defaultSettings.enableCore);
        setCoreParticleCount(settings.coreParticleCount ?? defaultSettings.coreParticleCount);
        setCoreDensity(settings.coreDensity ?? defaultSettings.coreDensity);
        setCoreParticleSize(settings.coreParticleSize ?? defaultSettings.coreParticleSize);
        setCoreIntensity(settings.coreIntensity ?? defaultSettings.coreIntensity);
        setCorePulseSpeed(settings.corePulseSpeed ?? defaultSettings.corePulseSpeed);
        setCoreRotationOffset(settings.coreRotationOffset ?? defaultSettings.coreRotationOffset);
        setFluidCohesion(settings.fluidCohesion ?? defaultSettings.fluidCohesion);
        setSurfaceTension(settings.surfaceTension ?? defaultSettings.surfaceTension);
        setFluidFlow(settings.fluidFlow ?? defaultSettings.fluidFlow);
        setAudioReactivitySpeed(settings.audioReactivitySpeed ?? defaultSettings.audioReactivitySpeed);
        toast.success('Settings restored');
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    setSettingsLoaded(true);
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (!settingsLoaded) return; // Don't save until initial load complete
    
    const settings: AtlasDemoSettings = {
      state,
      morphProgress,
      audioLevel,
      autoAudio,
      enableTrails,
      trailLength,
      trailOpacity,
      trailColorGradient,
      trailStartColor,
      trailEndColor,
      particleCount,
      particleSize,
      density,
      rotationSpeed,
      enableBloom,
      bloomIntensity,
      morphSpeed,
      enableRipples,
      rippleSpeed,
      rippleCount,
      enableTurbulence,
      turbulenceFrequency,
      turbulenceAmplitude,
      turbulenceSpeed,
      enableMouseInteraction,
      mouseMode,
      mouseStrength,
      mouseInfluenceRadius,
      enableCore,
      coreParticleCount,
      coreDensity,
      coreParticleSize,
      coreIntensity,
      corePulseSpeed,
      coreRotationOffset,
      fluidCohesion,
      surfaceTension,
      fluidFlow,
      audioReactivitySpeed,
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [
    settingsLoaded, state, morphProgress, audioLevel, autoAudio, enableTrails, trailLength, trailOpacity,
    particleCount, particleSize, density, rotationSpeed, enableBloom, bloomIntensity, morphSpeed,
    enableRipples, rippleSpeed, rippleCount, enableTurbulence, turbulenceFrequency, turbulenceAmplitude,
    turbulenceSpeed, enableMouseInteraction, mouseMode, mouseStrength, mouseInfluenceRadius,
    enableCore, coreParticleCount, coreDensity, coreParticleSize, coreIntensity, corePulseSpeed, coreRotationOffset,
    fluidCohesion, surfaceTension, fluidFlow, audioReactivitySpeed
  ]);

  // Export settings as JSON file
  const exportSettings = useCallback(() => {
    const settings: AtlasDemoSettings = {
      state, morphProgress, audioLevel, autoAudio, enableTrails, trailLength, trailOpacity,
      trailColorGradient, trailStartColor, trailEndColor,
      particleCount, particleSize, density, rotationSpeed, enableBloom, bloomIntensity, morphSpeed,
      enableRipples, rippleSpeed, rippleCount, enableTurbulence, turbulenceFrequency, turbulenceAmplitude,
      turbulenceSpeed, enableMouseInteraction, mouseMode, mouseStrength, mouseInfluenceRadius,
      enableCore, coreParticleCount, coreDensity, coreParticleSize, coreIntensity, corePulseSpeed, coreRotationOffset,
      fluidCohesion, surfaceTension, fluidFlow, audioReactivitySpeed
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported');
  }, [
    state, morphProgress, audioLevel, autoAudio, enableTrails, trailLength, trailOpacity,
    trailColorGradient, trailStartColor, trailEndColor,
    particleCount, particleSize, density, rotationSpeed, enableBloom, bloomIntensity, morphSpeed,
    enableRipples, rippleSpeed, rippleCount, enableTurbulence, turbulenceFrequency, turbulenceAmplitude,
    turbulenceSpeed, enableMouseInteraction, mouseMode, mouseStrength, mouseInfluenceRadius,
    enableCore, coreParticleCount, coreDensity, coreParticleSize, coreIntensity, corePulseSpeed, coreRotationOffset,
    fluidCohesion, surfaceTension, fluidFlow, audioReactivitySpeed
  ]);

  // Import settings from JSON file
  const importSettings = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const settings: AtlasDemoSettings = JSON.parse(ev.target?.result as string);
          setState(settings.state);
          setMorphProgress(settings.morphProgress);
          setAudioLevel(settings.audioLevel);
          setAutoAudio(settings.autoAudio);
          setEnableTrails(settings.enableTrails);
          setTrailLength(settings.trailLength);
          setTrailOpacity(settings.trailOpacity);
          setTrailColorGradient(settings.trailColorGradient ?? defaultSettings.trailColorGradient);
          setTrailStartColor(settings.trailStartColor ?? defaultSettings.trailStartColor);
          setTrailEndColor(settings.trailEndColor ?? defaultSettings.trailEndColor);
          setParticleCount(settings.particleCount);
          setParticleSize(settings.particleSize);
          setDensity(settings.density);
          setRotationSpeed(settings.rotationSpeed);
          setEnableBloom(settings.enableBloom);
          setBloomIntensity(settings.bloomIntensity);
          setMorphSpeed(settings.morphSpeed);
          setEnableRipples(settings.enableRipples);
          setRippleSpeed(settings.rippleSpeed);
          setRippleCount(settings.rippleCount);
          setEnableTurbulence(settings.enableTurbulence);
          setTurbulenceFrequency(settings.turbulenceFrequency);
          setTurbulenceAmplitude(settings.turbulenceAmplitude);
          setTurbulenceSpeed(settings.turbulenceSpeed);
          setEnableMouseInteraction(settings.enableMouseInteraction);
          setMouseMode(settings.mouseMode);
          setMouseStrength(settings.mouseStrength);
          setMouseInfluenceRadius(settings.mouseInfluenceRadius);
          setEnableCore(settings.enableCore ?? defaultSettings.enableCore);
          setCoreParticleCount(settings.coreParticleCount ?? defaultSettings.coreParticleCount);
          setCoreDensity(settings.coreDensity ?? defaultSettings.coreDensity);
          setCoreParticleSize(settings.coreParticleSize ?? defaultSettings.coreParticleSize);
          setCoreIntensity(settings.coreIntensity ?? defaultSettings.coreIntensity);
          setCorePulseSpeed(settings.corePulseSpeed ?? defaultSettings.corePulseSpeed);
          setCoreRotationOffset(settings.coreRotationOffset ?? defaultSettings.coreRotationOffset);
          setFluidCohesion(settings.fluidCohesion ?? defaultSettings.fluidCohesion);
          setSurfaceTension(settings.surfaceTension ?? defaultSettings.surfaceTension);
          setFluidFlow(settings.fluidFlow ?? defaultSettings.fluidFlow);
          setAudioReactivitySpeed(settings.audioReactivitySpeed ?? defaultSettings.audioReactivitySpeed);
          setActivePreset(null);
          toast.success('Settings imported');
        } catch (err) {
          toast.error('Invalid settings file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // Simulate audio levels
  useEffect(() => {
    if (!autoAudio) return;
    
    let frame: number;
    const animate = () => {
      setAudioLevel(() => {
        const noise = Math.sin(Date.now() * 0.005) * 0.3 + Math.random() * 0.4;
        return Math.max(0, Math.min(1, noise));
      });
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [autoAudio]);

  // Cycle through states automatically
  const startStateAnimation = () => {
    setIsAnimating(true);
    let index = 0;
    const interval = setInterval(() => {
      setState(states[index]);
      index++;
      if (index >= states.length) {
        clearInterval(interval);
        setIsAnimating(false);
        setState('dormant');
      }
    }, 2000);
  };

  const applyPreset = (preset: Preset) => {
    setState(preset.state);
    setMorphProgress(preset.morphProgress);
    setAudioLevel(preset.audioLevel);
    setAutoAudio(preset.autoAudio);
    setActivePreset(preset.name);
  };

  const applyPerformanceMode = (mode: PerformanceMode) => {
    const preset = performancePresets[mode];
    setPerformanceMode(mode);
    setParticleCount(preset.particleCount);
    setDensity(preset.density);
    setParticleSize(preset.particleSize);
    setTrailLength(preset.trailLength);
    setEnableBloom(preset.enableBloom);
    setCoreParticleCount(preset.coreParticleCount);
    if (preset.trailLength === 0) {
      setEnableTrails(false);
    } else {
      setEnableTrails(true);
    }
    toast.success(`${preset.label} mode applied`);
  };

  const resetToDefaults = () => {
    setState(defaultSettings.state);
    setMorphProgress(defaultSettings.morphProgress);
    setAudioLevel(defaultSettings.audioLevel);
    setAutoAudio(defaultSettings.autoAudio);
    setActivePreset(null);
    setEnableTrails(defaultSettings.enableTrails);
    setTrailLength(defaultSettings.trailLength);
    setTrailOpacity(defaultSettings.trailOpacity);
    setTrailColorGradient(defaultSettings.trailColorGradient);
    setTrailStartColor(defaultSettings.trailStartColor);
    setTrailEndColor(defaultSettings.trailEndColor);
    setParticleCount(defaultSettings.particleCount);
    setParticleSize(defaultSettings.particleSize);
    setDensity(defaultSettings.density);
    setRotationSpeed(defaultSettings.rotationSpeed);
    setEnableBloom(defaultSettings.enableBloom);
    setBloomIntensity(defaultSettings.bloomIntensity);
    setMorphSpeed(defaultSettings.morphSpeed);
    setEnableRipples(defaultSettings.enableRipples);
    setRippleSpeed(defaultSettings.rippleSpeed);
    setRippleCount(defaultSettings.rippleCount);
    setEnableTurbulence(defaultSettings.enableTurbulence);
    setTurbulenceFrequency(defaultSettings.turbulenceFrequency);
    setTurbulenceAmplitude(defaultSettings.turbulenceAmplitude);
    setTurbulenceSpeed(defaultSettings.turbulenceSpeed);
    setEnableMouseInteraction(defaultSettings.enableMouseInteraction);
    setMouseMode(defaultSettings.mouseMode);
    setMouseStrength(defaultSettings.mouseStrength);
    setMouseInfluenceRadius(defaultSettings.mouseInfluenceRadius);
    setEnableCore(defaultSettings.enableCore);
    setCoreParticleCount(defaultSettings.coreParticleCount);
    setCoreDensity(defaultSettings.coreDensity);
    setCoreParticleSize(defaultSettings.coreParticleSize);
    setCoreIntensity(defaultSettings.coreIntensity);
    setCorePulseSpeed(defaultSettings.corePulseSpeed);
    setCoreRotationOffset(defaultSettings.coreRotationOffset);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Reset to defaults');
  };

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
              onClick={() => {
                const settings: AtlasDemoSettings = {
                  state, morphProgress, audioLevel, autoAudio, enableTrails, trailLength, trailOpacity,
                  trailColorGradient, trailStartColor, trailEndColor,
                  particleCount, particleSize, density, rotationSpeed, enableBloom, bloomIntensity, morphSpeed,
                  enableRipples, rippleSpeed, rippleCount, enableTurbulence, turbulenceFrequency, turbulenceAmplitude,
                  turbulenceSpeed, enableMouseInteraction, mouseMode, mouseStrength, mouseInfluenceRadius,
                  enableCore, coreParticleCount, coreDensity, coreParticleSize, coreIntensity, corePulseSpeed, coreRotationOffset,
                  fluidCohesion, surfaceTension, fluidFlow, audioReactivitySpeed
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
                toast.success('Settings saved!');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:border-amber-500/60 text-amber-300 transition-all"
              title="Save Settings"
            >
              <Save className="w-4 h-4" />
              <span className="text-xs font-medium">Save</span>
            </button>
            <button
              onClick={exportSettings}
              className="p-2 rounded-lg bg-muted/20 border border-border/30 hover:border-border/50 transition-all"
              title="Export Settings"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={importSettings}
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
            {/* Fixed 460px sphere size */}
            <div className="w-[460px] h-[460px] flex-shrink-0">
              <AtlasCoreFixed
                state={state} 
                audioLevel={audioLevel} 
                morphProgress={morphProgress}
                enableTrails={enableTrails}
                trailLength={trailLength}
                trailOpacity={trailOpacity}
                trailColorGradient={trailColorGradient}
                trailStartColor={trailStartColor}
                trailEndColor={trailEndColor}
                particleCount={particleCount}
                particleSize={particleSize}
                density={density}
                rotationSpeed={rotationSpeed}
                enableBloom={enableBloom}
                bloomIntensity={bloomIntensity}
                morphSpeed={morphSpeed}
                enableRipples={enableRipples}
                rippleSpeed={rippleSpeed}
                rippleCount={rippleCount}
                enableTurbulence={enableTurbulence}
                turbulenceFrequency={turbulenceFrequency}
                turbulenceAmplitude={turbulenceAmplitude}
                turbulenceSpeed={turbulenceSpeed}
                enableMouseInteraction={enableMouseInteraction}
                mouseMode={mouseMode}
                mouseStrength={mouseStrength}
                mouseInfluenceRadius={mouseInfluenceRadius}
                enableCore={enableCore}
                coreParticleCount={coreParticleCount}
                coreDensity={coreDensity}
                coreParticleSize={coreParticleSize}
                coreIntensity={coreIntensity}
                corePulseSpeed={corePulseSpeed}
                coreRotationOffset={coreRotationOffset}
                fluidCohesion={fluidCohesion}
                surfaceTension={surfaceTension}
                fluidFlow={fluidFlow}
                audioReactivitySpeed={audioReactivitySpeed}
              />
            </div>
          </div>

          {/* Current state indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-xl bg-background/40 border border-border/30"
            key={state}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={`w-3 h-3 rounded-full ${stateDescriptions[state].color} animate-pulse`} />
            <span className="text-sm font-medium">{stateDescriptions[state].label}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">— {stateDescriptions[state].description}</span>
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
                      setState(s);
                      setActivePreset(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      state === s
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
                  onClick={() => setEnableCore(!enableCore)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    enableCore
                      ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300'
                      : 'bg-muted/20 border border-border/30 text-muted-foreground'
                  }`}
                >
                  {enableCore ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {enableCore && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Core Particle Count</span>
                      <span className="text-xs font-mono text-orange-400">{coreParticleCount}</span>
                    </div>
                    <Slider
                      value={[coreParticleCount]}
                      onValueChange={([v]) => setCoreParticleCount(v)}
                      min={100}
                      max={1000}
                      step={50}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Core Density</span>
                      <span className="text-xs font-mono text-orange-400">{coreDensity.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[coreDensity]}
                      onValueChange={([v]) => setCoreDensity(v)}
                      min={0.1}
                      max={0.6}
                      step={0.02}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Tight</span>
                      <span>Spread</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Core Particle Size</span>
                      <span className="text-xs font-mono text-orange-400">{coreParticleSize.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[coreParticleSize]}
                      onValueChange={([v]) => setCoreParticleSize(v)}
                      min={0.02}
                      max={0.1}
                      step={0.005}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Core Intensity</span>
                      <span className="text-xs font-mono text-orange-400">{coreIntensity.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[coreIntensity]}
                      onValueChange={([v]) => setCoreIntensity(v)}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Core Pulse Speed</span>
                      <span className="text-xs font-mono text-orange-400">{corePulseSpeed.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[corePulseSpeed]}
                      onValueChange={([v]) => setCorePulseSpeed(v)}
                      min={0.5}
                      max={3.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Core Rotation</span>
                      <span className="text-xs font-mono text-orange-400">{coreRotationOffset.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[coreRotationOffset]}
                      onValueChange={([v]) => setCoreRotationOffset(v)}
                      min={-2}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Counter</span>
                      <span>Same</span>
                    </div>
                  </div>
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
                  onClick={() => setEnableRipples(!enableRipples)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    enableRipples
                      ? 'bg-teal-500/20 border border-teal-500/50 text-teal-300'
                      : 'bg-muted/20 border border-border/30 text-muted-foreground'
                  }`}
                >
                  {enableRipples ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {enableRipples && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Ripple Speed</span>
                      <span className="text-xs font-mono text-teal-400">{rippleSpeed.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[rippleSpeed]}
                      onValueChange={([v]) => setRippleSpeed(v)}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Ripples per Change</span>
                      <span className="text-xs font-mono text-teal-400">{rippleCount}</span>
                    </div>
                    <Slider
                      value={[rippleCount]}
                      onValueChange={([v]) => setRippleCount(v)}
                      min={1}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                  </div>
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
                  onClick={() => setEnableTurbulence(!enableTurbulence)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    enableTurbulence
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                      : 'bg-muted/20 border border-border/30 text-muted-foreground'
                  }`}
                >
                  {enableTurbulence ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {enableTurbulence && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Frequency</span>
                      <span className="text-xs font-mono text-emerald-400">{turbulenceFrequency.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[turbulenceFrequency]}
                      onValueChange={([v]) => setTurbulenceFrequency(v)}
                      min={0.1}
                      max={2}
                      step={0.05}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Smooth</span>
                      <span>Chunky</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Amplitude</span>
                      <span className="text-xs font-mono text-emerald-400">{turbulenceAmplitude.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[turbulenceAmplitude]}
                      onValueChange={([v]) => setTurbulenceAmplitude(v)}
                      min={0.01}
                      max={0.3}
                      step={0.01}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Subtle</span>
                      <span>Strong</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Speed</span>
                      <span className="text-xs font-mono text-emerald-400">{turbulenceSpeed.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[turbulenceSpeed]}
                      onValueChange={([v]) => setTurbulenceSpeed(v)}
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Fluid Dynamics Controls */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-400" />
                Fluid Dynamics
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Cohesion</span>
                  <span className="text-xs font-mono text-sky-400">{fluidCohesion.toFixed(2)}</span>
                </div>
                <Slider
                  value={[fluidCohesion]}
                  onValueChange={([v]) => setFluidCohesion(v)}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Scattered</span>
                  <span>Solid</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Surface Tension</span>
                  <span className="text-xs font-mono text-sky-400">{surfaceTension.toFixed(2)}</span>
                </div>
                <Slider
                  value={[surfaceTension]}
                  onValueChange={([v]) => setSurfaceTension(v)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Flow Speed</span>
                  <span className="text-xs font-mono text-sky-400">{fluidFlow.toFixed(2)}</span>
                </div>
                <Slider
                  value={[fluidFlow]}
                  onValueChange={([v]) => setFluidFlow(v)}
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
              </div>
            </div>

            {/* Mouse Interaction Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-rose-400" />
                  Mouse Interaction
                </h3>
                <button
                  onClick={() => setEnableMouseInteraction(!enableMouseInteraction)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    enableMouseInteraction
                      ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                      : 'bg-muted/20 border border-border/30 text-muted-foreground'
                  }`}
                >
                  {enableMouseInteraction ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {enableMouseInteraction && (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMouseMode('attract')}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        mouseMode === 'attract'
                          ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                          : 'bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      🧲 Attract
                    </button>
                    <button
                      onClick={() => setMouseMode('repulse')}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        mouseMode === 'repulse'
                          ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                          : 'bg-muted/20 border border-border/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      💨 Repulse
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Strength</span>
                      <span className="text-xs font-mono text-rose-400">{mouseStrength.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[mouseStrength]}
                      onValueChange={([v]) => setMouseStrength(v)}
                      min={0.1}
                      max={2}
                      step={0.05}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Influence Radius</span>
                      <span className="text-xs font-mono text-rose-400">{mouseInfluenceRadius.toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[mouseInfluenceRadius]}
                      onValueChange={([v]) => setMouseInfluenceRadius(v)}
                      min={1}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Animation Controls */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                Animation
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Morph Progress</span>
                  <span className="text-xs font-mono text-amber-400">{morphProgress.toFixed(2)}</span>
                </div>
                <Slider
                  value={[morphProgress]}
                  onValueChange={([v]) => setMorphProgress(v)}
                  min={0}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Scattered</span>
                  <span>Sphere</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Morph Speed</span>
                  <span className="text-xs font-mono text-amber-400">{morphSpeed.toFixed(1)}</span>
                </div>
                <Slider
                  value={[morphSpeed]}
                  onValueChange={([v]) => setMorphSpeed(v)}
                  min={0.5}
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Rotation Speed</span>
                  <span className="text-xs font-mono text-cyan-400">{rotationSpeed.toFixed(2)}</span>
                </div>
                <Slider
                  value={[rotationSpeed]}
                  onValueChange={([v]) => setRotationSpeed(v)}
                  min={0}
                  max={2}
                  step={0.05}
                  className="w-full"
                />
              </div>
            </div>

            {/* Particle Controls */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Particles
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Particle Count</span>
                  <span className="text-xs font-mono text-purple-400">{particleCount}</span>
                </div>
                <Slider
                  value={[particleCount]}
                  onValueChange={([v]) => setParticleCount(v)}
                  min={500}
                  max={20000}
                  step={500}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Particle Size</span>
                  <span className="text-xs font-mono text-purple-400">{particleSize.toFixed(2)}</span>
                </div>
                <Slider
                  value={[particleSize]}
                  onValueChange={([v]) => setParticleSize(v)}
                  min={0.02}
                  max={0.2}
                  step={0.01}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Density</span>
                  <span className="text-xs font-mono text-purple-400">{density.toFixed(2)}</span>
                </div>
                <Slider
                  value={[density]}
                  onValueChange={([v]) => setDensity(v)}
                  min={0.3}
                  max={2}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Tight</span>
                  <span>Spread</span>
                </div>
              </div>
            </div>

            {/* Audio Level */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Audio Level</h3>
                <span className="text-sm font-mono text-cyan-400">{audioLevel.toFixed(2)}</span>
              </div>
              <Slider
                value={[audioLevel]}
                onValueChange={([v]) => {
                  setAudioLevel(v);
                  setAutoAudio(false);
                }}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
              <button
                onClick={() => setAutoAudio(!autoAudio)}
                className={`w-full px-4 py-2 rounded-xl text-sm transition-all ${
                  autoAudio
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                    : 'bg-muted/20 border border-border/30 hover:border-border/50'
                }`}
              >
                {autoAudio ? '🔊 Simulating Audio...' : '🔇 Simulate Audio'}
              </button>
              
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Reactivity Speed</span>
                  <span className="text-xs font-mono text-cyan-400">{audioReactivitySpeed.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[audioReactivitySpeed]}
                  onValueChange={([v]) => setAudioReactivitySpeed(v)}
                  min={0.2}
                  max={3.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>
            </div>

            {/* Effects Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Bloom Effect</h3>
                <button
                  onClick={() => setEnableBloom(!enableBloom)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    enableBloom
                      ? 'bg-pink-500/20 border border-pink-500/50 text-pink-300'
                      : 'bg-muted/20 border border-border/30 text-muted-foreground'
                  }`}
                >
                  {enableBloom ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {enableBloom && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Bloom Intensity</span>
                    <span className="text-xs font-mono text-pink-400">{bloomIntensity.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[bloomIntensity]}
                    onValueChange={([v]) => setBloomIntensity(v)}
                    min={0}
                    max={2}
                    step={0.05}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Trail Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Particle Trails</h3>
                <button
                  onClick={() => setEnableTrails(!enableTrails)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    enableTrails
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                      : 'bg-muted/20 border border-border/30 text-muted-foreground'
                  }`}
                >
                  {enableTrails ? 'ON' : 'OFF'}
                </button>
              </div>
              
              {enableTrails && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Trail Length</span>
                      <span className="text-xs font-mono text-amber-400">{trailLength}</span>
                    </div>
                    <Slider
                      value={[trailLength]}
                      onValueChange={([v]) => setTrailLength(v)}
                      min={1}
                      max={12}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Trail Opacity</span>
                      <span className="text-xs font-mono text-amber-400">{trailOpacity.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[trailOpacity]}
                      onValueChange={([v]) => setTrailOpacity(v)}
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                  </div>

                  {/* Color Gradient Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/20">
                    <span className="text-xs text-muted-foreground">Color Gradient</span>
                    <button
                      onClick={() => setTrailColorGradient(!trailColorGradient)}
                      className={`px-3 py-1 rounded-lg text-xs transition-all ${
                        trailColorGradient
                          ? 'bg-gradient-to-r from-orange-500/30 to-purple-500/30 border border-orange-500/50 text-orange-300'
                          : 'bg-muted/20 border border-border/30 text-muted-foreground'
                      }`}
                    >
                      {trailColorGradient ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {trailColorGradient && (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Start Color (Bright)</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={trailStartColor}
                              onChange={(e) => setTrailStartColor(e.target.value)}
                              className="w-6 h-6 rounded cursor-pointer border border-border/30"
                            />
                            <span className="text-xs font-mono text-amber-400">{trailStartColor}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">End Color (Dark)</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={trailEndColor}
                              onChange={(e) => setTrailEndColor(e.target.value)}
                              className="w-6 h-6 rounded cursor-pointer border border-border/30"
                            />
                            <span className="text-xs font-mono text-purple-400">{trailEndColor}</span>
                          </div>
                        </div>
                      </div>

                      {/* Gradient Preview */}
                      <div className="h-3 rounded-full w-full" style={{
                        background: `linear-gradient(to right, ${trailStartColor}, ${trailEndColor})`
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
    </div>
  );
}
