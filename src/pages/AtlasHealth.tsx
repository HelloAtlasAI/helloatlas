import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// Lazy load the heavy dashboard component
const AtlasHealthDashboard = lazy(() => import('@/components/atlas-health/AtlasHealthDashboard'));

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-muted-foreground">Loading Atlas Health...</p>
    </div>
  </div>
);

const AtlasHealth = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex-1" />
          <h1 className="text-xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Atlas Health Center
          </h1>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-16">
        <Suspense fallback={<PageLoader />}>
          <AtlasHealthDashboard />
        </Suspense>
      </main>
    </div>
  );
};

export default AtlasHealth;
