import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useVoice } from '@/hooks/useVoice';
import { useChatWithMemory } from '@/hooks/useChatWithMemory';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AIAssistantCard } from '@/components/dashboard/AIAssistantCard';
import { EmailCard } from '@/components/dashboard/EmailCard';
import { CalendarCard } from '@/components/dashboard/CalendarCard';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { StocksCard } from '@/components/dashboard/StocksCard';
import { TravelCard } from '@/components/dashboard/TravelCard';
import { DocumentsCard } from '@/components/dashboard/DocumentsCard';
import { ConversationDrawer } from '@/components/dashboard/ConversationDrawer';

type AIState = 'idle' | 'listening' | 'thinking' | 'speaking';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile } = useUserProfile();
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [focusedCard, setFocusedCard] = useState<string | null>(null);

  const {
    isRecording,
    isPlaying,
    audioLevel,
    startRecording,
    stopRecording,
    speakText,
    stopCurrentAudio
  } = useVoice();

  const { messages, aiState, setAiState, isLoading, sendMessage, clearMessages } = useChatWithMemory({
    onCardFocus: setFocusedCard,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Determine effective AI state
  const effectiveAiState: AIState = isRecording 
    ? 'listening' 
    : isVoiceProcessing || isLoading
      ? 'thinking'
      : isPlaying 
        ? 'speaking' 
        : aiState;

  const handleVoicePress = useCallback(() => {
    stopCurrentAudio();
    startRecording();
    setAiState('listening');
  }, [startRecording, setAiState, stopCurrentAudio]);

  const handleVoiceRelease = useCallback(async () => {
    if (!isRecording) return;
    
    setIsVoiceProcessing(true);
    try {
      const transcribedText = await stopRecording();
      if (transcribedText && transcribedText.trim()) {
        setIsConversationOpen(true);
        await sendMessage(transcribedText);
      }
    } finally {
      setIsVoiceProcessing(false);
    }
  }, [isRecording, stopRecording, sendMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  }, [inputValue, sendMessage]);

  const handleAssistantClick = useCallback(() => {
    setIsConversationOpen(true);
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/auth');
  }, [signOut, navigate]);

  // Keyboard shortcut for voice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !isConversationOpen && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleVoicePress();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleVoiceRelease();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isConversationOpen, handleVoicePress, handleVoiceRelease]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const userName = profile?.first_name || profile?.display_name;

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.3) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <DashboardHeader 
        userName={userName}
        onLogoutClick={handleLogout}
      />
      
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mosaic Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[140px]">
          {/* AI Assistant - Spans 2 columns, compact */}
          <motion.div 
            className="md:col-span-2 row-span-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AIAssistantCard
              state={effectiveAiState}
              audioLevel={audioLevel}
              userName={userName}
              isRecording={isRecording}
              isProcessing={isVoiceProcessing || isLoading}
              onVoicePress={handleVoicePress}
              onVoiceRelease={handleVoiceRelease}
              onClick={handleAssistantClick}
            />
          </motion.div>

          {/* Weather - 2 rows */}
          <motion.div 
            className={`row-span-2 ${focusedCard === 'weather' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-2xl' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <WeatherCard />
          </motion.div>

          {/* Travel - 2 rows */}
          <motion.div 
            className={`row-span-2 ${focusedCard === 'travel' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-2xl' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <TravelCard />
          </motion.div>

          {/* Email - 3 rows tall */}
          <motion.div 
            className={`row-span-3 ${focusedCard === 'email' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-2xl' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <EmailCard />
          </motion.div>

          {/* Calendar - 3 rows tall */}
          <motion.div 
            className={`row-span-3 ${focusedCard === 'calendar' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-2xl' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <CalendarCard />
          </motion.div>

          {/* Stocks - Wide, 2 columns, 2 rows */}
          <motion.div 
            className={`md:col-span-2 row-span-2 ${focusedCard === 'stocks' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-2xl' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StocksCard />
          </motion.div>

          {/* Documents - Wide, 2 columns, 2 rows */}
          <motion.div 
            className={`md:col-span-2 row-span-2 ${focusedCard === 'documents' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-2xl' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <DocumentsCard />
          </motion.div>
        </div>
      </main>

      {/* Conversation Drawer */}
      <AnimatePresence>
        {isConversationOpen && (
          <ConversationDrawer
            isOpen={isConversationOpen}
            onClose={() => setIsConversationOpen(false)}
            messages={messages}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSendMessage}
            isLoading={isLoading}
            aiState={effectiveAiState}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;