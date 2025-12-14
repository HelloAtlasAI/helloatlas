import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useChatWithMemory } from "@/hooks/useChatWithMemory";
import { useVoice } from "@/hooks/useVoice";
import { useCardFocus } from "@/hooks/useCardFocus";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProactiveAI } from "@/hooks/useProactiveAI";
import { PersonalGreeting } from "@/components/dashboard/PersonalGreeting";
import { DataFlowOrb } from "@/components/dashboard/DataFlowOrb";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { EmailCard } from "@/components/dashboard/EmailCard";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { StocksCard } from "@/components/dashboard/StocksCard";
import { TravelCard } from "@/components/dashboard/TravelCard";
import { DocumentsCard } from "@/components/dashboard/DocumentsCard";
import { WeatherCard } from "@/components/dashboard/WeatherCard";
import { ConversationDrawer } from "@/components/dashboard/ConversationDrawer";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, Search, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, updateProfile } = useUserProfile();
  const { focusedCard, setFocusedCard, streamingData } = useCardFocus();
  const proactiveInsight = useProactiveAI();

  const {
    messages,
    aiState,
    setAiState,
    isLoading,
    sendMessage,
    clearMessages,
  } = useChatWithMemory({
    onSpeakResponse: (text) => handleSpeakResponse(text),
    onCardFocus: setFocusedCard,
  });

  const {
    isPlaying,
    isRecording,
    startRecording,
    stopRecording,
    speakText,
  } = useVoice();
  
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const [conversationOpen, setConversationOpen] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSpeakResponse = useCallback((text: string) => {
    speak(text);
  }, [speak]);

  const effectiveAiState = isRecording ? "listening" : isPlaying ? "speaking" : aiState;

  const handleVoiceStart = useCallback(async () => {
    if (isPlaying) {
      stopSpeaking();
    }
    await startRecording();
    setAiState("listening");
  }, [isPlaying, stopSpeaking, startRecording, setAiState]);

  const handleVoiceStop = useCallback(async () => {
    const transcription = await stopRecording();
    if (transcription) {
      await sendMessage(transcription);
    }
  }, [stopRecording, sendMessage]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  // Handle proactive AI speaking
  useEffect(() => {
    if (proactiveInsight && !isPlaying && !isRecording) {
      speak(proactiveInsight.content);
    }
  }, [proactiveInsight, speak, isPlaying, isRecording]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dashboard-bg flex items-center justify-center">
        <DataFlowOrb state="thinking" audioLevel={0} size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-bg overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-dashboard-border bg-dashboard-card/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <DataFlowOrb state={effectiveAiState} audioLevel={isPlaying ? 0.5 : 0} size="sm" />
          <span className="text-xl font-semibold text-dashboard-foreground">Atlas</span>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dashboard-muted" />
            <input
              type="text"
              placeholder="Search or ask Atlas..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-dashboard-muted/30 border border-dashboard-border text-dashboard-foreground placeholder:text-dashboard-muted focus:outline-none focus:ring-2 focus:ring-dashboard-primary/50"
              onFocus={() => setConversationOpen(true)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-dashboard-muted hover:text-dashboard-foreground hover:bg-dashboard-muted/20"
          >
            <Bell className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-dashboard-muted hover:text-dashboard-foreground hover:bg-dashboard-muted/20"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-dashboard-muted hover:text-dashboard-foreground hover:bg-dashboard-muted/20"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 h-[calc(100vh-4rem)]">
        <div className="h-full grid grid-cols-12 gap-4 auto-rows-fr" style={{ gridTemplateRows: 'auto repeat(3, 1fr)' }}>
          {/* Personal Greeting - spans full width */}
          <div className="col-span-12">
            <PersonalGreeting 
              profile={profile} 
              aiState={effectiveAiState}
              onUpdateProfile={updateProfile}
            />
          </div>

          {/* Main Orb Area */}
          <div className={cn(
            "col-span-3 row-span-2 transition-all duration-500",
            focusedCard && focusedCard !== "orb" ? "scale-90 opacity-70" : ""
          )}>
            <DashboardCard className="h-full flex items-center justify-center" glowing={effectiveAiState !== "idle"}>
              <DataFlowOrb 
                state={effectiveAiState} 
                audioLevel={isPlaying ? 0.6 : isRecording ? 0.4 : 0} 
                size="lg"
                onClick={() => setConversationOpen(true)}
              />
            </DashboardCard>
          </div>

          {/* Email Card - Large */}
          <div className={cn(
            "col-span-5 row-span-2 transition-all duration-500",
            focusedCard === "email" ? "scale-105 z-10" : focusedCard ? "scale-95 opacity-80" : ""
          )}>
            <EmailCard 
              isFocused={focusedCard === "email"} 
              streamingData={focusedCard === "email" ? streamingData : undefined}
            />
          </div>

          {/* Calendar Card */}
          <div className={cn(
            "col-span-4 row-span-2 transition-all duration-500",
            focusedCard === "calendar" ? "scale-105 z-10" : focusedCard ? "scale-95 opacity-80" : ""
          )}>
            <CalendarCard 
              isFocused={focusedCard === "calendar"}
              streamingData={focusedCard === "calendar" ? streamingData : undefined}
            />
          </div>

          {/* Stocks Card */}
          <div className={cn(
            "col-span-3 transition-all duration-500",
            focusedCard === "stocks" ? "scale-105 z-10" : focusedCard ? "scale-95 opacity-80" : ""
          )}>
            <StocksCard 
              isFocused={focusedCard === "stocks"}
              streamingData={focusedCard === "stocks" ? streamingData : undefined}
            />
          </div>

          {/* Travel Card */}
          <div className={cn(
            "col-span-3 transition-all duration-500",
            focusedCard === "travel" ? "scale-105 z-10" : focusedCard ? "scale-95 opacity-80" : ""
          )}>
            <TravelCard 
              isFocused={focusedCard === "travel"}
              streamingData={focusedCard === "travel" ? streamingData : undefined}
            />
          </div>

          {/* Documents Card */}
          <div className={cn(
            "col-span-3 transition-all duration-500",
            focusedCard === "documents" ? "scale-105 z-10" : focusedCard ? "scale-95 opacity-80" : ""
          )}>
            <DocumentsCard 
              isFocused={focusedCard === "documents"}
              streamingData={focusedCard === "documents" ? streamingData : undefined}
            />
          </div>

          {/* Weather Card */}
          <div className={cn(
            "col-span-3 transition-all duration-500",
            focusedCard === "weather" ? "scale-105 z-10" : focusedCard ? "scale-95 opacity-80" : ""
          )}>
            <WeatherCard 
              isFocused={focusedCard === "weather"}
              streamingData={focusedCard === "weather" ? streamingData : undefined}
            />
          </div>
        </div>
      </main>

      {/* Conversation Drawer */}
      <ConversationDrawer
        open={conversationOpen}
        onOpenChange={setConversationOpen}
        messages={messages}
        isLoading={isLoading}
        isRecording={isRecording}
        isProcessingVoice={isProcessingVoice}
        onSendMessage={handleSendMessage}
        onVoiceStart={handleVoiceStart}
        onVoiceStop={handleVoiceStop}
        onClearMessages={clearMessages}
      />
    </div>
  );
};

export default Dashboard;
