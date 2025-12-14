import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NebulaOrb } from '@/components/dashboard/NebulaOrb';
import { GlassmorphicCard } from '@/components/dashboard/GlassmorphicCard';
import { EmailCard } from '@/components/dashboard/EmailCard';
import { CalendarCard } from '@/components/dashboard/CalendarCard';
import { StocksCard } from '@/components/dashboard/StocksCard';
import { TravelCard } from '@/components/dashboard/TravelCard';
import { DocumentsCard } from '@/components/dashboard/DocumentsCard';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { AIState } from '@/components/aria/AIOrb';
import { CardId } from '@/hooks/useCardFocus';
import { X, Mail, Calendar, TrendingUp, Plane, FileText, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AmbientLayoutProps {
  aiState: AIState;
  audioLevel: number;
  focusedCard: CardId | null;
  onOrbClick: () => void;
}

const miniCards = [
  { id: 'email' as CardId, Component: EmailCard, color: 'cyan', icon: Mail, label: 'Email' },
  { id: 'calendar' as CardId, Component: CalendarCard, color: 'purple', icon: Calendar, label: 'Calendar' },
  { id: 'stocks' as CardId, Component: StocksCard, color: 'green', icon: TrendingUp, label: 'Stocks' },
  { id: 'travel' as CardId, Component: TravelCard, color: 'orange', icon: Plane, label: 'Travel' },
  { id: 'documents' as CardId, Component: DocumentsCard, color: 'blue', icon: FileText, label: 'Docs' },
  { id: 'weather' as CardId, Component: WeatherCard, color: 'cyan', icon: Cloud, label: 'Weather' },
];

export const AmbientLayout = ({
  aiState,
  audioLevel,
  focusedCard,
  onOrbClick,
}: AmbientLayoutProps) => {
  const [expandedCard, setExpandedCard] = useState<CardId | null>(null);

  return (
    <div className="h-full relative overflow-hidden">
      {/* Massive background sphere */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 1, type: 'spring' }}
          className="w-[150vh] h-[150vh] blur-sm"
        >
          <NebulaOrb
            state={aiState}
            audioLevel={audioLevel}
            size="full"
          />
        </motion.div>
      </div>

      {/* Clickable orb overlay in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          className="cursor-pointer"
          onClick={onOrbClick}
        >
          <div className="w-32 h-32 rounded-full bg-primary/10 backdrop-blur-xl border border-primary/30 flex items-center justify-center hover:bg-primary/20 transition-colors">
            <p className="text-sm text-primary font-medium">Chat</p>
          </div>
        </motion.div>
      </div>

      {/* Mini cards dock at bottom */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex gap-3 p-3 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50">
          {miniCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 + index * 0.05 }}
                onClick={() => setExpandedCard(card.id)}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all hover:bg-primary/10 ${
                  focusedCard === card.id ? 'bg-primary/20 ring-1 ring-primary/50' : ''
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-5 h-5 text-foreground/80" />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Expanded Card Modal */}
      <AnimatePresence>
        {expandedCard && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-md z-40"
              onClick={() => setExpandedCard(null)}
            />
            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.9 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
            >
              <GlassmorphicCard glowColor={miniCards.find(c => c.id === expandedCard)?.color}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandedCard(null)}
                  className="absolute top-2 right-2 z-10"
                >
                  <X className="w-4 h-4" />
                </Button>
                {miniCards.map(card => 
                  card.id === expandedCard && (
                    <card.Component key={card.id} isFocused={true} />
                  )
                )}
              </GlassmorphicCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
