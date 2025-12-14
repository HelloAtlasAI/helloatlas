import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addTask = useCallback(async (title: string, priority?: string, due_date?: Date) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          title,
          priority: priority || 'medium',
          due_date: due_date?.toISOString() || null,
        })
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [user]);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .update({ completed: !task.completed })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === id ? data : t));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [tasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<Pick<Task, 'title' | 'priority' | 'due_date' | 'completed'>>) => {
    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => prev.map(task => task.id === id ? data : task));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTasks(prev => prev.filter(task => task.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return {
    tasks,
    isLoading,
    error,
    completedCount,
    progress,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
};
