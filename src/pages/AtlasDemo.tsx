import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Sparkles, Zap, Settings2, Layers } from 'lucide-react';
import { AtlasCoreFixed } from '@/components/dashboard/AtlasCoreFixed';
import { WakeWordState } from '@/hooks/useWakeWord';
import { Slider } from '@/components/ui/slider';

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
  const [state, setState] = useState<WakeWordState>('dormant');
  const [morphProgress, setMorphProgress] = useState(0.2);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoAudio, setAutoAudio] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  
  // Trail controls
  const [enableTrails, setEnableTrails] = useState(true);
  const [trailLength, setTrailLength] = useState(6);
  const [trailOpacity, setTrailOpacity] = useState(0.5);
  
  // Particle controls
  const [particleCount, setParticleCount] = useState(2000);
  const [particleSize, setParticleSize] = useState(0.08);
  const [density, setDensity] = useState(1.0);
  const [rotationSpeed, setRotationSpeed] = useState(0.5);
  
  // Effects controls
  const [enableBloom, setEnableBloom] = useState(true);
  const [bloomIntensity, setBloomIntensity] = useState(0.8);
  
  // Animation controls
  const [morphSpeed, setMorphSpeed] = useState(1.5);

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

  const resetToDefaults = () => {
    setState('dormant');
    setMorphProgress(0.2);
    setAudioLevel(0);
    setAutoAudio(false);
    setActivePreset(null);
    setEnableTrails(true);
    setTrailLength(6);
    setTrailOpacity(0.5);
    setParticleCount(2000);
    setParticleSize(0.08);
    setDensity(1.0);
    setRotationSpeed(0.5);
    setEnableBloom(true);
    setBloomIntensity(0.8);
    setMorphSpeed(1.5);
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
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="pt-20 flex min-h-screen">
        {/* Main visualization area */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-3xl aspect-square">
              <AtlasCoreFixed 
                state={state} 
                audioLevel={audioLevel} 
                morphProgress={morphProgress}
                enableTrails={enableTrails}
                trailLength={trailLength}
                trailOpacity={trailOpacity}
                particleCount={particleCount}
                particleSize={particleSize}
                density={density}
                rotationSpeed={rotationSpeed}
                enableBloom={enableBloom}
                bloomIntensity={bloomIntensity}
                morphSpeed={morphSpeed}
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
                  max={5000}
                  step={100}
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
                </>
              )}
            </div>

            {/* Info Panel */}
            <div className="p-4 rounded-xl bg-muted/10 border border-border/20 space-y-3">
              <h3 className="text-sm font-medium text-foreground/80">About Atlas Core</h3>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Circular particle texture for smooth rendering</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>Bloom post-processing for enhanced glow</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  <span>Fluid easing with per-particle offsets</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400">•</span>
                  <span>Additive blending for light accumulation</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}