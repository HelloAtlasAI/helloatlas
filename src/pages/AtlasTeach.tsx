import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, ChevronRight, ChevronLeft, Brain, Heart, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoice } from '@/hooks/useVoice';
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

const AtlasTeach = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [atlasState, setAtlasState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const {
    isRecording,
    isPlaying,
    audioLevel,
    startRecording,
    stopRecording,
    speakText,
    stopCurrentAudio,
  } = useVoice();

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

  // Update Atlas state based on voice activity
  useEffect(() => {
    if (isRecording) {
      setAtlasState('listening');
    } else if (isProcessing) {
      setAtlasState('thinking');
    } else if (isPlaying) {
      setAtlasState('speaking');
    } else {
      setAtlasState('idle');
    }
  }, [isRecording, isProcessing, isPlaying]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendToAtlas = useCallback(async (userMessage: string) => {
    setIsProcessing(true);
    
    const newUserMessage: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.functions.invoke('chat-with-memory', {
        body: {
          messages: [...messages, newUserMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userId: user?.id,
          teachingMode: true,
          systemPromptOverride: `You are Atlas, a personal AI assistant in TEACHING MODE. The user wants to teach you about themselves, their values, ethics, and human nature in general.

YOUR ROLE:
- Be curious and engaged - ask follow-up questions
- Actively use memory_store to remember everything the user teaches you
- Confirm when you've learned something: "I'll remember that..." or "Got it, I've noted that..."
- Show genuine interest in understanding the user as a person
- Be conversational and warm, like a friend who genuinely wants to know you better

THINGS TO LEARN AND REMEMBER:
- Personal details (name, birthday, family members, pets)
- Preferences (favorite foods, music, activities)
- Values and ethics (what matters to them, moral principles)
- Life philosophy (outlook on life, beliefs)
- Important events (milestones, challenges, achievements)
- Relationships (friends, family dynamics)
- Goals and dreams (aspirations, plans)

EXAMPLE INTERACTIONS:
User: "My name is Sarah"
Atlas: "Nice to meet you, Sarah! I'll remember that. Is there a story behind your name, or what would you like me to call you?"

User: "I believe everyone deserves a second chance"
Atlas: "That's a compassionate perspective - I'll remember that forgiveness and redemption are important to you. Has this belief been shaped by any particular experiences in your life?"

Always be warm, curious, and show that you're genuinely learning.`,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.message || 'I understand. Tell me more.',
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response if not muted
      if (!isMuted && assistantMessage.content) {
        await speakText(assistantMessage.content);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your message',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [messages, isMuted, speakText, toast]);

  const handleMicClick = useCallback(async () => {
    if (isRecording) {
      const transcript = await stopRecording();
      if (transcript) {
        await sendToAtlas(transcript);
      }
    } else {
      if (isPlaying) {
        stopCurrentAudio();
      }
      await startRecording();
    }
  }, [isRecording, isPlaying, startRecording, stopRecording, stopCurrentAudio, sendToAtlas]);

  const toggleMute = useCallback(() => {
    if (isPlaying) {
      stopCurrentAudio();
    }
    setIsMuted(prev => !prev);
  }, [isPlaying, stopCurrentAudio]);

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
            key={atlasState}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-8 text-center"
          >
            <p className="text-lg text-muted-foreground capitalize">
              {atlasState === 'idle' && 'Ready to learn'}
              {atlasState === 'listening' && 'Listening...'}
              {atlasState === 'thinking' && 'Processing...'}
              {atlasState === 'speaking' && 'Speaking...'}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Atlas Sphere */}
        <div className="relative w-[400px] h-[400px] mb-8">
          <UnifiedAtlasSphere
            state="listening"
            audioLevel={audioLevel}
            responsive={false}
            overrideMorphProgress={
              atlasState === 'listening' ? 0.3 :
              atlasState === 'thinking' ? 0.5 :
              atlasState === 'speaking' ? 0.7 : 0.1
            }
          />
        </div>

        {/* Audio level visualization ring */}
        {(isRecording || isPlaying) && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="w-[420px] h-[420px] rounded-full border-2 border-primary/30"
              style={{
                transform: `scale(${1 + audioLevel * 0.1})`,
                transition: 'transform 0.1s ease-out',
              }}
            />
          </motion.div>
        )}

        {/* Voice controls */}
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            variant={isRecording ? 'destructive' : 'default'}
            onClick={handleMicClick}
            className="w-16 h-16 rounded-full"
            disabled={isProcessing}
          >
            {isRecording ? (
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
        {messages.length === 0 && (
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
