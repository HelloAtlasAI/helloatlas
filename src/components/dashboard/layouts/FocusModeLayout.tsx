import { useState, useEffect, useCallback, memo } from 'react';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FocusModeLayoutProps {
  aiState: AIState;
  audioLevel: number;
  focusedCard: CardId | null;
  onOrbClick: () => void;
}

const focusCards = [
  { id: 'email' as CardId, Component: EmailCard, color: 'cyan', title: 'Email' },
  { id: 'calendar' as CardId, Component: CalendarCard, color: 'purple', title: 'Calendar' },
  { id: 'stocks' as CardId, Component: StocksCard, color: 'green', title: 'Stocks' },
  { id: 'travel' as CardId, Component: TravelCard, color: 'orange', title: 'Travel' },
  { id: 'documents' as CardId, Component: DocumentsCard, color: 'blue', title: 'Documents' },
  { id: 'weather' as CardId, Component: WeatherCard, color: 'cyan', title: 'Weather' },
];

const FocusModeLayoutComponent = ({
  aiState,
  audioLevel,
  focusedCard,
  onOrbClick,
}: FocusModeLayoutProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const goNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % focusCards.length);
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + focusCards.length) % focusCards.length);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  // Auto-focus on AI-highlighted card
  useEffect(() => {
    if (focusedCard) {
      const index = focusCards.findIndex(c => c.id === focusedCard);
      if (index !== -1 && index !== activeIndex) {
        setDirection(index > activeIndex ? 1 : -1);
        setActiveIndex(index);
      }
    }
  }, [focusedCard, activeIndex]);

  const activeCard = focusCards[activeIndex];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 pt-20">
      {/* Left - AI Sphere with controls */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex flex-col items-center justify-center"
      >
        <NebulaOrb
          state={aiState}
          audioLevel={audioLevel}
          size="lg"
          onClick={onOrbClick}
        />
        
        {/* Navigation */}
        <div className="mt-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrev}
            className="rounded-full bg-card/50 hover:bg-card"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          {/* Dot indicators */}
          <div className="flex gap-2">
            {focusCards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => {
                  setDirection(index > activeIndex ? 1 : -1);
                  setActiveIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeIndex 
                    ? 'bg-primary w-6' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            className="rounded-full bg-card/50 hover:bg-card"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Use arrow keys to navigate
        </p>
      </motion.div>

      {/* Right - Spotlight card */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex items-center justify-center relative overflow-hidden"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md"
          >
            <GlassmorphicCard
              isFocused={focusedCard === activeCard.id}
              glowColor={activeCard.color}
            >
              <activeCard.Component isFocused={focusedCard === activeCard.id} />
            </GlassmorphicCard>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export const FocusModeLayout = memo(FocusModeLayoutComponent);
