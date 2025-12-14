import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Plus, Trash2, Loader2, Check, X, Palette, Search, Clock, Pin, Archive, MoreVertical } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { formatDistanceToNow, format } from 'date-fns';

const colorMap: Record<string, { gradient: string; border: string; label: string; solid: string }> = {
  amber: { gradient: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', label: 'Amber', solid: 'bg-amber-500' },
  blue: { gradient: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', label: 'Blue', solid: 'bg-blue-500' },
  violet: { gradient: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30', label: 'Violet', solid: 'bg-violet-500' },
  emerald: { gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', label: 'Emerald', solid: 'bg-emerald-500' },
  rose: { gradient: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30', label: 'Rose', solid: 'bg-rose-500' },
};

type SortOption = 'updated' | 'created' | 'title';

export const ExpandedNotesCard = () => {
  const { notes, isLoading, addNote, updateNote, deleteNote } = useNotes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState('amber');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated');

  const selectedNote = useMemo(() => 
    notes.find(n => n.id === selectedNoteId),
    [notes, selectedNoteId]
  );

  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes.filter(note => 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [notes, searchQuery, sortBy]);

  const handleAddNote = async () => {
    if (!newTitle.trim()) return;
    const newNote = await addNote(newTitle, newContent, newColor);
    setNewTitle('');
    setNewContent('');
    setNewColor('amber');
    setIsAdding(false);
  };

  const handleSelectNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setSelectedNoteId(noteId);
      setEditTitle(note.title);
      setEditContent(note.content || '');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNoteId) return;
    await updateNote(selectedNoteId, { title: editTitle, content: editContent });
  };

  const handleColorChange = async (id: string, color: string) => {
    await updateNote(id, { color });
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
    }
  };

  const getColorClasses = (color: string) => colorMap[color] || colorMap.amber;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* Left sidebar - Notes list */}
      <div className="w-80 lg:w-96 flex-shrink-0 flex flex-col bg-card/50 rounded-2xl border border-border/50 overflow-hidden">
        {/* Sidebar header */}
        <div className="p-4 border-b border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <StickyNote className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-sm font-medium text-foreground">{notes.length} Notes</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAdding(true)}
              className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* Sort options */}
          <div className="flex items-center gap-1">
            {(['updated', 'created', 'title'] as SortOption[]).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  sortBy === option 
                    ? 'bg-amber-500/20 text-amber-400' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <AnimatePresence>
            {filteredAndSortedNotes.map((note) => {
              const colors = getColorClasses(note.color);
              const isSelected = selectedNoteId === note.id;
              
              return (
                <motion.button
                  key={note.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onClick={() => handleSelectNote(note.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    isSelected 
                      ? `bg-gradient-to-br ${colors.gradient} border ${colors.border}` 
                      : 'hover:bg-muted/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${colors.solid}`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-foreground truncate">{note.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {note.content || 'No content'}
                      </p>
                      <span className="text-xs text-muted-foreground/70 mt-2 block">
                        {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
          
          {filteredAndSortedNotes.length === 0 && !isAdding && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? 'No notes match your search.' : 'No notes yet.'}
            </div>
          )}
        </div>
      </div>

      {/* Right panel - Note editor or add form */}
      <div className="flex-1 flex flex-col bg-card/30 rounded-2xl border border-border/50 overflow-hidden">
        <AnimatePresence mode="wait">
          {isAdding ? (
            <motion.div
              key="add-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">New Note</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-muted rounded-lg">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className={`flex-1 flex flex-col p-6 rounded-2xl bg-gradient-to-br ${colorMap[newColor].gradient} border ${colorMap[newColor].border}`}>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Note title..."
                  className="w-full bg-transparent text-xl font-semibold text-foreground placeholder:text-muted-foreground outline-none mb-4"
                  autoFocus
                />
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Start writing..."
                  className="flex-1 w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none resize-none"
                />
              </div>

              {/* Color picker */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Color:</span>
                  {Object.entries(colorMap).map(([color, styles]) => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-6 h-6 rounded-full ${styles.solid} border-2 ${
                        newColor === color ? 'border-foreground scale-110' : 'border-transparent'
                      } transition-all`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddNote}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30"
                  >
                    <Check className="w-4 h-4" />
                    Create Note
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : selectedNote ? (
            <motion.div
              key={`note-${selectedNote.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              {/* Editor header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  {Object.entries(colorMap).map(([color, styles]) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(selectedNote.id, color)}
                      className={`w-5 h-5 rounded-full ${styles.solid} border-2 ${
                        selectedNote.color === color ? 'border-foreground scale-110' : 'border-transparent'
                      } transition-all hover:scale-110`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Last edited {formatDistanceToNow(new Date(selectedNote.updated_at), { addSuffix: true })}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editor body */}
              <div className="flex-1 p-6 overflow-y-auto">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleSaveNote}
                  placeholder="Note title..."
                  className="w-full bg-transparent text-2xl font-bold text-foreground placeholder:text-muted-foreground outline-none mb-4"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onBlur={handleSaveNote}
                  placeholder="Start writing your note..."
                  className="w-full min-h-[60vh] bg-transparent text-foreground placeholder:text-muted-foreground outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Editor footer */}
              <div className="p-4 border-t border-border/50 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Created {format(new Date(selectedNote.created_at), 'MMM d, yyyy')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {editContent.length} characters
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-muted-foreground"
            >
              <StickyNote className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg mb-2">Select a note to view</p>
              <p className="text-sm">or create a new one</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAdding(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                New Note
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
