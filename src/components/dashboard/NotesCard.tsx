import { StickyNote, Plus, MoreHorizontal } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { motion } from 'framer-motion';

interface NotesCardProps { 
  isFocused?: boolean; 
}

const mockNotes = [
  { id: 1, title: 'Project Ideas', content: 'Explore AI integration for dashboard analytics...', color: 'from-amber-500/20 to-orange-500/20', borderColor: 'border-amber-500/30', time: '2h ago' },
  { id: 2, title: 'Meeting Notes', content: 'Discussed Q1 roadmap with engineering team...', color: 'from-blue-500/20 to-cyan-500/20', borderColor: 'border-blue-500/30', time: '5h ago' },
  { id: 3, title: 'Quick Reminder', content: 'Follow up with design team about new mockups...', color: 'from-violet-500/20 to-purple-500/20', borderColor: 'border-violet-500/30', time: 'Yesterday' },
];

export const NotesCard = ({ isFocused }: NotesCardProps) => {
  return (
    <DashboardCard 
      glowColor="rgba(245, 158, 11, 0.15)" 
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
              <StickyNote className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Notes</h3>
              <p className="text-xs text-slate-400">{mockNotes.length} notes</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            className="p-2 text-amber-400 bg-amber-500/10 rounded-lg hover:bg-amber-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>
      }
    >
      <div className="space-y-3">
        {mockNotes.map((note, i) => (
          <motion.div 
            key={note.id} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            className={`group relative p-4 rounded-xl cursor-pointer bg-gradient-to-br ${note.color} border ${note.borderColor} hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-white text-sm">{note.title}</h4>
              <MoreHorizontal className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-xs text-slate-300 line-clamp-2 mb-2">{note.content}</p>
            <span className="text-xs text-slate-500">{note.time}</span>
          </motion.div>
        ))}
      </div>
    </DashboardCard>
  );
};
