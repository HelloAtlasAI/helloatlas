import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { city = 'San Francisco', lat, lon } = await req.json();
    
    // If no API key, return mock data
    if (!OPENWEATHER_API_KEY) {
      console.log('No OPENWEATHER_API_KEY configured, returning mock data');
      return jsonResponse({
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
    }

    // Build URL based on coordinates or city
    let url = `https://api.openweathermap.org/data/2.5/weather?appid=${OPENWEATHER_API_KEY}&units=imperial`;
    if (lat && lon) {
      url += `&lat=${lat}&lon=${lon}`;
    } else {
      url += `&q=${encodeURIComponent(city)}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Map OpenWeather icon to our icons
    const mapIcon = (icon: string) => {
      if (icon.includes('01')) return 'sunny';
      if (icon.includes('02') || icon.includes('03')) return 'partly-cloudy';
      if (icon.includes('04')) return 'cloudy';
      if (icon.includes('09') || icon.includes('10')) return 'rainy';
      if (icon.includes('11')) return 'stormy';
      if (icon.includes('13')) return 'snowy';
      return 'cloudy';
    };

    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp * 1000);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    // Get forecast for hourly data
    let hourlyData = [
      { time: 'Now', temp: Math.round(data.main.temp), icon: mapIcon(data.weather[0].icon) },
    ];

    try {
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?appid=${OPENWEATHER_API_KEY}&units=imperial&lat=${data.coord.lat}&lon=${data.coord.lon}&cnt=5`;
      const forecastRes = await fetch(forecastUrl);
      if (forecastRes.ok) {
        const forecastData = await forecastRes.json();
        hourlyData = forecastData.list.slice(0, 5).map((item: any, idx: number) => ({
          time: idx === 0 ? 'Now' : new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
          temp: Math.round(item.main.temp),
          icon: mapIcon(item.weather[0].icon),
        }));
      }
    } catch (e) {
      console.log('Could not fetch forecast:', e);
    }

    const result = {
      location: data.name,
      temp: Math.round(data.main.temp),
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      icon: mapIcon(data.weather[0].icon),
      sunrise: formatTime(data.sys.sunrise),
      sunset: formatTime(data.sys.sunset),
      hourly: hourlyData,
    };

    return jsonResponse(result);

  } catch (error: unknown) {
    console.error('Weather function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(message);
  }
});
