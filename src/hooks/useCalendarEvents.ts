import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  event_type: string;
  attendees: string[];
  created_at: string;
  updated_at: string;
}

const transformEvent = (data: any): CalendarEvent => ({
  ...data,
  attendees: Array.isArray(data.attendees) 
    ? data.attendees.map((a: any) => String(a)) 
    : []
});

export const useCalendarEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .gte('start_time', new Date().toISOString().split('T')[0])
        .order('start_time', { ascending: true });

      if (error) throw error;
      setEvents((data || []).map(transformEvent));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const addEvent = useCallback(async (event: {
    title: string;
    description?: string;
    start_time: Date;
    end_time?: Date;
    location?: string;
    event_type?: string;
    attendees?: string[];
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_events')
        .insert({
          user_id: user.id,
          title: event.title,
          description: event.description || null,
          start_time: event.start_time.toISOString(),
          end_time: event.end_time?.toISOString() || null,
          location: event.location || null,
          event_type: event.event_type || 'meeting',
          attendees: event.attendees || [],
        })
        .select()
        .single();

      if (error) throw error;
      const newEvent = transformEvent(data);
      setEvents(prev => [...prev, newEvent].sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      ));
      return newEvent;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [user]);

  const updateEvent = useCallback(async (id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('user_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const updated = transformEvent(data);
      setEvents(prev => prev.map(event => event.id === id ? updated : event));
      return updated;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEvents(prev => prev.filter(event => event.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};
