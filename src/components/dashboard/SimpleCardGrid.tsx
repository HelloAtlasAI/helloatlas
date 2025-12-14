import { memo } from 'react';
import { motion } from 'framer-motion';
import { Mail, Calendar, Cloud, TrendingUp, Plane, FileText } from 'lucide-react';

interface CardData {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  color: string;
}

const cards: CardData[] = [
  {
    id: 'email',
    title: 'Email',
    icon: <Mail className="w-5 h-5" />,
    content: (
      <div>
        <p className="text-2xl font-semibold">3</p>
        <p className="text-sm text-muted-foreground">unread messages</p>
      </div>
    ),
    color: 'text-blue-400',
  },
  {
    id: 'calendar',
    title: 'Calendar',
    icon: <Calendar className="w-5 h-5" />,
    content: (
      <div>
        <p className="text-2xl font-semibold">2</p>
        <p className="text-sm text-muted-foreground">events today</p>
      </div>
    ),
    color: 'text-emerald-400',
  },
  {
    id: 'weather',
    title: 'Weather',
    icon: <Cloud className="w-5 h-5" />,
    content: (
      <div>
        <p className="text-2xl font-semibold">18°C</p>
        <p className="text-sm text-muted-foreground">Partly cloudy</p>
      </div>
    ),
    color: 'text-cyan-400',
  },
  {
    id: 'stocks',
    title: 'Stocks',
    icon: <TrendingUp className="w-5 h-5" />,
    content: (
      <div>
        <p className="text-2xl font-semibold text-emerald-400">+2.4%</p>
        <p className="text-sm text-muted-foreground">Portfolio today</p>
      </div>
    ),
    color: 'text-emerald-400',
  },
  {
    id: 'travel',
    title: 'Travel',
    icon: <Plane className="w-5 h-5" />,
    content: (
      <div>
        <p className="text-lg font-semibold">Paris</p>
        <p className="text-sm text-muted-foreground">Next trip: Dec 20</p>
      </div>
    ),
    color: 'text-amber-400',
  },
  {
    id: 'documents',
    title: 'Documents',
    icon: <FileText className="w-5 h-5" />,
    content: (
      <div>
        <p className="text-2xl font-semibold">12</p>
        <p className="text-sm text-muted-foreground">recent files</p>
      </div>
    ),
    color: 'text-purple-400',
  },
];

const SimpleCardGridComponent = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          className="rounded-xl bg-card border border-border/50 p-5 hover:border-border transition-colors cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className={card.color}>{card.icon}</div>
            <h3 className="font-medium text-foreground">{card.title}</h3>
          </div>
          {card.content}
        </motion.div>
      ))}
    </div>
  );
};

export const SimpleCardGrid = memo(SimpleCardGridComponent);
