import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronRight, 
  Play, 
  Pause, 
  Loader2, 
  Plus,
  Target,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface ResearchTopic {
  id: string;
  parent_id?: string;
  topic: string;
  description?: string;
  status: string;
  depth_level: number;
  findings: unknown[];
  sources: unknown[];
  priority: number;
  auto_generated: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface ResearchExplorerProps {
  topics: ResearchTopic[];
  isLoading: boolean;
  onStartResearch: (topic: string, description?: string) => Promise<unknown>;
}

const statusConfig: Record<string, { color: string; icon: typeof Play }> = {
  queued: { color: 'bg-gray-500/20 text-gray-400', icon: Clock },
  researching: { color: 'bg-blue-500/20 text-blue-400', icon: Loader2 },
  completed: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  paused: { color: 'bg-amber-500/20 text-amber-400', icon: Pause },
};

export const ResearchExplorer = ({ 
  topics, 
  isLoading, 
  onStartResearch 
}: ResearchExplorerProps) => {
  const [newTopic, setNewTopic] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreateResearch = async () => {
    if (!newTopic.trim()) return;
    
    setIsCreating(true);
    await onStartResearch(newTopic, newDescription);
    setNewTopic('');
    setNewDescription('');
    setIsCreating(false);
  };

  // Build tree structure
  const rootTopics = topics.filter(t => !t.parent_id);
  const getChildren = (parentId: string) => topics.filter(t => t.parent_id === parentId);

  const renderTopic = (topic: ResearchTopic, depth: number = 0) => {
    const children = getChildren(topic.id);
    const config = statusConfig[topic.status] || statusConfig.queued;
    const StatusIcon = config.icon;
    const isExpanded = expandedId === topic.id;

    return (
      <motion.div
        key={topic.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2"
        style={{ marginLeft: depth * 24 }}
      >
        <div 
          className={`p-4 rounded-xl bg-background/30 border border-border/30 hover:border-primary/30 transition-colors cursor-pointer ${
            topic.status === 'researching' ? 'ring-2 ring-primary/30' : ''
          }`}
          onClick={() => setExpandedId(isExpanded ? null : topic.id)}
        >
          <div className="flex items-start gap-3">
            {children.length > 0 && (
              <ChevronRight 
                className={`w-5 h-5 mt-0.5 text-muted-foreground transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={config.color}>
                  <StatusIcon className={`w-3 h-3 mr-1 ${
                    topic.status === 'researching' ? 'animate-spin' : ''
                  }`} />
                  {topic.status}
                </Badge>
                <span className="font-medium">{topic.topic}</span>
                {topic.auto_generated && (
                  <Badge variant="outline" className="text-xs">Auto</Badge>
                )}
              </div>
              
              {topic.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {topic.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Depth: {topic.depth_level}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {Array.isArray(topic.findings) ? topic.findings.length : 0} findings
                </span>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-border/30"
              >
                {Array.isArray(topic.findings) && topic.findings.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Findings:</h4>
                    <div className="space-y-1">
                      {topic.findings.map((finding, idx) => (
                        <div key={idx} className="text-sm text-muted-foreground p-2 bg-background/50 rounded">
                          {typeof finding === 'string' ? finding : JSON.stringify(finding)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No findings yet</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isExpanded && children.length > 0 && (
          <div className="space-y-2">
            {children.map(child => renderTopic(child, depth + 1))}
          </div>
        )}
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Research Form */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Start New Research
        </h3>
        
        <div className="space-y-3">
          <Input
            placeholder="Research topic..."
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            className="bg-background/50"
          />
          
          <Textarea
            placeholder="Description (optional)..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
            className="bg-background/50"
          />
          
          <Button 
            onClick={handleCreateResearch}
            disabled={!newTopic.trim() || isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting Research...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Research
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Research Topics Tree */}
      <div className="space-y-3">
        {rootTopics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No research topics yet</p>
            <p className="text-sm">Start a new research topic above</p>
          </div>
        ) : (
          rootTopics.map(topic => renderTopic(topic))
        )}
      </div>
    </div>
  );
};
