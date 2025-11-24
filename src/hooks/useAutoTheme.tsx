import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function useAutoTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const location = useLocation();
  const isStudio = location.pathname.includes('/studio');
  const previousTheme = useRef<string | null>(null);
  const wasInStudio = useRef(false);
  const hasSetStudioTheme = useRef(false);

  useEffect(() => {
    // Set dark mode on Studio entry (but allow manual changes)
    if (isStudio) {
      if (!wasInStudio.current) {
        // Entering Studio - save current theme and switch to dark
        previousTheme.current = theme;
        wasInStudio.current = true;
        hasSetStudioTheme.current = false;
      }
      
      // Only force dark mode once on entry, then respect user's choice
      if (!hasSetStudioTheme.current && resolvedTheme !== 'dark') {
        setTheme('dark');
        hasSetStudioTheme.current = true;
      }
      return;
    }

    // Leaving Studio - restore user's preference from database
    if (wasInStudio.current && !isStudio) {
      wasInStudio.current = false;
      hasSetStudioTheme.current = false;
      
      const restoreTheme = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("theme_preference")
          .eq("user_id", user.id)
          .single();

        if (prefs?.theme_preference) {
          setTheme(prefs.theme_preference);
        } else if (previousTheme.current) {
          setTheme(previousTheme.current);
        }
      };
      
      restoreTheme();
      return;
    }

    // Don't auto-switch if user explicitly chose light or dark
    if (theme === 'light' || theme === 'dark') {
      return;
    }

    // Skip if not in system/auto mode
    if (theme !== 'system') return;

    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // 7am (7) to 7pm (19) = light mode
      // 7pm (19) to 7am (7) = dark mode
      const shouldBeDark = hour >= 19 || hour < 7;
      const targetTheme = shouldBeDark ? 'dark' : 'light';
      
      if (resolvedTheme !== targetTheme) {
        setTheme(targetTheme);
      }
    };

    // Check immediately
    checkTime();

    // Check every minute
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, [theme, resolvedTheme, setTheme, isStudio, location.pathname]);
}
