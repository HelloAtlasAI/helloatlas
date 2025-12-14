import { useRef, useEffect, useState } from "react";
import { X, Mail, Plane, TrendingUp, FileText, Calendar, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HolographicCardData {
  id: string;
  type: "email" | "flight" | "stock" | "document" | "calendar";
  title: string;
  subtitle: string;
  content: string;
  delay?: number;
}

interface HolographicCardProps {
  card: HolographicCardData;
  index: number;
  onClose?: (id: string) => void;
}

const iconMap: Record<string, LucideIcon> = {
  email: Mail,
  flight: Plane,
  stock: TrendingUp,
  document: FileText,
  calendar: Calendar,
};

export const HolographicCard = ({ card, index, onClose }: HolographicCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const Icon = iconMap[card.type] || FileText;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), (card.delay || index * 200));
    return () => clearTimeout(timer);
  }, [card.delay, index]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
    });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Calculate position around the center
  const angle = (index / 4) * Math.PI * 2 - Math.PI / 2;
  const radius = 45; // percentage from center
  const x = 50 + Math.cos(angle) * radius;
  const y = 50 + Math.sin(angle) * radius * 0.6; // Flatten vertically

  return (
    <div
      ref={cardRef}
      className={cn(
        "absolute w-72 transition-all duration-700 ease-out cursor-pointer",
        "transform-gpu perspective-1000",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
      )}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `
          translate(-50%, -50%)
          rotateY(${mousePos.x}deg)
          rotateX(${-mousePos.y}deg)
          translateZ(30px)
        `,
        transformStyle: "preserve-3d",
        animationDelay: `${card.delay || index * 200}ms`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Connection line to center */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: "50%",
          top: "50%",
          width: "200px",
          height: "200px",
          transform: `translate(-50%, -50%) rotate(${angle + Math.PI}rad)`,
          opacity: isVisible ? 0.3 : 0,
          transition: "opacity 0.5s ease-out",
        }}
      >
        <defs>
          <linearGradient id={`line-gradient-${card.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1="100"
          y1="100"
          x2="200"
          y2="100"
          stroke={`url(#line-gradient-${card.id})`}
          strokeWidth="1"
          strokeDasharray="4 4"
          className="animate-pulse"
        />
      </svg>

      {/* Card content */}
      <div
        className={cn(
          "relative rounded-2xl p-4 overflow-hidden",
          "border border-primary/20",
          "backdrop-blur-xl"
        )}
        style={{
          background: `
            linear-gradient(
              135deg,
              hsl(var(--glass-bg) / 0.7) 0%,
              hsl(var(--glass-bg) / 0.4) 50%,
              hsl(var(--glass-bg) / 0.7) 100%
            )
          `,
          boxShadow: `
            0 0 40px hsl(var(--primary) / 0.1),
            0 20px 40px hsl(var(--background) / 0.3),
            inset 0 1px 0 hsl(var(--foreground) / 0.1)
          `,
        }}
      >
        {/* Holographic shimmer effect */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `
              linear-gradient(
                ${45 + mousePos.x * 2}deg,
                transparent 0%,
                hsl(var(--primary) / 0.2) 45%,
                hsl(var(--accent) / 0.2) 50%,
                hsl(var(--secondary) / 0.2) 55%,
                transparent 100%
              )
            `,
            transition: "background 0.1s ease-out",
          }}
        />

        {/* Scan line effect */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ opacity: 0.1 }}
        >
          <div
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent"
            style={{
              animation: "scan 3s linear infinite",
              top: "0%",
            }}
          />
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(card.id);
            }}
            className="absolute top-2 right-2 p-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground truncate">{card.title}</h3>
            <p className="text-xs text-muted-foreground truncate">{card.subtitle}</p>
          </div>
        </div>

        {/* Content */}
        <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">
          {card.content}
        </p>

        {/* Glowing bottom edge */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)",
          }}
        />
      </div>
    </div>
  );
};

// Container for all holographic cards
interface HolographicCardsProps {
  cards: HolographicCardData[];
  onCardClose?: (id: string) => void;
}

export const HolographicCards = ({ cards, onCardClose }: HolographicCardsProps) => {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {cards.map((card, index) => (
        <div key={card.id} className="pointer-events-auto">
          <HolographicCard card={card} index={index} onClose={onCardClose} />
        </div>
      ))}
      
      <style>{`
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>
    </div>
  );
};

// Demo cards
export const demoHolographicCards: HolographicCardData[] = [
  {
    id: "1",
    type: "email",
    title: "3 Unread Emails",
    subtitle: "from today",
    content: "Meeting reminder from Sarah, Project update from Dev Team, Newsletter from TechCrunch",
    delay: 500,
  },
  {
    id: "2",
    type: "flight",
    title: "Paris Flight",
    subtitle: "Dec 20, 2024",
    content: "Air France AF1234 departing at 10:30 AM. Gate B42. Weather at destination: 8°C, partly cloudy.",
    delay: 700,
  },
  {
    id: "3",
    type: "stock",
    title: "AAPL Stock",
    subtitle: "+2.4% today",
    content: "Apple Inc. trading at $195.42. Market cap: $3.01T. Volume: 52.3M shares.",
    delay: 900,
  },
  {
    id: "4",
    type: "calendar",
    title: "Next Meeting",
    subtitle: "in 2 hours",
    content: "Product Review with Marketing Team. Conference Room A. 3 attendees confirmed.",
    delay: 1100,
  },
];
