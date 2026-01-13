import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAtlasProviderStatus } from './useAtlasProviderStatus';
import { useToast } from './use-toast';

export interface StartLearningParams {
  topic: string;
  triggerType?: 'voice' | 'text' | 'manual';
  userId?: string;
  sessionId?: string;
}

export function useAtlasLearningControl() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    settings,
    learningEnabled,
    isSystemHealthy,
    hasCreditsIssue,
    hasRateLimitIssue,
    toggleLearning,
    updateSettings,
    isToggling,
  } = useAtlasProviderStatus();

  // Start learning on a topic
  const startLearningMutation = useMutation({
    mutationFn: async (params: StartLearningParams) => {
      // Pre-flight checks
      if (!learningEnabled) {
        throw new Error('Learning is disabled. Enable learning first.');
      }

      if (!isSystemHealthy) {
        throw new Error('System is unhealthy. Some providers may be down.');
      }

      if (hasCreditsIssue) {
        throw new Error('AI credits are exhausted. Please add more credits.');
      }

      // Call atlas-control edge function
      const { data, error } = await supabase.functions.invoke('atlas-control', {
        body: { 
          topic: params.topic,
          userId: params.userId,
          sessionId: params.sessionId,
          triggerType: params.triggerType || 'manual',
        },
        headers: {
          'x-action': 'start_learning',
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['atlas-learning-logs'] });
      queryClient.invalidateQueries({ queryKey: ['atlas-research-topics'] });
      toast({
        title: 'Learning Started',
        description: `Atlas is now learning about the requested topic.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Learning Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    },
  });

  // Check if a message has learning intent
  const checkLearningIntent = async (message: string): Promise<{
    shouldLearn: boolean;
    topic?: string;
    intentType?: string;
    reason?: string;
  }> => {
    try {
      const { data, error } = await supabase.functions.invoke('atlas-control', {
        body: { message },
        headers: {
          'x-action': 'check_learning_intent',
        },
      });

      if (error) {
        console.error('Failed to check learning intent:', error);
        return { shouldLearn: false, reason: 'check_failed' };
      }

      return {
        shouldLearn: data.shouldLearn,
        topic: data.intent?.topic,
        intentType: data.intent?.type,
        reason: data.reason,
      };
    } catch (e) {
      console.error('Learning intent check error:', e);
      return { shouldLearn: false, reason: 'error' };
    }
  };

  // Quick enable/disable learning
  const enableLearning = () => {
    if (hasCreditsIssue) {
      toast({
        title: 'Cannot Enable Learning',
        description: 'AI credits are exhausted. Please add more credits first.',
        variant: 'destructive',
      });
      return;
    }
    toggleLearning(true);
    toast({
      title: 'Learning Enabled',
      description: 'Atlas will now learn from your conversations when requested.',
    });
  };

  const disableLearning = () => {
    toggleLearning(false);
    toast({
      title: 'Learning Disabled',
      description: 'Atlas will no longer learn from conversations.',
    });
  };

  // Update learning settings
  const setMaxTopics = (max: number) => {
    updateSettings({ max_topics_per_session: max });
  };

  const setMaxDepth = (max: number) => {
    updateSettings({ max_research_depth: max });
  };

  const setLearningMode = (mode: 'on_demand' | 'scheduled' | 'disabled') => {
    updateSettings({ learning_mode: mode });
    if (mode === 'disabled') {
      toggleLearning(false);
    }
  };

  return {
    // State
    learningEnabled,
    isSystemHealthy,
    hasCreditsIssue,
    hasRateLimitIssue,
    settings,
    
    // Actions
    startLearning: startLearningMutation.mutate,
    checkLearningIntent,
    enableLearning,
    disableLearning,
    setMaxTopics,
    setMaxDepth,
    setLearningMode,
    
    // Loading states
    isStartingLearning: startLearningMutation.isPending,
    isToggling,
    
    // Helpers
    canLearn: learningEnabled && isSystemHealthy && !hasCreditsIssue,
  };
}
