import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Star, Trash2, Archive, Reply, Forward, MoreHorizontal,
  Inbox, Send, FileText, AlertCircle, Tag, Search, Plus, 
  Paperclip, ChevronLeft, X, RefreshCw
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
    body: `Hi,

I need your input on the Q4 budget projections before our meeting tomorrow. We're looking at a 15% increase in marketing spend and need to justify the ROI.

Can you review the attached spreadsheet and provide your feedback by EOD?

Key areas to focus on:
- Marketing campaign effectiveness
- Customer acquisition costs
- Revenue projections

Thanks,
Sarah`,
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
    preview: 'Thanks for the update. The timeline works for our team. Let me know if anything changes.',
    body: `Thanks for the update. The timeline works for our team.

We'll have the designs ready by next Friday as discussed.

Let me know if anything changes on your end.

Best,
Mike`,
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
    preview: 'The updated brand guidelines are now available in the shared drive.',
    body: `Hello everyone,

The updated brand guidelines (V2) are now available in the shared drive.

Key updates include:
- New color palette variations
- Updated typography guidelines
- Social media templates
- Email signature templates

Please review and update any materials accordingly.

Best regards,
Design Team`,
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
    preview: 'Key takeaways from our product sync meeting yesterday.',
    body: `Hi team,

Here are the key takeaways from our product sync meeting:

1. Q4 feature freeze starts Dec 15
2. Beta testing begins Jan 5
3. Public launch planned for Feb 1

Action items:
- Complete all pending PRs by Dec 14
- Update documentation
- Prepare demo environment

Let me know if you have any questions.

Alex`,
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
  { 
    id: '5', 
    sender: 'Newsletter', 
    senderEmail: 'news@techdigest.com',
    subject: 'Tech Digest Weekly - AI Trends 2024', 
    preview: 'This week: The latest in AI, cloud computing, and developer tools.',
    body: `Welcome to Tech Digest Weekly!

This week's highlights:

AI & Machine Learning
- New breakthroughs in language models
- AI-powered development tools

Cloud & Infrastructure
- AWS announces new services
- Multi-cloud strategies

Developer Tools
- VS Code updates
- New testing frameworks

Read more at techdigest.com

Unsubscribe | Manage Preferences`,
    time: '8:00 AM',
    date: '2 days ago',
    read: true, 
    starred: false, 
    avatar: 'TD', 
    avatarColor: 'from-orange-500 to-amber-500',
    folder: 'inbox',
    labels: ['newsletter'],
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
  { id: 'newsletter', name: 'Newsletter', color: 'bg-orange-500' },
  { id: 'meeting', name: 'Meeting', color: 'bg-cyan-500' },
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

  const unreadCount = emails.filter(e => !e.read && e.folder === 'inbox').length;

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
    <div className="h-full flex gap-4">
      {/* Sidebar - Folders & Labels */}
      <motion.div 
        className="w-56 shrink-0 flex flex-col gap-4"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Compose Button */}
        <Button 
          onClick={() => setIsComposing(true)}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Compose
        </Button>

        {/* Folders */}
        <div className="space-y-1">
          {folders.map((folder) => {
            const Icon = folder.icon;
            const isActive = selectedFolder === folder.id;
            return (
              <motion.button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-pink-500/20 text-pink-400' 
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left text-sm">{folder.name}</span>
                {folder.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-pink-500/30' : 'bg-muted'
                  }`}>
                    {folder.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Labels */}
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2 px-3">Labels</p>
          <div className="space-y-1">
            {labels.map((label) => (
              <motion.button
                key={label.id}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                whileHover={{ x: 4 }}
              >
                <div className={`w-3 h-3 rounded-full ${label.color}`} />
                <span className="text-sm">{label.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Email List */}
      <motion.div 
        className="w-80 shrink-0 flex flex-col bg-card/30 rounded-2xl border border-border/50 overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Search */}
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

        {/* Email List */}
        <ScrollArea className="flex-1">
          <motion.div 
            className="p-2 space-y-1"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {filteredEmails.map((email, index) => (
                <motion.div
                  key={email.id}
                  variants={listItemVariants}
                  custom={index}
                  layout
                  onClick={() => handleEmailClick(email.id)}
                  className={`relative p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedEmail === email.id 
                      ? 'bg-pink-500/20 border border-pink-500/30' 
                      : 'hover:bg-accent/50'
                  } ${!email.read ? 'bg-accent/20' : ''}`}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
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
                            whileTap={{ scale: 0.9 }}
                          >
                            <Star className={`w-3.5 h-3.5 ${
                              email.starred ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'
                            }`} />
                          </motion.button>
                          <span className="text-xs text-muted-foreground">{email.time}</span>
                        </div>
                      </div>
                      <p className={`text-sm truncate ${!email.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{email.preview}</p>
                      
                      {/* Labels & Attachment indicator */}
                      <div className="flex items-center gap-2 mt-1.5">
                        {email.hasAttachment && (
                          <Paperclip className="w-3 h-3 text-muted-foreground" />
                        )}
                        {email.labels.slice(0, 2).map(labelId => {
                          const label = labels.find(l => l.id === labelId);
                          return label ? (
                            <span 
                              key={labelId}
                              className={`w-2 h-2 rounded-full ${label.color}`}
                            />
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Unread indicator */}
                  {!email.read && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-pink-400 to-rose-500 rounded-r-full" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </ScrollArea>
      </motion.div>

      {/* Email Content / Compose */}
      <motion.div 
        className="flex-1 flex flex-col bg-card/30 rounded-2xl border border-border/50 overflow-hidden"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {isComposing ? (
            <motion.div
              key="compose"
              className="flex-1 flex flex-col p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">New Message</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsComposing(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3 flex-1">
                <Input placeholder="To" className="bg-background/50" />
                <Input placeholder="Subject" className="bg-background/50" />
                <Textarea 
                  placeholder="Write your message..." 
                  className="flex-1 min-h-[300px] bg-background/50 resize-none"
                />
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
                <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </motion.div>
          ) : selectedEmailData ? (
            <motion.div
              key="email"
              className="flex-1 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Email Header */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-start justify-between mb-4">
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
                    <Button variant="ghost" size="icon">
                      <Reply className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Forward className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Archive className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteEmail(selectedEmailData.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold text-foreground">{selectedEmailData.subject}</h2>
                
                {/* Labels */}
                <div className="flex items-center gap-2 mt-3">
                  {selectedEmailData.labels.map(labelId => {
                    const label = labels.find(l => l.id === labelId);
                    return label ? (
                      <span 
                        key={labelId}
                        className={`px-2 py-0.5 text-xs rounded-full ${label.color} text-white`}
                      >
                        {label.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              
              {/* Email Body */}
              <ScrollArea className="flex-1 p-6">
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-foreground text-sm leading-relaxed">
                    {selectedEmailData.body}
                  </pre>
                </div>
                
                {/* Attachments */}
                {selectedEmailData.hasAttachment && (
                  <div className="mt-6 p-4 bg-accent/20 rounded-xl border border-border/50">
                    <p className="text-sm font-medium text-foreground mb-3">Attachments</p>
                    <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                      <FileText className="w-8 h-8 text-blue-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Q4_Budget_2024.xlsx</p>
                        <p className="text-xs text-muted-foreground">2.4 MB</p>
                      </div>
                      <Button variant="ghost" size="sm">Download</Button>
                    </div>
                  </div>
                )}
              </ScrollArea>
              
              {/* Quick Reply */}
              <div className="p-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <Input 
                    placeholder="Write a quick reply..." 
                    className="bg-background/50"
                  />
                  <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="flex-1 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
                  <Mail className="w-10 h-10 text-pink-400" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Select an email</h3>
                <p className="text-sm text-muted-foreground">Choose an email from the list to view its contents</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
