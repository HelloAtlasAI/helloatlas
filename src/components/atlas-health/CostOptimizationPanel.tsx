import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingDown, 
  Clock, 
  Zap, 
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useAtlasProviderStatus } from '@/hooks/useAtlasProviderStatus';
import { useUsageHistory } from '@/hooks/useUsageHistory';
import { useSpendingAlerts } from '@/hooks/useSpendingAlerts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  savingsEstimate: number;
  category: 'provider' | 'usage' | 'timing' | 'config';
  icon: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
}

const IMPACT_COLORS = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const IMPACT_LABELS = {
  high: 'High Impact',
  medium: 'Medium Impact',
  low: 'Low Impact',
};

export function CostOptimizationPanel() {
  const { providers, settings, updateSettings } = useAtlasProviderStatus();
  const { history, avgDailySpend, topProvider } = useUsageHistory('daily', 30);
  const { budgetSettings, dailySpending, dailyBudgetUsedPct } = useSpendingAlerts();

  // Generate recommendations based on usage patterns
  const recommendations = useMemo<Recommendation[]>(() => {
    const recs: Recommendation[] = [];

    // Check for high-cost provider usage
    const expensiveProviders = providers.filter(p => {
      const callCount = p.total_calls || 0;
      return (p.provider === 'openai' || p.provider === 'anthropic') && callCount > 100;
    });

    if (expensiveProviders.length > 0) {
      const totalExpensiveCalls = expensiveProviders.reduce((sum, p) => sum + (p.total_calls || 0), 0);
      const estimatedSavings = totalExpensiveCalls * 0.002; // Rough savings estimate

      recs.push({
        id: 'switch-to-lovable',
        title: 'Switch to Lovable AI for general queries',
        description: `You're making ${totalExpensiveCalls.toLocaleString()} calls to premium providers. Lovable AI can handle most queries at 70% lower cost.`,
        impact: 'high',
        savingsEstimate: estimatedSavings,
        category: 'provider',
        icon: Zap,
        actionLabel: 'Learn More',
      });
    }

    // Check for high failure rates
    const highFailureProviders = providers.filter(p => {
      const total = p.total_calls || 0;
      const failed = p.failed_calls || 0;
      return total > 50 && (failed / total) > 0.1;
    });

    if (highFailureProviders.length > 0) {
      const totalWasted = highFailureProviders.reduce((sum, p) => sum + (p.failed_calls || 0), 0);
      recs.push({
        id: 'reduce-failures',
        title: 'Reduce API call failures',
        description: `${totalWasted} failed calls detected. Implement retry logic and input validation to avoid wasted credits.`,
        impact: 'medium',
        savingsEstimate: totalWasted * 0.001,
        category: 'usage',
        icon: AlertTriangle,
      });
    }

    // Check if spending approaching budget
    if (dailyBudgetUsedPct > 50 && dailyBudgetUsedPct < 100) {
      recs.push({
        id: 'pace-spending',
        title: 'Pace your daily usage',
        description: `You've used ${dailyBudgetUsedPct.toFixed(0)}% of your daily budget by now. Consider spacing out AI operations.`,
        impact: 'medium',
        savingsEstimate: 0,
        category: 'timing',
        icon: Clock,
      });
    }

    // Check for peak usage patterns (if we have history)
    if (history.length >= 7) {
      const recentWeek = history.slice(-7);
      const avgRecent = recentWeek.reduce((sum, d) => sum + d.total, 0) / 7;
      const previousWeek = history.slice(-14, -7);
      
      if (previousWeek.length >= 7) {
        const avgPrevious = previousWeek.reduce((sum, d) => sum + d.total, 0) / 7;
        
        if (avgRecent > avgPrevious * 1.5) {
          recs.push({
            id: 'usage-spike',
            title: 'Unusual usage spike detected',
            description: `Your spending increased by ${((avgRecent / avgPrevious - 1) * 100).toFixed(0)}% compared to last week. Review recent activity for optimization opportunities.`,
            impact: 'high',
            savingsEstimate: (avgRecent - avgPrevious) * 7 * 0.5,
            category: 'usage',
            icon: TrendingDown,
          });
        }
      }
    }

    // Check for auto-validation being enabled
    if (settings?.auto_validation && settings?.auto_knowledge_extraction) {
      recs.push({
        id: 'batch-operations',
        title: 'Consider batch processing',
        description: 'Auto-validation and extraction are enabled. Batching these operations during off-peak hours can reduce costs.',
        impact: 'low',
        savingsEstimate: avgDailySpend * 0.1,
        category: 'config',
        icon: BarChart3,
        actionLabel: 'Configure Scheduling',
        onAction: () => updateSettings({ learning_mode: 'scheduled' }),
      });
    }

    // Check for rate limiting issues
    const rateLimitedProviders = providers.filter(p => p.status === 'rate_limited');
    if (rateLimitedProviders.length > 0) {
      recs.push({
        id: 'rate-limits',
        title: 'Optimize request distribution',
        description: `${rateLimitedProviders.map(p => p.provider).join(', ')} hitting rate limits. Distribute requests more evenly to avoid throttling penalties.`,
        impact: 'medium',
        savingsEstimate: 0,
        category: 'timing',
        icon: Clock,
      });
    }

    // Suggest research depth reduction if spending is high
    if (dailySpending > (budgetSettings?.daily_budget_usd || 5) * 0.7 && settings?.max_research_depth && settings.max_research_depth > 2) {
      recs.push({
        id: 'reduce-depth',
        title: 'Reduce research depth',
        description: `Research depth is set to ${settings.max_research_depth}. Lowering to 2 can reduce costs while maintaining quality for most topics.`,
        impact: 'medium',
        savingsEstimate: avgDailySpend * 0.2,
        category: 'config',
        icon: Lightbulb,
        actionLabel: 'Adjust Depth',
        onAction: () => updateSettings({ max_research_depth: 2 }),
      });
    }

    // If no issues found, add a positive message
    if (recs.length === 0) {
      recs.push({
        id: 'optimized',
        title: 'Your usage is well optimized!',
        description: 'No significant optimization opportunities detected. Your AI spending patterns look efficient.',
        impact: 'low',
        savingsEstimate: 0,
        category: 'usage',
        icon: CheckCircle2,
      });
    }

    // Sort by impact and savings
    return recs.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      if (impactOrder[a.impact] !== impactOrder[b.impact]) {
        return impactOrder[a.impact] - impactOrder[b.impact];
      }
      return b.savingsEstimate - a.savingsEstimate;
    });
  }, [providers, settings, history, avgDailySpend, dailySpending, dailyBudgetUsedPct, budgetSettings, updateSettings]);

  // Calculate total potential savings
  const totalPotentialSavings = useMemo(() => {
    return recommendations.reduce((sum, r) => sum + r.savingsEstimate, 0);
  }, [recommendations]);

  // Calculate optimization score (inverse of issues)
  const optimizationScore = useMemo(() => {
    const highImpactCount = recommendations.filter(r => r.impact === 'high').length;
    const mediumImpactCount = recommendations.filter(r => r.impact === 'medium').length;
    const score = Math.max(0, 100 - (highImpactCount * 25) - (mediumImpactCount * 10));
    return score;
  }, [recommendations]);

  return (
    <div className="space-y-6">
      {/* Optimization Score Header */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">Optimization Score</span>
          </div>
          <Badge 
            variant="outline" 
            className={optimizationScore >= 80 ? 'border-green-500/50 text-green-400' : 
                       optimizationScore >= 50 ? 'border-amber-500/50 text-amber-400' : 
                       'border-red-500/50 text-red-400'}
          >
            {optimizationScore}/100
          </Badge>
        </div>
        <Progress value={optimizationScore} className="h-2 mb-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}</span>
          {totalPotentialSavings > 0 && (
            <span className="flex items-center gap-1 text-green-400">
              <DollarSign className="w-3 h-3" />
              ${totalPotentialSavings.toFixed(2)} potential savings
            </span>
          )}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                rec.impact === 'high' ? 'bg-red-500/20' : 
                rec.impact === 'medium' ? 'bg-amber-500/20' : 
                'bg-green-500/20'
              }`}>
                <rec.icon className={`w-4 h-4 ${
                  rec.impact === 'high' ? 'text-red-400' : 
                  rec.impact === 'medium' ? 'text-amber-400' : 
                  'text-green-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-foreground">{rec.title}</h4>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] ${IMPACT_COLORS[rec.impact]}`}
                  >
                    {IMPACT_LABELS[rec.impact]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                <div className="flex items-center justify-between">
                  {rec.savingsEstimate > 0 && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Save ~${rec.savingsEstimate.toFixed(2)}/week
                    </span>
                  )}
                  {rec.actionLabel && rec.onAction && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs px-2 gap-1"
                      onClick={rec.onAction}
                    >
                      {rec.actionLabel}
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="p-4 rounded-lg bg-muted/20 border border-border/30">
        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Quick Cost-Saving Tips
        </h4>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
            <span>Use Lovable AI for routine queries - it's 70% cheaper than premium models</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
            <span>Enable scheduled learning to batch operations during off-peak hours</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
            <span>Set daily budget limits to prevent unexpected spending spikes</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
            <span>Review failed calls regularly - they still consume credits without value</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
