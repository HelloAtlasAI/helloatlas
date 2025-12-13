import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "./GlassCard";
import { Mail, FileText, Plane, TrendingUp, User, Calendar } from "lucide-react";

interface FloatingCardData {
  id: string;
  type: "email" | "document" | "travel" | "finance" | "person" | "event";
  title: string;
  subtitle?: string;
  content?: ReactNode;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "left" | "right";
}

interface FloatingCardsProps {
  cards: FloatingCardData[];
  onCardClose?: (id: string) => void;
}

const getIcon = (type: FloatingCardData["type"]) => {
  switch (type) {
    case "email":
      return <Mail className="w-4 h-4" />;
    case "document":
      return <FileText className="w-4 h-4" />;
    case "travel":
      return <Plane className="w-4 h-4" />;
    case "finance":
      return <TrendingUp className="w-4 h-4" />;
    case "person":
      return <User className="w-4 h-4" />;
    case "event":
      return <Calendar className="w-4 h-4" />;
    default:
      return null;
  }
};

const getPositionClasses = (position: FloatingCardData["position"]) => {
  switch (position) {
    case "top-left":
      return "top-8 left-8";
    case "top-right":
      return "top-8 right-8";
    case "bottom-left":
      return "bottom-32 left-8";
    case "bottom-right":
      return "bottom-32 right-8";
    case "left":
      return "top-1/2 -translate-y-1/2 left-8";
    case "right":
      return "top-1/2 -translate-y-1/2 right-8";
    default:
      return "";
  }
};

export const FloatingCards = ({ cards, onCardClose }: FloatingCardsProps) => {
  return (
    <>
      {cards.map((card, index) => (
        <div
          key={card.id}
          className={cn(
            "absolute w-72 animate-fade-in",
            getPositionClasses(card.position)
          )}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationFillMode: "backwards",
          }}
        >
          <GlassCard
            title={card.title}
            icon={getIcon(card.type)}
            onClose={onCardClose ? () => onCardClose(card.id) : undefined}
            glowing
          >
            {card.subtitle && (
              <p className="text-xs text-muted-foreground mb-2">{card.subtitle}</p>
            )}
            {card.content}
          </GlassCard>

          {/* Connection line to center */}
          <svg
            className="absolute top-1/2 pointer-events-none"
            style={{
              width: "100px",
              height: "2px",
              left: card.position.includes("left") ? "100%" : "-100px",
              opacity: 0.3,
            }}
          >
            <line
              x1="0"
              y1="1"
              x2="100"
              y2="1"
              stroke="url(#connectionGradient)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={card.position.includes("left") ? "1" : "0"} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={card.position.includes("left") ? "0" : "1"} />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ))}
    </>
  );
};

// Demo cards for initial display
export const demoCards: FloatingCardData[] = [
  {
    id: "email-1",
    type: "email",
    title: "Inbox Summary",
    subtitle: "3 important emails",
    position: "top-left",
    content: (
      <div className="space-y-2">
        <div className="text-xs text-foreground/80">• Meeting request from John</div>
        <div className="text-xs text-foreground/80">• Q4 Report ready for review</div>
        <div className="text-xs text-foreground/80">• Flight confirmation</div>
      </div>
    ),
  },
  {
    id: "finance-1",
    type: "finance",
    title: "Market Update",
    subtitle: "Live data",
    position: "top-right",
    content: (
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">AAPL</span>
          <span className="text-green-400">+2.4%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">GOOGL</span>
          <span className="text-green-400">+1.8%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">TSLA</span>
          <span className="text-red-400">-0.5%</span>
        </div>
      </div>
    ),
  },
  {
    id: "travel-1",
    type: "travel",
    title: "Upcoming Trip",
    subtitle: "Paris, France",
    position: "bottom-left",
    content: (
      <div className="space-y-1">
        <div className="text-xs text-foreground/80">Dec 20-27, 2024</div>
        <div className="text-xs text-muted-foreground">Flight + Hotel booked</div>
      </div>
    ),
  },
  {
    id: "document-1",
    type: "document",
    title: "Recent Documents",
    subtitle: "Last modified today",
    position: "bottom-right",
    content: (
      <div className="space-y-2">
        <div className="text-xs text-foreground/80">• Project Proposal.docx</div>
        <div className="text-xs text-foreground/80">• Budget 2025.xlsx</div>
      </div>
    ),
  },
];
