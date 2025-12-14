import { Calendar, Clock, Users, Video } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { cn } from "@/lib/utils";

interface CalendarCardProps {
  isFocused?: boolean;
  streamingData?: any[];
}

// Mock calendar data
const mockEvents = [
  {
    id: "1",
    title: "Team Standup",
    time: "10:00 AM",
    duration: "30 min",
    type: "meeting",
    attendees: 5,
    isNow: true,
  },
  {
    id: "2",
    title: "Product Review",
    time: "2:00 PM",
    duration: "1 hour",
    type: "video",
    attendees: 8,
    isNow: false,
  },
  {
    id: "3",
    title: "1:1 with Sarah",
    time: "4:00 PM",
    duration: "30 min",
    type: "meeting",
    attendees: 2,
    isNow: false,
  },
];

export const CalendarCard = ({ isFocused, streamingData }: CalendarCardProps) => {
  const today = new Date().toLocaleDateString("en-US", { 
    weekday: "long", 
    month: "long", 
    day: "numeric" 
  });

  return (
    <DashboardCard
      glowing={isFocused}
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-dashboard-secondary" />
            <span className="font-medium text-dashboard-foreground">Today</span>
          </div>
          <span className="text-sm text-dashboard-muted">{today}</span>
        </div>
      }
      className="h-full"
    >
      <div className="space-y-3 h-full">
        {mockEvents.map((event, index) => (
          <div
            key={event.id}
            className={cn(
              "p-4 rounded-xl transition-all duration-300",
              "bg-dashboard-muted/20 border border-dashboard-border",
              event.isNow && "border-dashboard-secondary bg-dashboard-secondary/10",
              isFocused && "animate-pulse"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {event.isNow && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-dashboard-secondary text-white">
                      NOW
                    </span>
                  )}
                  <h4 className="font-medium text-dashboard-foreground">{event.title}</h4>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-dashboard-muted">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {event.time}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {event.attendees}
                  </div>
                  {event.type === "video" && (
                    <div className="flex items-center gap-1 text-dashboard-primary">
                      <Video className="w-3.5 h-3.5" />
                      Video
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-dashboard-muted">{event.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};
