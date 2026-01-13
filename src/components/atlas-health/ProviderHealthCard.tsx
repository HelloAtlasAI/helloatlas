import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  CreditCard,
  RefreshCw,
  Sparkles,
  Brain,
  Search,
  Globe,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProviderStatus, ProviderName, ProviderStatusType } from '@/hooks/useAtlasProviderStatus';
import { formatDistanceToNow } from 'date-fns';

interface ProviderHealthCardProps {
  provider: ProviderStatus;
  onReset?: (provider: ProviderName) => void;
  compact?: boolean;
}

const providerConfig: Record<ProviderName, { 
  label: string; 
  icon: React.ReactNode; 
  tier: string;
  description: string;
}> = {
  lovable_ai: {
    label: 'Lovable AI',
    icon: <Sparkles className="w-4 h-4" />,
    tier: 'Primary',
    description: 'Main AI gateway for planning and execution',
  },
  anthropic: {
    label: 'Claude',
    icon: <Brain className="w-4 h-4" />,
    tier: 'Memory Core',
    description: 'Memory synthesis and advanced reasoning',
  },
  perplexity: {
    label: 'Perplexity',
    icon: <Search className="w-4 h-4" />,
    tier: 'Research',
    description: 'Web search and citation research',
  },
  jina: {
    label: 'Jina Reader',
    icon: <Globe className="w-4 h-4" />,
    tier: 'Utility',
    description: 'URL content extraction',
  },
  openai: {
    label: 'OpenAI',
    icon: <Zap className="w-4 h-4" />,
    tier: 'Fallback',
    description: 'Fallback AI provider',
  },
};

const statusConfig: Record<ProviderStatusType, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  label: string;
}> = {
  healthy: {
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    label: 'Healthy',
  },
  degraded: {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    label: 'Degraded',
  },
  error: {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: <XCircle className="w-4 h-4 text-red-500" />,
    label: 'Error',
  },
  rate_limited: {
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: <Clock className="w-4 h-4 text-orange-500" />,
    label: 'Rate Limited',
  },
  credits_exhausted: {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: <CreditCard className="w-4 h-4 text-red-500" />,
    label: 'Credits Exhausted',
  },
  unknown: {
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
    borderColor: 'border-border/30',
    icon: <div className="w-4 h-4 rounded-full bg-muted-foreground/50" />,
    label: 'Unknown',
  },
};

export function ProviderHealthCard({ provider, onReset, compact = false }: ProviderHealthCardProps) {
  const config = providerConfig[provider.provider];
  const status = statusConfig[provider.status];
  
  const successRate = provider.total_calls > 0 
    ? Math.round((provider.successful_calls / provider.total_calls) * 100) 
    : 100;

  const rateLimitRemaining = provider.rate_limit_until 
    ? new Date(provider.rate_limit_until) > new Date()
      ? formatDistanceToNow(new Date(provider.rate_limit_until), { addSuffix: true })
      : null
    : null;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className={`relative p-3 rounded-xl border ${status.bgColor} ${status.borderColor} cursor-help`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${status.bgColor} ${status.color}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{config.label}</h4>
                  <p className={`text-xs ${status.color}`}>{status.label}</p>
                </div>
                {status.icon}
              </div>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            <div className="mt-2 space-y-1 text-xs">
              <p>Status: <span className={status.color}>{status.label}</span></p>
              <p>Success Rate: {successRate}%</p>
              <p>Total Calls: {provider.total_calls}</p>
              {provider.last_error && (
                <p className="text-red-400 truncate">Error: {provider.last_error}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      className={`relative p-4 rounded-xl border backdrop-blur-sm ${status.bgColor} ${status.borderColor} hover:border-opacity-60 transition-all`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${status.bgColor} ${status.color}`}>
            {config.icon}
          </div>
          <div>
            <h4 className="font-medium">{config.label}</h4>
            <p className="text-xs text-muted-foreground">{config.tier}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status.icon}
          {onReset && provider.status !== 'healthy' && provider.status !== 'unknown' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onReset(provider.provider)}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 rounded-lg bg-background/30">
          <p className="text-muted-foreground">Calls</p>
          <p className="font-medium">{provider.total_calls}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-background/30">
          <p className="text-muted-foreground">Success</p>
          <p className={`font-medium ${successRate >= 95 ? 'text-green-500' : successRate >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
            {successRate}%
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-background/30">
          <p className="text-muted-foreground">Avg Time</p>
          <p className="font-medium">{provider.avg_response_time_ms || '-'}ms</p>
        </div>
      </div>

      {/* Error/Rate limit info */}
      {provider.last_error && provider.status !== 'healthy' && (
        <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-400 line-clamp-2">{provider.last_error}</p>
        </div>
      )}

      {rateLimitRemaining && (
        <div className="mt-3 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <p className="text-xs text-orange-400">
            Rate limit expires {rateLimitRemaining}
          </p>
        </div>
      )}

      {/* Last success */}
      {provider.last_success && (
        <p className="mt-2 text-xs text-muted-foreground">
          Last success: {formatDistanceToNow(new Date(provider.last_success), { addSuffix: true })}
        </p>
      )}
    </motion.div>
  );
}
