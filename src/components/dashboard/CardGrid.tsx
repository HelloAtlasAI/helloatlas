import { memo } from 'react';
import { motion } from 'framer-motion';
import { FocusableCard } from './FocusableCard';
import { EmailCard } from './EmailCard';
import { CalendarCard } from './CalendarCard';
import { StocksCard } from './StocksCard';
import { TravelCard } from './TravelCard';
import { DocumentsCard } from './DocumentsCard';
import { WeatherCard } from './WeatherCard';
import { CardId } from '@/hooks/useCardFocus';

interface CardGridProps {
  focusedCard: CardId;
  onCardClick?: (cardId: CardId) => void;
}

const cards = [
  { id: 'email' as const, Component: EmailCard, color: 'primary' },
  { id: 'calendar' as const, Component: CalendarCard, color: 'primary' },
  { id: 'stocks' as const, Component: StocksCard, color: 'primary' },
  { id: 'weather' as const, Component: WeatherCard, color: 'primary' },
  { id: 'travel' as const, Component: TravelCard, color: 'primary' },
  { id: 'documents' as const, Component: DocumentsCard, color: 'primary' },
];

const CardGridComponent = ({ focusedCard, onCardClick }: CardGridProps) => {
  const hasFocusedCard = focusedCard !== null;

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {cards.map((card, index) => (
        <FocusableCard
          key={card.id}
          id={card.id}
          isFocused={focusedCard === card.id}
          hasFocusedSibling={hasFocusedCard && focusedCard !== card.id}
          color={card.color}
          onClick={() => onCardClick?.(card.id)}
          delay={index * 0.05}
          className="min-h-[180px]"
        >
          <card.Component />
        </FocusableCard>
      ))}
    </motion.div>
  );
};

export const CardGrid = memo(CardGridComponent);
