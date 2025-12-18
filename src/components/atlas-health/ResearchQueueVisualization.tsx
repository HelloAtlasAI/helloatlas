import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Play, 
  Loader2, 
  CheckCircle, 
  Pause,
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ResearchTopic {
  id: string;
  topic: string;
  description?: string;
  status: string;
  depth_level: number;
  findings: unknown[];
  priority: number;
  auto_generated: boolean;
  created_at: string;
}

interface ResearchQueueVisualizationProps {
  topics: ResearchTopic[];
  compact?: boolean;
}

const priorityConfig: Record<number, { label: string; color: string }> = {
  1: { label: 'Critical', color: 'bg-red-500' },
  2: { label: 'High', color: 'bg-orange-500' },
  3: { label: 'High', color: 'bg-amber-500' },
  4: { label: 'Medium', color: 'bg-yellow-500' },
  5: { label: 'Normal', color: 'bg-blue-500' },
  6: { label: 'Normal', color: 'bg-blue-400' },
  7: { label: 'Low', color: 'bg-slate-500' },
  8: { label: 'Low', color: 'bg-slate-400' },
  9: { label: 'Low', color: 'bg-slate-300' },
  10: { label: 'Minimal', color: 'bg-slate-200' },
};

export const ResearchQueueVisualization = ({ 
  topics, 
  compact = false 
}: ResearchQueueVisualizationProps) => {
  // Categorize topics
  const { active, queued, completed, paused } = useMemo(() => {
    const sorted = [...topics].sort((a, b) => a.priority - b.priority);
    return {
      active: sorted.filter(t => t.status === 'researching'),
      queued: sorted.filter(t => t.status === 'queued'),
      completed: sorted.filter(t => t.status === 'completed').slice(0, 5),
      paused: sorted.filter(t => t.status === 'paused'),
    };
  }, [topics]);

  const getPriorityConfig = (priority: number) => 
    priorityConfig[Math.min(Math.max(priority, 1), 10)] || priorityConfig[5];

  // Calculate queue stats
  const totalInQueue = active.length + queued.length;
  const avgPriority = queued.length > 0 
    ? Math.round(queued.reduce((sum, t) => sum + t.priority, 0) / queued.length) 
    : 0;

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Compact Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-muted-foreground">{active.length} active</span>
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-muted-foreground">{queued.length} queued</span>
            </span>
          </div>
          {queued.length > 0 && (
            <Badge variant="outline" className="text-xs">
              Avg Priority: {avgPriority}
            </Badge>
          )}
        </div>

        {/* Active Research - Compact */}
        {active.length > 0 && (
          <div className="space-y-2">
            {active.map((topic) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-2"
              >
                <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin flex-shrink-0" />
                <span className="text-sm truncate flex-1">{topic.topic}</span>
                <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
                  Active
                </Badge>
              </motion.div>
            ))}
          </div>
        )}

        {/* Queue Preview - Compact */}
        {queued.length > 0 && (
          <div className="flex items-center gap-2 overflow-hidden">
            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {queued.slice(0, 5).map((topic, idx) => {
                const config = getPriorityConfig(topic.priority);
                return (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex-shrink-0"
                  >
                    <Badge 
                      variant="outline" 
                      className="text-xs whitespace-nowrap"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${config.color} mr-1.5`} />
                      {topic.topic.length > 20 ? topic.topic.slice(0, 20) + '...' : topic.topic}
                    </Badge>
                  </motion.div>
                );
              })}
              {queued.length > 5 && (
                <span className="text-xs text-muted-foreground">+{queued.length - 5} more</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Overview Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold">Research Queue</h3>
            <p className="text-sm text-muted-foreground">
              {totalInQueue} topic{totalInQueue !== 1 ? 's' : ''} in pipeline
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {active.length} Active
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {queued.length} Queued
          </Badge>
        </div>
      </div>

      {/* Active Research Section */}
      {active.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Currently Researching
          </h4>
          
          <div className="space-y-2">
            {active.map((topic) => {
              const config = getPriorityConfig(topic.priority);
              const findingsCount = Array.isArray(topic.findings) ? topic.findings.length : 0;
              
              return (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 relative overflow-hidden"
                >
                  {/* Animated background pulse */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                  
                  <div className="relative flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{topic.topic}</span>
                        <Badge className={`${config.color} text-white text-xs`}>
                          P{topic.priority}
                        </Badge>
                      </div>
                      
                      {topic.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                          {topic.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Depth {topic.depth_level}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {findingsCount} finding{findingsCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-3 relative">
                    <Progress value={Math.min(findingsCount * 20, 95)} className="h-1" />
                    <motion.div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Queue Visualization */}
      {queued.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-amber-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Priority Queue ({queued.length})
          </h4>
          
          {/* Visual Queue */}
          <div className="relative">
            {/* Queue line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent" />
            
            <div className="space-y-2">
              {queued.map((topic, idx) => {
                const config = getPriorityConfig(topic.priority);
                
                return (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative flex items-center gap-3 pl-3"
                  >
                    {/* Queue position indicator */}
                    <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-background border-2 border-amber-500/50 text-xs font-medium">
                      {idx + 1}
                    </div>
                    
                    {/* Topic card */}
                    <div className="flex-1 p-3 rounded-lg bg-background/30 border border-border/30 hover:border-amber-500/30 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${config.color} flex-shrink-0`} />
                          <span className="text-sm truncate">{topic.topic}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                          {topic.auto_generated && (
                            <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/30">
                              Auto
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Arrow to next */}
                    {idx < queued.length - 1 && (
                      <div className="absolute left-[22px] bottom-0 translate-y-1/2">
                        <ArrowRight className="w-3 h-3 text-amber-500/30 rotate-90" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Paused Research */}
      {paused.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Pause className="w-4 h-4" />
            Paused ({paused.length})
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {paused.map((topic) => (
              <Badge
                key={topic.id}
                variant="outline"
                className="bg-gray-500/10 text-gray-400 border-gray-500/30"
              >
                <Pause className="w-3 h-3 mr-1" />
                {topic.topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recently Completed */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Recently Completed ({completed.length})
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {completed.map((topic) => (
              <Badge
                key={topic.id}
                variant="outline"
                className="bg-green-500/10 text-green-400 border-green-500/30"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {topic.topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalInQueue === 0 && completed.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No research in queue</p>
          <p className="text-sm">Start a new research topic to see it here</p>
        </div>
      )}
    </div>
  );
};
