import { Mail, Star, Clock } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { cn } from "@/lib/utils";

interface EmailCardProps {
  isFocused?: boolean;
  streamingData?: any[];
}

// Mock email data
const mockEmails = [
  {
    id: "1",
    sender: "Sarah Johnson",
    subject: "Project Update - Q4 Review",
    preview: "Hey! Just wanted to share the latest updates on the Q4 review...",
    time: "10:30 AM",
    isStarred: true,
    isUnread: true,
  },
  {
    id: "2",
    sender: "Michael Chen",
    subject: "Meeting Tomorrow",
    preview: "Can we reschedule our 2pm meeting to 3pm? I have a conflict...",
    time: "9:15 AM",
    isStarred: false,
    isUnread: true,
  },
  {
    id: "3",
    sender: "Emily Davis",
    subject: "Design Review Feedback",
    preview: "I've reviewed the new designs and have some thoughts...",
    time: "Yesterday",
    isStarred: true,
    isUnread: false,
  },
  {
    id: "4",
    sender: "Alex Thompson",
    subject: "Lunch next week?",
    preview: "Hey! It's been a while since we caught up. Free for lunch...",
    time: "Yesterday",
    isStarred: false,
    isUnread: false,
  },
];

export const EmailCard = ({ isFocused, streamingData }: EmailCardProps) => {
  const unreadCount = mockEmails.filter(e => e.isUnread).length;

  return (
    <DashboardCard
      glowing={isFocused}
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-dashboard-primary" />
            <span className="font-medium text-dashboard-foreground">Inbox</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-dashboard-primary/20 text-dashboard-primary">
                {unreadCount} new
              </span>
            )}
          </div>
          <button className="text-sm text-dashboard-muted hover:text-dashboard-foreground transition-colors">
            View all
          </button>
        </div>
      }
      className="h-full"
    >
      <div className="space-y-1 h-full overflow-y-auto">
        {mockEmails.map((email, index) => (
          <div
            key={email.id}
            className={cn(
              "p-3 rounded-xl transition-all duration-300 cursor-pointer",
              "hover:bg-dashboard-muted/30",
              email.isUnread && "bg-dashboard-primary/5 border-l-2 border-dashboard-primary",
              isFocused && streamingData && "animate-pulse"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium text-sm truncate",
                    email.isUnread ? "text-dashboard-foreground" : "text-dashboard-muted"
                  )}>
                    {email.sender}
                  </span>
                  {email.isStarred && (
                    <Star className="w-3 h-3 text-dashboard-warning fill-dashboard-warning" />
                  )}
                </div>
                <p className={cn(
                  "text-sm truncate mt-0.5",
                  email.isUnread ? "text-dashboard-foreground" : "text-dashboard-muted"
                )}>
                  {email.subject}
                </p>
                <p className="text-xs text-dashboard-muted truncate mt-0.5">
                  {email.preview}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-dashboard-muted shrink-0">
                <Clock className="w-3 h-3" />
                {email.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};
