import { motion } from 'framer-motion';
import { Play, Clock, CheckCircle, XCircle, Loader2, StopCircle } from 'lucide-react';
import { useAgentRuns } from '@/hooks/useAgentRuns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  pending: { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  running: { icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  completed: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-green-400', bg: 'bg-green-400/10' },
  failed: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-red-400', bg: 'bg-red-400/10' },
  cancelled: { icon: <StopCircle className="w-3.5 h-3.5" />, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function AgentRunsPanel() {
  const { runs, activeRun, isLoading, cancelRun } = useAgentRuns(10);

  const getDuration = (run: typeof runs[0]) => {
    if (!run.started_at) return '-';
    const start = new Date(run.started_at);
    const end = run.finished_at ? new Date(run.finished_at) : new Date();
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Play className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Agent Runs</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="glass-card p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Play className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Agent Runs</h3>
        </div>
        {activeRun && (
          <Badge variant="outline" className="bg-blue-400/10 text-blue-400 border-blue-400/30">
            Active
          </Badge>
        )}
      </div>

      {runs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No runs yet</p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
          {runs.map((run) => {
            const config = statusConfig[run.status] || statusConfig.pending;
            return (
              <div
                key={run.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className={`p-1.5 rounded-md ${config.bg}`}>
                  <span className={config.color}>{config.icon}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {run.goal_text}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{run.agent?.name || 'Agent'}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{getDuration(run)}</span>
                  <span className="text-green-400">${run.cost_estimate?.toFixed(4) || '0.00'}</span>
                  
                  {(run.status === 'running' || run.status === 'pending') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={() => cancelRun(run.id)}
                    >
                      <StopCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
