import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
}

const getDayGreeting = (): string => {
  const now = new Date();
  const hour = now.getHours();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[now.getDay()];
  
  if (hour < 12) {
    return `Good Morning! Happy ${dayName}`;
  } else if (hour < 17) {
    return `Good Afternoon! Happy ${dayName}`;
  } else {
    return `Good Evening! Happy ${dayName}`;
  }
};

const getWeatherIcon = (condition: string) => {
  const lower = condition.toLowerCase();
  if (lower.includes('rain') || lower.includes('drizzle')) {
    return <CloudRain className="h-5 w-5 text-blue-400" />;
  } else if (lower.includes('snow')) {
    return <CloudSnow className="h-5 w-5 text-blue-200" />;
  } else if (lower.includes('thunder') || lower.includes('storm')) {
    return <CloudLightning className="h-5 w-5 text-yellow-400" />;
  } else if (lower.includes('cloud') || lower.includes('overcast')) {
    return <Cloud className="h-5 w-5 text-slate-400" />;
  } else if (lower.includes('wind')) {
    return <Wind className="h-5 w-5 text-slate-500" />;
  } else {
    return <Sun className="h-5 w-5 text-amber-400" />;
  }
};

export function TruckingWelcomeBanner() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting] = useState(getDayGreeting());
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user's name from profile
    const fetchUserName = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('account_full_name, full_name')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            const name = profile.account_full_name || profile.full_name;
            setUserName(name?.split(' ')[0] || null);
          }
        }
      } catch (error) {
        console.log('Could not fetch user name');
      }
    };

    fetchUserName();
  }, []);

  useEffect(() => {
    // Try to get weather based on geolocation
    const fetchWeather = async (lat?: number, lon?: number) => {
      try {
        // Use a free weather API (wttr.in) that doesn't require API key
        const location = lat && lon ? `${lat},${lon}` : 'Dallas'; // Default to Dallas for trucking
        const response = await fetch(`https://wttr.in/${location}?format=j1`, {
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Weather fetch failed');
        
        const data = await response.json();
        const current = data.current_condition?.[0];
        const area = data.nearest_area?.[0];
        
        if (current) {
          setWeather({
            temp: parseInt(current.temp_F) || 0,
            condition: current.weatherDesc?.[0]?.value || 'Clear',
            location: area?.areaName?.[0]?.value || 'Unknown'
          });
        }
      } catch (error) {
        console.log('Weather fetch failed, using fallback');
        // Fallback weather
        setWeather({
          temp: 45,
          condition: 'Clear',
          location: 'Dallas'
        });
      } finally {
        setLoading(false);
      }
    };

    // Try to get user's location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Geolocation denied, use default
          fetchWeather();
        },
        { timeout: 5000 }
      );
    } else {
      fetchWeather();
    }
  }, []);

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
      <div className="flex items-center gap-3">
        <span className="text-2xl">👋</span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {userName ? `${greeting.replace('!', `, ${userName}!`)}` : greeting}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Let's move some freight today!
          </p>
        </div>
      </div>
      
      {/* Weather */}
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : weather ? (
          <>
            {getWeatherIcon(weather.condition)}
            <span className="font-medium">{weather.temp}°F</span>
            <span className="text-slate-400">•</span>
            <span>{weather.condition}</span>
            <span className="text-slate-400">in {weather.location}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
