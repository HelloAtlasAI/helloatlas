import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

// Lazy load the heavy dashboard component
const AtlasCoreDashboard = lazy(() => import('@/components/atlas-health/AtlasCoreDashboard'));

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-primary/30 animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Cpu className="w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
      <p className="text-muted-foreground">Initializing Atlas Core...</p>
    </div>
  </div>
);

const AtlasCore = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(var(--secondary) / 0.4) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/30"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <motion.div
              className="relative w-8 h-8"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Atlas Core
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Intelligence Center</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-16 relative z-10">
        <Suspense fallback={<PageLoader />}>
          <AtlasCoreDashboard />
        </Suspense>
      </main>
    </div>
  );
};

export default AtlasCore;
