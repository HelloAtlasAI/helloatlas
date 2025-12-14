import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { UnifiedVisualization, VisualizationMode } from "@/components/aria/UnifiedVisualization";
import { HolographicCards, demoHolographicCards } from "@/components/aria/HolographicCard";
import { StateIndicator } from "@/components/aria/StateIndicator";
import { VisualizationModeSwitch } from "@/components/aria/VisualizationModeSwitch";
import { ChatInput } from "@/components/aria/ChatInput";
import { ConversationPanel } from "@/components/aria/ConversationPanel";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Loader2, Volume2, VolumeX } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, signOut } = useAuth();
  const [cards, setCards] = useState(demoHolographicCards);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>("face");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const APP_NAME = "Atlas";

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
      {/* FULLSCREEN 3D Canvas - covers entire viewport */}
      <div className="fixed inset-0 z-0">
        <UnifiedVisualization
          mode={visualizationMode}
          state={effectiveAiState}
          audioLevel={audioLevel}
          isSpeaking={isPlaying}
        />
      </div>

      {/* Header - on top of 3D */}
      <header className="relative z-30 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden backdrop-blur-md"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--secondary) / 0.3))",
              boxShadow: "0 0 30px hsl(var(--primary) / 0.3), inset 0 1px 0 hsl(var(--foreground) / 0.1)",
            }}
          >
            <span className="text-xl font-bold text-foreground">A</span>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{APP_NAME}</h1>
            <p className="text-xs text-muted-foreground">Neural AI Interface</p>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <StateIndicator state={effectiveAiState} />
          
          {/* Visualization mode switch */}
          <VisualizationModeSwitch 
            mode={visualizationMode} 
            onModeChange={setVisualizationMode} 
          />
          
          {/* Voice toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="p-2.5 rounded-xl bg-muted/20 backdrop-blur-sm hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all border border-border/20"
            title={voiceEnabled ? "Disable voice responses" : "Enable voice responses"}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/20 backdrop-blur-sm border border-border/20">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">
                  {user?.user_metadata?.display_name || user?.email?.split("@")[0]}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground rounded-xl"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 text-sm rounded-xl bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
            >
              Sign In
            </Button>
          )}
        </nav>
      </header>

      {/* Holographic data cards */}
      <div className="relative z-10">
        <HolographicCards cards={cards} onCardClose={handleCardClose} />
      </div>

      {/* Main content - welcome text */}
      <main className="relative z-20 flex flex-col items-center pt-8 pointer-events-none">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-extralight text-foreground mb-2 tracking-wide drop-shadow-lg">
            {user?.user_metadata?.display_name ? `Hello, ${user.user_metadata.display_name}` : "Welcome"}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base font-light drop-shadow-md">
            I'm <span className="font-medium bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">{APP_NAME}</span>, your neural AI interface
          </p>
        </div>

        {/* Conversation panel */}
        <div className="w-full max-w-2xl px-4 mt-[45vh] pointer-events-auto">
          <ConversationPanel messages={messages} />
        </div>
      </main>

      {/* Bottom input area */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <ChatInput
            onSend={sendMessage}
            onVoiceStart={handleVoiceStart}
            onVoiceStop={handleVoiceStop}
            isRecording={isRecording}
            isListening={effectiveAiState === "listening"}
            disabled={isLoading || isPlaying}
          />
          
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["Check emails", "Search flights", "Stock analysis", "Create document"].map((action) => (
              <button
                key={action}
                onClick={() => sendMessage(action)}
                disabled={isLoading || isPlaying}
                className="px-4 py-2 text-xs rounded-full bg-muted/20 backdrop-blur-sm text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all border border-border/20 hover:border-primary/30 disabled:opacity-50"
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