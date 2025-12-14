import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { cn } from "@/lib/utils";

interface StocksCardProps {
  isFocused?: boolean;
  streamingData?: any[];
}

// Mock stock data
const mockStocks = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 195.42,
    change: 2.34,
    changePercent: 1.21,
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 141.80,
    change: -0.85,
    changePercent: -0.60,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 378.91,
    change: 4.12,
    changePercent: 1.10,
  },
];

export const StocksCard = ({ isFocused, streamingData }: StocksCardProps) => {
  return (
    <DashboardCard
      glowing={isFocused}
      header={
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-dashboard-success" />
          <span className="font-medium text-dashboard-foreground">Watchlist</span>
        </div>
      }
      className="h-full"
    >
      <div className="space-y-3">
        {mockStocks.map((stock, index) => (
          <div
            key={stock.symbol}
            className={cn(
              "flex items-center justify-between p-2 rounded-lg transition-all",
              "hover:bg-dashboard-muted/20",
              isFocused && "animate-pulse"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div>
              <p className="font-medium text-dashboard-foreground">{stock.symbol}</p>
              <p className="text-xs text-dashboard-muted">{stock.name}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-dashboard-foreground">${stock.price.toFixed(2)}</p>
              <div className={cn(
                "flex items-center gap-1 text-xs",
                stock.change >= 0 ? "text-dashboard-success" : "text-dashboard-danger"
              )}>
                {stock.change >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {stock.change >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};
