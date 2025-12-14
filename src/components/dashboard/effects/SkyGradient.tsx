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

export const SkyGradient = ({ condition, timeOfDay = 'auto', className = '' }: SkyGradientProps) => {
  const gradientStyles = useMemo(() => {
    const time = timeOfDay === 'auto' ? getTimeOfDay() : timeOfDay;
    
    // Base colors for different times of day
    const timeColors = {
      day: {
        top: 'hsl(210, 80%, 55%)',
        middle: 'hsl(200, 70%, 70%)',
        bottom: 'hsl(195, 60%, 85%)',
        horizon: 'hsl(45, 80%, 95%)'
      },
      night: {
        top: 'hsl(230, 40%, 8%)',
        middle: 'hsl(235, 35%, 15%)',
        bottom: 'hsl(240, 30%, 22%)',
        horizon: 'hsl(250, 25%, 30%)'
      },
      sunrise: {
        top: 'hsl(220, 50%, 35%)',
        middle: 'hsl(25, 80%, 55%)',
        bottom: 'hsl(35, 90%, 70%)',
        horizon: 'hsl(45, 95%, 80%)'
      },
      sunset: {
        top: 'hsl(240, 45%, 25%)',
        middle: 'hsl(340, 70%, 45%)',
        bottom: 'hsl(25, 85%, 55%)',
        horizon: 'hsl(40, 90%, 70%)'
      }
    };

    // Weather condition modifiers
    const conditionModifiers: Record<string, { saturation: number; lightness: number; overlay?: string }> = {
      clear: { saturation: 1, lightness: 1 },
      sunny: { saturation: 1.1, lightness: 1.05 },
      cloudy: { saturation: 0.4, lightness: 0.85, overlay: 'hsla(210, 10%, 70%, 0.3)' },
      overcast: { saturation: 0.25, lightness: 0.7, overlay: 'hsla(210, 5%, 60%, 0.4)' },
      rain: { saturation: 0.3, lightness: 0.6, overlay: 'hsla(220, 20%, 40%, 0.35)' },
      drizzle: { saturation: 0.35, lightness: 0.65, overlay: 'hsla(215, 15%, 50%, 0.25)' },
      thunderstorm: { saturation: 0.2, lightness: 0.4, overlay: 'hsla(230, 30%, 20%, 0.5)' },
      snow: { saturation: 0.3, lightness: 0.9, overlay: 'hsla(210, 20%, 90%, 0.2)' },
      fog: { saturation: 0.15, lightness: 0.75, overlay: 'hsla(200, 10%, 80%, 0.5)' },
      mist: { saturation: 0.2, lightness: 0.8, overlay: 'hsla(200, 10%, 85%, 0.4)' }
    };
    
    const lowerCondition = condition.toLowerCase();
    let modifierKey = 'clear';
    
    if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) modifierKey = 'thunderstorm';
    else if (lowerCondition.includes('rain')) modifierKey = 'rain';
    else if (lowerCondition.includes('drizzle')) modifierKey = 'drizzle';
    else if (lowerCondition.includes('snow')) modifierKey = 'snow';
    else if (lowerCondition.includes('fog')) modifierKey = 'fog';
    else if (lowerCondition.includes('mist')) modifierKey = 'mist';
    else if (lowerCondition.includes('overcast')) modifierKey = 'overcast';
    else if (lowerCondition.includes('cloud')) modifierKey = 'cloudy';
    else if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) modifierKey = 'sunny';

    const colors = timeColors[time] || timeColors.day;
    const modifier = conditionModifiers[modifierKey] || conditionModifiers.clear;

    // Create multi-layer gradient for smooth transitions
    const gradient = `
      linear-gradient(
        180deg,
        ${colors.top} 0%,
        ${colors.middle} 35%,
        ${colors.bottom} 70%,
        ${colors.horizon} 100%
      )
    `;

    return {
      gradient,
      overlay: modifier.overlay,
      filter: `saturate(${modifier.saturation}) brightness(${modifier.lightness})`
    };
  }, [condition, timeOfDay]);

  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      {/* Base gradient layer */}
      <div
        className="absolute inset-0"
        style={{
          background: gradientStyles.gradient,
          filter: gradientStyles.filter
        }}
      />
      
      {/* Atmospheric haze layer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 150% 100% at 50% 100%, hsla(200, 30%, 90%, 0.15) 0%, transparent 70%)'
        }}
      />
      
      {/* Weather condition overlay */}
      {gradientStyles.overlay && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          style={{
            backgroundColor: gradientStyles.overlay
          }}
        />
      )}
      
      {/* Subtle noise texture for atmosphere */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />
    </motion.div>
  );
};

interface StarsOverlayProps {
  visible?: boolean;
  density?: number;
}

export const StarsOverlay = ({ visible = true, density = 100 }: StarsOverlayProps) => {
  const stars = useMemo(() => {
    return Array.from({ length: density }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 70, // Stars in upper portion
      size: 1 + Math.random() * 2,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.7
    }));
  }, [density]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size
          }}
          animate={{
            opacity: [star.opacity * 0.5, star.opacity, star.opacity * 0.5],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};

interface SunRaysProps {
  visible?: boolean;
  intensity?: number;
  position?: 'sunrise' | 'sunset' | 'high';
}

export const SunRays = ({ visible = true, intensity = 1, position = 'high' }: SunRaysProps) => {
  if (!visible) return null;

  const sunPosition = useMemo(() => {
    switch (position) {
      case 'sunrise': return { x: '20%', y: '80%' };
      case 'sunset': return { x: '80%', y: '80%' };
      default: return { x: '50%', y: '10%' };
    }
  }, [position]);

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: intensity * 0.6 }}
      transition={{ duration: 2 }}
    >
      {/* Sun glow */}
      <div
        className="absolute"
        style={{
          left: sunPosition.x,
          top: sunPosition.y,
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, hsla(45, 100%, 70%, 0.4) 0%, hsla(40, 90%, 60%, 0.2) 30%, transparent 70%)`,
          filter: 'blur(20px)'
        }}
      />
      
      {/* Light rays */}
      <motion.div
        className="absolute"
        style={{
          left: sunPosition.x,
          top: sunPosition.y,
          transform: 'translate(-50%, -50%)'
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: '2px',
              height: '400px',
              background: 'linear-gradient(to bottom, hsla(45, 100%, 80%, 0.3) 0%, transparent 100%)',
              transformOrigin: 'center bottom',
              transform: `rotate(${i * 30}deg) translateY(-50%)`,
              filter: 'blur(3px)'
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};
