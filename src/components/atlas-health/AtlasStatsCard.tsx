import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface AtlasStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color?: 'primary' | 'secondary' | 'accent' | 'destructive';
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
  color = 'primary' 
}: AtlasStatsCardProps) => {
  const trendIsPositive = trend !== undefined && trend > 0;
  const trendIsNegative = trend !== undefined && trend < 0;

  return (
    <motion.div
      className="glass-card p-6 rounded-2xl border border-border/50"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${
              trendIsPositive ? 'text-green-500' : trendIsNegative ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {trendIsPositive && <TrendingUp className="w-4 h-4" />}
              {trendIsNegative && <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(trend)}% from last period</span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};
