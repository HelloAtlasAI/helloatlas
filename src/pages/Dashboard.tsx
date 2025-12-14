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
import { CleanSphere } from '@/components/dashboard/CleanSphere';
import { GlassmorphicCard } from '@/components/dashboard/GlassmorphicCard';
import { ParticleBackground } from '@/components/dashboard/ParticleBackground';
import { FloatingLayout, FloatingElement } from '@/components/dashboard/FloatingLayout';
import { EmailCard } from '@/components/dashboard/EmailCard';
import { CalendarCard } from '@/components/dashboard/CalendarCard';
import { StocksCard } from '@/components/dashboard/StocksCard';
import { TravelCard } from '@/components/dashboard/TravelCard';
import { DocumentsCard } from '@/components/dashboard/DocumentsCard';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
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
    clearMessages 
  } = useChatWithMemory({
    onSpeakResponse: handleSpeakResponse,
    onCardFocus: handleCardFocus,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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

  // Handle proactive AI speaking
  useEffect(() => {
    if (proactiveInsight && !isPlaying && !isRecording) {
      speakText(proactiveInsight.content);
    }
  }, [proactiveInsight, speakText, isPlaying, isRecording]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <CleanSphere state="thinking" audioLevel={0} className="w-48 h-48" />
      </div>
    );
  }

  const greeting = profile?.first_name 
    ? `Welcome back, ${profile.first_name}` 
    : 'Welcome back';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <ParticleBackground />
      
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 p-6"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.h1 
            className="text-2xl font-light tracking-wide text-white/90"
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
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSignOut}
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative min-h-screen pt-24 pb-32 px-6">
        <FloatingLayout>
          <div className="max-w-7xl mx-auto h-full">
            {/* Central AI Sphere */}
            <FloatingElement 
              depth={3} 
              className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
              floatAmplitude={15}
              floatSpeed={4}
            >
              <div className="relative">
                <CleanSphere 
                  state={effectiveAiState}
                  audioLevel={audioLevel}
                  onClick={() => setIsConversationOpen(true)}
                  className="w-64 h-64 md:w-80 md:h-80"
                />
                
                {/* Voice control hint */}
                <motion.div 
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <p className="text-sm text-white/40">Click to chat with Atlas</p>
                </motion.div>
              </div>
            </FloatingElement>

            {/* Floating Cards - Asymmetric Layout */}
            {/* Top Left - Email */}
            <FloatingElement 
              depth={1} 
              className="top-[10%] left-[5%] w-80"
              floatAmplitude={8}
              floatSpeed={5}
            >
              <GlassmorphicCard 
                isFocused={focusedCard === 'email'}
                glowColor="cyan"
                delay={1}
              >
                <EmailCard isFocused={focusedCard === 'email'} />
              </GlassmorphicCard>
            </FloatingElement>

            {/* Top Right - Calendar */}
            <FloatingElement 
              depth={2} 
              className="top-[5%] right-[8%] w-72"
              floatAmplitude={12}
              floatSpeed={4}
            >
              <GlassmorphicCard 
                isFocused={focusedCard === 'calendar'}
                glowColor="purple"
                delay={2}
              >
                <CalendarCard isFocused={focusedCard === 'calendar'} />
              </GlassmorphicCard>
            </FloatingElement>

            {/* Left Middle - Stocks */}
            <FloatingElement 
              depth={0} 
              className="top-[55%] left-[3%] w-64"
              floatAmplitude={6}
              floatSpeed={6}
            >
              <GlassmorphicCard 
                isFocused={focusedCard === 'stocks'}
                glowColor="green"
                delay={3}
              >
                <StocksCard isFocused={focusedCard === 'stocks'} />
              </GlassmorphicCard>
            </FloatingElement>

            {/* Right Middle - Travel */}
            <FloatingElement 
              depth={1} 
              className="top-[45%] right-[5%] w-72"
              floatAmplitude={10}
              floatSpeed={5}
            >
              <GlassmorphicCard 
                isFocused={focusedCard === 'travel'}
                glowColor="orange"
                delay={4}
              >
                <TravelCard isFocused={focusedCard === 'travel'} />
              </GlassmorphicCard>
            </FloatingElement>

            {/* Bottom Left - Documents */}
            <FloatingElement 
              depth={2} 
              className="bottom-[15%] left-[15%] w-64"
              floatAmplitude={7}
              floatSpeed={4.5}
            >
              <GlassmorphicCard 
                isFocused={focusedCard === 'documents'}
                glowColor="blue"
                delay={5}
              >
                <DocumentsCard isFocused={focusedCard === 'documents'} />
              </GlassmorphicCard>
            </FloatingElement>

            {/* Bottom Right - Weather */}
            <FloatingElement 
              depth={0} 
              className="bottom-[10%] right-[12%] w-60"
              floatAmplitude={9}
              floatSpeed={5.5}
            >
              <GlassmorphicCard 
                isFocused={focusedCard === 'weather'}
                glowColor="cyan"
                delay={6}
              >
                <WeatherCard isFocused={focusedCard === 'weather'} />
              </GlassmorphicCard>
            </FloatingElement>
          </div>
        </FloatingLayout>
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
            <div 
              className="h-full backdrop-blur-2xl border-l border-white/10 flex flex-col"
              style={{
                background: 'linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(15,15,25,0.98) 100%)',
              }}
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                  <h2 className="text-lg font-medium text-white/90">Atlas</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsConversationOpen(false)}
                  className="text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-white/40 text-sm">
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
                            ? 'bg-cyan-500/20 text-white border border-cyan-500/30'
                            : 'bg-white/5 text-white/90 border border-white/10'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-6 border-t border-white/10">
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
                        ? 'bg-cyan-500/30 text-cyan-400 scale-110' 
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                  
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-full px-5"
                  />
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-full px-6 border border-cyan-500/30"
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
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
