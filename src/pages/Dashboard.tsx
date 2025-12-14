import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useVoice } from '@/hooks/useVoice';
import { useChatWithMemory } from '@/hooks/useChatWithMemory';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AIAssistantCard } from '@/components/dashboard/AIAssistantCard';
import { MiniAICard } from '@/components/dashboard/MiniAICard';
import { ExpandedCardView } from '@/components/dashboard/ExpandedCardView';
import { EmailCard } from '@/components/dashboard/EmailCard';
import { CalendarCard } from '@/components/dashboard/CalendarCard';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { StocksCard } from '@/components/dashboard/StocksCard';
import { TravelCard } from '@/components/dashboard/TravelCard';
import { DocumentsCard } from '@/components/dashboard/DocumentsCard';
import { NotesCard } from '@/components/dashboard/NotesCard';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { NewsCard } from '@/components/dashboard/NewsCard';
import { ConversationDrawer } from '@/components/dashboard/ConversationDrawer';

type AIState = 'idle' | 'listening' | 'thinking' | 'speaking';

// Card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: delay * 0.08,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

// Glow effect for focused cards
const getFocusedClasses = (cardName: string, focusedCard: string | null) => {
  if (focusedCard !== cardName) return '';
  return 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.4)]';
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile } = useUserProfile();
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [focusedCard, setFocusedCard] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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
        {/* Mosaic Grid Layout - Dynamic sizing with minmax */}
        <AnimatePresence mode="wait">
          {!expandedCard ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[minmax(140px,auto)] w-full">
          {/* AI Assistant - Spans 2 columns, compact */}
          <motion.div 
            className={`md:col-span-2 row-span-1 ${getFocusedClasses('assistant', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={0}
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
            className={`row-span-2 ${getFocusedClasses('weather', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <WeatherCard />
          </motion.div>

          {/* Travel - 2 rows */}
          <motion.div 
            className={`row-span-2 ${getFocusedClasses('travel', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <TravelCard />
          </motion.div>

          {/* Email - 3 rows tall */}
          <motion.div 
            className={`row-span-3 ${getFocusedClasses('email', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <EmailCard />
          </motion.div>

          {/* Calendar - 3 rows tall */}
          <motion.div 
            className={`row-span-3 ${getFocusedClasses('calendar', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <CalendarCard onExpand={() => setExpandedCard('calendar')} />
          </motion.div>

          {/* Stocks - Wide, 2 columns, 2 rows */}
          <motion.div 
            className={`md:col-span-2 row-span-2 ${getFocusedClasses('stocks', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={5}
          >
            <StocksCard />
          </motion.div>

          {/* Tasks - 2 rows */}
          <motion.div 
            className={`row-span-2 ${getFocusedClasses('tasks', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={6}
          >
            <TasksCard onExpand={() => setExpandedCard('tasks')} />
          </motion.div>

          {/* Notes - 2 rows */}
          <motion.div 
            className={`row-span-2 ${getFocusedClasses('notes', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={7}
          >
            <NotesCard onExpand={() => setExpandedCard('notes')} />
          </motion.div>

          {/* News - Wide, 2 columns, 2 rows */}
          <motion.div 
            className={`md:col-span-2 row-span-2 ${getFocusedClasses('news', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={8}
          >
            <NewsCard />
          </motion.div>

          {/* Documents - Wide, 2 columns, 2 rows */}
          <motion.div 
            className={`md:col-span-2 row-span-2 ${getFocusedClasses('documents', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={9}
          >
            <DocumentsCard />
          </motion.div>
        </div>
          ) : (
            <ExpandedCardView 
              layoutId={`card-${expandedCard}`}
              onClose={() => setExpandedCard(null)}
              title={expandedCard.charAt(0).toUpperCase() + expandedCard.slice(1)}
            >
              {expandedCard === 'weather' && <WeatherCard />}
              {expandedCard === 'calendar' && <CalendarCard />}
              {expandedCard === 'email' && <EmailCard />}
              {expandedCard === 'stocks' && <StocksCard />}
              {expandedCard === 'tasks' && <TasksCard />}
              {expandedCard === 'notes' && <NotesCard />}
              {expandedCard === 'news' && <NewsCard />}
              {expandedCard === 'documents' && <DocumentsCard />}
              {expandedCard === 'travel' && <TravelCard />}
            </ExpandedCardView>
          )}
        </AnimatePresence>

        {/* Mini AI Card when a card is expanded */}
        <AnimatePresence>
          {expandedCard && (
            <MiniAICard
              state={effectiveAiState}
              audioLevel={audioLevel}
              isRecording={isRecording}
              isProcessing={isVoiceProcessing || isLoading}
              onVoicePress={handleVoicePress}
              onVoiceRelease={handleVoiceRelease}
              onClick={handleAssistantClick}
            />
          )}
        </AnimatePresence>
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