import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, Lightbulb, Globe, Sparkles, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QueueItem {
  id: string;
  topic: string;
  source: string;
  status: string;
  priority_score: number;
  category: string | null;
  created_at: string;
}

interface LiveCollectionStreamProps {
  items: QueueItem[];
  isLoading?: boolean;
}

export function LiveCollectionStream({ items, isLoading }: LiveCollectionStreamProps) {
  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'news_pulse':
      case 'newsapi':
        return <Newspaper className="w-4 h-4" />;
      case 'perplexity':
        return <Sparkles className="w-4 h-4" />;
      case 'firecrawl':
        return <Globe className="w-4 h-4" />;
      case 'topic_discovery':
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'news_pulse':
      case 'newsapi':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'perplexity':
        return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      case 'firecrawl':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'topic_discovery':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 0.8) return 'bg-red-500/20 text-red-400';
    if (score >= 0.6) return 'bg-amber-500/20 text-amber-400';
    if (score >= 0.4) return 'bg-emerald-500/20 text-emerald-400';
    return 'bg-muted/20 text-muted-foreground';
  };

  const recentItems = items
    .filter(item => item.status === 'queued' || item.status === 'processing')
    .slice(0, 15);

  return (
    <div className="backdrop-blur-xl bg-background/30 border border-border/30 rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Newspaper className="w-5 h-5 text-amber-400" />
            <motion.div
              className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <h3 className="text-lg font-semibold">Live Collection</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {recentItems.length} items
        </span>
      </div>

      <ScrollArea className="h-[320px] pr-2">
        <AnimatePresence mode="popLayout">
          {recentItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.05,
                height: { duration: 0.2 }
              }}
              className="mb-2"
            >
              <div className="p-3 bg-background/20 rounded-xl border border-border/20 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  {/* Source Badge */}
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs ${getSourceColor(item.source)}`}>
                    {getSourceIcon(item.source)}
                    <span className="capitalize">{item.source.replace('_', ' ')}</span>
                  </div>
                  
                  {/* Priority Badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority_score)}`}>
                    {Math.round(item.priority_score * 100)}%
                  </div>
                </div>

                {/* Topic */}
                <p className="mt-2 text-sm line-clamp-2">{item.topic}</p>

                {/* Metadata */}
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span className="capitalize">{item.category || 'general'}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </div>
                </div>

                {/* Processing Indicator */}
                {item.status === 'processing' && (
                  <motion.div
                    className="mt-2 h-1 bg-primary/30 rounded-full overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="h-full bg-primary"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      style={{ width: '50%' }}
                    />
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {recentItems.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Newspaper className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No items in collection queue</p>
            <p className="text-xs mt-1">Trigger a brain cycle to start collecting</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
