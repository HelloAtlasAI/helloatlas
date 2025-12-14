import { Calendar, Clock, Video, MapPin, ChevronRight } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface CalendarCardProps { isFocused?: boolean; streamingData?: any[]; }

const mockEvents = [
  { id: 1, title: 'Daily Standup', time: '9:00 AM', duration: '15 min', type: 'video', attendees: ['JD', 'SC', 'MK'], isNow: true, color: 'from-emerald-500 to-teal-500', location: 'Zoom' },
  { id: 2, title: 'Product Review', time: '2:00 PM', duration: '1 hour', type: 'video', attendees: ['AR', 'TW'], isNow: false, color: 'from-blue-500 to-cyan-500', location: 'Meet' },
  { id: 3, title: '1:1 with Manager', time: '4:00 PM', duration: '30 min', type: 'in-person', attendees: ['LM'], isNow: false, color: 'from-violet-500 to-purple-500', location: 'Room 4B' },
];

export const CalendarCard = ({ isFocused }: CalendarCardProps) => {
  const today = format(new Date(), 'EEEE, MMM d');
  return (
    <DashboardCard glowColor="rgba(59, 130, 246, 0.15)" header={
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20"><Calendar className="w-5 h-5 text-blue-400" /></div>
          <div><h3 className="font-semibold text-white">Today</h3><p className="text-xs text-slate-400">{today}</p></div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 rounded-lg">+ Add</motion.button>
      </div>
    }>
      <div className="relative space-y-3">
        <div className="absolute left-[18px] top-3 bottom-3 w-px bg-gradient-to-b from-slate-700 via-slate-600 to-slate-700" />
        {mockEvents.map((event, i) => (
          <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="group relative pl-10 pr-3 py-3 rounded-xl cursor-pointer hover:bg-white/5">
            <div className={`absolute left-3 top-4 w-3 h-3 rounded-full border-2 border-slate-800 bg-gradient-to-br ${event.color} ${event.isNow ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-emerald-400/50' : ''}`} />
            {event.isNow && <div className="absolute left-8 -top-1 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/20 rounded-full border border-emerald-500/30">Now</div>}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white truncate">{event.title}</h4>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.time} · {event.duration}</span>
                  {event.type === 'video' ? <span className="flex items-center gap-1 text-blue-400"><Video className="w-3 h-3" />{event.location}</span> : <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                </div>
              </div>
              <div className="flex items-center -space-x-2">
                {event.attendees.map((a, j) => <div key={j} className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-slate-800 ${j === 0 ? 'bg-gradient-to-br from-pink-500 to-rose-500' : j === 1 ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-violet-500 to-purple-500'}`}>{a}</div>)}
              </div>
            </div>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100" />
          </motion.div>
        ))}
      </div>
    </DashboardCard>
  );
};
