import { memo } from 'react';
import { motion } from 'framer-motion';
import { PureNebulaSphere } from '@/components/dashboard/PureNebulaSphere';
import { GlassmorphicCard } from '@/components/dashboard/GlassmorphicCard';
import { EmailCard } from '@/components/dashboard/EmailCard';
import { CalendarCard } from '@/components/dashboard/CalendarCard';
import { StocksCard } from '@/components/dashboard/StocksCard';
import { TravelCard } from '@/components/dashboard/TravelCard';
import { DocumentsCard } from '@/components/dashboard/DocumentsCard';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { AIState } from '@/components/aria/AIOrb';
import { CardId } from '@/hooks/useCardFocus';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AmbientLayoutProps {
  aiState: AIState;
  audioLevel: number;
  focusedCard: CardId | null;
  onOrbClick: () => void;
}

const cards = [
  { id: 'email' as CardId, Component: EmailCard, color: 'cyan' },
  { id: 'calendar' as CardId, Component: CalendarCard, color: 'purple' },
  { id: 'stocks' as CardId, Component: StocksCard, color: 'green' },
  { id: 'travel' as CardId, Component: TravelCard, color: 'orange' },
  { id: 'documents' as CardId, Component: DocumentsCard, color: 'blue' },
  { id: 'weather' as CardId, Component: WeatherCard, color: 'cyan' },
];

const AmbientLayoutComponent = ({
  aiState,
  audioLevel,
  focusedCard,
  onOrbClick,
}: AmbientLayoutProps) => {
  return (
    <div className="h-full flex flex-col p-6 pt-20">
      {/* Header with large sphere */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-8"
      >
        <div className="relative">
          {/* Background glow */}
          <div 
            className="absolute inset-[-50%] rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle, hsl(210 70% 50% / 0.4) 0%, transparent 50%)',
            }}
          />
          <PureNebulaSphere
            state={aiState}
            audioLevel={audioLevel}
            size="xl"
            onClick={onOrbClick}
          />
        </div>
      </motion.div>

      {/* Cards in masonry-like grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                delay: 0.3 + index * 0.1,
                duration: 0.5,
              }}
            >
              <GlassmorphicCard
                isFocused={focusedCard === card.id}
                glowColor={card.color}
                delay={index}
              >
                <card.Component isFocused={focusedCard === card.id} />
              </GlassmorphicCard>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export const AmbientLayout = memo(AmbientLayoutComponent);
