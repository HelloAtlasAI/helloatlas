import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useVoice } from '@/hooks/useVoice';
import { useWakeWordFixed as useWakeWord, WakeWordState } from '@/hooks/useWakeWordFixed';
import { useChatWithMemory } from '@/hooks/useChatWithMemory';
import { useCardPriority, CardId } from '@/hooks/useCardPriority';
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

// Glow effect for focused cards (now supports multiple)
const getFocusedClasses = (cardName: string, focusedCards: string[], isSpeaking: boolean) => {
  const isFocused = focusedCards.includes(cardName);
  if (!isFocused) return '';
  return 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.4)]';
};

// Get dim classes for non-focused cards during speech
const getDimClasses = (cardName: string, focusedCards: string[], isSpeaking: boolean) => {
  if (!isSpeaking || focusedCards.length === 0) return '';
  if (focusedCards.includes(cardName)) return '';
  return 'opacity-40 scale-[0.98] blur-[1px]';
};

// Get compact classes for empty cards
const getEmptyClasses = (isEmpty: boolean) => {
  if (!isEmpty) return '';
  return 'row-span-1 !h-[60px] opacity-60';
};

// Get empty card styles with order for grid positioning
const getCardStyles = (isEmpty: boolean, order: number) => {
  return {
    opacity: isEmpty ? 0.6 : 1,
    order: order, // CSS Grid order property
  };
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
  const [focusedCards, setFocusedCards] = useState<string[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [lastAiResponse, setLastAiResponse] = useState<string>('');
  const [isWakeWordTriggered, setIsWakeWordTriggered] = useState(false);

  // Card priority system
  const { sortedCards, cardMeta } = useCardPriority();

  const {
    isRecording,
    isPlaying,
    audioLevel,
    startRecording,
    stopRecording,
    speakText,
    stopCurrentAudio
  } = useVoice();

  // Handle multi-card focus callback
  const handleCardFocus = useCallback((cardIds: string[] | null) => {
    setFocusedCards(cardIds || []);
  }, []);

  const { messages, aiState, setAiState, isLoading, sendMessage, clearMessages } = useChatWithMemory({
    onCardFocus: handleCardFocus,
  });

  // Ref for auto-stop timer
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Wake word detection - declare first so we can use pauseListening in callbacks
  const {
    state: wakeWordState,
    setState: setWakeWordState,
    transcript: wakeWordTranscript,
    isSupported: isWakeWordSupported,
    startPassiveListening,
    resetToPassive,
    pauseListening,
    resumeListening,
  } = useWakeWord({
    keyword: 'atlas',
    onWakeWordDetected: () => {
      console.log('[Dashboard] Wake word detected! Starting recording...');
      stopCurrentAudio();
      setIsWakeWordTriggered(true);
      startRecording();
    },
    onTimeout: () => {
      console.log('[Dashboard] Wake word timeout');
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

  // Is Atlas speaking with focused cards?
  const isSpeakingWithFocus = effectiveAiState === 'speaking' && focusedCards.length > 0;

  const handleVoicePress = useCallback(() => {
    console.log('[Dashboard] Voice press - pausing wake word, starting recording');
    pauseListening(); // Pause wake word to prevent conflicts
    stopCurrentAudio();
    startRecording();
    setAiState('listening');
  }, [startRecording, setAiState, stopCurrentAudio, pauseListening]);

  const handleVoiceRelease = useCallback(async () => {
    if (!isRecording) return;
    
    console.log('[Dashboard] Voice release - processing recording');
    
    // Clear auto-stop timer and wake word trigger
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    setIsWakeWordTriggered(false);
    
    setIsVoiceProcessing(true);
    setWakeWordState('thinking');
    
    try {
      const transcribedText = await stopRecording();
      console.log('[Dashboard] Transcribed text:', transcribedText);
      
      if (transcribedText && transcribedText.trim()) {
        setLastUserMessage(transcribedText);
        setIsConversationOpen(true);
        
        console.log('[Dashboard] Sending message to chat...');
        const response = await sendMessage(transcribedText);
        console.log('[Dashboard] Got response:', response?.substring(0, 100));
        
        if (response && response.trim()) {
          setLastAiResponse(response);
          // Auto-speak the response for voice interactions
          setWakeWordState('speaking');
          console.log('[Dashboard] Speaking response...');
          await speakText(response);
          console.log('[Dashboard] TTS complete');
        } else {
          console.warn('[Dashboard] No response to speak');
        }
      } else {
        console.log('[Dashboard] No transcribed text');
      }
    } catch (error) {
      console.error('[Dashboard] Voice processing error:', error);
    } finally {
      setIsVoiceProcessing(false);
      // Resume wake word listening after TTS is done
      console.log('[Dashboard] Resuming wake word listening');
      resumeListening();
    }
  }, [isRecording, stopRecording, sendMessage, setWakeWordState, speakText, resumeListening]);

  // Auto-stop recording after silence when triggered by wake word
  useEffect(() => {
    if (!isRecording || !isWakeWordTriggered) return;

    // Set up silence detection - auto-stop after 3 seconds of low audio
    let silenceStart: number | null = null;
    const SILENCE_THRESHOLD = 0.05;
    const SILENCE_DURATION = 2000; // 2 seconds of silence to stop
    const MAX_RECORDING_TIME = 30000; // 30 seconds max
    
    // Max recording time failsafe
    autoStopTimerRef.current = setTimeout(() => {
      handleVoiceRelease();
    }, MAX_RECORDING_TIME);

    // Check audio levels periodically
    const checkInterval = setInterval(() => {
      if (audioLevel < SILENCE_THRESHOLD) {
        if (silenceStart === null) {
          silenceStart = Date.now();
        } else if (Date.now() - silenceStart > SILENCE_DURATION) {
          // Silence detected for long enough, stop recording
          handleVoiceRelease();
        }
      } else {
        silenceStart = null;
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
    };
  }, [isRecording, isWakeWordTriggered, audioLevel, handleVoiceRelease]);

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

  const handleManualActivate = useCallback(async () => {
    // Toggle recording - if already recording, stop and process
    if (isRecording) {
      await handleVoiceRelease();
      return;
    }
    
    stopCurrentAudio();
    setIsWakeWordTriggered(true); // Enable auto-stop for click activation
    startRecording();
    setWakeWordState('listening');
  }, [isRecording, handleVoiceRelease, stopCurrentAudio, startRecording, setWakeWordState]);

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
        <LayoutGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 auto-rows-[minmax(140px,auto)] w-full">
          {/* Atlas AI Interface - Spans 2 columns, fixed height */}
          <motion.div 
            layoutId="card-assistant"
            className={`md:col-span-2 xl:col-span-2 h-[200px] transition-all duration-300 ${getFocusedClasses('assistant', focusedCards, isSpeakingWithFocus)}`}
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
            layoutId="card-weather"
            className={`row-span-2 transition-all duration-300 ${getFocusedClasses('weather', focusedCards, isSpeakingWithFocus)} ${getDimClasses('weather', focusedCards, isSpeakingWithFocus)}`}
            style={getCardStyles(cardMeta['weather']?.isEmpty || false, sortedCards.indexOf('weather'))}
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
            layoutId="card-travel"
            className={`${cardMeta['travel']?.isEmpty ? 'row-span-1 h-[60px]' : 'row-span-2'} transition-all duration-300 ${getFocusedClasses('travel', focusedCards, isSpeakingWithFocus)} ${getDimClasses('travel', focusedCards, isSpeakingWithFocus)}`}
            style={getCardStyles(cardMeta['travel']?.isEmpty || false, sortedCards.indexOf('travel'))}
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
            layoutId="card-email"
            className={`row-span-3 transition-all duration-300 ${getFocusedClasses('email', focusedCards, isSpeakingWithFocus)} ${getDimClasses('email', focusedCards, isSpeakingWithFocus)}`}
            style={getCardStyles(cardMeta['email']?.isEmpty || false, sortedCards.indexOf('email'))}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <EmailCard onExpand={() => setExpandedCard('email')} />
          </motion.div>

          {/* Calendar - 3 rows tall */}
          <motion.div 
            layoutId="card-calendar"
            className={`${cardMeta['calendar']?.isEmpty ? 'row-span-1 h-[60px]' : 'row-span-3'} transition-all duration-300 ${getFocusedClasses('calendar', focusedCards, isSpeakingWithFocus)} ${getDimClasses('calendar', focusedCards, isSpeakingWithFocus)}`}
            style={getCardStyles(cardMeta['calendar']?.isEmpty || false, sortedCards.indexOf('calendar'))}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <CalendarCard onExpand={() => setExpandedCard('calendar')} />
          </motion.div>

          {/* Stocks - Wide, 2-3 columns depending on screen */}
          <motion.div 
            layoutId="card-stocks"
            className={`md:col-span-2 xl:col-span-2 2xl:col-span-2 ${cardMeta['stocks']?.isEmpty ? 'row-span-1 h-[60px]' : 'row-span-2'} transition-all duration-300 ${getFocusedClasses('stocks', focusedCards, isSpeakingWithFocus)} ${getDimClasses('stocks', focusedCards, isSpeakingWithFocus)}`}
            style={getCardStyles(cardMeta['stocks']?.isEmpty || false, sortedCards.indexOf('stocks'))}
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
            layoutId="card-tasks"
            className={`${cardMeta['tasks']?.isEmpty ? 'row-span-1 h-[60px]' : 'row-span-2'} transition-all duration-300 ${getFocusedClasses('tasks', focusedCards, isSpeakingWithFocus)} ${getDimClasses('tasks', focusedCards, isSpeakingWithFocus)}`}
            style={getCardStyles(cardMeta['tasks']?.isEmpty || false, sortedCards.indexOf('tasks'))}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={6}
          >
            <TasksCard onExpand={() => setExpandedCard('tasks')} />
          </motion.div>

          {/* Notes - 2 rows */}
          <motion.div 
            layoutId="card-notes"
            className={`${cardMeta['notes']?.isEmpty ? 'row-span-1 h-[60px]' : 'row-span-2'} transition-all duration-300 ${getFocusedClasses('notes', focusedCards, isSpeakingWithFocus)} ${getDimClasses('notes', focusedCards, isSpeakingWithFocus)}`}
            style={getCardStyles(cardMeta['notes']?.isEmpty || false, sortedCards.indexOf('notes'))}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={7}
          >
            <NotesCard onExpand={() => setExpandedCard('notes')} />
          </motion.div>

          {/* News - Wide, 2-3 columns depending on screen */}
          <motion.div 
            layoutId="card-news"
            className={`md:col-span-2 xl:col-span-2 2xl:col-span-3 ${cardMeta['news']?.isEmpty ? 'row-span-1 h-[60px]' : 'row-span-2'} transition-all duration-300 ${getFocusedClasses('news', focusedCards, isSpeakingWithFocus)} ${getDimClasses('news', focusedCards, isSpeakingWithFocus)}`}
            style={getCardStyles(cardMeta['news']?.isEmpty || false, sortedCards.indexOf('news'))}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={8}
          >
            <NewsCard onExpand={() => setExpandedCard('news')} />
          </motion.div>

          {/* Documents - Wide, 2-3 columns depending on screen */}
          <motion.div 
            layoutId="card-documents"
            className={`md:col-span-2 xl:col-span-2 2xl:col-span-2 ${cardMeta['documents']?.isEmpty ? 'row-span-1 h-[60px]' : 'row-span-2'} transition-all duration-300 ${getFocusedClasses('documents', focusedCards, isSpeakingWithFocus)} ${getDimClasses('documents', focusedCards, isSpeakingWithFocus)}`}
            style={getCardStyles(cardMeta['documents']?.isEmpty || false, sortedCards.indexOf('documents'))}
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
        </LayoutGroup>
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
