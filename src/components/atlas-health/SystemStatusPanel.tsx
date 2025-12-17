import { motion } from 'framer-motion';
import { Activity, DollarSign, Zap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useWorkspaceSettings } from '@/hooks/useWorkspaceSettings';
import { Progress } from '@/components/ui/progress';

export function SystemStatusPanel() {
  const { settings, usage, healthStatus, isLoading } = useWorkspaceSettings();

  if (isLoading || !settings) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">System Status</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const getHealthIcon = () => {
    switch (healthStatus) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-400';
    if (percent >= 70) return 'bg-yellow-400';
    return 'bg-primary';
  };

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">System Status</h3>
        </div>
        <div className="flex items-center gap-2">
          {getHealthIcon()}
          <span className={`text-sm font-medium capitalize ${
            healthStatus === 'healthy' ? 'text-green-400' :
            healthStatus === 'warning' ? 'text-yellow-400' :
            healthStatus === 'critical' ? 'text-red-400' :
            'text-muted-foreground'
          }`}>
            {healthStatus}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Daily Budget */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm text-foreground">Daily Budget</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ${usage.dailySpent.toFixed(2)} / ${settings.daily_budget_limit.toFixed(2)}
            </span>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getProgressColor(usage.budgetPercent)}`}
              initial={{ width: 0 }}
              animate={{ width: `${usage.budgetPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Runs Today */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-foreground">Runs Today</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {usage.runsToday} / {settings.daily_run_limit}
            </span>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getProgressColor(usage.runsPercent)}`}
              initial={{ width: 0 }}
              animate={{ width: `${usage.runsPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            />
          </div>
        </div>

        {/* Tool Calls Today */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-sm text-foreground">Tool Calls Today</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {usage.toolCallsToday} / {settings.daily_tool_call_limit}
            </span>
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getProgressColor(usage.toolCallsPercent)}`}
              initial={{ width: 0 }}
              animate={{ width: `${usage.toolCallsPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </div>
      </div>

      {/* Settings Summary */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${settings.auto_approve_low_risk ? 'bg-green-400' : 'bg-muted-foreground'}`} />
            <span className="text-muted-foreground">Auto-approve low risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${settings.require_approval_for_risky ? 'bg-yellow-400' : 'bg-muted-foreground'}`} />
            <span className="text-muted-foreground">Require approval for risky</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
