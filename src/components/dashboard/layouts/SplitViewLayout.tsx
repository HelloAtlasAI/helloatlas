import { memo } from 'react';
import { motion } from 'framer-motion';
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
import { ScrollArea } from '@/components/ui/scroll-area';

interface SplitViewLayoutProps {
  aiState: AIState;
  audioLevel: number;
  focusedCard: CardId | null;
  onOrbClick: () => void;
}

const leftCards = [
  { id: 'email' as CardId, Component: EmailCard, color: 'cyan' },
  { id: 'calendar' as CardId, Component: CalendarCard, color: 'purple' },
  { id: 'stocks' as CardId, Component: StocksCard, color: 'green' },
];

const rightCards = [
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
      {/* Left Side - AI Sphere */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25 }}
        className="flex flex-col items-center justify-center"
      >
        <NebulaOrb
          state={aiState}
          audioLevel={audioLevel}
          size="xl"
          onClick={onOrbClick}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-sm text-muted-foreground"
        >
          Click to chat with Atlas
        </motion.p>
        
        {/* Quick cards under sphere */}
        <div className="mt-8 w-full max-w-sm space-y-4">
          {leftCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <GlassmorphicCard
                isFocused={focusedCard === card.id}
                glowColor={card.color}
              >
                <card.Component isFocused={focusedCard === card.id} />
              </GlassmorphicCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Right Side - Cards Grid */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25 }}
        className="h-full"
      >
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4 pb-8">
            {rightCards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <GlassmorphicCard
                  isFocused={focusedCard === card.id}
                  glowColor={card.color}
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
