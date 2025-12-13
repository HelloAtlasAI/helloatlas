import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AIAvatar3D } from "@/components/aria/AIAvatar3D";
import { AIOrb } from "@/components/aria/AIOrb";
import { ChatInput } from "@/components/aria/ChatInput";
import { FloatingCards, demoCards } from "@/components/aria/FloatingCards";
import { BackgroundEffects } from "@/components/aria/BackgroundEffects";
import { ConversationPanel } from "@/components/aria/ConversationPanel";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Loader2, Volume2, VolumeX } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const [cards, setCards] = useState(demoCards);
  const [use3DAvatar, setUse3DAvatar] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const {
    isRecording,
    isPlaying,
    audioLevel,
    startRecording,
    stopRecording,
    speakText,
  } = useVoice();

  const handleSpeakResponse = useCallback((text: string) => {
    if (voiceEnabled) {
      speakText(text);
    }
  }, [voiceEnabled, speakText]);

  const { messages, aiState, setAiState, isLoading, sendMessage } = useChat({
    onSpeakResponse: handleSpeakResponse,
  });

  // Determine effective AI state
  const effectiveAiState = isRecording ? "listening" : isPlaying ? "speaking" : aiState;

  const handleCardClose = (id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  };

  const handleVoiceStart = async () => {
    const started = await startRecording();
    if (started) {
      setAiState("listening");
    }
  };

  const handleVoiceStop = async () => {
    const text = await stopRecording();
    setAiState("idle");
    return text;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Background effects */}
      <BackgroundEffects />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">A</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">ARIA</h1>
            <p className="text-xs text-muted-foreground">AI Research Assistant</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {/* Voice toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            title={voiceEnabled ? "Disable voice responses" : "Enable voice responses"}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Avatar toggle */}
          <button
            onClick={() => setUse3DAvatar(!use3DAvatar)}
            className="px-3 py-1.5 text-xs rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          >
            {use3DAvatar ? "2D Mode" : "3D Mode"}
          </button>

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  {user?.user_metadata?.display_name || user?.email?.split("@")[0]}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 text-sm rounded-xl bg-primary/10 text-primary hover:bg-primary/20"
            >
              Sign In
            </Button>
          )}
        </nav>
      </header>

      {/* Floating data cards */}
      <FloatingCards cards={cards} onCardClose={handleCardClose} />

      {/* Main content - AI Avatar */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        {/* Welcome text */}
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-light text-foreground mb-2">
            Hello{user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ""}.
            I'm <span className="font-semibold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">ARIA</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Your personal AI assistant. Ask me anything or tap the mic to talk.
          </p>
        </div>

        {/* AI Avatar - 3D or 2D */}
        {use3DAvatar ? (
          <div className="w-80 h-80 mb-16">
            <AIAvatar3D state={effectiveAiState} audioLevel={audioLevel} />
          </div>
        ) : (
          <AIOrb state={effectiveAiState} className="mb-16" />
        )}

        {/* Conversation panel */}
        <ConversationPanel messages={messages} />
      </main>

      {/* Bottom input area */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <ChatInput
            onSend={sendMessage}
            onVoiceStart={handleVoiceStart}
            onVoiceStop={handleVoiceStop}
            isRecording={isRecording}
            isListening={effectiveAiState === "listening"}
            disabled={isLoading || isPlaying}
          />
          
          {/* Quick action chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["Check my emails", "Find flights", "Stock prices", "Create document"].map((action) => (
              <button
                key={action}
                onClick={() => sendMessage(action)}
                disabled={isLoading || isPlaying}
                className="px-3 py-1.5 text-xs rounded-full bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors border border-border/30 disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
