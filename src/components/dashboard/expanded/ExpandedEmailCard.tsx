import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Star, Trash2, Archive, Reply, Forward,
  Inbox, Send, FileText, AlertCircle, Tag, Search, Plus, 
  Paperclip, X, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { staggerContainer, listItemVariants } from '@/lib/animations';

// Mock email data
const mockEmails = [
  { 
    id: '1', 
    sender: 'Sarah Chen', 
    senderEmail: 'sarah.chen@company.com',
    subject: 'Q4 Budget Review - Action Required', 
    preview: 'Hi, I need your input on the Q4 budget projections before our meeting tomorrow.', 
    body: `Hi,\n\nI need your input on the Q4 budget projections before our meeting tomorrow. We're looking at a 15% increase in marketing spend and need to justify the ROI.\n\nCan you review the attached spreadsheet and provide your feedback by EOD?\n\nThanks,\nSarah`,
    time: '10:32 AM',
    date: 'Today',
    read: false, 
    starred: true, 
    avatar: 'SC', 
    avatarColor: 'from-pink-500 to-rose-500',
    folder: 'inbox',
    labels: ['work', 'urgent'],
    hasAttachment: true
  },
  { 
    id: '2', 
    sender: 'Mike Johnson', 
    senderEmail: 'mike.j@design.co',
    subject: 'Re: Project Timeline Update', 
    preview: 'Thanks for the update. The timeline works for our team.',
    body: `Thanks for the update. The timeline works for our team.\n\nWe'll have the designs ready by next Friday as discussed.\n\nBest,\nMike`,
    time: '9:15 AM',
    date: 'Today',
    read: false, 
    starred: false, 
    avatar: 'MJ', 
    avatarColor: 'from-blue-500 to-cyan-500',
    folder: 'inbox',
    labels: ['work'],
    hasAttachment: false
  },
  { 
    id: '3', 
    sender: 'Design Team', 
    senderEmail: 'design@company.com',
    subject: 'Brand Guidelines V2 Released', 
    preview: 'The updated brand guidelines are now available.',
    body: `Hello everyone,\n\nThe updated brand guidelines (V2) are now available in the shared drive.\n\nKey updates include:\n- New color palette\n- Updated typography\n- Social media templates\n\nBest regards,\nDesign Team`,
    time: '3:45 PM',
    date: 'Yesterday',
    read: true, 
    starred: false, 
    avatar: 'DT', 
    avatarColor: 'from-purple-500 to-violet-500',
    folder: 'inbox',
    labels: ['design'],
    hasAttachment: true
  },
  { 
    id: '4', 
    sender: 'Alex Rivera', 
    senderEmail: 'alex.r@company.com',
    subject: 'Meeting Notes - Product Sync', 
    preview: 'Key takeaways from our product sync meeting.',
    body: `Hi team,\n\nHere are the key takeaways:\n\n1. Q4 feature freeze starts Dec 15\n2. Beta testing begins Jan 5\n3. Public launch planned for Feb 1\n\nAlex`,
    time: '11:20 AM',
    date: 'Yesterday',
    read: true, 
    starred: true, 
    avatar: 'AR', 
    avatarColor: 'from-emerald-500 to-teal-500',
    folder: 'inbox',
    labels: ['work', 'meeting'],
    hasAttachment: false
  },
];

const folders = [
  { id: 'inbox', name: 'Inbox', icon: Inbox, count: 23 },
  { id: 'sent', name: 'Sent', icon: Send, count: 0 },
  { id: 'drafts', name: 'Drafts', icon: FileText, count: 3 },
  { id: 'spam', name: 'Spam', icon: AlertCircle, count: 5 },
  { id: 'trash', name: 'Trash', icon: Trash2, count: 0 },
];

const labels = [
  { id: 'work', name: 'Work', color: 'bg-blue-500' },
  { id: 'personal', name: 'Personal', color: 'bg-green-500' },
  { id: 'urgent', name: 'Urgent', color: 'bg-red-500' },
  { id: 'design', name: 'Design', color: 'bg-purple-500' },
];

export const ExpandedEmailCard = () => {
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [emails, setEmails] = useState(mockEmails);

  const selectedEmailData = useMemo(() => 
    emails.find(e => e.id === selectedEmail),
    [emails, selectedEmail]
  );

  const filteredEmails = useMemo(() => 
    emails.filter(email => 
      email.folder === selectedFolder &&
      (email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
       email.sender.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [emails, selectedFolder, searchQuery]
  );

  const handleEmailClick = (id: string) => {
    setSelectedEmail(id);
    setEmails(prev => prev.map(e => 
      e.id === id ? { ...e, read: true } : e
    ));
  };

  const handleStarEmail = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails(prev => prev.map(email => 
      email.id === id ? { ...email, starred: !email.starred } : email
    ));
  };

  const handleDeleteEmail = (id: string) => {
    setEmails(prev => prev.filter(e => e.id !== id));
    if (selectedEmail === id) setSelectedEmail(null);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-4">
      {/* Sidebar */}
      <motion.div 
        className="w-52 shrink-0 flex flex-col gap-4"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <Button 
          onClick={() => setIsComposing(true)}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Compose
        </Button>

        <div className="space-y-1">
          {folders.map((folder) => {
            const Icon = folder.icon;
            const isActive = selectedFolder === folder.id;
            return (
              <motion.button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-pink-500/20 text-pink-400' : 'text-muted-foreground hover:bg-accent/50'
                }`}
                whileHover={{ x: 4 }}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left text-sm">{folder.name}</span>
                {folder.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-pink-500/30' : 'bg-muted'}`}>
                    {folder.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2 px-3">Labels</p>
          {labels.map((label) => (
            <motion.button
              key={label.id}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent/50"
              whileHover={{ x: 4 }}
            >
              <div className={`w-3 h-3 rounded-full ${label.color}`} />
              <span className="text-sm">{label.name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Email List */}
      <motion.div 
        className="w-80 shrink-0 flex flex-col backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-border/50"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <motion.div className="p-2 space-y-1" variants={staggerContainer} initial="hidden" animate="visible">
            <AnimatePresence mode="popLayout">
              {filteredEmails.map((email, index) => (
                <motion.div
                  key={email.id}
                  variants={listItemVariants}
                  custom={index}
                  layout
                  onClick={() => handleEmailClick(email.id)}
                  className={`relative p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedEmail === email.id ? 'bg-pink-500/20 border border-pink-500/30' : 'hover:bg-accent/50'
                  } ${!email.read ? 'bg-accent/20' : ''}`}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${email.avatarColor} shrink-0`}>
                      {email.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`font-medium truncate ${!email.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {email.sender}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <motion.button
                            onClick={(e) => handleStarEmail(email.id, e)}
                            whileHover={{ scale: 1.2 }}
                          >
                            <Star className={`w-3.5 h-3.5 ${email.starred ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`} />
                          </motion.button>
                          <span className="text-xs text-muted-foreground">{email.time}</span>
                        </div>
                      </div>
                      <p className={`text-sm truncate ${!email.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{email.preview}</p>
                      {email.hasAttachment && (
                        <Paperclip className="w-3 h-3 text-muted-foreground mt-1" />
                      )}
                    </div>
                  </div>
                  {!email.read && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-pink-400 to-rose-500 rounded-r-full" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </ScrollArea>
      </motion.div>

      {/* Email Content */}
      <motion.div 
        className="flex-1 flex flex-col backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 overflow-hidden"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {isComposing ? (
            <motion.div key="compose" className="flex-1 flex flex-col p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">New Message</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsComposing(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3 flex-1">
                <Input placeholder="To" className="bg-background/50" />
                <Input placeholder="Subject" className="bg-background/50" />
                <Textarea placeholder="Write your message..." className="flex-1 min-h-[300px] bg-background/50 resize-none" />
              </div>
              <div className="flex justify-end mt-4">
                <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </motion.div>
          ) : selectedEmailData ? (
            <motion.div key="email" className="flex-1 flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="p-4 border-b border-border/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br ${selectedEmailData.avatarColor}`}>
                      {selectedEmailData.avatar}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{selectedEmailData.sender}</h3>
                      <p className="text-sm text-muted-foreground">{selectedEmailData.senderEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedEmailData.date} at {selectedEmailData.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon"><Reply className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon"><Forward className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon"><Archive className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteEmail(selectedEmailData.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-foreground mt-4">{selectedEmailData.subject}</h2>
              </div>
              <ScrollArea className="flex-1 p-4">
                <pre className="whitespace-pre-wrap font-sans text-foreground/90 leading-relaxed">
                  {selectedEmailData.body}
                </pre>
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div key="empty" className="flex-1 flex items-center justify-center text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Select an email to read</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
