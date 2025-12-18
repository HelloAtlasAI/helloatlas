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
import { AIState } from '@/types';
import { CardId } from '@/hooks/useCardFocus';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CommandCenterLayoutProps {
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

const CommandCenterLayoutComponent = ({
  aiState,
  audioLevel,
  focusedCard,
  onOrbClick,
}: CommandCenterLayoutProps) => {
  return (
    <div className="h-full flex flex-col p-6 pt-20">
      {/* Header with Sphere */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center pb-8"
      >
        <div className="flex flex-col items-center">
          <PureNebulaSphere
            state={aiState}
            audioLevel={audioLevel}
            size="lg"
            onClick={onOrbClick}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-sm text-muted-foreground"
          >
            Click to chat with Atlas
          </motion.p>
        </div>
      </motion.div>

      {/* Cards Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.08 }}
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

export const CommandCenterLayout = memo(CommandCenterLayoutComponent);
