import { useState } from "react";
import { AIOrb } from "@/components/aria/AIOrb";
import { ChatInput } from "@/components/aria/ChatInput";
import { FloatingCards, demoCards } from "@/components/aria/FloatingCards";
import { BackgroundEffects } from "@/components/aria/BackgroundEffects";
import { ConversationPanel } from "@/components/aria/ConversationPanel";
import { useConversation } from "@/hooks/useConversation";

const Index = () => {
  const { messages, aiState, sendMessage, toggleListening } = useConversation();
  const [cards, setCards] = useState(demoCards);

  const handleCardClose = (id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  };

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
          <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Settings
          </button>
          <button className="px-4 py-2 text-sm rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            Sign In
          </button>
        </nav>
      </header>

      {/* Floating data cards */}
      <FloatingCards cards={cards} onCardClose={handleCardClose} />

      {/* Main content - AI Orb */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
        {/* Welcome text */}
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-light text-foreground mb-2">
            Hello, I'm <span className="font-semibold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">ARIA</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Your personal AI assistant. Ask me anything.
          </p>
        </div>

        {/* AI Orb */}
        <AIOrb state={aiState} className="mb-16" />

        {/* Conversation panel */}
        <ConversationPanel messages={messages} />
      </main>

      {/* Bottom input area */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <ChatInput
            onSend={sendMessage}
            onVoiceToggle={toggleListening}
            isListening={aiState === "listening"}
            disabled={aiState === "thinking" || aiState === "speaking"}
          />
          
          {/* Quick action chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["Check my emails", "Find flights", "Stock prices", "Create document"].map((action) => (
              <button
                key={action}
                onClick={() => sendMessage(action)}
                className="px-3 py-1.5 text-xs rounded-full bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors border border-border/30"
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
