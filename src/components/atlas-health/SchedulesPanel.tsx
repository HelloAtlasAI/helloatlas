import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Play, Loader2, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useSchedules } from '@/hooks/useSchedules';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow, format } from 'date-fns';

export function SchedulesPanel() {
  const { schedules, isLoading, toggleSchedule, runNow, deleteSchedule } = useSchedules();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);

  const handleToggle = async (id: string, enabled: boolean) => {
    setProcessingId(id);
    try {
      await toggleSchedule(id, enabled);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRunNow = async (id: string) => {
    setProcessingId(id);
    try {
      await runNow(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedSchedule) return;
    setProcessingId(selectedSchedule);
    try {
      await deleteSchedule(selectedSchedule);
    } finally {
      setProcessingId(null);
      setDeleteDialogOpen(false);
      setSelectedSchedule(null);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-accent/10">
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Schedules</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Schedules</h3>
          </div>
          <Badge variant="outline" className="text-muted-foreground">
            {schedules.filter(s => s.enabled).length} active
          </Badge>
        </div>

        {schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No schedules configured</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`p-3 rounded-lg transition-colors ${
                  schedule.enabled ? 'bg-muted/30 hover:bg-muted/50' : 'bg-muted/10 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    className="mt-0.5"
                    onClick={() => handleToggle(schedule.id, !schedule.enabled)}
                    disabled={processingId === schedule.id}
                  >
                    {schedule.enabled ? (
                      <ToggleRight className="w-6 h-6 text-primary" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{schedule.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <code className="bg-background/50 px-1 py-0.5 rounded">{schedule.cron_expression}</code>
                      <span>•</span>
                      <span>{schedule.agent?.name || 'Agent'}</span>
                    </div>
                    {schedule.next_run_at && schedule.enabled && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Next: {format(new Date(schedule.next_run_at), 'MMM d, h:mm a')}
                      </p>
                    )}
                    {schedule.last_run_at && (
                      <div className="flex items-center gap-1 text-xs mt-1">
                        <span className="text-muted-foreground">Last:</span>
                        <span className={
                          schedule.last_run_status === 'completed' ? 'text-green-400' :
                          schedule.last_run_status === 'failed' ? 'text-red-400' :
                          'text-muted-foreground'
                        }>
                          {schedule.last_run_status}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(schedule.last_run_at), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => handleRunNow(schedule.id)}
                      disabled={processingId === schedule.id || !schedule.enabled}
                    >
                      {processingId === schedule.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => {
                        setSelectedSchedule(schedule.id);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={processingId === schedule.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
