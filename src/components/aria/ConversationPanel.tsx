import { cn } from "@/lib/utils";
import { Bot, User, ExternalLink } from "lucide-react";

export interface Citation {
  url: string;
  title?: string;
  domain?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: Citation[];
}

interface ConversationPanelProps {
  messages: Message[];
  className?: string;
}

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
};

const getFaviconUrl = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
  } catch {
    return '';
  }
};

const InlineCitations = ({ citations }: { citations: Citation[] }) => {
  if (!citations || citations.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/30">
      {citations.slice(0, 4).map((citation, idx) => {
        const domain = citation.domain || extractDomain(citation.url);
        return (
          <a
            key={idx}
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-primary/10 hover:bg-primary/20 text-primary/80 transition-colors"
            title={citation.title || citation.url}
          >
            <img 
              src={getFaviconUrl(citation.url)} 
              alt=""
              className="w-2.5 h-2.5"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="truncate max-w-[60px]">{domain}</span>
            <ExternalLink className="w-2 h-2 opacity-50" />
          </a>
        );
      })}
      {citations.length > 4 && (
        <span className="text-[10px] text-muted-foreground px-1">
          +{citations.length - 4}
        </span>
      )}
    </div>
  );
};

export const ConversationPanel = ({ messages, className }: ConversationPanelProps) => {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute bottom-28 left-1/2 -translate-x-1/2 w-full max-w-lg",
        "max-h-48 overflow-y-auto scrollbar-thin",
        "rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50",
        "p-4 space-y-3",
        className
      )}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3 animate-fade-in",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.role === "assistant" && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
          )}
          
          <div
            className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
              message.role === "user"
                ? "bg-primary/20 text-foreground"
                : "bg-muted/50 text-foreground"
            )}
          >
            {message.content}
            {message.role === "assistant" && message.citations && message.citations.length > 0 && (
              <InlineCitations citations={message.citations} />
            )}
          </div>

          {message.role === "user" && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-secondary" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
