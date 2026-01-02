import { memo } from 'react';
import { motion } from 'framer-motion';
import { Brain, BookOpen, Lightbulb, ChevronRight, Sparkles, Type } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { BrainSearchResult as BrainSearchResultType, BrainResultType } from '@/hooks/useBrainSearch';

interface BrainSearchResultProps {
  result: BrainSearchResultType;
  onClick?: (result: BrainSearchResultType) => void;
  isSelected?: boolean;
  onFindSimilar?: (result: BrainSearchResultType) => void;
}

const typeConfig: Record<BrainResultType, { 
  icon: typeof Brain; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  knowledge: { 
    icon: Brain, 
    color: 'text-violet-400', 
    bgColor: 'bg-violet-500/10',
    label: 'Knowledge'
  },
  research: { 
    icon: BookOpen, 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/10',
    label: 'Research'
  },
  finding: { 
    icon: Lightbulb, 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/10',
    label: 'Finding'
  },
};

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  researching: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  queued: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  failed: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const formatPreview = (preview: string): JSX.Element => {
  // Convert **text** to bold
  const parts = preview.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span key={i} className="text-primary font-medium bg-primary/10 px-0.5 rounded">
              {part.slice(2, -2)}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export const BrainSearchResult = memo(({ result, onClick, isSelected, onFindSimilar }: BrainSearchResultProps) => {
  const config = typeConfig[result.type];
  const Icon = config.icon;
  const isSemanticResult = result.source === 'semantic';
  
  return (
    <motion.button
      onClick={() => onClick?.(result)}
      className={`w-full text-left p-4 rounded-xl border transition-all group ${
        isSelected 
          ? 'bg-primary/10 border-primary/50' 
          : 'bg-background/30 border-border/30 hover:bg-background/50 hover:border-border/50'
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0 relative`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
          {isSemanticResult && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
              <Sparkles className="w-2 h-2 text-primary-foreground" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
            {result.category && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {result.category}
              </Badge>
            )}
            {result.status && (
              <Badge 
                variant="outline" 
                className={`text-[10px] px-1.5 py-0 ${statusColors[result.status] || ''}`}
              >
                {result.status}
              </Badge>
            )}
            {/* Semantic match indicator */}
            {isSemanticResult && result.similarity !== undefined && (
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0 bg-primary/10 border-primary/30 text-primary gap-1"
              >
                <Sparkles className="w-2.5 h-2.5" />
                {Math.round(result.similarity * 100)}% match
              </Badge>
            )}
            {result.source === 'keyword' && (
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0 bg-muted/50 gap-1"
              >
                <Type className="w-2.5 h-2.5" />
                keyword
              </Badge>
            )}
          </div>
          
          {/* Title */}
          <h4 className="font-medium text-foreground truncate mb-1 group-hover:text-primary transition-colors">
            {result.title}
          </h4>
          
          {/* Preview */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {formatPreview(result.preview)}
          </p>
          
          {/* Footer with confidence/similarity and date */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {result.similarity !== undefined && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">Similarity:</span>
                <div className="w-16">
                  <Progress 
                    value={result.similarity * 100} 
                    className="h-1.5"
                  />
                </div>
                <span className="text-xs text-primary font-medium">
                  {Math.round(result.similarity * 100)}%
                </span>
              </div>
            )}
            {result.confidence !== undefined && !result.similarity && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <div className="w-16">
                  <Progress 
                    value={result.confidence * 100} 
                    className="h-1.5"
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(result.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
      </div>
    </motion.button>
  );
});

BrainSearchResult.displayName = 'BrainSearchResult';
