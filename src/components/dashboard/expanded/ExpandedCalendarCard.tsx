import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Video, MapPin, Plus, Trash2, Loader2, X, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { 
  format, isToday, isTomorrow, startOfDay, addDays, isSameDay, parseISO, 
  startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, 
  startOfMonth, endOfMonth, addMonths, subMonths, getDay, isSameMonth 
} from 'date-fns';
import { Calendar as CalendarWidget } from '@/components/ui/calendar';

const eventColors = [
  { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/20', text: 'text-emerald-400', solid: 'bg-emerald-500' },
  { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/20', text: 'text-blue-400', solid: 'bg-blue-500' },
  { gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-500/20', text: 'text-violet-400', solid: 'bg-violet-500' },
  { gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-500/20', text: 'text-rose-400', solid: 'bg-rose-500' },
  { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/20', text: 'text-amber-400', solid: 'bg-amber-500' },
];

const eventTypes = [
  { value: 'meeting', label: 'Meeting', icon: Calendar },
  { value: 'video', label: 'Video Call', icon: Video },
  { value: 'reminder', label: 'Reminder', icon: Clock },
];

type ViewMode = 'week' | 'month';

export const ExpandedCalendarCard = () => {
  const { events, isLoading, addEvent, deleteEvent } = useCalendarEvents();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newLocation, setNewLocation] = useState('');
  const [newEventType, setNewEventType] = useState('meeting');

  // Get days for current view
  const viewDays = useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
  }, [currentDate, viewMode]);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => 
    events.filter(e => isSameDay(parseISO(e.start_time), day))
      .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());

  // Get events for selected day
  const selectedDayEvents = useMemo(() => 
    getEventsForDay(selectedDate),
    [events, selectedDate]
  );

  // Upcoming events for sidebar
  const upcomingEvents = useMemo(() => 
    events
      .filter(e => parseISO(e.start_time) >= startOfDay(new Date()))
      .slice(0, 8),
    [events]
  );

  const handleAddEvent = async () => {
    if (!newTitle.trim()) return;
    
    const startDate = new Date(selectedDate);
    const [startHour, startMin] = newStartTime.split(':').map(Number);
    startDate.setHours(startHour, startMin, 0, 0);
    
    const endDate = new Date(selectedDate);
    const [endHour, endMin] = newEndTime.split(':').map(Number);
    endDate.setHours(endHour, endMin, 0, 0);

    await addEvent({
      title: newTitle,
      description: newDescription,
      start_time: startDate,
      end_time: endDate,
      location: newLocation || undefined,
      event_type: newEventType,
    });
    
    resetForm();
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewStartTime('09:00');
    setNewEndTime('10:00');
    setNewLocation('');
    setNewEventType('meeting');
    setIsAdding(false);
  };

  const formatEventTime = (startTime: string, endTime: string | null) => {
    const start = format(parseISO(startTime), 'h:mm a');
    if (!endTime) return start;
    const end = format(parseISO(endTime), 'h:mm a');
    return `${start} - ${end}`;
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMMM d');
  };

  const navigatePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const getEventColor = (index: number) => eventColors[index % eventColors.length];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* Left sidebar */}
      <div className="w-72 lg:w-80 flex-shrink-0 flex flex-col gap-4">
        {/* Mini calendar */}
        <div className="bg-card/50 rounded-2xl border border-border/50 p-3">
          <CalendarWidget
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="pointer-events-auto"
            modifiers={{
              hasEvents: events.map(e => parseISO(e.start_time))
            }}
            modifiersStyles={{
              hasEvents: { fontWeight: 'bold' }
            }}
          />
        </div>

        {/* Upcoming events */}
        <div className="flex-1 bg-card/50 rounded-2xl border border-border/50 p-4 overflow-hidden flex flex-col">
          <h3 className="text-sm font-medium text-foreground mb-3">Upcoming Events</h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
            ) : (
              upcomingEvents.map((event, i) => {
                const color = getEventColor(i);
                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedDate(parseISO(event.start_time))}
                    className={`w-full text-left p-3 rounded-xl ${color.bg} transition-all hover:scale-[1.02]`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-1 h-full rounded-full ${color.solid}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(parseISO(event.start_time), 'MMM d')} · {format(parseISO(event.start_time), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main calendar area */}
      <div className="flex-1 flex flex-col bg-card/30 rounded-2xl border border-border/50 overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20"
            >
              Today
            </button>
            <div className="flex items-center gap-1">
              <button onClick={navigatePrev} className="p-2 hover:bg-muted rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={navigateNext} className="p-2 hover:bg-muted rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {format(currentDate, viewMode === 'week' ? "'Week of' MMM d, yyyy" : 'MMMM yyyy')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex items-center bg-muted/30 rounded-lg p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'week' ? 'bg-card text-foreground' : 'text-muted-foreground'}`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'month' ? 'bg-card text-foreground' : 'text-muted-foreground'}`}
              >
                Month
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              New Event
            </motion.button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border/50">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className={`grid grid-cols-7 h-full ${viewMode === 'week' ? 'grid-rows-1' : 'auto-rows-fr'}`}>
            {viewDays.map((day, i) => {
              const dayEvents = getEventsForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`relative p-2 border-r border-b border-border/30 text-left transition-colors min-h-[100px] ${
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/30'
                  } ${!isCurrentMonth && viewMode === 'month' ? 'opacity-40' : ''}`}
                >
                  <span className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                    isToday(day) ? 'bg-primary text-primary-foreground font-bold' : 
                    isSelected ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Event previews */}
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, viewMode === 'week' ? 5 : 2).map((event, j) => {
                      const color = getEventColor(j);
                      return (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded ${color.bg} ${color.text} truncate`}
                        >
                          {format(parseISO(event.start_time), 'h:mm')} {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > (viewMode === 'week' ? 5 : 2) && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - (viewMode === 'week' ? 5 : 2)} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right panel - Selected day / Add form */}
      <div className="w-80 lg:w-96 flex-shrink-0 flex flex-col bg-card/50 rounded-2xl border border-border/50 overflow-hidden">
        <AnimatePresence mode="wait">
          {isAdding ? (
            <motion.div
              key="add-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col p-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">New Event</h3>
                <button onClick={resetForm} className="p-2 hover:bg-muted rounded-lg">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Event title..."
                  className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />

                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full h-20 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />

                <div className="p-3 bg-muted/30 rounded-xl space-y-3">
                  <div className="text-xs font-medium text-muted-foreground">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="px-2 py-1 text-sm bg-card border border-border rounded text-foreground"
                    />
                    <span className="text-muted-foreground">to</span>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="px-2 py-1 text-sm bg-card border border-border rounded text-foreground"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {eventTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setNewEventType(type.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        newEventType === type.value
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'text-muted-foreground hover:text-foreground border border-border/50'
                      }`}
                    >
                      <type.icon className="w-3 h-3" />
                      {type.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Add location..."
                    className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleAddEvent}
                    className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-primary/20 rounded-lg hover:bg-primary/30"
                  >
                    Create Event
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="day-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-border/50">
                <h3 className="text-lg font-semibold text-foreground">{getDateLabel(selectedDate)}</h3>
                <p className="text-sm text-muted-foreground">{format(selectedDate, 'MMMM d, yyyy')}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedDayEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No events scheduled</p>
                    <button
                      onClick={() => setIsAdding(true)}
                      className="mt-3 text-sm text-primary hover:underline"
                    >
                      Add an event
                    </button>
                  </div>
                ) : (
                  selectedDayEvents.map((event, i) => {
                    const color = getEventColor(i);
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`group relative p-4 rounded-xl ${color.bg} border border-border/30`}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${color.solid}`} />
                        
                        <div className="pl-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-foreground">{event.title}</h4>
                            <button
                              onClick={() => deleteEvent(event.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-foreground/10 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {formatEventTime(event.start_time, event.end_time)}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1.5">
                                {event.event_type === 'video' ? (
                                  <Video className="w-3.5 h-3.5 text-blue-400" />
                                ) : (
                                  <MapPin className="w-3.5 h-3.5" />
                                )}
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
