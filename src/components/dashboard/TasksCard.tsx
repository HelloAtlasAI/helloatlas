import { CheckCircle2, Circle, Clock, Flag } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { motion } from 'framer-motion';

interface TasksCardProps { 
  isFocused?: boolean; 
}

const mockTasks = [
  { id: 1, title: 'Review Q4 analytics report', completed: false, priority: 'high', dueTime: 'Today, 3:00 PM' },
  { id: 2, title: 'Prepare presentation slides', completed: false, priority: 'medium', dueTime: 'Today, 5:00 PM' },
  { id: 3, title: 'Send project update email', completed: true, priority: 'low', dueTime: 'Completed' },
  { id: 4, title: 'Schedule team sync meeting', completed: false, priority: 'medium', dueTime: 'Tomorrow' },
  { id: 5, title: 'Update documentation', completed: true, priority: 'low', dueTime: 'Completed' },
];

const priorityColors = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-slate-400',
};

export const TasksCard = ({ isFocused }: TasksCardProps) => {
  const completedCount = mockTasks.filter(t => t.completed).length;
  const progress = (completedCount / mockTasks.length) * 100;
  
  return (
    <DashboardCard 
      glowColor="rgba(59, 130, 246, 0.15)" 
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Tasks</h3>
              <p className="text-xs text-slate-400">{completedCount}/{mockTasks.length} completed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs text-blue-400">{Math.round(progress)}%</span>
          </div>
        </div>
      }
    >
      <div className="space-y-1">
        {mockTasks.map((task, i) => (
          <motion.div 
            key={task.id} 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: i * 0.08 }}
            className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors ${task.completed ? 'opacity-60' : ''}`}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-slate-500 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="text-xs text-slate-500">{task.dueTime}</span>
              </div>
            </div>
            <Flag className={`w-4 h-4 flex-shrink-0 ${priorityColors[task.priority as keyof typeof priorityColors]}`} />
          </motion.div>
        ))}
      </div>
    </DashboardCard>
  );
};
