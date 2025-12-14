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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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
    <div className="h-full flex flex-col">
      {/* Central AI Sphere */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="relative"
        >
          <NebulaOrb
            state={aiState}
            audioLevel={audioLevel}
            size="lg"
            onClick={onOrbClick}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-muted-foreground whitespace-nowrap"
          >
            Click to chat with Atlas
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom Dock */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', damping: 25 }}
        className="pb-8"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="glass-card p-3 rounded-2xl">
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-2">
                {cards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="flex-shrink-0 w-64"
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
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const CommandCenterLayout = memo(CommandCenterLayoutComponent);
