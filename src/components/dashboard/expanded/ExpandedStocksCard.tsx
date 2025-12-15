import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Search, Star, ArrowUpRight, ArrowDownRight, Radio } from 'lucide-react';
import { useStocksRealtime } from '@/hooks/useStocksRealtime';
import { useWatchlist } from '@/hooks/useWatchlist';

interface PriceFlash {
  symbol: string;
  direction: 'up' | 'down';
  timestamp: number;
}

export const ExpandedStocksCard = () => {
  const { watchlist, symbols, addSymbol, removeSymbol } = useWatchlist();
  const { stocks, isLoading, isLive } = useStocksRealtime(symbols);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [priceFlashes, setPriceFlashes] = useState<PriceFlash[]>([]);
  const previousPrices = useRef<Record<string, number>>({});

  // Track price changes for flash animations
  useEffect(() => {
    stocks.forEach(stock => {
      const prevPrice = previousPrices.current[stock.symbol];
      if (prevPrice !== undefined && prevPrice !== stock.price) {
        const direction = stock.price > prevPrice ? 'up' : 'down';
        setPriceFlashes(prev => [...prev, { symbol: stock.symbol, direction, timestamp: Date.now() }]);
        
        // Clear flash after animation
        setTimeout(() => {
          setPriceFlashes(prev => prev.filter(f => f.symbol !== stock.symbol || Date.now() - f.timestamp > 500));
        }, 600);
      }
      previousPrices.current[stock.symbol] = stock.price;
    });
  }, [stocks]);

  const getFlashClass = (symbol: string) => {
    const flash = priceFlashes.find(f => f.symbol === symbol);
    if (!flash) return '';
    return flash.direction === 'up' ? 'animate-pulse-green' : 'animate-pulse-red';
  };

  const filteredStocks = useMemo(() => {
    if (!searchQuery) return stocks;
    return stocks.filter(s => 
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stocks, searchQuery]);

  const watchlistSymbols = new Set(watchlist.map(w => w.symbol));

  const formatChange = (change: number) => `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <TrendingUp className="w-12 h-12 text-emerald-400" />
        </motion.div>
      </div>
    );
  }

  const selected = selectedStock ? stocks.find(s => s.symbol === selectedStock) : null;

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* Stock list */}
      <div className="w-80 lg:w-96 flex-shrink-0 flex flex-col backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 overflow-hidden">
        <div className="p-4 border-b border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-foreground">Watchlist</span>
            </div>
            {/* Live indicator */}
            <AnimatePresence>
              {isLive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-emerald-400"
                  />
                  <Radio className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">Live</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredStocks.map((stock, i) => {
            const isPositive = stock.change >= 0;
            const isSelected = selectedStock === stock.symbol;
            const flashClass = getFlashClass(stock.symbol);
            
            return (
              <motion.button
                key={stock.symbol}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedStock(stock.symbol)}
                className={`w-full text-left p-3 rounded-xl transition-all ${flashClass} ${
                  isSelected ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30' : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {stock.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]">{stock.name || 'Stock'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <motion.div 
                      key={stock.price}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-medium text-foreground"
                    >
                      {formatPrice(stock.price)}
                    </motion.div>
                    <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {formatChange(stock.changePercent)}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Chart & Details */}
      <div className="flex-1 flex flex-col gap-6">
        {selected ? (
          <>
            <motion.div 
              className="backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-foreground">{selected.symbol}</h2>
                    <button
                      onClick={() => watchlistSymbols.has(selected.symbol) 
                        ? removeSymbol(selected.symbol) 
                        : addSymbol(selected.symbol, selected.name || '')
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        watchlistSymbols.has(selected.symbol) ? 'bg-amber-500/20 text-amber-400' : 'bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${watchlistSymbols.has(selected.symbol) ? 'fill-amber-400' : ''}`} />
                    </button>
                    {isLive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                        />
                        <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Streaming</span>
                      </motion.div>
                    )}
                  </div>
                  <p className="text-muted-foreground">{selected.name || 'Company Name'}</p>
                </div>
                <div className="text-right">
                  <motion.div 
                    key={selected.price}
                    initial={{ scale: 1.05, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`text-3xl font-bold text-foreground ${getFlashClass(selected.symbol)}`}
                  >
                    {formatPrice(selected.price)}
                  </motion.div>
                  <div className={`flex items-center justify-end gap-1 text-lg ${selected.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selected.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    {formatChange(selected.changePercent)}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="flex-1 backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 p-6 flex items-center justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-center text-muted-foreground">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Interactive chart coming soon</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Open', value: formatPrice(selected.price * 0.99) },
                { label: 'High', value: formatPrice(selected.price * 1.02) },
                { label: 'Low', value: formatPrice(selected.price * 0.97) },
                { label: 'Volume', value: '2.4M' },
                { label: 'Mkt Cap', value: '$2.1T' },
                { label: 'P/E Ratio', value: '28.5' },
                { label: '52w High', value: formatPrice(selected.price * 1.15) },
                { label: '52w Low', value: formatPrice(selected.price * 0.75) },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="backdrop-blur-xl bg-background/30 rounded-xl border border-border/30 p-4"
                >
                  <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                  <div className="text-sm font-medium text-foreground">{stat.value}</div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Select a stock to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Market Overview */}
      <div className="w-72 lg:w-80 flex-shrink-0 flex flex-col gap-4">
        <motion.div 
          className="backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 p-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-sm font-medium text-foreground mb-3">Market Indices</h3>
          <div className="space-y-3">
            {[
              { name: 'S&P 500', value: '4,567.23', change: 0.45 },
              { name: 'NASDAQ', value: '14,234.56', change: 0.82 },
              { name: 'DOW', value: '35,123.45', change: -0.12 },
            ].map((index) => (
              <div key={index.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div>
                  <div className="text-sm font-medium text-foreground">{index.name}</div>
                  <div className="text-xs text-muted-foreground">{index.value}</div>
                </div>
                <div className={`text-sm font-medium ${index.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatChange(index.change)}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="flex-1 backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 p-4 overflow-hidden flex flex-col"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-sm font-medium text-foreground mb-3">Top Movers</h3>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {stocks.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 8).map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => setSelectedStock(stock.symbol)}
                className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors ${getFlashClass(stock.symbol)}`}
              >
                <span className="text-sm font-medium text-foreground">{stock.symbol}</span>
                <span className={`text-sm ${stock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatChange(stock.changePercent)}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Flash animation styles */}
      <style>{`
        @keyframes pulse-green {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(16, 185, 129, 0.2); }
        }
        @keyframes pulse-red {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(239, 68, 68, 0.2); }
        }
        .animate-pulse-green {
          animation: pulse-green 0.5s ease-out;
        }
        .animate-pulse-red {
          animation: pulse-red 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};
