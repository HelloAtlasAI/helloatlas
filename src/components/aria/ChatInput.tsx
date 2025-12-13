import { useState, KeyboardEvent } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onVoiceToggle?: () => void;
  isListening?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = ({
  onSend,
  onVoiceToggle,
  isListening = false,
  disabled = false,
  placeholder = "Ask ARIA anything...",
}: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative">
      {/* Glow effect when focused */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-accent/30 to-secondary/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
      
      <div className="relative flex items-center gap-2 p-2 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 focus-within:border-primary/50 transition-colors group">
        {/* Voice button */}
        {onVoiceToggle && (
          <button
            onClick={onVoiceToggle}
            disabled={disabled}
            className={cn(
              "p-3 rounded-xl transition-all duration-200",
              "hover:bg-muted/50 active:scale-95",
              isListening
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isListening ? (
              <Mic className="w-5 h-5 animate-pulse" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Input field */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "flex-1 bg-transparent text-foreground placeholder:text-muted-foreground",
            "text-sm outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className={cn(
            "p-3 rounded-xl transition-all duration-200",
            "bg-primary/10 text-primary",
            "hover:bg-primary/20 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary/10"
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
