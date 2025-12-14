import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Note {
  id: string;
  title: string;
  content: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export const useNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addNote = useCallback(async (title: string, content?: string, color?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_notes')
        .insert({
          user_id: user.id,
          title,
          content: content || null,
          color: color || 'amber',
        })
        .select()
        .single();

      if (error) throw error;
      setNotes(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [user]);

  const updateNote = useCallback(async (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'color'>>) => {
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setNotes(prev => prev.map(note => note.id === id ? data : note));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotes(prev => prev.filter(note => note.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    isLoading,
    error,
    addNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,
  };
};
