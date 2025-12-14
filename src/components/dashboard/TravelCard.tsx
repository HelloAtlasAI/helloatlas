import { Plane, MapPin, Clock } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { cn } from "@/lib/utils";

interface TravelCardProps {
  isFocused?: boolean;
  streamingData?: any[];
}

// Mock travel data
const upcomingTrip = {
  destination: "Paris, France",
  departureDate: "Dec 20, 2024",
  returnDate: "Dec 27, 2024",
  flight: {
    airline: "Air France",
    flightNumber: "AF123",
    departureTime: "10:30 AM",
    arrivalTime: "11:45 PM",
    status: "On Time",
  },
  daysUntil: 6,
};

export const TravelCard = ({ isFocused, streamingData }: TravelCardProps) => {
  return (
    <DashboardCard
      glowing={isFocused}
      header={
        <div className="flex items-center gap-2">
          <Plane className="w-5 h-5 text-dashboard-accent" />
          <span className="font-medium text-dashboard-foreground">Upcoming Trip</span>
        </div>
      }
      className={cn("h-full", isFocused && "animate-pulse")}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-dashboard-accent/20 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-dashboard-accent" />
          </div>
          <div>
            <h4 className="font-medium text-dashboard-foreground">{upcomingTrip.destination}</h4>
            <p className="text-sm text-dashboard-muted">
              {upcomingTrip.departureDate} - {upcomingTrip.returnDate}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-dashboard-muted/20 border border-dashboard-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-dashboard-foreground">
              {upcomingTrip.flight.airline} {upcomingTrip.flight.flightNumber}
            </span>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-dashboard-success/20 text-dashboard-success">
              {upcomingTrip.flight.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-dashboard-muted">
            <Clock className="w-3.5 h-3.5" />
            {upcomingTrip.flight.departureTime} → {upcomingTrip.flight.arrivalTime}
          </div>
        </div>

        <div className="text-center p-3 rounded-xl bg-dashboard-primary/10">
          <span className="text-2xl font-bold text-dashboard-primary">{upcomingTrip.daysUntil}</span>
          <span className="text-sm text-dashboard-muted ml-2">days to go!</span>
        </div>
      </div>
    </DashboardCard>
  );
};
