import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "@/components/aria/ConversationPanel";
import { Bot, User, Send, Mic, MicOff, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ConversationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  isLoading: boolean;
  isRecording: boolean;
  isProcessingVoice: boolean;
  onSendMessage: (message: string) => void;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  onClearMessages: () => void;
}

export const ConversationDrawer = ({
  open,
  onOpenChange,
  messages,
  isLoading,
  isRecording,
  isProcessingVoice,
  onSendMessage,
  onVoiceStart,
  onVoiceStop,
  onClearMessages,
}: ConversationDrawerProps) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      onVoiceStop();
    } else {
      onVoiceStart();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[400px] sm:w-[540px] bg-dashboard-card border-dashboard-border p-0 flex flex-col"
      >
        <SheetHeader className="p-4 border-b border-dashboard-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-dashboard-foreground flex items-center gap-2">
              <Bot className="w-5 h-5 text-dashboard-primary" />
              Chat with Atlas
            </SheetTitle>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearMessages}
                className="text-dashboard-muted hover:text-dashboard-foreground hover:bg-dashboard-muted/20"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-dashboard-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-dashboard-primary" />
              </div>
              <h3 className="text-lg font-medium text-dashboard-foreground mb-2">
                Hi there! 👋
              </h3>
              <p className="text-sm text-dashboard-muted max-w-xs">
                I'm Atlas, your personal AI assistant. Ask me anything about your emails, calendar, stocks, or just chat!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dashboard-primary/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-dashboard-primary" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                      message.role === "user"
                        ? "bg-dashboard-primary text-white"
                        : "bg-dashboard-muted/30 text-dashboard-foreground"
                    )}
                  >
                    {message.content}
                  </div>

                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dashboard-secondary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-dashboard-secondary" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dashboard-primary/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-dashboard-primary" />
                  </div>
                  <div className="bg-dashboard-muted/30 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-dashboard-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-dashboard-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-dashboard-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-dashboard-border">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleVoiceClick}
              disabled={isProcessingVoice}
              className={cn(
                "border-dashboard-border text-dashboard-muted hover:text-dashboard-foreground hover:bg-dashboard-muted/20",
                isRecording && "bg-dashboard-danger/20 text-dashboard-danger border-dashboard-danger"
              )}
            >
              {isProcessingVoice ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isLoading || isRecording}
              className="flex-1 bg-dashboard-muted/30 border-dashboard-border text-dashboard-foreground placeholder:text-dashboard-muted"
            />
            
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-dashboard-primary hover:bg-dashboard-primary/90 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
