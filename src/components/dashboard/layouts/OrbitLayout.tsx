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

interface OrbitLayoutProps {
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

const OrbitLayoutComponent = ({
  aiState,
  audioLevel,
  focusedCard,
  onOrbClick,
}: OrbitLayoutProps) => {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 pt-20">
      {/* Left column - first 2 cards */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4"
      >
        {cards.slice(0, 2).map((card, index) => (
          <GlassmorphicCard
            key={card.id}
            isFocused={focusedCard === card.id}
            glowColor={card.color}
            delay={index}
          >
            <card.Component isFocused={focusedCard === card.id} />
          </GlassmorphicCard>
        ))}
      </motion.div>

      {/* Center - Sphere */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col items-center justify-center"
      >
        <PureNebulaSphere
          state={aiState}
          audioLevel={audioLevel}
          size="xl"
          onClick={onOrbClick}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-sm text-muted-foreground text-center"
        >
          Click to chat with Atlas
        </motion.p>
        
        {/* Middle cards below sphere on mobile */}
        <div className="lg:hidden mt-8 w-full space-y-4">
          {cards.slice(2, 4).map((card, index) => (
            <GlassmorphicCard
              key={card.id}
              isFocused={focusedCard === card.id}
              glowColor={card.color}
              delay={index + 2}
            >
              <card.Component isFocused={focusedCard === card.id} />
            </GlassmorphicCard>
          ))}
        </div>
      </motion.div>

      {/* Right column - last 2 cards (or 4 on desktop) */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-4 pb-4">
            {/* On desktop, show cards 2-5 (middle two + last two) */}
            <div className="hidden lg:flex flex-col gap-4">
              {cards.slice(2).map((card, index) => (
                <GlassmorphicCard
                  key={card.id}
                  isFocused={focusedCard === card.id}
                  glowColor={card.color}
                  delay={index + 2}
                >
                  <card.Component isFocused={focusedCard === card.id} />
                </GlassmorphicCard>
              ))}
            </div>
            {/* On mobile, show last 2 cards */}
            <div className="lg:hidden flex flex-col gap-4">
              {cards.slice(4).map((card, index) => (
                <GlassmorphicCard
                  key={card.id}
                  isFocused={focusedCard === card.id}
                  glowColor={card.color}
                  delay={index + 4}
                >
                  <card.Component isFocused={focusedCard === card.id} />
                </GlassmorphicCard>
              ))}
            </div>
          </div>
        </ScrollArea>
      </motion.div>
    </div>
  );
};

export const OrbitLayout = memo(OrbitLayoutComponent);
