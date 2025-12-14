import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  url: string;
  category: string;
  trending: boolean;
}

const MOCK_NEWS: NewsItem[] = [
  { id: '1', title: 'AI Breakthrough: New Language Models Show Human-Level Reasoning', source: 'TechCrunch', time: '2h ago', url: '#', trending: true, category: 'Technology' },
  { id: '2', title: 'Global Markets Rally on Positive Economic Data', source: 'Bloomberg', time: '4h ago', url: '#', trending: true, category: 'Finance' },
  { id: '3', title: 'Space Agency Announces New Moon Mission Timeline', source: 'Reuters', time: '6h ago', url: '#', trending: false, category: 'Science' },
];

export const useNews = (category?: string) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-news', {
        body: { category }
      });

      if (error) throw error;
      setNews(data?.articles || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      // Use mock data as fallback
      setNews(MOCK_NEWS);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchNews();
    // Refresh every 15 minutes
    const interval = setInterval(fetchNews, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  return {
    news,
    isLoading,
    error,
    refetch: fetchNews,
  };
};
