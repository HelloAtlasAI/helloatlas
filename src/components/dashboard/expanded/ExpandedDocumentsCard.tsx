import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, FileSpreadsheet, Presentation, Folder, Image as ImageIcon,
  Upload, Download, MoreHorizontal, Share2, Trash2, Edit2, Grid,
  List, Search, Star, Clock, HardDrive, ChevronRight, Plus, X,
  File, FileVideo, FileAudio, Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { staggerContainer, listItemVariants } from '@/lib/animations';

// File type icons mapping
const getFileIcon = (type: string) => {
  const icons: Record<string, typeof FileText> = {
    document: FileText,
    spreadsheet: FileSpreadsheet,
    presentation: Presentation,
    folder: Folder,
    image: ImageIcon,
    video: FileVideo,
    audio: FileAudio,
    archive: Archive,
    default: File
  };
  return icons[type] || icons.default;
};

// File type colors
const getFileColor = (type: string) => {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    document: { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/20', text: 'text-blue-400' },
    spreadsheet: { bg: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    presentation: { bg: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/20', text: 'text-orange-400' },
    folder: { bg: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/20', text: 'text-violet-400' },
    image: { bg: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/20', text: 'text-pink-400' },
    video: { bg: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/20', text: 'text-red-400' },
    audio: { bg: 'from-indigo-500/20 to-blue-500/20', border: 'border-indigo-500/20', text: 'text-indigo-400' },
    archive: { bg: 'from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/20', text: 'text-amber-400' },
    default: { bg: 'from-slate-500/20 to-gray-500/20', border: 'border-slate-500/20', text: 'text-slate-400' }
  };
  return colors[type] || colors.default;
};

// Mock file data
const mockFiles = [
  { id: '1', name: 'Q4 Budget Report.xlsx', type: 'spreadsheet', size: '2.4 MB', modified: '2 hours ago', modifiedDate: new Date(Date.now() - 2 * 60 * 60 * 1000), shared: true, starred: true, folder: 'root' },
  { id: '2', name: 'Product Roadmap 2025.pptx', type: 'presentation', size: '8.7 MB', modified: 'Yesterday', modifiedDate: new Date(Date.now() - 24 * 60 * 60 * 1000), shared: true, starred: false, folder: 'root' },
  { id: '3', name: 'Meeting Notes - Dec 12.docx', type: 'document', size: '145 KB', modified: 'Yesterday', modifiedDate: new Date(Date.now() - 26 * 60 * 60 * 1000), shared: false, starred: false, folder: 'root' },
  { id: '4', name: 'Brand Assets', type: 'folder', size: '24 files', modified: '3 days ago', modifiedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), shared: true, starred: true, folder: 'root' },
  { id: '5', name: 'Team Photo.jpg', type: 'image', size: '4.2 MB', modified: '5 days ago', modifiedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), shared: false, starred: false, folder: 'root' },
  { id: '6', name: 'Product Demo.mp4', type: 'video', size: '156 MB', modified: 'Last week', modifiedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), shared: true, starred: false, folder: 'root' },
  { id: '7', name: 'Interview Recording.mp3', type: 'audio', size: '34 MB', modified: 'Last week', modifiedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), shared: false, starred: false, folder: 'root' },
  { id: '8', name: 'Project Files.zip', type: 'archive', size: '89 MB', modified: '2 weeks ago', modifiedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), shared: false, starred: false, folder: 'root' },
  { id: '9', name: 'Client Proposal.docx', type: 'document', size: '320 KB', modified: '3 weeks ago', modifiedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), shared: true, starred: true, folder: 'root' },
  { id: '10', name: 'Analytics Dashboard.xlsx', type: 'spreadsheet', size: '1.8 MB', modified: 'Last month', modifiedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), shared: false, starred: false, folder: 'root' },
];

const quickAccessFolders = [
  { id: 'home', name: 'Home', icon: HardDrive },
  { id: 'starred', name: 'Starred', icon: Star },
  { id: 'recent', name: 'Recent', icon: Clock },
  { id: 'shared', name: 'Shared with me', icon: Share2 },
  { id: 'trash', name: 'Trash', icon: Trash2 },
];

const storagData = {
  used: 67,
  total: 100,
  breakdown: [
    { type: 'Documents', size: 12, color: 'bg-blue-500' },
    { type: 'Media', size: 35, color: 'bg-pink-500' },
    { type: 'Archives', size: 15, color: 'bg-amber-500' },
    { type: 'Other', size: 5, color: 'bg-slate-500' },
  ]
};

export const ExpandedDocumentsCard = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedFolder, setSelectedFolder] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [files, setFiles] = useState(mockFiles);
  const [sortBy, setSortBy] = useState<'name' | 'modified' | 'size'>('modified');

  const filteredFiles = useMemo(() => {
    let result = [...files];
    
    // Filter by search
    if (searchQuery) {
      result = result.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by folder type
    if (selectedFolder === 'starred') {
      result = result.filter(f => f.starred);
    } else if (selectedFolder === 'shared') {
      result = result.filter(f => f.shared);
    }
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'modified') return b.modifiedDate.getTime() - a.modifiedDate.getTime();
      return 0;
    });
    
    return result;
  }, [files, searchQuery, selectedFolder, sortBy]);

  const selectedFileData = useMemo(() => 
    files.find(f => f.id === selectedFile),
    [files, selectedFile]
  );

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, starred: !f.starred } : f
    ));
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFile === id) setSelectedFile(null);
  };

  return (
    <div className="h-full flex gap-4">
      {/* Sidebar */}
      <motion.div 
        className="w-56 shrink-0 flex flex-col gap-4"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Upload Button */}
        <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25">
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </Button>

        {/* Quick Access */}
        <div className="space-y-1">
          {quickAccessFolders.map((folder) => {
            const Icon = folder.icon;
            const isActive = selectedFolder === folder.id;
            return (
              <motion.button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{folder.name}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Storage Usage */}
        <div className="mt-auto p-4 backdrop-blur-xl bg-background/30 rounded-xl border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Storage</span>
            <span className="text-xs text-muted-foreground">{storagData.used}GB / {storagData.total}GB</span>
          </div>
          
          <div className="h-2 bg-muted/20 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${storagData.used}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>

          <div className="space-y-2">
            {storagData.breakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-muted-foreground">{item.type}</span>
                </div>
                <span className="text-foreground">{item.size}GB</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="flex-1 flex flex-col backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 border-border/50"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Sort options */}
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-muted-foreground">Sort by:</span>
            {(['modified', 'name', 'size'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSortBy(option)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  sortBy === option 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Files */}
        <ScrollArea className="flex-1">
          {viewMode === 'list' ? (
            <motion.div 
              className="p-2"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Header row */}
              <div className="grid grid-cols-[1fr,100px,120px,80px] gap-4 px-4 py-2 text-xs text-muted-foreground border-b border-border/50">
                <span>Name</span>
                <span>Size</span>
                <span>Modified</span>
                <span className="text-right">Actions</span>
              </div>

              <AnimatePresence mode="popLayout">
                {filteredFiles.map((file, index) => {
                  const IconComponent = getFileIcon(file.type);
                  const colors = getFileColor(file.type);
                  
                  return (
                    <motion.div
                      key={file.id}
                      variants={listItemVariants}
                      custom={index}
                      layout
                      onClick={() => setSelectedFile(file.id)}
                      className={`grid grid-cols-[1fr,100px,120px,80px] gap-4 items-center p-3 rounded-xl cursor-pointer transition-colors ${
                        selectedFile === file.id 
                          ? 'bg-blue-500/20 border border-blue-500/30' 
                          : 'hover:bg-accent/50'
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${colors.bg} border ${colors.border}`}>
                          <IconComponent className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{file.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {file.shared && <Share2 className="w-3 h-3 text-muted-foreground" />}
                            {file.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                          </div>
                        </div>
                      </div>
                      
                      <span className="text-sm text-muted-foreground">{file.size}</span>
                      <span className="text-sm text-muted-foreground">{file.modified}</span>
                      
                      <div className="flex items-center justify-end gap-1">
                        <motion.button
                          onClick={(e) => toggleStar(file.id, e)}
                          className="p-1.5 rounded-lg hover:bg-accent"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Star className={`w-4 h-4 ${file.starred ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
                        </motion.button>
                        <button className="p-1.5 rounded-lg hover:bg-accent">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              className="p-4 grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {filteredFiles.map((file, index) => {
                const IconComponent = getFileIcon(file.type);
                const colors = getFileColor(file.type);
                
                return (
                  <motion.div
                    key={file.id}
                    variants={listItemVariants}
                    custom={index}
                    onClick={() => setSelectedFile(file.id)}
                    className={`p-4 rounded-xl cursor-pointer transition-colors ${
                      selectedFile === file.id 
                        ? 'bg-blue-500/20 border border-blue-500/30' 
                        : 'bg-accent/20 hover:bg-accent/40 border border-transparent'
                    }`}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-full aspect-square rounded-xl flex items-center justify-center bg-gradient-to-br ${colors.bg} border ${colors.border} mb-3`}>
                      <IconComponent className={`w-12 h-12 ${colors.text}`} />
                    </div>
                    <p className="font-medium text-foreground truncate text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{file.modified}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      {file.shared && <Share2 className="w-3 h-3 text-muted-foreground" />}
                      {file.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </ScrollArea>
      </motion.div>

      {/* File Preview Panel */}
      <AnimatePresence>
        {selectedFileData && (
          <motion.div 
            className="w-72 shrink-0 backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 p-4 flex flex-col"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">File Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Preview */}
            <div className={`w-full aspect-square rounded-xl flex items-center justify-center bg-gradient-to-br ${getFileColor(selectedFileData.type).bg} border ${getFileColor(selectedFileData.type).border} mb-4`}>
              {React.createElement(getFileIcon(selectedFileData.type), {
                className: `w-16 h-16 ${getFileColor(selectedFileData.type).text}`
              })}
            </div>

            {/* File info */}
            <h4 className="font-medium text-foreground mb-1">{selectedFileData.name}</h4>
            
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground capitalize">{selectedFileData.type}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Size</span>
                <span className="text-foreground">{selectedFileData.size}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Modified</span>
                <span className="text-foreground">{selectedFileData.modified}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Shared</span>
                <span className="text-foreground">{selectedFileData.shared ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-4 border-t border-border/50 space-y-2">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteFile(selectedFileData.id)}
                  className="text-red-400 hover:text-red-300 hover:border-red-500/50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Need to import React for createElement
import React from 'react';
