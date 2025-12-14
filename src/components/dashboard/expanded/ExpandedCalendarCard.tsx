import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Video, MapPin, Plus, Trash2, Loader2, X } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { format, isToday, isTomorrow, startOfDay, addDays, isSameDay, parseISO, addHours } from 'date-fns';
import { Calendar as CalendarWidget } from '@/components/ui/calendar';

const eventColors = [
  { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  { gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-500/20', text: 'text-violet-400' },
  { gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-500/20', text: 'text-rose-400' },
  { gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/20', text: 'text-amber-400' },
];

const eventTypes = [
  { value: 'meeting', label: 'Meeting', icon: Calendar },
  { value: 'video', label: 'Video Call', icon: Video },
  { value: 'reminder', label: 'Reminder', icon: Clock },
];

export const ExpandedCalendarCard = () => {
  const { events, isLoading, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newLocation, setNewLocation] = useState('');
  const [newEventType, setNewEventType] = useState('meeting');

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
    return format(date, 'EEEE, MMM d');
  };

  const selectedDayEvents = events
    .filter(e => isSameDay(parseISO(e.start_time), selectedDate))
    .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());

  // Get events for next 7 days for the mini agenda
  const upcomingDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  const eventsByDay = upcomingDays.map(day => ({
    date: day,
    events: events.filter(e => isSameDay(parseISO(e.start_time), day))
  }));

  return (
    <div className="flex gap-6 h-full">
      {/* Left side: Calendar widget + upcoming days */}
      <div className="w-80 flex-shrink-0 space-y-4">
        <CalendarWidget
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-xl border border-border bg-card p-3 pointer-events-auto"
          modifiers={{
            hasEvents: events.map(e => parseISO(e.start_time))
          }}
          modifiersStyles={{
            hasEvents: { fontWeight: 'bold', textDecoration: 'underline' }
          }}
        />

        {/* Upcoming days mini agenda */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Upcoming</h3>
          {eventsByDay.slice(0, 5).map(({ date, events: dayEvents }) => (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                isSameDay(date, selectedDate) ? 'bg-primary/20' : 'hover:bg-muted/50'
              }`}
            >
              <span className={`text-sm ${isSameDay(date, selectedDate) ? 'text-primary font-medium' : 'text-foreground'}`}>
                {isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'EEE, MMM d')}
              </span>
              {dayEvents.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground">
                  {dayEvents.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right side: Day view */}
      <div className="flex-1 space-y-4">
        {/* Day header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{getDateLabel(selectedDate)}</h2>
              <p className="text-xs text-muted-foreground">{format(selectedDate, 'MMMM d, yyyy')}</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Event
          </motion.button>
        </div>

        {/* Add event form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">New Event for {format(selectedDate, 'MMM d')}</span>
                  <button onClick={resetForm} className="p-1 hover:bg-foreground/10 rounded">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Event title..."
                  className="w-full bg-transparent text-foreground text-base placeholder:text-muted-foreground outline-none"
                  autoFocus
                />

                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full h-16 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none resize-none"
                />

                {/* Time inputs */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="px-2 py-1 text-sm bg-muted/50 border border-border rounded text-foreground"
                    />
                    <span className="text-muted-foreground">to</span>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="px-2 py-1 text-sm bg-muted/50 border border-border rounded text-foreground"
                    />
                  </div>
                </div>

                {/* Event type */}
                <div className="flex items-center gap-2">
                  {eventTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setNewEventType(type.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        newEventType === type.value
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'text-muted-foreground hover:text-foreground border border-transparent'
                      }`}
                    >
                      <type.icon className="w-3 h-3" />
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* Location */}
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
                    className="px-4 py-2 text-sm font-medium text-foreground bg-primary/20 rounded-lg hover:bg-primary/30"
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
          )}
        </AnimatePresence>

        {/* Events list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : selectedDayEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No events scheduled for this day.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayEvents.map((event, i) => {
              const colorStyle = eventColors[i % eventColors.length];
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`group relative p-4 rounded-xl ${colorStyle.bg} border border-border/50 transition-all hover:shadow-lg`}
                >
                  <div className="flex items-start gap-4">
                    {/* Time indicator */}
                    <div className={`w-1 h-full absolute left-0 top-0 rounded-l-xl bg-gradient-to-b ${colorStyle.gradient}`} />
                    
                    <div className="flex-1 pl-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-foreground/10 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
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
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
