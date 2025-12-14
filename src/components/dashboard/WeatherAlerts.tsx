import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CloudRain, Snowflake, Wind, Thermometer, X } from 'lucide-react';
import { useState } from 'react';

interface WeatherAlert {
  id: string;
  type: 'warning' | 'watch' | 'advisory';
  title: string;
  description: string;
  expires: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
}

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
  onDismiss?: (id: string) => void;
}

const severityConfig = {
  minor: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/40',
    text: 'text-blue-300',
    icon: CloudRain,
    pulse: false,
  },
  moderate: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/40',
    text: 'text-amber-300',
    icon: Wind,
    pulse: false,
  },
  severe: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/40',
    text: 'text-orange-300',
    icon: AlertTriangle,
    pulse: true,
  },
  extreme: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    text: 'text-red-300',
    icon: AlertTriangle,
    pulse: true,
  },
};

const AlertCard = ({ 
  alert, 
  onDismiss,
  index,
}: { 
  alert: WeatherAlert; 
  onDismiss?: (id: string) => void;
  index: number;
}) => {
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ delay: index * 0.1, type: 'spring', damping: 20 }}
      className={`relative overflow-hidden rounded-xl border ${config.border} ${config.bg} backdrop-blur-sm p-4`}
    >
      {/* Pulsing background for severe alerts */}
      {config.pulse && (
        <motion.div
          className="absolute inset-0 bg-current opacity-10"
          animate={{
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <div className="relative flex items-start gap-3">
        {/* Icon with animation */}
        <motion.div
          className={`p-2 rounded-lg ${config.bg}`}
          animate={config.pulse ? {
            scale: [1, 1.1, 1],
          } : {}}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon className={`w-5 h-5 ${config.text}`} />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className={`text-xs font-medium uppercase tracking-wider ${config.text}`}>
                {alert.type}
              </span>
              <h4 className="text-sm font-semibold text-foreground mt-0.5">
                {alert.title}
              </h4>
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(alert.id)}
                className="p-1 rounded-lg hover:bg-foreground/10 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {alert.description}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              Expires: {alert.expires}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar for expiration */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${config.text.replace('text-', 'bg-')}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 60, ease: 'linear' }}
      />
    </motion.div>
  );
};

export const WeatherAlerts = ({ alerts, onDismiss }: WeatherAlertsProps) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    onDismiss?.(id);
  };

  const visibleAlerts = alerts.filter(alert => !dismissed.has(alert.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-medium text-foreground">Weather Alerts</span>
        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300">
          {visibleAlerts.length}
        </span>
      </div>
      
      <AnimatePresence mode="popLayout">
        {visibleAlerts.map((alert, index) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onDismiss={handleDismiss}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Mock alerts for demo - in production these would come from the weather API
export const getMockWeatherAlerts = (condition: string): WeatherAlert[] => {
  const lower = condition.toLowerCase();
  const alerts: WeatherAlert[] = [];

  if (lower.includes('storm') || lower.includes('thunder')) {
    alerts.push({
      id: 'storm-1',
      type: 'warning',
      title: 'Thunderstorm Warning',
      description: 'Severe thunderstorms expected with heavy rain, lightning, and possible hail.',
      expires: '8:00 PM Today',
      severity: 'severe',
    });
  }

  if (lower.includes('rain')) {
    alerts.push({
      id: 'flood-1',
      type: 'watch',
      title: 'Flash Flood Watch',
      description: 'Conditions are favorable for flash flooding. Be prepared to move to higher ground.',
      expires: 'Tomorrow 6:00 AM',
      severity: 'moderate',
    });
  }

  if (lower.includes('snow')) {
    alerts.push({
      id: 'winter-1',
      type: 'advisory',
      title: 'Winter Weather Advisory',
      description: 'Snow accumulation of 2-4 inches expected. Roads may become slippery.',
      expires: 'Tomorrow 12:00 PM',
      severity: 'minor',
    });
  }

  return alerts;
};
