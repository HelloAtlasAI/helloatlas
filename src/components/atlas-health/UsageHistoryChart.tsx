import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Calendar } from "lucide-react";
import { useUsageHistory } from "@/hooks/useUsageHistory";
import { useSpendingAlerts } from "@/hooks/useSpendingAlerts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  lovable_ai: {
    label: "Lovable AI",
    color: "hsl(270, 60%, 55%)",
  },
  perplexity: {
    label: "Perplexity",
    color: "hsl(200, 80%, 55%)",
  },
  openai: {
    label: "OpenAI",
    color: "hsl(142, 60%, 45%)",
  },
  anthropic: {
    label: "Anthropic",
    color: "hsl(30, 80%, 55%)",
  },
  firecrawl: {
    label: "Firecrawl",
    color: "hsl(340, 70%, 55%)",
  },
};

export function UsageHistoryChart() {
  const [granularity, setGranularity] = useState<'daily' | 'weekly'>('daily');
  const [timeRange, setTimeRange] = useState<number>(7);
  
  const { history, isLoading, totalSpent, avgDailySpend, projectedWeeklySpend } = useUsageHistory(granularity, timeRange);
  const { budgetSettings } = useSpendingAlerts();

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), granularity === 'weekly' ? 'MMM d' : 'MMM d');
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Usage Trends
            </CardTitle>
            <CardDescription>
              AI spending over time by provider
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={granularity} onValueChange={(v) => setGranularity(v as 'daily' | 'weekly')}>
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(timeRange)} onValueChange={(v) => setTimeRange(Number(v))}>
              <SelectTrigger className="w-[100px] h-8">
                <Calendar className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
            <p className="text-lg font-semibold">${totalSpent.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Avg Daily</p>
            <p className="text-lg font-semibold">${avgDailySpend.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">Projected Weekly</p>
            <p className="text-lg font-semibold">${projectedWeeklySpend.toFixed(2)}</p>
          </div>
        </div>

        {/* Chart */}
        {history.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No usage data yet</p>
              <p className="text-sm">Data will appear as you use AI features</p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={history}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip 
                content={<ChartTooltipContent />}
                formatter={(value: number) => [`$${value.toFixed(4)}`, '']}
              />
              {budgetSettings && (
                <ReferenceLine 
                  y={budgetSettings.daily_budget_usd} 
                  stroke="hsl(var(--destructive))" 
                  strokeDasharray="5 5"
                  label={{ value: 'Budget', fill: 'hsl(var(--destructive))', fontSize: 10 }}
                />
              )}
              <Area
                type="monotone"
                dataKey="lovable_ai"
                stackId="1"
                stroke="hsl(270, 60%, 55%)"
                fill="hsl(270, 60%, 55%)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="perplexity"
                stackId="1"
                stroke="hsl(200, 80%, 55%)"
                fill="hsl(200, 80%, 55%)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="openai"
                stackId="1"
                stroke="hsl(142, 60%, 45%)"
                fill="hsl(142, 60%, 45%)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="anthropic"
                stackId="1"
                stroke="hsl(30, 80%, 55%)"
                fill="hsl(30, 80%, 55%)"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="firecrawl"
                stackId="1"
                stroke="hsl(340, 70%, 55%)"
                fill="hsl(340, 70%, 55%)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        )}

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {Object.entries(chartConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: config.color }}
              />
              <span className="text-xs text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
