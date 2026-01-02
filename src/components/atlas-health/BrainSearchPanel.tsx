import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Brain, 
  BookOpen, 
  Lightbulb, 
  SlidersHorizontal,
  Command,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { BrainSearchResult } from './BrainSearchResult';
import { useBrainSearch, BrainResultType, BrainSearchResult as BrainSearchResultType } from '@/hooks/useBrainSearch';

interface BrainSearchPanelProps {
  onResultClick?: (result: BrainSearchResultType) => void;
  compact?: boolean;
}

const typeFilters: { type: BrainResultType; icon: typeof Brain; label: string; color: string }[] = [
  { type: 'knowledge', icon: Brain, label: 'Knowledge', color: 'violet' },
  { type: 'research', icon: BookOpen, label: 'Research', color: 'cyan' },
  { type: 'finding', icon: Lightbulb, label: 'Findings', color: 'amber' },
];

export const BrainSearchPanel = ({ onResultClick, compact = false }: BrainSearchPanelProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedTypes, setSelectedTypes] = useState<BrainResultType[]>(['knowledge', 'research', 'finding']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minConfidence, setMinConfidence] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    query, 
    setQuery, 
    results, 
    resultsByType,
    isLoading, 
    isSearching,
    allCategories,
    totalResults,
    clearSearch 
  } = useBrainSearch({
    types: selectedTypes,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    minConfidence,
  });
  
  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        clearSearch();
        inputRef.current?.blur();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSearch]);
  
  const toggleType = useCallback((type: BrainResultType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);
  
  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);
  
  const hasActiveFilters = selectedCategories.length > 0 || minConfidence > 0;
  
  return (
    <div className={`flex flex-col ${compact ? 'h-[400px]' : 'h-full min-h-[600px]'}`}>
      {/* Search Header */}
      <div className="flex-shrink-0 space-y-4 mb-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search knowledge, research, findings..."
            className="pl-10 pr-24 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl text-base"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isSearching && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={clearSearch}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border/50 bg-muted/50 px-1.5 text-[10px] text-muted-foreground">
              <Command className="w-3 h-3" />K
            </kbd>
          </div>
        </div>
        
        {/* Type Filters & Filter Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {typeFilters.map(({ type, icon: Icon, label, color }) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              onClick={() => toggleType(type)}
              className={`gap-1.5 rounded-lg transition-all ${
                selectedTypes.includes(type)
                  ? `bg-${color}-500/20 border-${color}-500/50 text-${color}-400`
                  : 'bg-background/30 border-border/30 text-muted-foreground'
              }`}
              style={{
                backgroundColor: selectedTypes.includes(type) ? `hsl(var(--${color === 'violet' ? 'primary' : color === 'cyan' ? 'secondary' : 'accent'}) / 0.2)` : undefined,
                borderColor: selectedTypes.includes(type) ? `hsl(var(--${color === 'violet' ? 'primary' : color === 'cyan' ? 'secondary' : 'accent'}) / 0.5)` : undefined,
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {query && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">
                  {resultsByType[type].length}
                </Badge>
              )}
            </Button>
          ))}
          
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`gap-1.5 rounded-lg ml-auto ${
                  hasActiveFilters ? 'bg-primary/20 border-primary/50' : 'bg-background/30 border-border/30'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 bg-primary/30">
                    {selectedCategories.length + (minConfidence > 0 ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                {/* Categories */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {allCategories.map(category => (
                      <Button
                        key={category}
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCategory(category)}
                        className={`text-xs h-7 ${
                          selectedCategories.includes(category)
                            ? 'bg-primary/20 border-primary/50'
                            : ''
                        }`}
                      >
                        {category}
                      </Button>
                    ))}
                    {allCategories.length === 0 && (
                      <span className="text-xs text-muted-foreground">No categories found</span>
                    )}
                  </div>
                </div>
                
                {/* Confidence Threshold */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Min. Confidence</h4>
                    <span className="text-xs text-muted-foreground">{Math.round(minConfidence * 100)}%</span>
                  </div>
                  <Slider
                    value={[minConfidence]}
                    onValueChange={([v]) => setMinConfidence(v)}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                
                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedCategories([]);
                      setMinConfidence(0);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Results */}
      <ScrollArea className="flex-1">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </motion.div>
          ) : query && results.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground/70">
                Try different keywords or adjust your filters
              </p>
            </motion.div>
          ) : query ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="text-sm text-muted-foreground mb-3">
                {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
              </div>
              {results.map((result) => (
                <BrainSearchResult
                  key={result.id}
                  result={result}
                  onClick={onResultClick}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-1">Search Atlas Brain</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Search across all knowledge entries, research topics, and findings
              </p>
              <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5 text-violet-400" />
                  {resultsByType.knowledge.length || '–'} knowledge
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  {resultsByType.research.length || '–'} research
                </span>
                <span className="flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  {resultsByType.finding.length || '–'} findings
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
};
