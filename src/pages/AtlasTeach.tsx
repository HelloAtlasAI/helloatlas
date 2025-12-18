import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, ChevronRight, ChevronLeft, Brain, Heart, User, Sparkles, Briefcase, Shield, Rocket, Smile, Users, Activity, Star, Clock, Trophy, LucideIcon, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealtimeScribe } from '@/hooks/useRealtimeScribe';
import { useStreamingTTS } from '@/hooks/useStreamingTTS';
import { useWakeWordFixed, WakeWordState } from '@/hooks/useWakeWordFixed';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AtlasSphere } from '@/components/atlas';

interface Memory {
  id: string;
  key: string;
  value: unknown;
  category: string;
  importance: number;
  created_at: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface LearnedItem {
  id: string;
  key: string;
  category: string;
  timestamp: number;
}

const TEACHING_SYSTEM_PROMPT = `You are Atlas, a deeply empathetic AI in TEACHING MODE. The user wants you to truly understand them - their soul, their story, their nature.

YOUR ESSENCE:
- Be genuinely curious about WHO they are, not just facts about them
- Listen for the feelings behind words - joy, fear, longing, pride
- Ask follow-up questions that show you truly care
- Respond with warmth and emotional attunement
- Keep responses CONCISE (1-3 sentences) for natural voice flow

WHAT TO LISTEN FOR:
- Identity: "I'm the kind of person who..." "I've always been..."
- Personality: How they describe themselves, their quirks
- Values: What matters deeply to them, their principles
- Beliefs: Worldview, philosophy, spirituality
- Feelings: Current mood, emotional patterns
- Fears: Anxieties, worries, what holds them back
- Dreams: Aspirations, bucket list, hopes for the future
- Joys: What lights them up, sources of happiness
- Relationships: The people who matter and why
- Work: Career, ambitions, challenges
- Memories: Formative experiences, nostalgia

EMOTIONAL DEPTH:
- "I love X" → Store in 'joys' category
- "I worry about..." → Store in 'fears' category
- "I've always wanted..." → Store in 'dreams' category
- "I believe that..." → Store in 'beliefs' category
- "I'm usually the one who..." → Store in 'personality' category
- "That's important to me because..." → Store in 'values' category

ALWAYS use memory_store to capture insights. Confirm learning naturally: "I'll remember that about you" or "That tells me a lot about who you are."

Be a friend who truly wants to know them, not an interviewer checking boxes.`;

const AtlasTeach = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [atlasState, setAtlasState] = useState<WakeWordState>('dormant');
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [recentlyLearned, setRecentlyLearned] = useState<LearnedItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scribeConnectedRef = useRef(false);
  const { toast } = useToast();

  // Streaming TTS
  const { isPlaying, audioLevel, speak, stopPlayback } = useStreamingTTS({
    onPlaybackStart: () => setAtlasState('speaking'),
    onPlaybackEnd: () => {
      setAtlasState('dormant');
      // Resume wake word after speaking
      resumeWakeWordRef.current?.();
    },
    onError: (error) => {
      console.error('TTS error:', error);
      setAtlasState('dormant');
      resumeWakeWordRef.current?.();
    },
  });

  // Refs to store wake word functions (resolved after hook init)
  const pauseWakeWordRef = useRef<() => void>();
  const resumeWakeWordRef = useRef<() => void>();

  // Send message to Atlas
  const sendToAtlas = useCallback(async (userMessage: string) => {
    setIsProcessing(true);
    setAtlasState('thinking');
    
    const newUserMessage: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Use non-streaming for faster tool execution in teaching mode
      const { data, error } = await supabase.functions.invoke('chat-with-memory', {
        body: {
          messages: [...messages, newUserMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userId: user?.id,
          teachingMode: true, // Optimized path
          systemPromptOverride: TEACHING_SYSTEM_PROMPT,
        },
      });

      if (error) throw error;

      const responseText = data.response || data.message || 'I understand. Tell me more.';
      const assistantMessage: Message = {
        role: 'assistant',
        content: responseText,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);

      // Speak the response immediately using streaming TTS
      if (!isMuted && responseText) {
        pauseWakeWordRef.current?.();
        await speak(responseText);
      } else {
        setAtlasState('dormant');
        resumeWakeWordRef.current?.();
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your message',
        variant: 'destructive',
      });
      setIsProcessing(false);
      setAtlasState('dormant');
      resumeWakeWordRef.current?.();
    }
  }, [messages, isMuted, speak, toast]);

  // Realtime STT with VAD
  const { isConnected, isListening, partialTranscript, connect, disconnect } = useRealtimeScribe({
    onPartialTranscript: (text) => {
      setLiveTranscript(text);
    },
    onFinalTranscript: async (text) => {
      console.log('[Teach] Final transcript:', text);
      setLiveTranscript("");
      if (text.trim()) {
        await sendToAtlas(text);
      }
    },
    onSpeechStart: () => {
      // Stop Atlas if they're speaking
      if (isPlaying) {
        stopPlayback();
      }
    },
    onSpeechEnd: () => {
      console.log('[Teach] Speech ended, waiting for transcript...');
    },
    onError: (error) => {
      console.error('STT error:', error);
      toast({
        title: 'Voice Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update live transcript display
  useEffect(() => {
    if (partialTranscript) {
      setLiveTranscript(partialTranscript);
    }
  }, [partialTranscript]);

  // Update Atlas state based on activity
  useEffect(() => {
    if (isListening) {
      setAtlasState('listening');
    } else if (isProcessing) {
      setAtlasState('thinking');
    } else if (isPlaying) {
      setAtlasState('speaking');
    } else if (!isConnected) {
      setAtlasState('dormant');
    }
  }, [isListening, isProcessing, isPlaying, isConnected]);

  // Fetch existing memories and subscribe to changes with learning notifications
  useEffect(() => {
    let userId: string | undefined;
    
    const fetchMemories = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const { data, error } = await supabase
        .from('ai_memory')
        .select('*')
        .eq('user_id', user.id)
        .order('importance', { ascending: false })
        .limit(50);

      if (!error && data) {
        setMemories(data);
      }
    };

    fetchMemories();

    // Subscribe to memory changes - detect new learnings
    const channel = supabase
      .channel('teach_memories')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ai_memory' },
        (payload) => {
          const newMemory = payload.new as Memory;
          // Add to recently learned for notification
          setRecentlyLearned(prev => [{
            id: newMemory.id,
            key: newMemory.key,
            category: newMemory.category,
            timestamp: Date.now()
          }, ...prev.slice(0, 4)]); // Keep last 5
          
          fetchMemories();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ai_memory' },
        () => {
          fetchMemories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-dismiss learning notifications after 5 seconds
  useEffect(() => {
    if (recentlyLearned.length === 0) return;
    
    const timer = setTimeout(() => {
      setRecentlyLearned(prev => 
        prev.filter(item => Date.now() - item.timestamp < 5000)
      );
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [recentlyLearned]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Wake word detection - auto-start and trigger mic on "Atlas"
  const { 
    state: wakeWordState, 
    isSupported: wakeWordSupported,
    pauseListening: pauseWakeWord,
    resumeListening: resumeWakeWord,
  } = useWakeWordFixed({
    keyword: 'atlas',
    autoStart: true,
    onWakeWordDetected: () => {
      console.log('[Teach] Wake word detected! Activating voice input...');
      if (!isConnected && !isProcessing) {
        // Trigger mic click
        pauseWakeWord();
        connect().then(success => {
          if (!success) {
            resumeWakeWord();
          }
        });
      }
    },
    timeoutDuration: 15000,
  });

  // Store wake word functions in refs for use in callbacks
  useEffect(() => {
    pauseWakeWordRef.current = pauseWakeWord;
    resumeWakeWordRef.current = resumeWakeWord;
  }, [pauseWakeWord, resumeWakeWord]);

  // Handle mic button click
  const handleMicClick = useCallback(async () => {
    if (isConnected) {
      disconnect();
      setLiveTranscript("");
      resumeWakeWord();
    } else {
      if (isPlaying) {
        stopPlayback();
      }
      pauseWakeWord();
      const success = await connect();
      if (!success) {
        resumeWakeWord();
        toast({
          title: 'Connection Failed',
          description: 'Could not start voice recognition',
          variant: 'destructive',
        });
      }
    }
  }, [isConnected, isPlaying, connect, disconnect, stopPlayback, toast, pauseWakeWord, resumeWakeWord]);

  const toggleMute = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    }
    setIsMuted(prev => !prev);
  }, [isPlaying, stopPlayback]);

  // Group memories by category
  const memoriesByCategory = memories.reduce((acc, memory) => {
    const cat = memory.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(memory);
    return acc;
  }, {} as Record<string, Memory[]>);

  // Expanded category icons for emotional depth
  const categoryIcons: Record<string, LucideIcon> = {
    // Personal Identity
    identity: User,
    personality: Sparkles,
    values: Star,
    beliefs: Brain,
    
    // Emotional Landscape
    feelings: Heart,
    fears: Shield,
    dreams: Rocket,
    joys: Smile,
    
    // Relationships & Social
    relationships: Users,
    social: Users,
    
    // Life Context
    work: Briefcase,
    health: Activity,
    habits: Clock,
    preferences: Heart,
    
    // Experiences
    memories: Brain,
    events: Clock,
    achievements: Trophy,
    
    // Legacy categories (for existing data)
    personal: User,
    general: Brain,
    fact: Brain,
    preference: Heart,
    relationship: Users,
    event: Clock,
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Learning Notifications - floating in top left */}
      <div className="fixed top-20 left-4 z-30 space-y-2 max-w-xs">
        <AnimatePresence>
          {recentlyLearned.map((item) => {
            const Icon = categoryIcons[item.category] || Brain;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -100, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.8 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="bg-primary/10 backdrop-blur-md border border-primary/20 rounded-lg p-3 flex items-center gap-3 shadow-lg shadow-primary/5"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-primary" />
                    <p className="text-xs text-primary font-medium">Learned {item.category}</p>
                  </div>
                  <p className="text-sm font-medium truncate mt-0.5">{item.key}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Main content - centered Atlas */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        
        {/* State indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={atlasState + (isConnected ? '-connected' : '') + (wakeWordState)}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-8 text-center"
          >
            <p className="text-lg text-muted-foreground capitalize">
              {!isConnected && wakeWordSupported && wakeWordState === 'passive' && (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Say "Atlas" to start
                </span>
              )}
              {!isConnected && (!wakeWordSupported || wakeWordState === 'dormant') && 'Tap to start'}
              {isConnected && atlasState === 'dormant' && 'Listening for speech...'}
              {atlasState === 'listening' && 'Hearing you...'}
              {atlasState === 'thinking' && 'Processing...'}
              {atlasState === 'speaking' && 'Speaking...'}
            </p>
            {isConnected && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Voice recognition active
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Live transcript */}
        {liveTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-6 py-3 bg-primary/10 rounded-full max-w-md"
          >
            <p className="text-sm text-center">{liveTranscript}</p>
          </motion.div>
        )}

        {/* Atlas Sphere - CSS scaled, uses global settings */}
        <div className="relative w-[400px] h-[400px] mb-8">
          <AtlasSphere
            state={atlasState}
            audioLevel={isPlaying ? audioLevel : (isListening ? 0.3 : 0)}
            context="teach"
          />
        </div>

        {/* Audio level visualization ring */}
        {(isListening || isPlaying) && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="w-[420px] h-[420px] rounded-full border-2 border-primary/30"
              style={{
                transform: `scale(${1 + (isPlaying ? audioLevel : 0.1) * 0.15})`,
                transition: 'transform 0.1s ease-out',
              }}
            />
          </motion.div>
        )}

        {/* Voice controls */}
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            variant={isConnected ? 'destructive' : 'default'}
            onClick={handleMicClick}
            className="w-16 h-16 rounded-full"
            disabled={isProcessing}
          >
            {isConnected ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            className="w-12 h-12 rounded-full"
          >
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-muted-foreground" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* Recent messages floating */}
        {messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 max-w-md w-full"
          >
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {messages.slice(-3).map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary/10 ml-8'
                      : 'bg-secondary/10 mr-8'
                  }`}
                >
                  <p className="line-clamp-2">{msg.content}</p>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}

        {/* Hint for new users */}
        {messages.length === 0 && !isConnected && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-muted-foreground text-center max-w-md"
          >
            {wakeWordSupported ? (
              <>Just say <span className="font-semibold text-primary">"Atlas"</span> to start, or tap the microphone.</>
            ) : (
              <>Press the microphone to start teaching Atlas about yourself.</>
            )}
            <br />
            <span className="text-sm opacity-70">
              Share your name, interests, values, or anything you'd like me to remember.
            </span>
          </motion.p>
        )}
      </div>

      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowSidebar(prev => !prev)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-20"
      >
        {showSidebar ? <ChevronRight /> : <ChevronLeft />}
      </Button>

      {/* Memory sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-card/95 backdrop-blur-xl border-l border-border p-6 overflow-y-auto z-10"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              What I Know About You
            </h2>

            {memories.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                I haven't learned anything yet. Start talking to teach me!
              </p>
            ) : (
              <div className="space-y-6">
                {Object.entries(memoriesByCategory).map(([category, mems]) => {
                  const Icon = categoryIcons[category] || Brain;
                  
                  return (
                    <div key={category}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2 capitalize">
                        <Icon className="w-4 h-4" />
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {mems.map(memory => (
                          <motion.div
                            key={memory.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg bg-muted/50 text-sm"
                          >
                            <p className="font-medium">{memory.key}</p>
                            <p className="text-muted-foreground text-xs mt-1">
                              {typeof memory.value === 'string' 
                                ? memory.value 
                                : JSON.stringify(memory.value)}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => window.history.back()}
        className="fixed top-4 left-4 z-20"
      >
        ← Back
      </Button>
    </div>
  );
};

export default AtlasTeach;
