import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface SkyGradientProps {
  condition: string;
  timeOfDay?: 'day' | 'night' | 'sunrise' | 'sunset' | 'auto';
  className?: string;
}

const getTimeOfDay = (): 'day' | 'night' | 'sunrise' | 'sunset' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 7) return 'sunrise';
  if (hour >= 7 && hour < 18) return 'day';
  if (hour >= 18 && hour < 20) return 'sunset';
  return 'night';
};

const gradients = {
  clear: {
    day: 'from-sky-400 via-blue-500 to-indigo-600',
    night: 'from-slate-900 via-indigo-950 to-slate-950',
    sunrise: 'from-amber-300 via-orange-400 to-rose-500',
    sunset: 'from-orange-400 via-rose-500 to-purple-700',
  },
  cloudy: {
    day: 'from-slate-400 via-slate-500 to-slate-600',
    night: 'from-slate-800 via-slate-900 to-slate-950',
    sunrise: 'from-slate-400 via-amber-300 to-slate-500',
    sunset: 'from-slate-500 via-rose-400 to-slate-700',
  },
  rain: {
    day: 'from-slate-500 via-slate-600 to-slate-700',
    night: 'from-slate-800 via-slate-900 to-slate-950',
    sunrise: 'from-slate-500 via-slate-600 to-slate-700',
    sunset: 'from-slate-600 via-slate-700 to-slate-800',
  },
  storm: {
    day: 'from-slate-600 via-slate-700 to-slate-900',
    night: 'from-slate-900 via-slate-950 to-black',
    sunrise: 'from-slate-600 via-slate-700 to-slate-800',
    sunset: 'from-slate-700 via-slate-800 to-slate-900',
  },
  snow: {
    day: 'from-slate-200 via-slate-300 to-slate-400',
    night: 'from-slate-600 via-slate-700 to-slate-800',
    sunrise: 'from-rose-200 via-slate-300 to-slate-400',
    sunset: 'from-slate-300 via-rose-300 to-slate-500',
  },
};

const getConditionKey = (condition: string): keyof typeof gradients => {
  const lower = condition.toLowerCase();
  if (lower.includes('storm') || lower.includes('thunder')) return 'storm';
  if (lower.includes('rain') || lower.includes('drizzle')) return 'rain';
  if (lower.includes('snow') || lower.includes('sleet')) return 'snow';
  if (lower.includes('cloud') || lower.includes('overcast')) return 'cloudy';
  return 'clear';
};

export const SkyGradient = ({
  condition,
  timeOfDay = 'auto',
  className = '',
}: SkyGradientProps) => {
  const gradient = useMemo(() => {
    const time = timeOfDay === 'auto' ? getTimeOfDay() : timeOfDay;
    const conditionKey = getConditionKey(condition);
    return gradients[conditionKey][time];
  }, [condition, timeOfDay]);

  return (
    <motion.div
      className={`absolute inset-0 bg-gradient-to-b ${gradient} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    />
  );
};

// Stars overlay for night sky
export const StarsOverlay = ({ visible }: { visible: boolean }) => {
  const stars = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 60}%`,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
    }));
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Sun rays for clear weather
export const SunRays = ({ visible, intensity = 1 }: { visible: boolean; intensity?: number }) => {
  if (!visible) return null;

  return (
    <motion.div
      className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: intensity * 0.6, scale: 1 }}
      transition={{ duration: 1 }}
    >
      <div 
        className="w-full h-full"
        style={{
          background: 'radial-gradient(circle at top right, rgba(255, 200, 100, 0.4) 0%, transparent 60%)',
        }}
      />
      {/* Ray lines */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 right-0 origin-top-right bg-gradient-to-b from-amber-300/30 to-transparent"
          style={{
            width: 2,
            height: 200,
            transform: `rotate(${i * 12 - 40}deg)`,
          }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
};
