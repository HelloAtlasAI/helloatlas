import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mic, Brain, Sparkles, Orbit, ArrowRight, Mail, Cpu, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { AtlasSphere } from '@/components/atlas';

const featureCards = [
  {
    icon: Mic,
    title: 'Voice-First',
    description: 'Real-time speech recognition, wake-word activation, and streaming speech synthesis — speak naturally and Atlas responds.',
    accent: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20 hover:border-cyan-500/40',
  },
  {
    icon: Brain,
    title: 'Persistent Memory',
    description: 'Atlas remembers preferences, facts, and context across sessions with a multi-tier memory architecture.',
    accent: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20 hover:border-indigo-500/40',
  },
  {
    icon: Sparkles,
    title: 'Proactive Intelligence',
    description: 'On-demand learning and research pipeline that surfaces relevant knowledge when you need it.',
    accent: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20 hover:border-violet-500/40',
  },
  {
    icon: Orbit,
    title: 'Immersive Sphere',
    description: 'A GPU-accelerated 3D visualization that reacts to AI state and audio, giving Atlas a tangible presence.',
    accent: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/20 hover:border-fuchsia-500/40',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
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

const ComingSoon = () => {
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
        {/* Grid pattern */}
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
          <Link
            to="/atlas-architecture"
            className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Architecture
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Button
            asChild
            size="sm"
            className="rounded-full bg-[hsl(var(--landing-indigo))] hover:bg-[hsl(var(--landing-indigo)/0.85)] text-white px-5"
          >
            <Link to="/dashboard">Enter Atlas</Link>
          </Button>
        </div>
      </motion.nav>

      {/* Hero section */}
      <section className="relative z-10 container mx-auto px-6 pt-12 pb-24 lg:pt-20 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left: text */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
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

            <motion.form
              variants={itemVariants}
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md"
            >
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
            </motion.form>

            {submitted && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-[hsl(var(--landing-indigo))]"
              >
                Thanks — we'll notify you when Atlas launches.
              </motion.p>
            )}

            <motion.div
              variants={itemVariants}
              className="mt-10 flex items-center gap-6 text-sm text-muted-foreground"
            >
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[360px] sm:h-[440px] lg:h-[520px]"
          >
            <div
              className="absolute inset-0 rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, hsl(var(--landing-indigo) / 0.4) 0%, transparent 65%)' }}
            />
            <div className="relative z-10 w-full h-full">
              <AtlasSphere state="thinking" audioLevel={0.3} context="mini" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature cards */}
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
          {featureCards.map((card, index) => (
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
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ boxShadow: 'inset 0 1px 0 hsl(var(--foreground) / 0.06)' }}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA section */}
      <section className="relative z-10 container mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden border border-[hsl(var(--landing-indigo)/0.25)] bg-[hsl(var(--landing-surface)/0.4)] backdrop-blur-xl p-10 sm:p-14 text-center"
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'radial-gradient(circle at 50% 0%, hsl(var(--landing-indigo) / 0.4), transparent 60%)',
            }}
          />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold font-sora mb-4">Ready to meet Atlas?</h2>
            <p className="text-muted-foreground mb-8">
              The dashboard is already live. Preview the architecture, explore the health center, or enter Atlas now.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-[hsl(var(--landing-indigo))] hover:bg-[hsl(var(--landing-indigo)/0.85)] text-white px-8 h-12"
              >
                <Link to="/dashboard">Enter Atlas</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-[hsl(var(--landing-indigo)/0.35)] bg-transparent hover:bg-[hsl(var(--landing-indigo)/0.1)] px-8 h-12"
              >
                <Link to="/atlas-architecture">Explore Architecture</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[hsl(var(--landing-surface)/0.6)]">
        <div className="container mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--landing-indigo) / 0.3), hsl(var(--landing-navy) / 0.3))',
              }}
            >
              <span className="text-sm font-bold text-foreground font-sora">A</span>
            </div>
            <span className="text-sm font-semibold font-sora">Atlas</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Ambient intelligence, coming soon.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/atlas-architecture" className="hover:text-foreground transition-colors">Architecture</Link>
            <Link to="/atlas-core" className="hover:text-foreground transition-colors">Health</Link>
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ComingSoon;
