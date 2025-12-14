import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

const MOCK_STOCKS: StockData[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 189.84, change: 1.24, changePercent: 0.66, sparkline: [65, 70, 68, 72, 75, 73, 78, 82, 80, 85, 83, 88] },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.16, change: -0.89, changePercent: -0.63, sparkline: [80, 78, 82, 79, 75, 77, 73, 70, 72, 68, 70, 69] },
  { symbol: 'MSFT', name: 'Microsoft', price: 378.91, change: 4.12, changePercent: 1.10, sparkline: [60, 62, 65, 68, 70, 72, 75, 78, 80, 82, 85, 88] },
  { symbol: 'NVDA', name: 'NVIDIA', price: 495.22, change: 12.55, changePercent: 2.60, sparkline: [45, 50, 55, 58, 62, 68, 72, 78, 82, 88, 92, 95] },
];

export const useStocks = (symbols: string[]) => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    if (symbols.length === 0) {
      setStocks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-stocks', {
        body: { symbols }
      });

      if (error) throw error;
      setStocks(data?.stocks || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      // Use mock data as fallback
      setStocks(MOCK_STOCKS.filter(s => symbols.includes(s.symbol)));
    } finally {
      setIsLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchStocks();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStocks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStocks]);

  return {
    stocks,
    isLoading,
    error,
    refetch: fetchStocks,
  };
};
