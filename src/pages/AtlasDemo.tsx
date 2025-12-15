import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Sparkles, Zap } from 'lucide-react';
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
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-2xl aspect-square">
              <AtlasCoreFixed 
                state={state} 
                audioLevel={audioLevel} 
                morphProgress={morphProgress} 
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
          className="w-80 lg:w-96 backdrop-blur-xl bg-background/20 border-l border-border/20 p-6 overflow-y-auto"
        >
          <div className="space-y-8">
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
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {presets.map((preset) => (
                  <motion.button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-xl text-left transition-all ${
                      activePreset === preset.name
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 ring-1 ring-amber-500/30'
                        : `bg-gradient-to-r ${preset.gradient} border border-border/30 hover:border-border/50`
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{preset.icon}</span>
                      <span className="text-xs font-medium text-foreground truncate">{preset.name}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{preset.description}</p>
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
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
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

            {/* Morph Progress */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground/80 uppercase tracking-wider">Morph Progress</h3>
                <span className="text-sm font-mono text-amber-400">{morphProgress.toFixed(2)}</span>
              </div>
              <Slider
                value={[morphProgress]}
                onValueChange={([v]) => setMorphProgress(v)}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Scattered (0.0)</span>
                <span>Sphere (1.0)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Controls particle formation: scattered wave → tight sphere formation
              </p>
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
              <p className="text-xs text-muted-foreground">
                Drives audio-reactive displacement and ripple effects
              </p>
            </div>

            {/* Info Panel */}
            <div className="p-4 rounded-xl bg-muted/10 border border-border/20 space-y-3">
              <h3 className="text-sm font-medium text-foreground/80">About Atlas Core</h3>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span><strong>5000+ particles</strong> with custom shaders</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span><strong>4-layer system:</strong> core, lattice, particles, glow</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span><strong>Icosahedron wireframe</strong> with independent rotation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>Inspired by <strong>izum.study</strong> morphing design</span>
                </li>
              </ul>
            </div>

            {/* Shader Uniforms Reference */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 font-mono text-xs">
              <h4 className="text-foreground/80 mb-2">Active Uniforms</h4>
              <div className="space-y-1 text-slate-400">
                <div>uMorphProgress: <span className="text-amber-400">{morphProgress.toFixed(3)}</span></div>
                <div>uAudioLevel: <span className="text-cyan-400">{audioLevel.toFixed(3)}</span></div>
                <div>uStateIntensity: <span className="text-purple-400">{stateDescriptions[state].label}</span></div>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
