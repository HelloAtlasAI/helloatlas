import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Brain, Database, ArrowRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LearningSession {
  id: string;
  topic: string;
  mode: string;
  status: string;
  discoveries: unknown[];
  created_at: string;
  ended_at?: string;
}

interface DataFlow {
  id: string;
  type: 'knowledge' | 'research' | 'conversation';
  content: string;
  timestamp: Date;
}

interface LearningFlowVisualizationProps {
  compact?: boolean;
}

export const LearningFlowVisualization = ({ compact = false }: LearningFlowVisualizationProps) => {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [dataFlows, setDataFlows] = useState<DataFlow[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [learningTopic, setLearningTopic] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('atlas_learning_sessions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setSessions(data as LearningSession[]);
        setIsLearning(data.length > 0);
      }
    };

    fetchSessions();

    // Subscribe to realtime updates for all learning-related tables
    const knowledgeChannel = supabase
      .channel('learning_flow_knowledge')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'atlas_knowledge_entries' },
        (payload) => {
          const newFlow: DataFlow = {
            id: payload.new.id as string,
            type: 'knowledge',
            content: payload.new.topic as string,
            timestamp: new Date(),
          };
          setDataFlows(prev => [newFlow, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    const researchChannel = supabase
      .channel('learning_flow_research')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'atlas_research_topics' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newFlow: DataFlow = {
              id: payload.new.id as string,
              type: 'research',
              content: payload.new.topic as string,
              timestamp: new Date(),
            };
            setDataFlows(prev => [newFlow, ...prev].slice(0, 10));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(knowledgeChannel);
      supabase.removeChannel(researchChannel);
    };
  }, []);

  const startLearningMode = async () => {
    if (!learningTopic.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('atlas_learning_sessions')
      .insert({
        user_id: user?.id,
        topic: learningTopic,
        mode: 'explore',
        status: 'active',
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to start learning session',
        variant: 'destructive',
      });
      return;
    }

    setIsLearning(true);
    setLearningTopic('');
    toast({
      title: 'Learning Mode Activated',
      description: `Atlas is now exploring: ${learningTopic}`,
    });
  };

  const stopLearningMode = async () => {
    const { error } = await supabase
      .from('atlas_learning_sessions')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('status', 'active');

    if (!error) {
      setIsLearning(false);
      setSessions([]);
      toast({
        title: 'Learning Mode Stopped',
        description: 'All learning sessions have been paused',
      });
    }
  };

  const flowTypeColors: Record<string, string> = {
    knowledge: 'bg-primary/20 text-primary border-primary/30',
    research: 'bg-secondary/20 text-secondary border-secondary/30',
    conversation: 'bg-accent/20 text-accent border-accent/30',
  };

  const flowTypeIcons: Record<string, typeof Brain> = {
    knowledge: Brain,
    research: Database,
    conversation: Zap,
  };

  return (
    <div className="space-y-6">
      {/* Learning Mode Controls */}
      {!compact && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Learning Mode
            </h3>
            
            <Badge 
              variant={isLearning ? 'default' : 'secondary'}
              className={isLearning ? 'animate-pulse' : ''}
            >
              {isLearning ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Input
              placeholder="Enter a topic to learn about..."
              value={learningTopic}
              onChange={(e) => setLearningTopic(e.target.value)}
              className="bg-background/50"
              disabled={isLearning}
            />
            
            {isLearning ? (
              <Button variant="destructive" onClick={stopLearningMode}>
                <Pause className="w-4 h-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button onClick={startLearningMode} disabled={!learningTopic.trim()}>
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Active Sessions */}
      {sessions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Active Sessions</h4>
          {sessions.map(session => (
            <div 
              key={session.id}
              className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="flex-1">{session.topic}</span>
              <Badge variant="outline">{session.mode}</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Real-time Data Flow */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Database className="w-4 h-4" />
          Real-time Data Flow
        </h4>
        
        <div className={`space-y-2 ${compact ? 'max-h-[200px]' : 'max-h-[400px]'} overflow-y-auto scrollbar-thin`}>
          <AnimatePresence mode="popLayout">
            {dataFlows.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-muted-foreground"
              >
                <ArrowRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Waiting for data...</p>
              </motion.div>
            ) : (
              dataFlows.map((flow, index) => {
                const Icon = flowTypeIcons[flow.type];
                
                return (
                  <motion.div
                    key={flow.id}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{ delay: index * 0.02 }}
                    className={`p-3 rounded-lg border flex items-center gap-3 ${flowTypeColors[flow.type]}`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-sm truncate">{flow.content}</span>
                    <span className="text-xs opacity-60">
                      {flow.timestamp.toLocaleTimeString()}
                    </span>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
