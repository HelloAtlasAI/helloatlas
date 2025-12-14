import { TrendingUp, TrendingDown, BarChart3, ChevronRight, Wifi } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { motion } from 'framer-motion';
import { useStocksRealtime } from '@/hooks/useStocksRealtime';

interface StocksCardProps { 
  isFocused?: boolean; 
  streamingData?: any[];
  onExpand?: () => void;
}

const defaultSymbols = ['AAPL', 'GOOGL', 'MSFT', 'NVDA'];

const Sparkline = ({ data, positive }: { data: number[]; positive: boolean }) => {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 60},${20 - ((v - min) / range) * 20}`).join(' ');
  return (<svg width="60" height="24"><defs><linearGradient id={`g-${positive?'u':'d'}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={positive?'#22c55e':'#ef4444'} stopOpacity="0.3"/><stop offset="100%" stopColor={positive?'#22c55e':'#ef4444'} stopOpacity="0"/></linearGradient></defs><polygon points={`0,24 ${points} 60,24`} fill={`url(#g-${positive?'u':'d'})`}/><polyline points={points} fill="none" stroke={positive?'#22c55e':'#ef4444'} strokeWidth="1.5"/></svg>);
};

export const StocksCard = ({ isFocused, onExpand }: StocksCardProps) => {
  const { stocks, isLive } = useStocksRealtime(defaultSymbols);
  
  // Generate sparkline data from price
  const getSparkline = (price: number) => {
    const base = price * 0.98;
    return Array.from({ length: 12 }, (_, i) => base + (Math.random() * price * 0.04));
  };

  return (
    <DashboardCard glowColor="rgba(34, 197, 94, 0.15)" onClick={onExpand} header={
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20"><BarChart3 className="w-5 h-5 text-emerald-400" /></div><div><h3 className="font-semibold text-white">Watchlist</h3><p className="text-xs text-slate-400">Market open</p></div></div>
        <div className="flex items-center gap-2">
          {isLive && <Wifi className="w-3 h-3 text-emerald-400" />}
          <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-2 bg-emerald-400 rounded-full" />
          <span className="text-xs text-emerald-400">{isLive ? 'Live' : 'Delayed'}</span>
        </div>
      </div>
    }>
      <div className="space-y-1">
        {stocks.length > 0 ? stocks.map((s, i) => {
          const pos = s.changePercent >= 0;
          const sparkline = getSparkline(s.price);
          return (<motion.div key={s.symbol} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="group flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-white/5">
            <div className="flex items-center gap-3 flex-1 min-w-0"><div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white ${pos?'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20':'bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/20'}`}>{s.symbol.slice(0,2)}</div><div className="min-w-0"><p className="font-medium text-white">{s.symbol}</p><p className="text-xs text-slate-500 truncate">Stock</p></div></div>
            <div className="hidden sm:block mx-4"><Sparkline data={sparkline} positive={pos} /></div>
            <div className="text-right"><motion.p key={s.price} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="font-medium text-white">${s.price.toFixed(2)}</motion.p><div className={`flex items-center justify-end gap-1 text-xs ${pos?'text-emerald-400':'text-red-400'}`}>{pos?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>}<span>{pos?'+':''}{s.changePercent.toFixed(2)}%</span></div></div>
            <ChevronRight className="ml-2 w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100" />
          </motion.div>);
        }) : defaultSymbols.map((symbol, i) => (
          <motion.div key={symbol} initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} className="p-3 rounded-xl animate-pulse">
            <div className="h-10 bg-muted/30 rounded-xl" />
          </motion.div>
        ))}
      </div>
    </DashboardCard>
  );
};

