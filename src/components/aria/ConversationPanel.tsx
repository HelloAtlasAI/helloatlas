import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ConversationPanelProps {
  messages: Message[];
  className?: string;
}

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
