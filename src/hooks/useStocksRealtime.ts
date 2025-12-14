import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeStock {
  symbol: string;
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  volume?: number;
  timestamp: number;
}

interface PriceUpdate {
  symbol: string;
  price: number;
  volume?: number;
  timestamp: number;
}

export const useStocksRealtime = (symbols: string[]) => {
  const [stocks, setStocks] = useState<Map<string, RealtimeStock>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with baseline prices
  const initializeStocks = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-stocks', {
        body: { symbols },
      });

      if (!error && data?.stocks) {
        const stockMap = new Map<string, RealtimeStock>();
        data.stocks.forEach((stock: any) => {
          stockMap.set(stock.symbol, {
            symbol: stock.symbol,
            price: stock.price,
            previousPrice: stock.price,
            change: stock.change || 0,
            changePercent: stock.changePercent || 0,
            timestamp: Date.now(),
          });
        });
        setStocks(stockMap);
      }
    } catch (err) {
      console.error('Failed to initialize stocks:', err);
    }
  }, [symbols]);

  // Handle price update with animation trigger
  const handlePriceUpdate = useCallback((update: PriceUpdate) => {
    setStocks(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(update.symbol);
      
      if (existing) {
        const previousPrice = existing.price;
        const change = update.price - previousPrice;
        const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
        
        newMap.set(update.symbol, {
          ...existing,
          price: update.price,
          previousPrice,
          change,
          changePercent,
          volume: update.volume,
          timestamp: update.timestamp,
        });
      }
      
      return newMap;
    });
  }, []);

  // Connect to WebSocket
  const connectWebSocket = useCallback(async () => {
    if (symbols.length === 0) return;

    try {
      const wsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stocks-realtime`.replace('https://', 'wss://');
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsLive(true);
        
        // Subscribe to symbols
        ws.send(JSON.stringify({
          type: 'subscribe',
          symbols,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'trade' && data.data) {
            data.data.forEach((trade: any) => {
              handlePriceUpdate({
                symbol: trade.s,
                price: trade.p,
                volume: trade.v,
                timestamp: trade.t || Date.now(),
              });
            });
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsLive(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsLive(false);
        
        // Attempt reconnection after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setIsLive(false);
      
      // Fall back to polling
      startPollingFallback();
    }
  }, [symbols, handlePriceUpdate]);

  // Polling fallback
  const startPollingFallback = useCallback(() => {
    if (fallbackIntervalRef.current) return;

    fallbackIntervalRef.current = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stocks', {
          body: { symbols },
        });

        if (!error && data?.stocks) {
          data.stocks.forEach((stock: any) => {
            handlePriceUpdate({
              symbol: stock.symbol,
              price: stock.price,
              timestamp: Date.now(),
            });
          });
        }
      } catch (err) {
        console.error('Polling fallback error:', err);
      }
    }, 10000); // Poll every 10 seconds
  }, [symbols, handlePriceUpdate]);

  // Initialize and connect
  useEffect(() => {
    initializeStocks();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
    };
  }, [initializeStocks, connectWebSocket]);

  // Update subscriptions when symbols change
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        symbols,
      }));
    }
  }, [symbols]);

  return {
    stocks: Array.from(stocks.values()),
    stocksMap: stocks,
    isConnected,
    isLive,
    refetch: initializeStocks,
  };
};
