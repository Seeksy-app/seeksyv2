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

        // Restore saved preference or use system theme
        const savedTheme = prefs?.theme_preference || previousTheme.current || 'system';
        setTheme(savedTheme);
      };
      
      restoreTheme();
      return;
    }

    // Auto mode now follows system preferences (OS-level light/dark mode)
    // "system" theme in next-themes automatically follows OS preference
  }, [theme, resolvedTheme, setTheme, isStudio, location.pathname]);
}
