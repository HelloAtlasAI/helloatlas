import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Plus, Trash2, Loader2, Check, X, Palette } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { formatDistanceToNow } from 'date-fns';

const colorMap: Record<string, { gradient: string; border: string; label: string }> = {
  amber: { gradient: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', label: 'Amber' },
  blue: { gradient: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', label: 'Blue' },
  violet: { gradient: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30', label: 'Violet' },
  emerald: { gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30', label: 'Emerald' },
  rose: { gradient: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30', label: 'Rose' },
};

export const ExpandedNotesCard = () => {
  const { notes, isLoading, addNote, updateNote, deleteNote } = useNotes();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState('amber');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddNote = async () => {
    if (!newTitle.trim()) return;
    await addNote(newTitle, newContent, newColor);
    setNewTitle('');
    setNewContent('');
    setNewColor('amber');
    setIsAdding(false);
  };

  const handleStartEdit = (note: any) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content || '');
  };

  const handleSaveEdit = async (id: string) => {
    await updateNote(id, { title: editTitle, content: editContent });
    setEditingId(null);
  };

  const handleColorChange = async (id: string, color: string) => {
    await updateNote(id, { color });
    setShowColorPicker(null);
  };

  const getColorClasses = (color: string) => {
    return colorMap[color] || colorMap.amber;
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header with search and add */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20">
            <StickyNote className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">All Notes</h2>
            <p className="text-xs text-muted-foreground">{notes.length} notes total</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-400 bg-amber-500/10 rounded-lg hover:bg-amber-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Note
          </motion.button>
        </div>
      </div>

      {/* Add new note form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-4 rounded-xl bg-gradient-to-br ${colorMap[newColor].gradient} border ${colorMap[newColor].border}`}>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full mb-3 bg-transparent text-foreground text-base font-medium placeholder:text-muted-foreground outline-none"
                autoFocus
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write your note..."
                className="w-full h-24 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none resize-none"
              />
              
              {/* Color picker */}
              <div className="flex items-center gap-2 mt-3 mb-4">
                <span className="text-xs text-muted-foreground">Color:</span>
                {Object.entries(colorMap).map(([color, styles]) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${styles.gradient} border-2 ${
                      newColor === color ? 'border-foreground' : 'border-transparent'
                    } transition-all`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddNote}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground bg-primary/20 rounded-lg hover:bg-primary/30"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? 'No notes match your search.' : 'No notes yet. Click "New Note" to create one.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note, i) => {
            const colors = getColorClasses(note.color);
            const isEditing = editingId === note.id;
            
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`group relative p-4 rounded-xl bg-gradient-to-br ${colors.gradient} border ${colors.border} transition-all hover:shadow-lg`}
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full mb-2 bg-transparent text-foreground text-sm font-medium outline-none"
                      autoFocus
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-20 bg-transparent text-foreground text-sm outline-none resize-none"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleSaveEdit(note.id)}
                        className="px-3 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/20 rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <h4 
                        className="font-medium text-foreground text-sm cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleStartEdit(note)}
                      >
                        {note.title}
                      </h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setShowColorPicker(showColorPicker === note.id ? null : note.id)}
                          className="p-1 hover:bg-foreground/10 rounded"
                        >
                          <Palette className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="p-1 hover:bg-foreground/10 rounded"
                        >
                          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Color picker dropdown */}
                    <AnimatePresence>
                      {showColorPicker === note.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute top-12 right-4 flex gap-1 p-2 bg-card rounded-lg shadow-lg border border-border z-10"
                        >
                          {Object.keys(colorMap).map((color) => (
                            <button
                              key={color}
                              onClick={() => handleColorChange(note.id, color)}
                              className={`w-5 h-5 rounded-full bg-gradient-to-br ${colorMap[color].gradient} border ${
                                note.color === color ? 'border-foreground' : 'border-transparent'
                              }`}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <p 
                      className="text-xs text-muted-foreground line-clamp-3 mb-3 cursor-pointer"
                      onClick={() => handleStartEdit(note)}
                    >
                      {note.content || 'Click to add content...'}
                    </p>
                    <span className="text-xs text-muted-foreground/70">
                      {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                    </span>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
