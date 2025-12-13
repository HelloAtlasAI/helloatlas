import { useState, KeyboardEvent } from "react";
import { Send, Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => Promise<string | null>;
  isListening?: boolean;
  isRecording?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = ({
  onSend,
  onVoiceStart,
  onVoiceStop,
  isListening = false,
  isRecording = false,
  disabled = false,
  placeholder = "Ask ARIA anything...",
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

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

  const handleVoiceClick = async () => {
    if (isRecording && onVoiceStop) {
      setIsProcessingVoice(true);
      const transcription = await onVoiceStop();
      setIsProcessingVoice(false);
      
      if (transcription) {
        onSend(transcription);
      }
    } else if (onVoiceStart) {
      onVoiceStart();
    }
  };

  return (
    <div className="relative">
      {/* Glow effect when recording */}
      {isRecording && (
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 via-accent/50 to-secondary/50 rounded-2xl blur animate-pulse" />
      )}
      
      <div className={cn(
        "relative flex items-center gap-2 p-2 rounded-2xl bg-card/60 backdrop-blur-xl border transition-colors group",
        isRecording 
          ? "border-primary/50" 
          : "border-border/50 focus-within:border-primary/50"
      )}>
        {/* Voice button */}
        {(onVoiceStart || onVoiceStop) && (
          <button
            onClick={handleVoiceClick}
            disabled={disabled || isProcessingVoice}
            className={cn(
              "p-3 rounded-xl transition-all duration-200",
              "hover:bg-muted/50 active:scale-95",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isRecording
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isProcessingVoice ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isRecording ? (
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
          disabled={disabled || isRecording}
          placeholder={isRecording ? "Listening..." : placeholder}
          className={cn(
            "flex-1 bg-transparent text-foreground placeholder:text-muted-foreground",
            "text-sm outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim() || isRecording}
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
