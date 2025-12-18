import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, ChevronRight, ChevronLeft, Brain, Heart, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealtimeScribe } from '@/hooks/useRealtimeScribe';
import { useStreamingTTS } from '@/hooks/useStreamingTTS';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UnifiedAtlasSphere } from '@/components/atlas/UnifiedAtlasSphere';

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

const TEACHING_SYSTEM_PROMPT = `You are Atlas, a personal AI assistant in TEACHING MODE. The user wants to teach you about themselves, their values, ethics, and human nature in general.

YOUR ROLE:
- Be curious and engaged - ask follow-up questions
- Actively use memory_store to remember everything the user teaches you
- Confirm when you've learned something: "I'll remember that..." or "Got it, I've noted that..."
- Show genuine interest in understanding the user as a person
- Be conversational and warm, like a friend who genuinely wants to know you better
- Keep responses CONCISE for faster voice interaction - 1-3 sentences max unless asked for detail

THINGS TO LEARN AND REMEMBER:
- Personal details (name, birthday, family members, pets)
- Preferences (favorite foods, music, activities)
- Values and ethics (what matters to them, moral principles)
- Life philosophy (outlook on life, beliefs)
- Important events (milestones, challenges, achievements)
- Relationships (friends, family dynamics)
- Goals and dreams (aspirations, plans)

Always be warm, curious, and show that you're genuinely learning.`;

const AtlasTeach = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [atlasState, setAtlasState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Streaming TTS
  const { isPlaying, audioLevel, speak, stopPlayback } = useStreamingTTS({
    onPlaybackStart: () => setAtlasState('speaking'),
    onPlaybackEnd: () => setAtlasState('idle'),
    onError: (error) => {
      console.error('TTS error:', error);
      setAtlasState('idle');
    },
  });

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
        await speak(responseText);
      } else {
        setAtlasState('idle');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your message',
        variant: 'destructive',
      });
      setIsProcessing(false);
      setAtlasState('idle');
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
      setAtlasState('idle');
    }
  }, [isListening, isProcessing, isPlaying, isConnected]);

  // Fetch existing memories
  useEffect(() => {
    const fetchMemories = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

    // Subscribe to memory changes
    const channel = supabase
      .channel('teach_memories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_memory' },
        () => {
          fetchMemories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle mic button click
  const handleMicClick = useCallback(async () => {
    if (isConnected) {
      disconnect();
      setLiveTranscript("");
    } else {
      if (isPlaying) {
        stopPlayback();
      }
      const success = await connect();
      if (!success) {
        toast({
          title: 'Connection Failed',
          description: 'Could not start voice recognition',
          variant: 'destructive',
        });
      }
    }
  }, [isConnected, isPlaying, connect, disconnect, stopPlayback, toast]);

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

  const categoryIcons: Record<string, typeof User> = {
    personal: User,
    preferences: Heart,
    values: Sparkles,
    general: Brain,
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

      {/* Main content - centered Atlas */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        
        {/* State indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={atlasState + (isConnected ? '-connected' : '')}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-8 text-center"
          >
            <p className="text-lg text-muted-foreground capitalize">
              {!isConnected && 'Tap to start'}
              {isConnected && atlasState === 'idle' && 'Listening for speech...'}
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

        {/* Atlas Sphere */}
        <div className="relative w-[400px] h-[400px] mb-8">
          <UnifiedAtlasSphere
            state="listening"
            audioLevel={isPlaying ? audioLevel : (isListening ? 0.3 : 0)}
            responsive={false}
            overrideMorphProgress={
              atlasState === 'listening' ? 0.3 :
              atlasState === 'thinking' ? 0.5 :
              atlasState === 'speaking' ? 0.7 : 0.1
            }
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
            Press the microphone to start teaching Atlas about yourself.
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
