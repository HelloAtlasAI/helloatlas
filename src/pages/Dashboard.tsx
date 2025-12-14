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
import { VoiceButton } from '@/components/dashboard/VoiceButton';
import { ConversationDrawer } from '@/components/dashboard/ConversationDrawer';

type AIState = 'idle' | 'listening' | 'thinking' | 'speaking';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile } = useUserProfile();
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);

  const {
    isRecording,
    isPlaying,
    audioLevel,
    startRecording,
    stopRecording,
    speakText
  } = useVoice();

  const handleSpeakResponse = useCallback((text: string) => {
    speakText(text);
  }, [speakText]);

  const { messages, aiState, setAiState, isLoading, sendMessage } = useChatWithMemory({
    onSpeakResponse: handleSpeakResponse,
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
    : isPlaying 
      ? 'speaking' 
      : aiState;

  const handleVoicePress = useCallback(() => {
    startRecording();
    setAiState('listening');
  }, [startRecording, setAiState]);

  const handleVoiceRelease = useCallback(async () => {
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
  }, [stopRecording, sendMessage]);

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
      if (e.code === 'Space' && !isConversationOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        handleVoicePress();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isRecording) {
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
  }, [isConversationOpen, isRecording, handleVoicePress, handleVoiceRelease]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-muted-foreground text-xl"
        >
          Loading...
        </motion.div>
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
      
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* AI Assistant Card */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AIAssistantCard
            state={effectiveAiState}
            audioLevel={audioLevel}
            userName={userName}
            onClick={handleAssistantClick}
          />
        </motion.div>
        
        {/* Card Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <EmailCard />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <CalendarCard />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <WeatherCard />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <StocksCard />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <TravelCard />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <DocumentsCard />
          </motion.div>
        </motion.div>
      </main>

      {/* Floating Voice Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <VoiceButton
          isRecording={isRecording}
          isProcessing={isVoiceProcessing}
          onPress={handleVoicePress}
          onRelease={handleVoiceRelease}
        />
      </div>

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
