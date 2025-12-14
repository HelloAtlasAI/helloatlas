import { Cloud, Sun, Droplets, Wind, Sunrise, Sunset } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { motion } from 'framer-motion';

interface WeatherCardProps { isFocused?: boolean; streamingData?: any[]; }

const hourlyForecast = [
  { time: 'Now', temp: 68, icon: 'partly-cloudy' },
  { time: '12PM', temp: 71, icon: 'sunny' },
  { time: '3PM', temp: 72, icon: 'sunny' },
  { time: '6PM', temp: 69, icon: 'partly-cloudy' },
  { time: '9PM', temp: 64, icon: 'cloudy' },
];

export const WeatherCard = ({ isFocused }: WeatherCardProps) => (
  <DashboardCard glowColor="rgba(251, 191, 36, 0.15)">
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">San Francisco, CA</p>
          <div className="flex items-end gap-2"><span className="text-5xl font-light text-white">68°</span><span className="text-lg text-slate-400 mb-2">F</span></div>
          <p className="text-slate-300 mt-1">Partly Cloudy</p>
        </div>
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} className="relative">
          <Sun className="w-16 h-16 text-amber-400" />
          <motion.div animate={{ x: [0, 10, 0] }} transition={{ duration: 8, repeat: Infinity }} className="absolute -right-2 top-2"><Cloud className="w-12 h-12 text-slate-400" /></motion.div>
        </motion.div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5"><Droplets className="w-4 h-4 text-blue-400" /><div><p className="text-[10px] text-slate-500 uppercase">Humidity</p><p className="text-sm font-medium text-white">65%</p></div></div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5"><Wind className="w-4 h-4 text-cyan-400" /><div><p className="text-[10px] text-slate-500 uppercase">Wind</p><p className="text-sm font-medium text-white">12 mph</p></div></div>
      </div>
      <div className="pt-3 border-t border-white/5">
        <p className="text-xs text-slate-500 uppercase mb-3">Hourly</p>
        <div className="flex justify-between">
          {hourlyForecast.map((h, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl ${i === 0 ? 'bg-amber-500/10 border border-amber-500/20' : ''}`}>
              <span className={`text-xs ${i === 0 ? 'text-amber-400 font-medium' : 'text-slate-500'}`}>{h.time}</span>
              {h.icon === 'sunny' && <Sun className="w-5 h-5 text-amber-400" />}
              {h.icon === 'partly-cloudy' && <div className="relative"><Sun className="w-5 h-5 text-amber-400" /><Cloud className="w-3 h-3 text-slate-400 absolute -right-1 bottom-0" /></div>}
              {h.icon === 'cloudy' && <Cloud className="w-5 h-5 text-slate-400" />}
              <span className={`text-sm font-medium ${i === 0 ? 'text-white' : 'text-slate-300'}`}>{h.temp}°</span>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2"><Sunrise className="w-4 h-4 text-amber-400" /><div><p className="text-[10px] text-slate-500">Sunrise</p><p className="text-sm text-white">6:42 AM</p></div></div>
        <div className="flex-1 mx-4 h-1 rounded-full bg-gradient-to-r from-amber-500/30 via-amber-500 to-orange-500/30 relative"><motion.div className="absolute w-2 h-2 bg-amber-400 rounded-full -top-0.5 shadow-lg" style={{ left: '35%' }} animate={{ boxShadow: ['0 0 10px rgba(251,191,36,0.5)', '0 0 20px rgba(251,191,36,0.8)', '0 0 10px rgba(251,191,36,0.5)'] }} transition={{ duration: 2, repeat: Infinity }} /></div>
        <div className="flex items-center gap-2"><Sunset className="w-4 h-4 text-orange-400" /><div><p className="text-[10px] text-slate-500">Sunset</p><p className="text-sm text-white">5:24 PM</p></div></div>
      </div>
    </div>
  </DashboardCard>
);
