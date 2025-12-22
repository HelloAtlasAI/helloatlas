import { motion } from 'framer-motion';
import { TrendingUp, Brain, BookOpen, Shield, Zap, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface LearningMetrics {
  knowledgeVelocity: number;
  researchVelocity: number;
  validationRate: number;
  queueDepth: number;
  processingCount: number;
  successRate: number;
}

interface LearningVelocityMetricsProps {
  metrics: LearningMetrics;
  queuedCount: number;
  processingCount: number;
}

export function LearningVelocityMetrics({ 
  metrics, 
  queuedCount, 
  processingCount 
}: LearningVelocityMetricsProps) {
  return (
    <div className="backdrop-blur-xl bg-background/30 border border-border/30 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Learning Velocity</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Knowledge Velocity */}
        <VelocityCard
          icon={<Brain className="w-5 h-5" />}
          label="Knowledge"
          value={metrics.knowledgeVelocity}
          unit="/hr"
          color="primary"
          trend={metrics.knowledgeVelocity > 0 ? 'up' : 'neutral'}
        />

        {/* Research Velocity */}
        <VelocityCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Research"
          value={metrics.researchVelocity}
          unit="/hr"
          color="cyan"
          trend={metrics.researchVelocity > 0 ? 'up' : 'neutral'}
        />

        {/* Validation Rate */}
        <VelocityCard
          icon={<Shield className="w-5 h-5" />}
          label="Validations"
          value={metrics.validationRate}
          unit="/hr"
          color="emerald"
          trend={metrics.validationRate > 0 ? 'up' : 'neutral'}
        />

        {/* Queue Depth */}
        <VelocityCard
          icon={<Zap className="w-5 h-5" />}
          label="Queue"
          value={queuedCount}
          unit="items"
          color="amber"
          trend={queuedCount > 10 ? 'up' : queuedCount > 0 ? 'neutral' : 'down'}
        />

        {/* Processing */}
        <VelocityCard
          icon={<motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Zap className="w-5 h-5" />
          </motion.div>}
          label="Processing"
          value={processingCount}
          unit="active"
          color="violet"
          isAnimating={processingCount > 0}
        />

        {/* Success Rate */}
        <VelocityCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Success"
          value={metrics.successRate}
          unit="%"
          color={metrics.successRate >= 80 ? 'emerald' : metrics.successRate >= 50 ? 'amber' : 'destructive'}
          trend={metrics.successRate >= 80 ? 'up' : metrics.successRate >= 50 ? 'neutral' : 'down'}
        />
      </div>
    </div>
  );
}

function VelocityCard({
  icon,
  label,
  value,
  unit,
  color,
  trend,
  isAnimating
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  color: 'primary' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'destructive';
  trend?: 'up' | 'down' | 'neutral';
  isAnimating?: boolean;
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10 border-primary/30',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
    destructive: 'text-destructive bg-destructive/10 border-destructive/30'
  };

  const iconColorClasses = {
    primary: 'text-primary',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    violet: 'text-violet-400',
    destructive: 'text-destructive'
  };

  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <motion.div
      className={`p-4 rounded-xl border ${colorClasses[color]}`}
      whileHover={{ scale: 1.02 }}
      animate={isAnimating ? { borderColor: ['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.6)', 'rgba(139, 92, 246, 0.3)'] } : {}}
      transition={isAnimating ? { duration: 1.5, repeat: Infinity } : {}}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={iconColorClasses[color]}>{icon}</div>
        {trend && <TrendIcon className={`w-3 h-3 ${trendColor}`} />}
      </div>
      
      <motion.div
        className="text-2xl font-bold"
        key={value}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {value}
        <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
      </motion.div>
      
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );
}
