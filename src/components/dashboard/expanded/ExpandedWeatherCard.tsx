import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, Sun, CloudRain, Wind, Droplets, Eye, Gauge, 
  Sunrise, Sunset, MapPin, RefreshCw, Thermometer,
  Snowflake, CloudLightning, CloudSnow, CloudFog
} from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { SkyGradient, StarsOverlay, SunRays } from '../effects/SkyGradient';
import { WeatherEnvironment3D } from '../effects/WeatherEnvironment3D';
import { WeatherAlerts, getMockWeatherAlerts } from '../WeatherAlerts';
import { useMemo } from 'react';

const getWeatherIcon = (condition: string, size: string = 'w-8 h-8') => {
  const lower = condition?.toLowerCase() || '';
  if (lower.includes('thunder') || lower.includes('storm')) return <CloudLightning className={`${size} text-amber-400`} />;
  if (lower.includes('snow')) return <CloudSnow className={`${size} text-slate-200`} />;
  if (lower.includes('rain') || lower.includes('drizzle')) return <CloudRain className={`${size} text-blue-400`} />;
  if (lower.includes('fog') || lower.includes('mist')) return <CloudFog className={`${size} text-slate-400`} />;
  if (lower.includes('cloud')) return <Cloud className={`${size} text-slate-400`} />;
  return <Sun className={`${size} text-amber-400`} />;
};

const getTimeOfDay = (): 'day' | 'night' | 'sunrise' | 'sunset' => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 7) return 'sunrise';
  if (hour >= 7 && hour < 18) return 'day';
  if (hour >= 18 && hour < 20) return 'sunset';
  return 'night';
};

export const ExpandedWeatherCard = () => {
  const { weather, isLoading, refetch } = useWeather();
  const timeOfDay = getTimeOfDay();
  const isNight = timeOfDay === 'night';
  const isClear = !weather?.condition?.toLowerCase().includes('cloud') && 
                  !weather?.condition?.toLowerCase().includes('rain') &&
                  !weather?.condition?.toLowerCase().includes('storm');

  const alerts = useMemo(() => {
    if (!weather) return [];
    return getMockWeatherAlerts(weather.condition);
  }, [weather]);

  const hourlyForecast = weather?.hourly || [];

  if (isLoading || !weather) {
    return (
      <div className="relative flex items-center justify-center h-[calc(100vh-140px)]">
        <SkyGradient condition="clear" timeOfDay="day" />
        <motion.div 
          className="relative z-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sun className="w-16 h-16 text-amber-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-140px)] overflow-hidden rounded-2xl">
      {/* Immersive Background Layers */}
      <div className="absolute inset-0">
        {/* Sky gradient based on condition and time */}
        <SkyGradient condition={weather.condition} timeOfDay={timeOfDay} />
        
        {/* Stars for night */}
        <StarsOverlay visible={isNight && isClear} />
        
        {/* Sun rays for clear day */}
        <SunRays visible={!isNight && isClear} intensity={0.8} />
        
        {/* 3D Weather particles */}
        <WeatherEnvironment3D 
          condition={weather.condition} 
          intensity={1}
        />
        
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col lg:flex-row gap-6 h-full p-6 overflow-y-auto">
        {/* Left Column - Current Weather */}
        <div className="lg:w-1/3 flex flex-col gap-4">
          {/* Current Conditions Card */}
          <motion.div 
            className="flex-1 backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 p-6 flex flex-col"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground/80">{weather.location || 'Current Location'}</span>
              </div>
              <motion.button 
                onClick={() => refetch()}
                className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                whileHover={{ rotate: 180 }}
                whileTap={{ scale: 0.9 }}
              >
                <RefreshCw className="w-4 h-4 text-foreground/60" />
              </motion.button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 0.3 }}
              >
                {getWeatherIcon(weather.condition, 'w-28 h-28')}
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 text-center"
              >
                <div className="text-7xl font-extralight text-foreground tracking-tight">
                  {Math.round(weather.temp)}°
                </div>
                <div className="text-xl text-foreground/70 mt-2 capitalize font-light">
                  {weather.condition}
                </div>
                <div className="text-sm text-foreground/50 mt-1">
                  Feels like {Math.round(weather.temp)}°
                </div>
              </motion.div>
            </div>

            {/* Quick Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/30"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-center">
                <Droplets className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                <div className="text-sm font-medium text-foreground">{weather.humidity}%</div>
                <div className="text-xs text-foreground/50">Humidity</div>
              </div>
              <div className="text-center">
                <Wind className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
                <div className="text-sm font-medium text-foreground">{Math.round(weather.windSpeed)} km/h</div>
                <div className="text-xs text-foreground/50">Wind</div>
              </div>
              <div className="text-center">
                <Eye className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                <div className="text-sm font-medium text-foreground">10 km</div>
                <div className="text-xs text-foreground/50">Visibility</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Sunrise/Sunset Card */}
          <motion.div 
            className="backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 p-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Sunrise className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs text-foreground/50">Sunrise</div>
                  <div className="text-sm font-medium text-foreground">{weather.sunrise}</div>
                </div>
              </div>
              
              {/* Day Progress Bar */}
              <div className="flex-1 mx-4">
                <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${((new Date().getHours() - 6) / 12) * 100}%` }}
                    transition={{ delay: 0.5, duration: 1 }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Sunset className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="text-xs text-foreground/50">Sunset</div>
                  <div className="text-sm font-medium text-foreground">{weather.sunset}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Weather Alerts */}
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 p-4"
            >
              <WeatherAlerts alerts={alerts} />
            </motion.div>
          )}
        </div>

        {/* Right Column - Forecasts & Details */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Hourly Forecast */}
          <motion.div 
            className="backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h3 className="text-sm font-medium text-foreground/80 mb-4">24-Hour Forecast</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {(hourlyForecast.length > 0 ? hourlyForecast : Array.from({ length: 24 })).map((hour: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.02 }}
                  className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl min-w-[70px] transition-colors ${
                    i === 0 ? 'bg-primary/20 border border-primary/30' : 'bg-foreground/5 hover:bg-foreground/10'
                  }`}
                >
                  <span className="text-xs text-foreground/60">
                    {hour?.time || (i === 0 ? 'Now' : `${(new Date().getHours() + i) % 24}:00`)}
                  </span>
                  <div className="my-2">
                    {getWeatherIcon(hour?.icon || (i % 3 === 0 ? 'cloudy' : 'clear'), 'w-6 h-6')}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {hour?.temp ? Math.round(hour.temp) : Math.round(weather.temp + (Math.random() * 4 - 2))}°
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 7-Day Forecast */}
          <motion.div 
            className="flex-1 backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 p-4 overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-medium text-foreground/80 mb-4">7-Day Outlook</h3>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
                const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Sunny', 'Rain', 'Cloudy', 'Sunny'];
                const highTemp = Math.round(weather.temp + (i % 3) - 1);
                const lowTemp = Math.round(weather.temp - 5 - (i % 2));
                
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                      i === 0 ? 'bg-primary/10' : 'hover:bg-foreground/5'
                    }`}
                  >
                    <div className="w-16 text-sm text-foreground font-medium">{dayName}</div>
                    <div className="flex items-center gap-3 flex-1 justify-center">
                      {getWeatherIcon(conditions[i], 'w-6 h-6')}
                      <span className="text-xs text-foreground/60 capitalize w-24">
                        {conditions[i]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-foreground font-medium w-8 text-right">{highTemp}°</span>
                      <div className="w-16 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-400 via-amber-400 to-orange-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${((highTemp - lowTemp) / 15) * 100}%` }}
                          transition={{ delay: 0.6 + i * 0.05 }}
                        />
                      </div>
                      <span className="text-foreground/50 w-8">{lowTemp}°</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Additional Stats Grid */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { label: 'Pressure', value: '1013 hPa', icon: Gauge, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
              { label: 'UV Index', value: '3 Low', icon: Sun, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
              { label: 'Dew Point', value: `${Math.round(weather.temp - 5)}°`, icon: Thermometer, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
              { label: 'Air Quality', value: 'Good', icon: Wind, color: 'text-teal-400', bgColor: 'bg-teal-500/10' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 + i * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="backdrop-blur-xl bg-background/30 rounded-xl border border-border/30 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <span className="text-xs text-foreground/50">{stat.label}</span>
                </div>
                <div className="text-lg font-medium text-foreground">{stat.value}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
