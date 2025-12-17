import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Brain, Zap, Lightbulb, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TokenStats {
  planner: number;
  worker: number;
  reasoner: number;
  total: number;
}

interface DailyUsage {
  date: string;
  planner: number;
  worker: number;
  reasoner: number;
}

const tierConfig = {
  planner: {
    label: 'Planner',
    icon: Brain,
    color: 'bg-purple-400',
    textColor: 'text-purple-400',
    description: 'Strategic planning & goal decomposition',
  },
  worker: {
    label: 'Worker',
    icon: Zap,
    color: 'bg-blue-400',
    textColor: 'text-blue-400',
    description: 'Task execution & tool calls',
  },
  reasoner: {
    label: 'Reasoner',
    icon: Lightbulb,
    color: 'bg-amber-400',
    textColor: 'text-amber-400',
    description: 'Verification & quality checks',
  },
};

export function ModelUsageAnalytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [stats, setStats] = useState<TokenStats>({ planner: 0, worker: 0, reasoner: 0, total: 0 });
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        // Calculate date range
        let dateFilter = '';
        const now = new Date();
        if (timeRange === '7d') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = weekAgo.toISOString();
        } else if (timeRange === '30d') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = monthAgo.toISOString();
        }

        // Fetch runs with token data
        let query = supabase
          .from('runs')
          .select('tokens_planner, tokens_worker, tokens_reasoner, created_at')
          .eq('user_id', user.id);

        if (dateFilter) {
          query = query.gte('created_at', dateFilter);
        }

        const { data: runs, error } = await query;

        if (error) throw error;

        // Aggregate token stats
        const aggregated = (runs || []).reduce(
          (acc, run) => ({
            planner: acc.planner + (run.tokens_planner || 0),
            worker: acc.worker + (run.tokens_worker || 0),
            reasoner: acc.reasoner + (run.tokens_reasoner || 0),
          }),
          { planner: 0, worker: 0, reasoner: 0 }
        );

        setStats({
          ...aggregated,
          total: aggregated.planner + aggregated.worker + aggregated.reasoner,
        });

        // Calculate daily usage for chart
        const dailyMap = new Map<string, DailyUsage>();
        (runs || []).forEach((run) => {
          const date = new Date(run.created_at).toISOString().split('T')[0];
          const existing = dailyMap.get(date) || { date, planner: 0, worker: 0, reasoner: 0 };
          dailyMap.set(date, {
            date,
            planner: existing.planner + (run.tokens_planner || 0),
            worker: existing.worker + (run.tokens_worker || 0),
            reasoner: existing.reasoner + (run.tokens_reasoner || 0),
          });
        });

        // Sort by date
        const sortedDaily = Array.from(dailyMap.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setDailyUsage(sortedDaily);
      } catch (error) {
        console.error('Error fetching token stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user, timeRange]);

  // Calculate percentages for the donut chart
  const percentages = useMemo(() => {
    if (stats.total === 0) return { planner: 0, worker: 0, reasoner: 0 };
    return {
      planner: Math.round((stats.planner / stats.total) * 100),
      worker: Math.round((stats.worker / stats.total) * 100),
      reasoner: Math.round((stats.reasoner / stats.total) * 100),
    };
  }, [stats]);

  // Calculate max for bar chart scaling
  const maxDaily = useMemo(() => {
    if (dailyUsage.length === 0) return 1;
    return Math.max(...dailyUsage.map((d) => d.planner + d.worker + d.reasoner));
  }, [dailyUsage]);

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Model Usage Analytics</h3>
        </div>
        <div className="flex items-center justify-center py-12">
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Model Usage Analytics</h3>
            <p className="text-xs text-muted-foreground">Token consumption by tier</p>
          </div>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
          <SelectTrigger className="w-[100px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {stats.total === 0 ? (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No usage data yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Run an agent to see token analytics
          </p>
        </div>
      ) : (
        <>
          {/* Total tokens */}
          <div className="text-center mb-6">
            <p className="text-3xl font-bold text-foreground">
              {stats.total.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Total Tokens</p>
          </div>

          {/* Tier breakdown cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(Object.keys(tierConfig) as Array<keyof typeof tierConfig>).map((tier) => {
              const config = tierConfig[tier];
              const Icon = config.icon;
              const value = stats[tier];
              const pct = percentages[tier];

              return (
                <div
                  key={tier}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${config.textColor}`} />
                    <span className="text-xs font-medium text-foreground">{config.label}</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {value.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={`h-full ${config.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily usage bar chart */}
          {dailyUsage.length > 1 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-foreground mb-3">Daily Usage</p>
              <div className="flex items-end gap-1 h-24">
                {dailyUsage.slice(-14).map((day, index) => {
                  const total = day.planner + day.worker + day.reasoner;
                  const height = Math.max((total / maxDaily) * 100, 4);
                  const plannerH = total > 0 ? (day.planner / total) * height : 0;
                  const workerH = total > 0 ? (day.worker / total) * height : 0;
                  const reasonerH = total > 0 ? (day.reasoner / total) * height : 0;

                  return (
                    <motion.div
                      key={day.date}
                      className="flex-1 flex flex-col justify-end group relative"
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      style={{ transformOrigin: 'bottom' }}
                    >
                      <div
                        className="w-full bg-amber-400 rounded-t-sm"
                        style={{ height: `${reasonerH}%` }}
                      />
                      <div
                        className="w-full bg-blue-400"
                        style={{ height: `${workerH}%` }}
                      />
                      <div
                        className="w-full bg-purple-400 rounded-b-sm"
                        style={{ height: `${plannerH}%` }}
                      />
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg whitespace-nowrap">
                          <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                          <p className="text-purple-400">Planner: {day.planner.toLocaleString()}</p>
                          <p className="text-blue-400">Worker: {day.worker.toLocaleString()}</p>
                          <p className="text-amber-400">Reasoner: {day.reasoner.toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>{dailyUsage.slice(-14)[0]?.date.slice(-5)}</span>
                <span>{dailyUsage.slice(-1)[0]?.date.slice(-5)}</span>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            {(Object.keys(tierConfig) as Array<keyof typeof tierConfig>).map((tier) => (
              <div key={tier} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${tierConfig[tier].color}`} />
                <span className="text-muted-foreground">{tierConfig[tier].label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
