import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, Clock, Star, ChevronDown, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAtlasKnowledge } from '@/hooks/useAtlasKnowledge';

interface KnowledgeBankPanelProps {
  compact?: boolean;
  limit?: number;
}

export const KnowledgeBankPanel = ({ compact = false, limit }: KnowledgeBankPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const { knowledge, isLoading, categories } = useAtlasKnowledge();

  const filteredKnowledge = knowledge
    .filter(entry => {
      const matchesSearch = !searchQuery || 
        entry.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(entry.content).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || entry.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .slice(0, limit);

  const categoryColors: Record<string, string> = {
    'user_preference': 'bg-blue-500/20 text-blue-400',
    'learned_fact': 'bg-green-500/20 text-green-400',
    'research_topic': 'bg-purple-500/20 text-purple-400',
    'conversation': 'bg-amber-500/20 text-amber-400',
    'general': 'bg-gray-500/20 text-gray-400',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredKnowledge.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No knowledge entries yet</p>
              <p className="text-sm">Atlas will learn from your conversations</p>
            </motion.div>
          ) : (
            filteredKnowledge.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-background/30 border border-border/30 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={categoryColors[entry.category] || categoryColors.general}>
                        {entry.category}
                      </Badge>
                      <span className="text-sm font-medium">{entry.topic}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {(entry.confidence * 100).toFixed(0)}% confidence
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <ChevronDown 
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      expandedId === entry.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                <AnimatePresence>
                  {expandedId === entry.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-border/30"
                    >
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {JSON.stringify(entry.content, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
