import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Play, Loader2, CheckCircle2, XCircle, Clock, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface BrainRun {
  id: string;
  run_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  news_collected: number;
  topics_generated: number;
  research_completed: number;
  entries_validated: number;
  error_message: string | null;
}

interface BrainActivityPanelProps {
  activeRun: BrainRun | undefined;
  lastRun: BrainRun | undefined;
  isRunning: boolean;
  isTriggering: boolean;
  onTrigger: () => void;
}

export function BrainActivityPanel({
  activeRun,
  lastRun,
  isRunning,
  isTriggering,
  onTrigger
}: BrainActivityPanelProps) {
  const displayRun = activeRun || lastRun;
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-destructive" />;
      default: return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'border-primary/50 bg-primary/5';
      case 'completed': return 'border-emerald-500/50 bg-emerald-500/5';
      case 'failed': return 'border-destructive/50 bg-destructive/5';
      default: return 'border-border/50 bg-background/30';
    }
  };

  return (
    <div className="backdrop-blur-xl bg-background/30 border border-border/30 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-6 h-6 text-primary" />
            {isRunning && (
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">Brain Activity</h3>
            <p className="text-sm text-muted-foreground">
              {isRunning ? 'Learning in progress...' : 'Waiting for next cycle'}
            </p>
          </div>
        </div>
        
        <Button
          onClick={onTrigger}
          disabled={isTriggering || isRunning}
          size="sm"
          className="bg-primary/20 hover:bg-primary/30 border border-primary/50"
        >
          {isTriggering ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {isTriggering ? 'Starting...' : 'Trigger Cycle'}
        </Button>
      </div>

      {/* Current/Last Run Status */}
      <AnimatePresence mode="wait">
        {displayRun && (
          <motion.div
            key={displayRun.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-xl border p-4 mb-4 ${getStatusColor(displayRun.status)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(displayRun.status)}
                <span className="font-medium capitalize">{displayRun.run_type} Run</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(displayRun.started_at), { addSuffix: true })}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-3">
              <MetricBox
                icon={<Zap className="w-4 h-4 text-amber-400" />}
                label="News"
                value={displayRun.news_collected}
                isAnimating={isRunning}
              />
              <MetricBox
                icon={<TrendingUp className="w-4 h-4 text-cyan-400" />}
                label="Topics"
                value={displayRun.topics_generated}
                isAnimating={isRunning}
              />
              <MetricBox
                icon={<Brain className="w-4 h-4 text-violet-400" />}
                label="Research"
                value={displayRun.research_completed}
                isAnimating={isRunning}
              />
              <MetricBox
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                label="Validated"
                value={displayRun.entries_validated}
                isAnimating={isRunning}
              />
            </div>

            {displayRun.error_message && (
              <div className="mt-3 p-2 bg-destructive/10 rounded-lg text-sm text-destructive">
                {displayRun.error_message}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Scheduled Run */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Next scheduled cycle:</span>
        <span className="text-foreground font-medium">~30 minutes</span>
      </div>
    </div>
  );
}

function MetricBox({ 
  icon, 
  label, 
  value, 
  isAnimating 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  isAnimating?: boolean;
}) {
  return (
    <div className="text-center p-2 bg-background/30 rounded-lg">
      <div className="flex justify-center mb-1">{icon}</div>
      <motion.div
        className="text-lg font-bold"
        animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5, repeat: isAnimating ? Infinity : 0, repeatDelay: 2 }}
      >
        {value}
      </motion.div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
