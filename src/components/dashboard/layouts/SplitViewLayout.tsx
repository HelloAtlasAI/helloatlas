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

interface SplitViewLayoutProps {
  aiState: AIState;
  audioLevel: number;
  focusedCard: CardId | null;
  onOrbClick: () => void;
}

const allCards = [
  { id: 'email' as CardId, Component: EmailCard, color: 'cyan' },
  { id: 'calendar' as CardId, Component: CalendarCard, color: 'purple' },
  { id: 'stocks' as CardId, Component: StocksCard, color: 'green' },
  { id: 'travel' as CardId, Component: TravelCard, color: 'orange' },
  { id: 'documents' as CardId, Component: DocumentsCard, color: 'blue' },
  { id: 'weather' as CardId, Component: WeatherCard, color: 'cyan' },
];

const SplitViewLayoutComponent = ({
  aiState,
  audioLevel,
  focusedCard,
  onOrbClick,
}: SplitViewLayoutProps) => {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 pt-20">
      {/* Left Side - Sphere and greeting */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center"
      >
        <PureNebulaSphere
          state={aiState}
          audioLevel={audioLevel}
          size="xl"
          onClick={onOrbClick}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <h2 className="text-xl font-medium text-foreground mb-2">Good afternoon</h2>
          <p className="text-sm text-muted-foreground">
            Click the sphere to start a conversation
          </p>
        </motion.div>
      </motion.div>

      {/* Right Side - Cards list */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="h-full"
      >
        <ScrollArea className="h-full pr-2">
          <div className="space-y-4 pb-6">
            {allCards.map((card, index) => (
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
      </motion.div>
    </div>
  );
};

export const SplitViewLayout = memo(SplitViewLayoutComponent);
