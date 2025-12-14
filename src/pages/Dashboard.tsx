import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useVoice } from '@/hooks/useVoice';
import { useChatWithMemory } from '@/hooks/useChatWithMemory';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AIAssistantCard } from '@/components/dashboard/AIAssistantCard';
import { SimpleCardGrid } from '@/components/dashboard/SimpleCardGrid';
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
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const userName = profile?.first_name || profile?.display_name;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        userName={userName}
        onLogoutClick={handleLogout}
      />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24">
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
        
        {/* Info Cards Grid */}
        <SimpleCardGrid />
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
