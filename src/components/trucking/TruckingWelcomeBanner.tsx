import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Loader2, Trophy, Flame, TrendingUp, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLoadStats } from '@/hooks/useLoadStats';
import { Badge } from '@/components/ui/badge';

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function TruckingWelcomeBanner() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [greeting] = useState(getDayGreeting());
  const [userName, setUserName] = useState<string | null>(null);
  const { stats, loading: statsLoading } = useLoadStats();

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
        setWeatherLoading(false);
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
    <div className="space-y-3">
      {/* Main greeting banner */}
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
          {weatherLoading ? (
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

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Today's Count */}
        <div className="flex items-center gap-3 py-2 px-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200/50 dark:border-green-800/50">
          <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">Today</p>
            {statsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-green-600" />
            ) : (
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {stats.todayCount} loads
                {stats.isPersonalBest && stats.todayCount > 0 && (
                  <Badge className="ml-2 bg-yellow-400 text-yellow-900 text-[10px] px-1 py-0">🏆 PB!</Badge>
                )}
              </p>
            )}
          </div>
        </div>

        {/* This Month */}
        <div className="flex items-center gap-3 py-2 px-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">This Month</p>
            {statsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            ) : (
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{stats.monthCount} loads</p>
            )}
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="flex items-center gap-3 py-2 px-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
            <span className="text-sm">💰</span>
          </div>
          <div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Today Rev</p>
            {statsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            ) : (
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(stats.todayRevenue)}</p>
            )}
          </div>
        </div>

        {/* Daily Record */}
        <div className="flex items-center gap-3 py-2 px-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
          <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
            <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Daily Record</p>
            {statsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            ) : (
              <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                {stats.dailyRecord.count} <span className="font-normal text-xs">({stats.dailyRecord.date || 'N/A'})</span>
              </p>
            )}
          </div>
        </div>

        {/* Monthly Record */}
        <div className="flex items-center gap-3 py-2 px-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
          <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <span className="text-sm">🏅</span>
          </div>
          <div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Monthly Record</p>
            {statsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            ) : (
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                {stats.monthlyRecord.count} <span className="font-normal text-xs">({stats.monthlyRecord.month || 'N/A'})</span>
              </p>
            )}
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center gap-3 py-2 px-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
          <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
            <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Streak</p>
            {statsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
            ) : (
              <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                {stats.streak} day{stats.streak !== 1 ? 's' : ''} 🔥
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
