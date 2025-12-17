import { ExternalLink, Globe, FileText, Shield, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Citation {
  url: string;
  title?: string;
  snippet?: string;
  domain?: string;
  credibility_score?: number;
  accessed_at?: string;
}

interface CitationsListProps {
  citations: (Citation | string)[];
  className?: string;
  compact?: boolean;
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// Get favicon URL for a domain
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}

// Get credibility badge color
function getCredibilityColor(score: number): string {
  if (score >= 0.8) return 'text-green-400';
  if (score >= 0.6) return 'text-yellow-400';
  return 'text-orange-400';
}

export const CitationsList = ({ citations, className, compact = false }: CitationsListProps) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  // Normalize citations to objects
  const normalizedCitations: Citation[] = citations.map(c => 
    typeof c === 'string' ? { url: c } : c
  );

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {normalizedCitations.slice(0, 5).map((citation, idx) => {
          const domain = citation.domain || extractDomain(citation.url);
          return (
            <a
              key={idx}
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
              title={citation.title || citation.url}
            >
              <img 
                src={getFaviconUrl(citation.url)} 
                alt=""
                className="w-3 h-3"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="truncate max-w-[100px]">{domain}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </a>
          );
        })}
        {normalizedCitations.length > 5 && (
          <Badge variant="outline" className="text-xs">
            +{normalizedCitations.length - 5} more
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <FileText className="w-4 h-4" />
        <span>Sources ({normalizedCitations.length})</span>
      </div>
      
      <div className="space-y-2">
        {normalizedCitations.map((citation, idx) => {
          const domain = citation.domain || extractDomain(citation.url);
          
          return (
            <a
              key={idx}
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:border-primary/30 hover:bg-background/80 transition-all group"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
                <img 
                  src={getFaviconUrl(citation.url)} 
                  alt=""
                  className="w-5 h-5"
                  onError={(e) => {
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = '<svg class="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                    }
                  }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary group-hover:underline truncate">
                    {citation.title || domain}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                </div>
                
                <div className="flex items-center gap-2 mt-0.5">
                  <Globe className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">{domain}</span>
                  
                  {citation.credibility_score !== undefined && (
                    <span className={cn("flex items-center gap-0.5 text-xs", getCredibilityColor(citation.credibility_score))}>
                      <Shield className="w-3 h-3" />
                      {Math.round(citation.credibility_score * 100)}%
                    </span>
                  )}
                </div>
                
                {citation.snippet && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {citation.snippet}
                  </p>
                )}
              </div>
              
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">
                {idx + 1}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
};

// Inline citation component for use within text
export const InlineCitation = ({ 
  index, 
  url, 
  title 
}: { 
  index: number; 
  url: string; 
  title?: string;
}) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-medium rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors align-super ml-0.5"
      title={title || url}
    >
      {index}
    </a>
  );
};
