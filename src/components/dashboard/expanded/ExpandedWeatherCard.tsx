import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer, Eye, Gauge, Sunrise, Sunset, MapPin, RefreshCw } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';

const getWeatherIcon = (condition: string, size: string = 'w-8 h-8') => {
  const lower = condition?.toLowerCase() || '';
  if (lower.includes('rain') || lower.includes('drizzle')) return <CloudRain className={`${size} text-blue-400`} />;
  if (lower.includes('cloud')) return <Cloud className={`${size} text-slate-400`} />;
  return <Sun className={`${size} text-amber-400`} />;
};

export const ExpandedWeatherCard = () => {
  const { weather, isLoading, refetch } = useWeather();

  if (isLoading || !weather) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Use hourly data from weather hook
  const hourlyForecast = weather.hourly || [];

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Main weather display */}
      <div className="lg:w-1/3 flex flex-col">
        {/* Current weather card */}
        <div className="flex-1 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 rounded-2xl border border-amber-500/20 p-6 flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{weather.location || 'Current Location'}</span>
            </div>
            <button 
              onClick={() => refetch()}
              className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {getWeatherIcon(weather.condition, 'w-24 h-24')}
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-center"
            >
              <div className="text-6xl font-light text-foreground">{Math.round(weather.temp)}°</div>
              <div className="text-xl text-muted-foreground mt-2 capitalize">{weather.condition}</div>
              <div className="text-sm text-muted-foreground mt-1">
                Feels like {Math.round(weather.temp)}°
              </div>
            </motion.div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/30">
            <div className="text-center">
              <Droplets className="w-5 h-5 mx-auto text-blue-400 mb-1" />
              <div className="text-sm font-medium text-foreground">{weather.humidity}%</div>
              <div className="text-xs text-muted-foreground">Humidity</div>
            </div>
            <div className="text-center">
              <Wind className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
              <div className="text-sm font-medium text-foreground">{Math.round(weather.windSpeed)} km/h</div>
              <div className="text-xs text-muted-foreground">Wind</div>
            </div>
            <div className="text-center">
              <Eye className="w-5 h-5 mx-auto text-purple-400 mb-1" />
              <div className="text-sm font-medium text-foreground">10 km</div>
              <div className="text-xs text-muted-foreground">Visibility</div>
            </div>
          </div>
        </div>

        {/* Sunrise/Sunset */}
        <div className="mt-4 bg-card/50 rounded-2xl border border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Sunrise className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Sunrise</div>
                <div className="text-sm font-medium text-foreground">{weather.sunrise}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Sunset className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Sunset</div>
                <div className="text-sm font-medium text-foreground">{weather.sunset}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right section - Forecasts */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Hourly forecast */}
        <div className="bg-card/50 rounded-2xl border border-border/50 p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Hourly Forecast</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {hourlyForecast.map((hour, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex-shrink-0 flex flex-col items-center p-3 rounded-xl bg-muted/30 min-w-[80px]"
              >
                <span className="text-xs text-muted-foreground">{hour.time}</span>
                {getWeatherIcon(hour.icon, 'w-6 h-6')}
                <span className="text-sm font-medium text-foreground mt-1">
                  {Math.round(hour.temp)}°
                </span>
              </motion.div>
            ))}
            {hourlyForecast.length === 0 && Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex-shrink-0 flex flex-col items-center p-3 rounded-xl bg-muted/30 min-w-[80px]"
              >
                <span className="text-xs text-muted-foreground">
                  {i === 0 ? 'Now' : `${(new Date().getHours() + i) % 24}:00`}
                </span>
                <Sun className="w-6 h-6 text-amber-400" />
                <span className="text-sm font-medium text-foreground mt-1">
                  {Math.round(weather.temp + (Math.random() * 4 - 2))}°
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 7-day forecast */}
        <div className="flex-1 bg-card/50 rounded-2xl border border-border/50 p-4 overflow-hidden flex flex-col">
          <h3 className="text-sm font-medium text-foreground mb-4">7-Day Forecast</h3>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
              const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Sunny', 'Sunny', 'Cloudy', 'Sunny'];
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <div className="w-16 text-sm text-foreground font-medium">{dayName}</div>
                  <div className="flex items-center gap-2">
                    {getWeatherIcon(conditions[i], 'w-5 h-5')}
                    <span className="text-xs text-muted-foreground capitalize w-20">
                      {conditions[i]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-foreground font-medium">
                      {Math.round(weather.temp + (i % 3) - 1)}°
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round(weather.temp - 5)}°
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Additional details */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pressure', value: '1013 hPa', icon: Gauge, color: 'text-green-400' },
            { label: 'UV Index', value: '3', icon: Sun, color: 'text-amber-400' },
            { label: 'Dew Point', value: `${Math.round(weather.temp - 5)}°`, icon: Droplets, color: 'text-blue-400' },
            { label: 'Air Quality', value: 'Good', icon: Wind, color: 'text-emerald-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="bg-card/50 rounded-xl border border-border/50 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-lg font-medium text-foreground">{stat.value}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};