import { useEffect, useState } from "react";
import { Sun, SunMedium, Moon, CloudMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type ThemeLevel = 'light' | 'dark' | 'midnight' | 'system';

const THEME_LEVELS: { value: number; theme: ThemeLevel; icon: typeof Sun; label: string }[] = [
  { value: 0, theme: 'light', icon: Sun, label: 'Light' },
  { value: 33, theme: 'dark', icon: SunMedium, label: 'Dark' },
  { value: 66, theme: 'midnight', icon: CloudMoon, label: 'Midnight' },
  { value: 100, theme: 'system', icon: Moon, label: 'System' },
];

function getThemeFromValue(value: number): ThemeLevel {
  if (value <= 16) return 'light';
  if (value <= 50) return 'dark';
  if (value <= 83) return 'midnight';
  return 'system';
}

function getValueFromTheme(theme: string | undefined): number {
  switch (theme) {
    case 'light': return 0;
    case 'dark': return 33;
    case 'midnight': return 66;
    case 'system': return 100;
    default: return 0;
  }
}

export function ThemeSliderPopover() {
  const { theme, setTheme } = useTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState<number[]>([getValueFromTheme(theme)]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    setSliderValue([getValueFromTheme(theme)]);
  }, [theme]);

  const handleSliderChange = async (value: number[]) => {
    setSliderValue(value);
    const newTheme = getThemeFromValue(value[0]);
    setTheme(newTheme);

    if (userId) {
      await supabase
        .from("user_preferences")
        .upsert({
          user_id: userId,
          theme_preference: newTheme,
        }, {
          onConflict: 'user_id'
        });
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case "dark":
        return <SunMedium className="h-4 w-4 text-orange-400" />;
      case "midnight":
        return <CloudMoon className="h-4 w-4 text-indigo-400" />;
      default:
        return <Moon className="h-4 w-4 text-slate-400" />;
    }
  };

  const getCurrentThemeLabel = () => {
    const level = THEME_LEVELS.find(l => l.theme === theme);
    return level?.label || 'System';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {getThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-16 p-3 bg-popover border shadow-lg z-50"
        side="bottom"
      >
        <div className="flex flex-col items-center gap-3">
          {/* Top icon - Light */}
          <div className={cn(
            "p-1.5 rounded-md transition-colors",
            theme === 'light' && "bg-yellow-100 dark:bg-yellow-900/30"
          )}>
            <Sun className={cn(
              "h-4 w-4",
              theme === 'light' ? "text-yellow-500" : "text-muted-foreground"
            )} />
          </div>

          {/* Vertical Slider */}
          <div className="h-32 flex items-center justify-center">
            <Slider
              value={sliderValue}
              onValueChange={handleSliderChange}
              max={100}
              step={1}
              orientation="vertical"
              className="h-full"
            />
          </div>

          {/* Bottom icon - System/Moon */}
          <div className={cn(
            "p-1.5 rounded-md transition-colors",
            theme === 'system' && "bg-slate-100 dark:bg-slate-800"
          )}>
            <Moon className={cn(
              "h-4 w-4",
              theme === 'system' ? "text-slate-500" : "text-muted-foreground"
            )} />
          </div>

          {/* Current theme label */}
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            {getCurrentThemeLabel()}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
