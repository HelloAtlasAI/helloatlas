import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AtlasStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color?: 'primary' | 'secondary' | 'accent' | 'destructive';
  className?: string;
}

const colorClasses = {
  primary: 'text-primary bg-primary/10 border-primary/20',
  secondary: 'text-secondary bg-secondary/10 border-secondary/20',
  accent: 'text-accent bg-accent/10 border-accent/20',
  destructive: 'text-destructive bg-destructive/10 border-destructive/20',
};

export const AtlasStatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'primary',
  className
}: AtlasStatsCardProps) => {
  const trendIsPositive = trend !== undefined && trend > 0;
  const trendIsNegative = trend !== undefined && trend < 0;

  return (
    <motion.div
      className={cn(
        "backdrop-blur-xl bg-background/30 border border-border/30 p-5 rounded-2xl hover:border-primary/30 transition-all",
        className
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${
              trendIsPositive ? 'text-emerald-400' : trendIsNegative ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {trendIsPositive && <TrendingUp className="w-3 h-3" />}
              {trendIsNegative && <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(trend)}% from last period</span>
            </div>
          )}
        </div>

        <div className={cn("p-2.5 rounded-xl", colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
};
