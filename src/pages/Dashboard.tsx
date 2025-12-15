import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useVoice } from '@/hooks/useVoice';
import { useWakeWordFixed as useWakeWord, WakeWordState } from '@/hooks/useWakeWordFixed';
import { useChatWithMemory } from '@/hooks/useChatWithMemory';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AtlasInterface } from '@/components/dashboard/AtlasInterface';
import { MiniAICard } from '@/components/dashboard/MiniAICard';
import { ImmersiveCardShell } from '@/components/dashboard/ImmersiveCardShell';
import { MorphableCard } from '@/components/dashboard/MorphableCard';
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
import { 
  ExpandedNotesCard, 
  ExpandedTasksCard, 
  ExpandedCalendarCard,
  ExpandedWeatherCard,
  ExpandedStocksCard,
  ExpandedNewsCard,
  ExpandedEmailCard,
  ExpandedTravelCard,
  ExpandedDocumentsCard
} from '@/components/dashboard/expanded';
import {
  EmailAtmosphere,
  StocksAtmosphere,
  CalendarAtmosphere,
  TasksAtmosphere,
  NotesAtmosphere,
  NewsAtmosphere,
  DocumentsAtmosphere,
  TravelAtmosphere,
} from '@/components/dashboard/effects/CardAtmospheres';

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

// Get glow color for each card type
const getGlowColor = (cardName: string) => {
  const colors: Record<string, string> = {
    notes: 'hsl(45, 93%, 47%, 0.2)',
    tasks: 'hsl(217, 91%, 60%, 0.2)',
    calendar: 'hsl(217, 91%, 60%, 0.2)',
    weather: 'hsl(38, 92%, 50%, 0.2)',
    stocks: 'hsl(160, 84%, 39%, 0.2)',
    news: 'hsl(263, 70%, 50%, 0.2)',
    email: 'hsl(350, 70%, 55%, 0.2)',
    documents: 'hsl(200, 70%, 50%, 0.2)',
    travel: 'hsl(280, 70%, 50%, 0.2)',
  };
  return colors[cardName] || 'hsl(var(--primary) / 0.15)';
};

// Get accent color for each card type
const getAccentColor = (cardName: string) => {
  const colors: Record<string, string> = {
    notes: 'hsl(45, 93%, 47%)',
    tasks: 'hsl(217, 91%, 60%)',
    calendar: 'hsl(217, 91%, 60%)',
    weather: 'hsl(38, 92%, 50%)',
    stocks: 'hsl(160, 84%, 39%)',
    news: 'hsl(263, 70%, 50%)',
    email: 'hsl(350, 70%, 55%)',
    documents: 'hsl(200, 70%, 50%)',
    travel: 'hsl(280, 70%, 50%)',
  };
  return colors[cardName] || 'hsl(var(--primary))';
};

// Get atmospheric background for each card type
const getCardAtmosphere = (cardName: string) => {
  switch (cardName) {
    case 'email': return <EmailAtmosphere />;
    case 'stocks': return <StocksAtmosphere />;
    case 'calendar': return <CalendarAtmosphere />;
    case 'tasks': return <TasksAtmosphere />;
    case 'notes': return <NotesAtmosphere />;
    case 'news': return <NewsAtmosphere />;
    case 'documents': return <DocumentsAtmosphere />;
    case 'travel': return <TravelAtmosphere />;
    // Weather has its own 3D environment built into its card
    default: return null;
  }
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
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [lastAiResponse, setLastAiResponse] = useState<string>('');

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

  // Wake word detection
  const {
    state: wakeWordState,
    setState: setWakeWordState,
    transcript: wakeWordTranscript,
    isSupported: isWakeWordSupported,
    startPassiveListening,
    resetToPassive,
  } = useWakeWord({
    keyword: 'atlas',
    onWakeWordDetected: () => {
      // Play activation sound (could be added later)
      console.log('Wake word detected!');
      stopCurrentAudio();
      startRecording();
    },
    onTimeout: () => {
      console.log('Wake word timeout');
    },
  });

  // Start passive listening on mount
  useEffect(() => {
    if (user && !authLoading) {
      startPassiveListening();
    }
  }, [user, authLoading, startPassiveListening]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Determine effective Atlas state
  const effectiveAtlasState: WakeWordState = isRecording 
    ? 'listening' 
    : isVoiceProcessing || isLoading
      ? 'thinking'
      : isPlaying 
        ? 'speaking' 
        : wakeWordState;

  // Determine effective AI state for legacy components
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
    setWakeWordState('thinking');
    try {
      const transcribedText = await stopRecording();
      if (transcribedText && transcribedText.trim()) {
        setLastUserMessage(transcribedText);
        setIsConversationOpen(true);
        const response = await sendMessage(transcribedText);
        if (response) {
          setLastAiResponse(response);
        }
      }
    } finally {
      setIsVoiceProcessing(false);
      resetToPassive();
    }
  }, [isRecording, stopRecording, sendMessage, setWakeWordState, resetToPassive]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;
    const message = inputValue;
    setInputValue('');
    setLastUserMessage(message);
    const response = await sendMessage(message);
    if (response) {
      setLastAiResponse(response);
    }
  }, [inputValue, sendMessage]);

  const handleAssistantClick = useCallback(() => {
    setIsConversationOpen(true);
  }, []);

  const handleManualActivate = useCallback(() => {
    stopCurrentAudio();
    startRecording();
    setWakeWordState('listening');
  }, [stopCurrentAudio, startRecording, setWakeWordState]);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/auth');
  }, [signOut, navigate]);

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

  // Render expanded card content
  const renderExpandedContent = () => {
    switch (expandedCard) {
      case 'notes': return <ExpandedNotesCard />;
      case 'tasks': return <ExpandedTasksCard />;
      case 'calendar': return <ExpandedCalendarCard />;
      case 'weather': return <ExpandedWeatherCard />;
      case 'stocks': return <ExpandedStocksCard />;
      case 'news': return <ExpandedNewsCard />;
      case 'email': return <ExpandedEmailCard />;
      case 'documents': return <ExpandedDocumentsCard />;
      case 'travel': return <ExpandedTravelCard />;
      default: return null;
    }
  };

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
      
      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Mosaic Grid Layout - Dynamic sizing with minmax */}
        <AnimatePresence mode="wait">
          {!expandedCard ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 auto-rows-[minmax(140px,auto)] w-full">
          {/* Atlas AI Interface - Spans 2 columns, row-span-2 for sphere */}
          <motion.div 
            className={`md:col-span-2 xl:col-span-2 ${getFocusedClasses('assistant', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <AtlasInterface
              state={effectiveAtlasState}
              audioLevel={audioLevel}
              userName={userName}
              transcript={wakeWordTranscript}
              lastMessage={lastUserMessage}
              lastResponse={lastAiResponse}
              isSupported={isWakeWordSupported}
              onManualActivate={handleManualActivate}
            />
          </motion.div>

          {/* Weather - 2 rows with morphable shape */}
          <motion.div 
            className={`row-span-2 ${getFocusedClasses('weather', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <MorphableCard notch="bottom-right" notchSize={20} enabled={false}>
              <WeatherCard onExpand={() => setExpandedCard('weather')} />
            </MorphableCard>
          </motion.div>

          {/* Travel - 2 rows with morphable shape */}
          <motion.div 
            className={`row-span-2 ${getFocusedClasses('travel', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <MorphableCard notch="bottom-left" notchSize={20} enabled={false}>
              <TravelCard onExpand={() => setExpandedCard('travel')} />
            </MorphableCard>
          </motion.div>

          {/* Email - 3 rows tall */}
          <motion.div 
            className={`row-span-3 ${getFocusedClasses('email', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <EmailCard onExpand={() => setExpandedCard('email')} />
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

          {/* Stocks - Wide, 2-3 columns depending on screen */}
          <motion.div 
            className={`md:col-span-2 xl:col-span-3 2xl:col-span-2 row-span-2 ${getFocusedClasses('stocks', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={5}
          >
            <MorphableCard notch="top-left" notchSize={12} enabled={false}>
              <StocksCard onExpand={() => setExpandedCard('stocks')} />
            </MorphableCard>
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

          {/* News - Wide, 2-3 columns depending on screen */}
          <motion.div 
            className={`md:col-span-2 xl:col-span-3 2xl:col-span-3 row-span-2 ${getFocusedClasses('news', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={8}
          >
            <NewsCard onExpand={() => setExpandedCard('news')} />
          </motion.div>

          {/* Documents - Wide, 2-3 columns depending on screen */}
          <motion.div 
            className={`md:col-span-2 xl:col-span-2 2xl:col-span-3 row-span-2 ${getFocusedClasses('documents', focusedCard)}`}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={9}
          >
            <MorphableCard notch="top-right" notchSize={10} enabled={false}>
              <DocumentsCard onExpand={() => setExpandedCard('documents')} />
            </MorphableCard>
          </motion.div>
        </div>
          ) : (
            <ImmersiveCardShell 
              layoutId={`card-${expandedCard}`}
              onClose={() => setExpandedCard(null)}
              title={expandedCard.charAt(0).toUpperCase() + expandedCard.slice(1)}
              glowColor={getGlowColor(expandedCard)}
              accentColor={getAccentColor(expandedCard)}
              backgroundElement={getCardAtmosphere(expandedCard)}
              enableParallax={true}
              showHUD={true}
            >
              {renderExpandedContent()}
            </ImmersiveCardShell>
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
