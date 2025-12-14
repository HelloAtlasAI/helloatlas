import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Settings, LogOut, X, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChatWithMemory } from '@/hooks/useChatWithMemory';
import { useCardFocus, CardId } from '@/hooks/useCardFocus';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useVoice } from '@/hooks/useVoice';
import { AtlasSphere } from '@/components/dashboard/AtlasSphere';
import { VoiceButton } from '@/components/dashboard/VoiceButton';
import { CardGrid } from '@/components/dashboard/CardGrid';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { focusedCard, setFocusedCard, clearFocus, hasFocusedCard } = useCardFocus();
  
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  
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

  // Determine effective AI state
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
      setIsConversationOpen(true);
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

  const handleSphereClick = () => {
    setIsConversationOpen(true);
  };

  const handleCardClick = (cardId: CardId) => {
    if (focusedCard === cardId) {
      clearFocus();
    } else {
      setFocusedCard(cardId, false); // Don't auto-clear on manual click
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <AtlasSphere state="thinking" audioLevel={0} size="lg" />
      </div>
    );
  }

  const greeting = profile?.first_name 
    ? `Welcome back, ${profile.first_name}` 
    : 'Welcome back';

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-muted/20 pointer-events-none" />
      
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 p-4 md:p-6"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.h1 
            className="text-xl md:text-2xl font-light tracking-wide text-foreground/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {greeting}
          </motion.h1>
          
          <div className="flex items-center gap-2">
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

      {/* Main Content */}
      <main className="relative min-h-screen pt-20 pb-28">
        <div className="max-w-7xl mx-auto">
          {/* Atlas Sphere - Central Focus */}
          <motion.div 
            className="flex flex-col items-center justify-center py-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            <AtlasSphere
              state={effectiveAiState}
              audioLevel={audioLevel}
              size="xl"
              onClick={handleSphereClick}
            />
            <motion.p 
              className="mt-4 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {effectiveAiState === 'listening' ? 'Listening...' :
               effectiveAiState === 'thinking' ? 'Thinking...' :
               effectiveAiState === 'speaking' ? 'Speaking...' :
               'Tap to chat with Atlas'}
            </motion.p>
          </motion.div>

          {/* Card Grid */}
          <CardGrid 
            focusedCard={focusedCard} 
            onCardClick={handleCardClick}
          />
        </div>
      </main>

      {/* Floating Voice Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <VoiceButton
          isRecording={isRecording}
          isProcessing={isProcessingVoice}
          onPress={handleVoiceStart}
          onRelease={handleVoiceStop}
        />
      </div>

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
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full transition-colors ${
                    effectiveAiState === 'idle' ? 'bg-muted-foreground' :
                    effectiveAiState === 'listening' ? 'bg-yellow-500 animate-pulse' :
                    effectiveAiState === 'thinking' ? 'bg-blue-500 animate-pulse' :
                    'bg-green-500 animate-pulse'
                  }`} />
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
              <ScrollArea className="flex-1 p-4 md:p-6">
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
              <div className="p-4 md:p-6 border-t border-border">
                <div className="flex gap-3">
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
                    size="icon"
                    className="bg-primary/20 hover:bg-primary/30 text-primary rounded-full border border-primary/30"
                  >
                    <Send className="w-5 h-5" />
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
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
