import { TrendingUp, TrendingDown, BarChart3, ChevronRight } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { motion } from 'framer-motion';

interface StocksCardProps { isFocused?: boolean; streamingData?: any[]; }
const mockStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 189.84, change: 1.24, changePercent: 0.66, sparkline: [65, 70, 68, 72, 75, 73, 78, 82, 80, 85, 83, 88] },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.16, change: -0.89, changePercent: -0.63, sparkline: [80, 78, 82, 79, 75, 77, 73, 70, 72, 68, 70, 69] },
  { symbol: 'MSFT', name: 'Microsoft', price: 378.91, change: 4.12, changePercent: 1.10, sparkline: [60, 62, 65, 68, 70, 72, 75, 78, 80, 82, 85, 88] },
  { symbol: 'NVDA', name: 'NVIDIA', price: 495.22, change: 12.55, changePercent: 2.60, sparkline: [45, 50, 55, 58, 62, 68, 72, 78, 82, 88, 92, 95] },
];
const Sparkline = ({ data, positive }: { data: number[]; positive: boolean }) => {
  const max = Math.max(...data), min = Math.min(...data), range = max - min;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 60},${20 - ((v - min) / range) * 20}`).join(' ');
  return (<svg width="60" height="24"><defs><linearGradient id={`g-${positive?'u':'d'}`} x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={positive?'#22c55e':'#ef4444'} stopOpacity="0.3"/><stop offset="100%" stopColor={positive?'#22c55e':'#ef4444'} stopOpacity="0"/></linearGradient></defs><polygon points={`0,24 ${points} 60,24`} fill={`url(#g-${positive?'u':'d'})`}/><polyline points={points} fill="none" stroke={positive?'#22c55e':'#ef4444'} strokeWidth="1.5"/></svg>);
};
export const StocksCard = ({ isFocused }: StocksCardProps) => (
  <DashboardCard glowColor="rgba(34, 197, 94, 0.15)" header={
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20"><BarChart3 className="w-5 h-5 text-emerald-400" /></div><div><h3 className="font-semibold text-white">Watchlist</h3><p className="text-xs text-slate-400">Market open</p></div></div>
      <div className="flex items-center gap-2"><motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-2 bg-emerald-400 rounded-full" /><span className="text-xs text-emerald-400">Live</span></div>
    </div>
  }>
    <div className="space-y-1">
      {mockStocks.map((s, i) => {
        const pos = s.change >= 0;
        return (<motion.div key={s.symbol} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="group flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-white/5">
          <div className="flex items-center gap-3 flex-1 min-w-0"><div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white ${pos?'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20':'bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/20'}`}>{s.symbol.slice(0,2)}</div><div className="min-w-0"><p className="font-medium text-white">{s.symbol}</p><p className="text-xs text-slate-500 truncate">{s.name}</p></div></div>
          <div className="hidden sm:block mx-4"><Sparkline data={s.sparkline} positive={pos} /></div>
          <div className="text-right"><p className="font-medium text-white">${s.price.toFixed(2)}</p><div className={`flex items-center justify-end gap-1 text-xs ${pos?'text-emerald-400':'text-red-400'}`}>{pos?<TrendingUp className="w-3 h-3"/>:<TrendingDown className="w-3 h-3"/>}<span>{pos?'+':''}{s.changePercent.toFixed(2)}%</span></div></div>
          <ChevronRight className="ml-2 w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100" />
        </motion.div>);
      })}
    </div>
  </DashboardCard>
);
