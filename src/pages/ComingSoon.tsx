import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Mic,
  Brain,
  Sparkles,
  Orbit,
  ArrowRight,
  Mail,
  Cpu,
  ChevronRight,
  Layers,
  Database,
  Network,
  Radio,
  Zap,
  Shield,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { AtlasSphere } from '@/components/atlas';

const featureCards = [
  {
    icon: Mic,
    title: 'Voice-First',
    description:
      'Real-time speech recognition, wake-word activation, and streaming speech synthesis — speak naturally and Atlas responds.',
    accent: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
  },
  {
    icon: Brain,
    title: 'Persistent Memory',
    description:
      'Atlas remembers preferences, facts, and context across sessions with a multi-tier memory architecture.',
    accent: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20 hover:border-indigo-500/40',
  },
  {
    icon: Sparkles,
    title: 'Proactive Intelligence',
    description:
      'On-demand learning and research pipeline that surfaces relevant knowledge when you need it.',
    accent: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20 hover:border-violet-500/40',
  },
  {
    icon: Orbit,
    title: 'Immersive Sphere',
    description:
      'A GPU-accelerated 3D visualization that reacts to AI state and audio, giving Atlas a tangible presence.',
    accent: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/20 hover:border-fuchsia-500/40',
  },
];

const coreLayers = [
  {
    icon: Radio,
    title: 'Sensory Layer',
    description:
      'Continuous audio capture, wake-word detection, and streaming transcription form the always-on sensory input.',
  },
  {
    icon: Brain,
    title: 'Cognitive Core',
    description:
      'Multi-model routing across Gemini, Claude, and Perplexity — matched to task type, latency, and budget.',
  },
  {
    icon: Database,
    title: 'Memory Fabric',
    description:
      'Four tiers — working, short-term, long-term, and semantic core — synthesised into a persistent identity.',
  },
  {
    icon: Orbit,
    title: 'Expression Layer',
    description:
      'The 3D sphere and streaming TTS translate cognitive state into visible, audible presence in real time.',
  },
];

const architectureBlocks = [
  {
    icon: Layers,
    title: 'Frontend',
    stack: 'React 18 · Vite · Three.js · Tailwind',
    description: 'Reactive UI with a GPU-driven sphere that mirrors every cognitive state.',
  },
  {
    icon: Network,
    title: 'Edge Runtime',
    stack: 'Supabase Functions · Deno',
    description: 'Low-latency orchestration for chat, memory, research, and voice pipelines.',
  },
  {
    icon: Cpu,
    title: 'AI Gateway',
    stack: 'Gemini · Claude · Perplexity',
    description: 'Budget-aware model routing with graceful fallback and cost governance.',
  },
  {
    icon: Database,
    title: 'Storage',
    stack: 'Postgres · pgvector · Realtime',
    description: 'Structured data, semantic embeddings, and live subscriptions in one place.',
  },
];

const uniqueFeatures = [
  {
    icon: Eye,
    title: 'Cognitive Sphere',
    description:
      'Six distinct visual states — dormant, listening, thinking, speaking, learning, dreaming — rendered via custom GLSL shaders.',
  },
  {
    icon: Shield,
    title: 'Budget Guardrails',
    description:
      'Spend-aware routing kicks in at 70%, 90%, and 100% thresholds, automatically switching to lighter models.',
  },
  {
    icon: Zap,
    title: 'On-Demand Learning',
    description:
      'Research is triggered by intent, not by cron — no wasted compute, no stale summaries.',
  },
  {
    icon: Brain,
    title: 'Semantic Core',
    description:
      'Claude periodically synthesises long-term memory into a compact identity layer that grounds every response.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const WaitlistForm = ({ compact = false }: { compact?: boolean }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <div className={compact ? 'max-w-md mx-auto' : 'max-w-md'}>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 rounded-full bg-[hsl(var(--landing-surface)/0.5)] border-[hsl(var(--landing-indigo)/0.25)] focus:border-[hsl(var(--landing-indigo))] focus:ring-[hsl(var(--landing-indigo)/0.3)] placeholder:text-muted-foreground"
          />
        </div>
        <Button
          type="submit"
          className="h-12 rounded-full bg-[hsl(var(--landing-indigo))] hover:bg-[hsl(var(--landing-indigo)/0.85)] text-white px-6 font-medium"
        >
          {submitted ? 'You are on the list' : 'Join waitlist'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>
      {submitted && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-[hsl(var(--landing-indigo))]"
        >
          Thanks — we'll notify you when Atlas launches.
        </motion.p>
      )}
    </div>
  );
};

const ComingSoon = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[hsl(var(--landing-bg))] text-foreground font-manrope">
      {/* Ambient background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[900px] h-[900px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--landing-indigo) / 0.35) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[700px] h-[700px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--landing-navy) / 0.45) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--landing-indigo) / 0.2) 0%, transparent 60%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        className="relative z-50 container mx-auto px-6 py-6 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--landing-indigo) / 0.4), hsl(var(--landing-navy) / 0.4))',
              boxShadow: '0 0 24px hsl(var(--landing-indigo) / 0.3), inset 0 1px 0 hsl(var(--foreground) / 0.1)',
            }}
          >
            <span className="text-lg font-bold text-foreground font-sora">A</span>
          </div>
          <span className="text-xl font-semibold font-sora tracking-tight">Atlas</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#core"
            className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Core
            <ChevronRight className="w-4 h-4" />
          </a>
          <a
            href="#architecture"
            className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Architecture
          </a>
          <a
            href="#waitlist"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Waitlist
          </a>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative z-10 container mx-auto px-6 pt-12 pb-24 lg:pt-20 lg:pb-32">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center">
          {/* Left: text */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-2xl">
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--landing-indigo)/0.3)] bg-[hsl(var(--landing-surface)/0.5)] backdrop-blur-md text-sm mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--landing-indigo))] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--landing-indigo))]" />
              </span>
              <span className="text-muted-foreground">Coming soon</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold font-sora tracking-tight leading-[1.05] mb-6"
            >
              Intelligence,
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--landing-indigo)) 0%, hsl(var(--primary)) 100%)' }}
              >
                in orbit.
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-8 max-w-xl"
            >
              Atlas is a voice-first AI companion with persistent memory, proactive
              intelligence, and an immersive 3D presence. It listens, remembers, and
              thinks ahead — so you don't have to.
            </motion.p>

            <motion.div variants={itemVariants}>
              <WaitlistForm />
            </motion.div>

            <motion.div variants={itemVariants} className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                <span>Multi-model routing</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                <span>Real-time voice</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: sphere */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-center min-h-[420px] lg:min-h-[560px] overflow-visible"
          >
            <div
              className="absolute left-1/2 top-1/2 aspect-square w-[min(420px,calc(100vw-3rem))] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl pointer-events-none sm:w-[480px] lg:w-[560px]"
              style={{ background: 'radial-gradient(circle, hsl(var(--landing-indigo) / 0.4) 0%, transparent 65%)' }}
            />
            {/* Stable square canvas bounds; camera distance keeps the sphere/glow fully inside the same box. */}
            <div className="relative z-10 aspect-square w-[min(420px,calc(100vw-3rem))] overflow-visible sm:w-[480px] lg:w-[560px]">
              <AtlasSphere state="thinking" audioLevel={0.3} context="mini" cameraZ={10} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* What Atlas is building */}
      <section className="relative z-10 container mx-auto px-6 pb-24 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-sora mb-4">What Atlas is building</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A new kind of ambient intelligence — one that stays in sync with you across every conversation, task, and idea.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {featureCards.map((card) => (
            <motion.div
              key={card.title}
              variants={itemVariants}
              className={`group relative p-6 rounded-2xl border ${card.border} bg-[hsl(var(--landing-surface)/0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1`}
            >
              <div className={`inline-flex p-3 rounded-xl ${card.bg} mb-5`}>
                <card.icon className={`w-6 h-6 ${card.accent}`} />
              </div>
              <h3 className="text-lg font-semibold font-sora mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Core */}
      <section id="core" className="relative z-10 container mx-auto px-6 pb-24 lg:pb-32 scroll-mt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--landing-indigo)/0.3)] bg-[hsl(var(--landing-surface)/0.4)] text-xs uppercase tracking-widest text-muted-foreground mb-5">
            The Core
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-sora mb-4">Four layers, one presence.</h2>
          <p className="text-muted-foreground">
            Atlas is built as concentric layers of intelligence — from raw sensory input to expressive output — with memory binding them together.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-2 gap-5"
        >
          {coreLayers.map((layer, i) => (
            <motion.div
              key={layer.title}
              variants={itemVariants}
              className="relative p-6 rounded-2xl border border-[hsl(var(--landing-indigo)/0.15)] hover:border-[hsl(var(--landing-indigo)/0.35)] bg-[hsl(var(--landing-surface)/0.35)] backdrop-blur-xl transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[hsl(var(--landing-indigo)/0.15)] border border-[hsl(var(--landing-indigo)/0.25)] flex items-center justify-center">
                  <layer.icon className="w-5 h-5 text-[hsl(var(--landing-indigo))]" />
                </div>
                <div>
                  <div className="text-xs font-mono text-muted-foreground mb-1">0{i + 1}</div>
                  <h3 className="text-lg font-semibold font-sora mb-2">{layer.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{layer.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="relative z-10 container mx-auto px-6 pb-24 lg:pb-32 scroll-mt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--landing-indigo)/0.3)] bg-[hsl(var(--landing-surface)/0.4)] text-xs uppercase tracking-widest text-muted-foreground mb-5">
            General Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-sora mb-4">Built for realtime, designed for scale.</h2>
          <p className="text-muted-foreground">
            A composable stack across frontend, edge, AI, and storage — every layer swappable, every call observable.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {architectureBlocks.map((block) => (
            <motion.div
              key={block.title}
              variants={itemVariants}
              className="relative p-6 rounded-2xl border border-[hsl(var(--landing-indigo)/0.15)] hover:border-[hsl(var(--landing-indigo)/0.35)] bg-[hsl(var(--landing-surface)/0.35)] backdrop-blur-xl transition-all"
            >
              <block.icon className="w-6 h-6 text-[hsl(var(--landing-indigo))] mb-4" />
              <h3 className="text-lg font-semibold font-sora mb-1">{block.title}</h3>
              <div className="text-xs font-mono text-[hsl(var(--landing-indigo))] mb-3">{block.stack}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{block.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Unique features */}
      <section className="relative z-10 container mx-auto px-6 pb-24 lg:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[hsl(var(--landing-indigo)/0.3)] bg-[hsl(var(--landing-surface)/0.4)] text-xs uppercase tracking-widest text-muted-foreground mb-5">
            What Makes Atlas Different
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-sora mb-4">The features you won't find elsewhere.</h2>
          <p className="text-muted-foreground">
            Atlas is opinionated where it matters — presence, memory, and cost — so it feels alive without going broke.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-2 gap-5"
        >
          {uniqueFeatures.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className="group relative p-6 rounded-2xl border border-[hsl(var(--landing-indigo)/0.15)] hover:border-[hsl(var(--landing-indigo)/0.35)] bg-[hsl(var(--landing-surface)/0.35)] backdrop-blur-xl transition-all overflow-hidden"
            >
              <div
                className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-0 group-hover:opacity-30 blur-3xl transition-opacity"
                style={{ background: 'radial-gradient(circle, hsl(var(--landing-indigo)) 0%, transparent 70%)' }}
              />
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[hsl(var(--landing-indigo)/0.15)] border border-[hsl(var(--landing-indigo)/0.25)] flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-[hsl(var(--landing-indigo))]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold font-sora mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Waitlist CTA */}
      <section id="waitlist" className="relative z-10 container mx-auto px-6 pb-24 scroll-mt-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden border border-[hsl(var(--landing-indigo)/0.25)] bg-[hsl(var(--landing-surface)/0.4)] backdrop-blur-xl p-10 sm:p-14 text-center"
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(circle at 50% 0%, hsl(var(--landing-indigo) / 0.4), transparent 60%)' }}
          />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold font-sora mb-4">Be the first to meet Atlas.</h2>
            <p className="text-muted-foreground mb-8">
              Join the waitlist and get early access when Atlas opens its doors.
            </p>
            <WaitlistForm compact />
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[hsl(var(--landing-surface)/0.6)]">
        <div className="container mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(var(--landing-indigo) / 0.3), hsl(var(--landing-navy) / 0.3))' }}
            >
              <span className="text-sm font-bold text-foreground font-sora">A</span>
            </div>
            <span className="text-sm font-semibold font-sora">Atlas</span>
          </div>
          <p className="text-sm text-muted-foreground">Ambient intelligence, coming soon.</p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#core" className="hover:text-foreground transition-colors">Core</a>
            <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
            <a href="#waitlist" className="hover:text-foreground transition-colors">Waitlist</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ComingSoon;
