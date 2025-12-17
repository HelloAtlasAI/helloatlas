import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Brain, Search, Lightbulb, BookOpen } from 'lucide-react';

interface NotificationConfig {
  enabled?: boolean;
  soundEnabled?: boolean;
}

export const useAtlasNotifications = (config: NotificationConfig = {}) => {
  const { enabled = true, soundEnabled = false } = config;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

  // Show toast notification
  const showNotification = useCallback((
    title: string,
    description: string,
    type: 'knowledge' | 'research' | 'learning' | 'discovery'
  ) => {
    const icons = {
      knowledge: '🧠',
      research: '🔍',
      learning: '💡',
      discovery: '📚',
    };

    toast({
      title: `${icons[type]} ${title}`,
      description,
      duration: 5000,
    });

    playNotificationSound();
  }, [playNotificationSound]);

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to knowledge entries
    const knowledgeChannel = supabase
      .channel('atlas_knowledge_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'atlas_knowledge_entries' },
        (payload) => {
          const entry = payload.new as {
            topic: string;
            category: string;
            confidence: number;
          };
          showNotification(
            'New Knowledge Discovered',
            `Topic: ${entry.topic} (${entry.category}) - ${Math.round(entry.confidence * 100)}% confidence`,
            'knowledge'
          );
        }
      )
      .subscribe();

    // Subscribe to research topics
    const researchChannel = supabase
      .channel('atlas_research_notifications')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'atlas_research_topics' },
        (payload) => {
          const topic = payload.new as {
            topic: string;
            status: string;
            findings: unknown;
          };
          
          if (topic.status === 'completed' && topic.findings) {
            showNotification(
              'Research Complete',
              `Findings available for: ${topic.topic}`,
              'research'
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'atlas_research_topics' },
        (payload) => {
          const topic = payload.new as { topic: string };
          showNotification(
            'Research Started',
            `Now researching: ${topic.topic}`,
            'research'
          );
        }
      )
      .subscribe();

    // Subscribe to learning sessions
    const learningChannel = supabase
      .channel('atlas_learning_notifications')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'atlas_learning_sessions' },
        (payload) => {
          const session = payload.new as {
            topic: string;
            status: string;
            discoveries: unknown;
          };
          
          if (session.status === 'completed' && session.discoveries) {
            showNotification(
              'Learning Session Complete',
              `New discoveries for: ${session.topic}`,
              'learning'
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(knowledgeChannel);
      supabase.removeChannel(researchChannel);
      supabase.removeChannel(learningChannel);
    };
  }, [enabled, showNotification]);

  return { showNotification };
};
