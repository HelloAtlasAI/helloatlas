import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WeatherData {
  location: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  sunrise: string;
  sunset: string;
  hourly: Array<{
    time: string;
    temp: number;
    icon: string;
  }>;
}

export const useWeather = (city: string = 'San Francisco') => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { city }
      });

      if (error) throw error;
      setWeather(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      // Use mock data as fallback
      setWeather({
        location: city,
        temp: 68,
        condition: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        icon: 'partly-cloudy',
        sunrise: '6:42 AM',
        sunset: '5:24 PM',
        hourly: [
          { time: 'Now', temp: 68, icon: 'partly-cloudy' },
          { time: '12PM', temp: 71, icon: 'sunny' },
          { time: '3PM', temp: 72, icon: 'sunny' },
          { time: '6PM', temp: 69, icon: 'partly-cloudy' },
          { time: '9PM', temp: 64, icon: 'cloudy' },
        ]
      });
    } finally {
      setIsLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return {
    weather,
    isLoading,
    error,
    refetch: fetchWeather,
  };
};
