import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Flag, Plus, Trash2, Loader2, Calendar, Filter } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarWidget } from '@/components/ui/calendar';

const priorityColors = {
  high: { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  medium: { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  low: { text: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
};

type FilterType = 'all' | 'active' | 'completed' | 'overdue';
type PriorityType = 'high' | 'medium' | 'low';

export const ExpandedTasksCard = () => {
  const { tasks, isLoading, completedCount, progress, addTask, toggleTask, updateTask, deleteTask } = useTasks();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<PriorityType>('medium');
  const [newDueDate, setNewDueDate] = useState<Date | undefined>(undefined);
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    await addTask(newTitle, newPriority, newDueDate);
    setNewTitle('');
    setNewPriority('medium');
    setNewDueDate(undefined);
    setIsAdding(false);
  };

  const handleStartEdit = (task: any) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const handleSaveEdit = async (id: string) => {
    await updateTask(id, { title: editTitle });
    setEditingId(null);
  };

  const handlePriorityChange = async (id: string, priority: PriorityType) => {
    await updateTask(id, { priority });
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = parseISO(dueDate);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const isOverdue = (dueDate: string | null, completed: boolean) => {
    if (!dueDate || completed) return false;
    return isPast(parseISO(dueDate));
  };

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'active': return !task.completed;
      case 'completed': return task.completed;
      case 'overdue': return isOverdue(task.due_date, task.completed);
      default: return true;
    }
  });

  const overdueCount = tasks.filter(t => isOverdue(t.due_date, t.completed)).length;

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">All Tasks</h2>
            <p className="text-xs text-muted-foreground">{completedCount}/{tasks.length} completed</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-sm font-medium text-blue-400">{Math.round(progress)}%</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Task
        </motion.button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-lg w-fit">
        {(['all', 'active', 'completed', 'overdue'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === f 
                ? 'bg-primary/20 text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'overdue' && overdueCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-destructive/20 text-destructive rounded-full">
                {overdueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Add new task form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full mb-4 bg-transparent text-foreground text-base placeholder:text-muted-foreground outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              />
              
              <div className="flex items-center gap-4 mb-4">
                {/* Priority selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Priority:</span>
                  {(['low', 'medium', 'high'] as PriorityType[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        newPriority === p 
                          ? `${priorityColors[p].bg} ${priorityColors[p].text} ${priorityColors[p].border} border`
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Due date picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-1 text-xs text-muted-foreground hover:text-foreground rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <Calendar className="w-3 h-3" />
                      {newDueDate ? format(newDueDate, 'MMM d') : 'Set due date'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarWidget
                      mode="single"
                      selected={newDueDate}
                      onSelect={setNewDueDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddTask}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-primary/20 rounded-lg hover:bg-primary/30"
                >
                  Add Task
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tasks list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {filter === 'all' ? 'No tasks yet. Click "New Task" to create one.' : `No ${filter} tasks.`}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task, i) => {
            const isEditing = editingId === task.id;
            const overdue = isOverdue(task.due_date, task.completed);
            const priority = task.priority as PriorityType || 'medium';

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`group flex items-center gap-4 p-4 rounded-xl transition-colors ${
                  task.completed ? 'bg-muted/20 opacity-60' : 'bg-muted/30 hover:bg-muted/50'
                } ${overdue ? 'border border-destructive/30' : ''}`}
              >
                <button 
                  onClick={() => toggleTask(task.id)}
                  className="flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-transparent text-foreground outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(task.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => handleSaveEdit(task.id)}
                    />
                  ) : (
                    <p 
                      className={`text-sm cursor-pointer ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                      onClick={() => handleStartEdit(task)}
                    >
                      {task.title}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-1">
                    {task.due_date && (
                      <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                        <Clock className="w-3 h-3" />
                        {formatDueDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Priority badge */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full ${priorityColors[priority].bg} ${priorityColors[priority].text} ${priorityColors[priority].border} border`}>
                      <Flag className="w-3 h-3" />
                      {priority}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="end">
                    <div className="flex flex-col gap-1">
                      {(['low', 'medium', 'high'] as PriorityType[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => handlePriorityChange(task.id, p)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md text-left transition-colors ${
                            priority === p ? priorityColors[p].bg : 'hover:bg-muted'
                          } ${priorityColors[p].text}`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground/10 rounded"
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bulk actions */}
      {tasks.some(t => t.completed) && (
        <div className="flex justify-end pt-4 border-t border-border">
          <button
            onClick={() => tasks.filter(t => t.completed).forEach(t => deleteTask(t.id))}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear completed tasks
          </button>
        </div>
      )}
    </div>
  );
};
