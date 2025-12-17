import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, Clock, Star, ChevronDown, Filter, Tag, MessageSquare, BookOpen, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAtlasKnowledge } from '@/hooks/useAtlasKnowledge';

interface KnowledgeBankPanelProps {
  compact?: boolean;
  limit?: number;
}

// Helper to parse and display content nicely
const formatContent = (content: Record<string, unknown>): { summary: string; details: string[] } => {
  const summary = (content.summary as string) || 
                  (content.text as string) || 
                  (content.message as string) || 
                  (content.value as string) ||
                  JSON.stringify(content).slice(0, 100);
  
  const details: string[] = [];
  
  if (content.details && typeof content.details === 'string') {
    details.push(content.details);
  }
  if (content.source && typeof content.source === 'string') {
    details.push(`Source: ${content.source}`);
  }
  if (content.context && typeof content.context === 'string') {
    details.push(`Context: ${content.context}`);
  }
  
  return { summary: summary.slice(0, 200), details };
};

// Get icon for category
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'user_preference': return User;
    case 'learned_fact': return BookOpen;
    case 'research_topic': return Search;
    case 'conversation': return MessageSquare;
    default: return Brain;
  }
};

export const KnowledgeBankPanel = ({ compact = false, limit }: KnowledgeBankPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const { knowledge, isLoading, categories } = useAtlasKnowledge();

  const filteredKnowledge = useMemo(() => {
    return knowledge
      .filter(entry => {
        const matchesSearch = !searchQuery || 
          entry.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
          JSON.stringify(entry.content).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || entry.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .slice(0, limit);
  }, [knowledge, searchQuery, selectedCategory, limit]);

  const categoryConfig: Record<string, { color: string; bg: string; label: string }> = {
    'user_preference': { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Preference' },
    'learned_fact': { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Fact' },
    'research_topic': { color: 'text-violet-400', bg: 'bg-violet-500/20', label: 'Research' },
    'conversation': { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Conversation' },
    'general': { color: 'text-muted-foreground', bg: 'bg-muted/30', label: 'General' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Loading knowledge...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search knowledge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border/30 focus:border-primary/50"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {categories.map(cat => {
              const config = categoryConfig[cat] || categoryConfig.general;
              return (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`flex-shrink-0 ${selectedCategory === cat ? '' : 'bg-background/30 border-border/30'}`}
                >
                  {config.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredKnowledge.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                <Brain className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">No knowledge entries yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Atlas will learn from your conversations</p>
            </motion.div>
          ) : (
            filteredKnowledge.map((entry, index) => {
              const config = categoryConfig[entry.category] || categoryConfig.general;
              const CategoryIcon = getCategoryIcon(entry.category);
              const { summary, details } = formatContent(entry.content as Record<string, unknown>);
              const confidencePercent = Math.round(entry.confidence * 100);
              
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  className={`group p-4 rounded-xl backdrop-blur-sm bg-background/20 border border-border/20 
                    hover:border-primary/30 hover:bg-background/30 transition-all cursor-pointer`}
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <CategoryIcon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`${config.bg} ${config.color} border-0 text-[10px]`}>
                          {config.label}
                        </Badge>
                        <span className="text-sm font-medium truncate">{entry.topic}</span>
                      </div>
                      
                      {/* Summary preview */}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {summary}
                      </p>
                      
                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                        {/* Confidence meter */}
                        <div className="flex items-center gap-2">
                          <Star className="w-3 h-3" />
                          <div className="w-16 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                            <motion.div 
                              className="h-full bg-primary/60 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${confidencePercent}%` }}
                              transition={{ delay: index * 0.05, duration: 0.5 }}
                            />
                          </div>
                          <span>{confidencePercent}%</span>
                        </div>
                        
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Expand indicator */}
                    <ChevronDown 
                      className={`w-5 h-5 text-muted-foreground/50 transition-transform flex-shrink-0 ${
                        expandedId === entry.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {expandedId === entry.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-border/20 space-y-3">
                          {details.length > 0 && (
                            <div className="space-y-2">
                              {details.map((detail, i) => (
                                <p key={i} className="text-sm text-muted-foreground bg-background/30 p-2 rounded-lg">
                                  {detail}
                                </p>
                              ))}
                            </div>
                          )}
                          
                          {/* Full content display */}
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                              View raw data
                            </summary>
                            <pre className="mt-2 p-3 rounded-lg bg-background/40 text-muted-foreground overflow-x-auto">
                              {JSON.stringify(entry.content, null, 2)}
                            </pre>
                          </details>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
