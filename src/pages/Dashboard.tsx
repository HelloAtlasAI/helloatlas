import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Settings, LogOut, Mic, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChatWithMemory } from '@/hooks/useChatWithMemory';
import { useCardFocus, CardId } from '@/hooks/useCardFocus';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useProactiveAI } from '@/hooks/useProactiveAI';
import { useVoice } from '@/hooks/useVoice';
import { ParticleBackground } from '@/components/dashboard/ParticleBackground';
import { NebulaOrb } from '@/components/dashboard/NebulaOrb';
import {
  DashboardLayoutSelector,
  LayoutType,
  CommandCenterLayout,
  OrbitLayout,
  SplitViewLayout,
  AmbientLayout,
  FocusModeLayout,
} from '@/components/dashboard/layouts';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { focusedCard, setFocusedCard } = useCardFocus();
  const proactiveInsight = useProactiveAI();
  
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [activeLayout, setActiveLayout] = useState<LayoutType>(() => {
    const saved = localStorage.getItem('dashboardLayout');
    return (saved as LayoutType) || 'command';
  });
  
  const { 
    isRecording, 
    isPlaying, 
    audioLevel,
    startRecording, 
    stopRecording,
    speakText,
  } = useVoice();

  const handleCardFocus = useCallback((cardType: CardId) => {
    setFocusedCard(cardType);
  }, [setFocusedCard]);
  
  const handleSpeakResponse = useCallback((text: string) => {
    speakText(text);
  }, [speakText]);
  
  const { 
    messages, 
    aiState, 
    setAiState,
    isLoading, 
    sendMessage, 
  } = useChatWithMemory({
    onSpeakResponse: handleSpeakResponse,
    onCardFocus: handleCardFocus,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Save layout preference
  useEffect(() => {
    localStorage.setItem('dashboardLayout', activeLayout);
  }, [activeLayout]);

  const effectiveAiState = isRecording ? 'listening' : isPlaying ? 'speaking' : aiState;

  const handleVoiceStart = useCallback(async () => {
    await startRecording();
    setAiState('listening');
  }, [startRecording, setAiState]);

  const handleVoiceStop = useCallback(async () => {
    setIsProcessingVoice(true);
    const transcription = await stopRecording();
    setIsProcessingVoice(false);
    if (transcription) {
      await sendMessage(transcription);
    }
  }, [stopRecording, sendMessage]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleOrbClick = () => setIsConversationOpen(true);

  // Handle proactive AI speaking
  useEffect(() => {
    if (proactiveInsight && !isPlaying && !isRecording) {
      speakText(proactiveInsight.content);
    }
  }, [proactiveInsight, speakText, isPlaying, isRecording]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <NebulaOrb state="thinking" audioLevel={0} size="lg" />
      </div>
    );
  }

  const greeting = profile?.first_name 
    ? `Welcome back, ${profile.first_name}` 
    : 'Welcome back';

  const layoutProps = {
    aiState: effectiveAiState,
    audioLevel,
    focusedCard,
    onOrbClick: handleOrbClick,
  };

  const renderLayout = () => {
    switch (activeLayout) {
      case 'command':
        return <CommandCenterLayout {...layoutProps} />;
      case 'orbit':
        return <OrbitLayout {...layoutProps} />;
      case 'split':
        return <SplitViewLayout {...layoutProps} />;
      case 'ambient':
        return <AmbientLayout {...layoutProps} />;
      case 'focus':
        return <FocusModeLayout {...layoutProps} />;
      default:
        return <CommandCenterLayout {...layoutProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <ParticleBackground />
      
      {/* Layout Selector */}
      <DashboardLayoutSelector 
        activeLayout={activeLayout} 
        onLayoutChange={setActiveLayout} 
      />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 p-6"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.h1 
            className="text-2xl font-light tracking-wide text-foreground/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {greeting}
          </motion.h1>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Dynamic Layout */}
      <main className="relative min-h-screen">
        {renderLayout()}
      </main>

      {/* Conversation Panel */}
      <AnimatePresence>
        {isConversationOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50"
          >
            <div className="h-full bg-card/95 backdrop-blur-2xl border-l border-border flex flex-col">
              {/* Panel Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <h2 className="text-lg font-medium text-foreground">Atlas</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsConversationOpen(false)}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground text-sm">
                        Start a conversation with Atlas
                      </p>
                    </div>
                  )}
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary/20 text-foreground border border-primary/30'
                            : 'bg-muted text-foreground border border-border'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted border border-border rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-6 border-t border-border">
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onMouseDown={handleVoiceStart}
                    onMouseUp={handleVoiceStop}
                    onMouseLeave={isRecording ? handleVoiceStop : undefined}
                    disabled={isProcessingVoice}
                    className={`rounded-full transition-all ${
                      isRecording 
                        ? 'bg-primary/30 text-primary scale-110' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                  
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-full px-5"
                  />
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-primary/20 hover:bg-primary/30 text-primary rounded-full px-6 border border-primary/30"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background overlay when conversation is open */}
      <AnimatePresence>
        {isConversationOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsConversationOpen(false)}
            className="fixed inset-0 bg-background/50 z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
