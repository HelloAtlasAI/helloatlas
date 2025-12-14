import { Cloud, Sun, Droplets, Wind } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { cn } from "@/lib/utils";

interface WeatherCardProps {
  isFocused?: boolean;
  streamingData?: any[];
}

// Mock weather data
const weather = {
  location: "San Francisco",
  temperature: 68,
  condition: "Partly Cloudy",
  humidity: 65,
  wind: 12,
  high: 72,
  low: 58,
};

export const WeatherCard = ({ isFocused, streamingData }: WeatherCardProps) => {
  return (
    <DashboardCard
      glowing={isFocused}
      className={cn("h-full", isFocused && "animate-pulse")}
    >
      <div className="flex flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-dashboard-muted">{weather.location}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-light text-dashboard-foreground">
                {weather.temperature}
              </span>
              <span className="text-xl text-dashboard-muted">°F</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-xl bg-dashboard-primary/10 flex items-center justify-center">
            <Cloud className="w-8 h-8 text-dashboard-primary" />
          </div>
        </div>

        <p className="text-sm text-dashboard-muted mt-2">{weather.condition}</p>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-dashboard-border">
          <div className="text-center">
            <Droplets className="w-4 h-4 mx-auto text-dashboard-primary" />
            <p className="text-xs text-dashboard-muted mt-1">{weather.humidity}%</p>
          </div>
          <div className="text-center">
            <Wind className="w-4 h-4 mx-auto text-dashboard-muted" />
            <p className="text-xs text-dashboard-muted mt-1">{weather.wind} mph</p>
          </div>
          <div className="text-center">
            <Sun className="w-4 h-4 mx-auto text-dashboard-warning" />
            <p className="text-xs text-dashboard-muted mt-1">{weather.high}° / {weather.low}°</p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};
