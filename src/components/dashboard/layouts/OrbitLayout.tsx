import { useState, memo } from 'react';
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
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrbitLayoutProps {
  aiState: AIState;
  audioLevel: number;
  focusedCard: CardId | null;
  onOrbClick: () => void;
}

const orbitCards = [
  { id: 'email' as CardId, Component: EmailCard, color: 'cyan', angle: 0 },
  { id: 'calendar' as CardId, Component: CalendarCard, color: 'purple', angle: 60 },
  { id: 'stocks' as CardId, Component: StocksCard, color: 'green', angle: 120 },
  { id: 'travel' as CardId, Component: TravelCard, color: 'orange', angle: 180 },
  { id: 'documents' as CardId, Component: DocumentsCard, color: 'blue', angle: 240 },
  { id: 'weather' as CardId, Component: WeatherCard, color: 'cyan', angle: 300 },
];

const OrbitLayoutComponent = ({
  aiState,
  audioLevel,
  focusedCard,
  onOrbClick,
}: OrbitLayoutProps) => {
  const [expandedCard, setExpandedCard] = useState<CardId | null>(null);
  const orbitRadius = 280;

  return (
    <div className="h-full flex items-center justify-center relative">
      {/* Central Nebula Sphere */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="relative z-10"
      >
        <NebulaOrb
          state={aiState}
          audioLevel={audioLevel}
          size="xl"
          onClick={onOrbClick}
        />
      </motion.div>

      {/* Orbiting Cards */}
      {orbitCards.map((card, index) => {
        const angleRad = (card.angle * Math.PI) / 180;
        const x = Math.cos(angleRad) * orbitRadius;
        const y = Math.sin(angleRad) * orbitRadius * 0.6; // Elliptical orbit
        
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x,
              y,
            }}
            transition={{ 
              delay: 0.5 + index * 0.1,
              type: 'spring',
              damping: 20 
            }}
            whileHover={{ scale: 1.05, zIndex: 20 }}
            className="absolute w-56 cursor-pointer"
            onClick={() => setExpandedCard(card.id)}
          >
            <GlassmorphicCard
              isFocused={focusedCard === card.id}
              glowColor={card.color}
            >
              <div className="max-h-32 overflow-hidden">
                <card.Component isFocused={focusedCard === card.id} />
              </div>
            </GlassmorphicCard>
          </motion.div>
        );
      })}

      {/* Orbit path visualization */}
      <div 
        className="absolute border border-border/20 rounded-full pointer-events-none"
        style={{ 
          width: orbitRadius * 2, 
          height: orbitRadius * 1.2,
        }}
      />

      {/* Expanded Card Modal */}
      <AnimatePresence>
        {expandedCard && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setExpandedCard(null)}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <GlassmorphicCard glowColor={orbitCards.find(c => c.id === expandedCard)?.color}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExpandedCard(null)}
                  className="absolute top-2 right-2 z-10"
                >
                  <X className="w-4 h-4" />
                </Button>
                {orbitCards.map(card => 
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

export const OrbitLayout = memo(OrbitLayoutComponent);
