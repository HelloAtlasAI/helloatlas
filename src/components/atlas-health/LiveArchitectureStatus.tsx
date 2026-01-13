import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Network, 
  Cpu, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Brain,
  Database,
  Sparkles,
  Search,
  Globe,
  Zap,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAtlasProviderStatus, ProviderName } from '@/hooks/useAtlasProviderStatus';
import { ProviderHealthCard } from './ProviderHealthCard';
import { LearningControlPanel } from './LearningControlPanel';

const LiveArchitectureStatus = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const {
    providers,
    settings,
    learningLogs,
    isLoading,
    isSystemHealthy,
    criticalProvidersDown,
    hasCreditsIssue,
    hasRateLimitIssue,
    learningEnabled,
    resetProvider,
  } = useAtlasProviderStatus();

  const getProviderByName = (name: ProviderName) => 
    providers.find(p => p.provider === name);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500 bg-green-500/20 border-green-500/40';
      case 'degraded': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/40';
      case 'error': return 'text-red-500 bg-red-500/20 border-red-500/40';
      case 'rate_limited': return 'text-orange-500 bg-orange-500/20 border-orange-500/40';
      case 'credits_exhausted': return 'text-red-500 bg-red-500/20 border-red-500/40';
      default: return 'text-muted-foreground bg-muted/20 border-border/40';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-3 h-3" />;
      case 'degraded': return <AlertTriangle className="w-3 h-3" />;
      case 'error': 
      case 'credits_exhausted': return <XCircle className="w-3 h-3" />;
      case 'rate_limited': return <Clock className="w-3 h-3" />;
      default: return <div className="w-3 h-3 rounded-full bg-current opacity-50" />;
    }
  };

  // Architecture nodes
  const architectureNodes = [
    {
      id: 'frontend',
      label: 'Frontend',
      sublabel: 'React App',
      icon: <Cpu className="w-5 h-5" />,
      status: 'healthy',
      x: 50,
      y: 10,
    },
    {
      id: 'edge',
      label: 'Edge Functions',
      sublabel: 'Supabase',
      icon: <Network className="w-5 h-5" />,
      status: isSystemHealthy ? 'healthy' : 'degraded',
      x: 50,
      y: 30,
    },
    {
      id: 'lovable_ai',
      label: 'Lovable AI',
      sublabel: 'Gemini/GPT',
      icon: <Sparkles className="w-5 h-5" />,
      status: getProviderByName('lovable_ai')?.status || 'unknown',
      provider: 'lovable_ai' as ProviderName,
      x: 20,
      y: 55,
    },
    {
      id: 'anthropic',
      label: 'Claude',
      sublabel: 'Memory Core',
      icon: <Brain className="w-5 h-5" />,
      status: getProviderByName('anthropic')?.status || 'unknown',
      provider: 'anthropic' as ProviderName,
      x: 50,
      y: 55,
    },
    {
      id: 'perplexity',
      label: 'Perplexity',
      sublabel: 'Research',
      icon: <Search className="w-5 h-5" />,
      status: getProviderByName('perplexity')?.status || 'unknown',
      provider: 'perplexity' as ProviderName,
      x: 80,
      y: 55,
    },
    {
      id: 'jina',
      label: 'Jina',
      sublabel: 'Scraping',
      icon: <Globe className="w-5 h-5" />,
      status: getProviderByName('jina')?.status || 'unknown',
      provider: 'jina' as ProviderName,
      x: 80,
      y: 80,
    },
    {
      id: 'database',
      label: 'Database',
      sublabel: 'Supabase',
      icon: <Database className="w-5 h-5" />,
      status: 'healthy',
      x: 20,
      y: 80,
    },
  ];

  // Connection paths
  const connections = [
    { from: 'frontend', to: 'edge' },
    { from: 'edge', to: 'lovable_ai' },
    { from: 'edge', to: 'anthropic' },
    { from: 'edge', to: 'perplexity' },
    { from: 'perplexity', to: 'jina' },
    { from: 'lovable_ai', to: 'database' },
    { from: 'anthropic', to: 'database' },
  ];

  if (isLoading) {
    return (
      <div className="backdrop-blur-xl bg-background/30 border border-border/30 rounded-2xl p-6">
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="w-8 h-8 text-primary" />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="backdrop-blur-xl bg-background/30 border border-border/30 rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isSystemHealthy ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <Network className={`w-5 h-5 ${isSystemHealthy ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">AI Architecture Status</h3>
            <p className="text-sm text-muted-foreground">
              {isSystemHealthy ? 'All systems operational' : 'Some systems need attention'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasCreditsIssue && (
            <Badge variant="destructive" className="gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              Credits Exhausted
            </Badge>
          )}
          <Badge 
            variant={learningEnabled ? 'default' : 'secondary'}
            className="gap-1"
          >
            <Brain className="w-3 h-3" />
            Learning: {learningEnabled ? 'ON' : 'OFF'}
          </Badge>
        </div>
      </div>

      {/* Warning Banner */}
      <AnimatePresence>
        {(hasCreditsIssue || criticalProvidersDown.length > 0) && (
          <motion.div
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-500">Critical Issue Detected</p>
                <p className="text-sm text-red-400">
                  {hasCreditsIssue 
                    ? 'AI credits are exhausted. Learning has been automatically disabled. Please add credits to continue.'
                    : 'Critical AI providers are down. Learning has been paused.'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Architecture Visualization */}
      <div className="relative h-80 mb-6 rounded-xl border border-border/30 bg-background/20 overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {connections.map((conn, idx) => {
            const fromNode = architectureNodes.find(n => n.id === conn.from);
            const toNode = architectureNodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const fromX = (fromNode.x / 100) * 100 + '%';
            const fromY = (fromNode.y / 100) * 100 + '%';
            const toX = (toNode.x / 100) * 100 + '%';
            const toY = (toNode.y / 100) * 100 + '%';

            const isHealthy = toNode.status === 'healthy' || toNode.status === 'unknown';

            return (
              <motion.line
                key={idx}
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke={isHealthy ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'}
                strokeWidth="2"
                strokeOpacity="0.3"
                strokeDasharray={isHealthy ? "0" : "5,5"}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {architectureNodes.map((node, idx) => (
          <motion.div
            key={node.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <motion.button
              className={`relative p-3 rounded-xl border-2 backdrop-blur-sm ${getStatusColor(node.status)} hover:scale-105 transition-transform`}
              onClick={() => setExpandedSection(expandedSection === node.id ? null : node.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Pulse animation for unhealthy */}
              {node.status !== 'healthy' && node.status !== 'unknown' && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-current opacity-20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              {node.icon}
              
              {/* Status indicator */}
              <div className={`absolute -top-1 -right-1 p-0.5 rounded-full ${getStatusColor(node.status)}`}>
                {getStatusIcon(node.status)}
              </div>
            </motion.button>
            
            {/* Label */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-center whitespace-nowrap">
              <p className="text-xs font-medium">{node.label}</p>
              <p className="text-[10px] text-muted-foreground">{node.sublabel}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {providers.map((provider) => (
          <ProviderHealthCard
            key={provider.id}
            provider={provider}
            onReset={resetProvider}
            compact
          />
        ))}
      </div>

      {/* Learning Control */}
      <LearningControlPanel compact />

      {/* Recent Learning Activity */}
      {learningLogs && learningLogs.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border/30">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Learning Activity
          </h4>
          <div className="space-y-2">
            {learningLogs.slice(0, 3).map((log) => (
              <div 
                key={log.id}
                className={`p-3 rounded-lg border text-sm ${
                  log.status === 'error' 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : log.status === 'completed'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-muted/20 border-border/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {log.topic_requested || 'Learning session'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {log.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {log.topics_learned}/{log.max_topics_allowed} topics • {log.trigger_type}
                </p>
                {log.error_message && (
                  <p className="text-xs text-red-400 mt-1">{log.error_message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border/30 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span>Healthy</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-yellow-500" />
          <span>Degraded</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-orange-500" />
          <span>Rate Limited</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-3 h-3 text-red-500" />
          <span>Error/Credits Exhausted</span>
        </div>
      </div>
    </motion.div>
  );
};

export default LiveArchitectureStatus;
