import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function useAutoTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const location = useLocation();
  const isStudio = location.pathname === '/studio'; // Only /studio forces dark, not /studio-templates or any other page
  const previousTheme = useRef<string | null>(null);
  const wasInStudio = useRef(false);
  const hasSetStudioTheme = useRef(false);

  // Load and maintain user's theme preference
  useEffect(() => {
    if (isStudio) return; // Skip when in Studio - let Studio effect handle it
    
    const loadUserTheme = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("theme_preference")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prefs?.theme_preference && prefs.theme_preference !== theme) {
        setTheme(prefs.theme_preference);
      }
    };

    loadUserTheme();
  }, [location.pathname, setTheme, isStudio]); // Reload on every navigation

  // Handle Studio theme switching
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
          .maybeSingle();

        // Restore saved preference or use system theme
        const savedTheme = prefs?.theme_preference || previousTheme.current || 'light';
        setTheme(savedTheme);
      };
      
      restoreTheme();
      return;
    }
  }, [resolvedTheme, setTheme, isStudio, location.pathname]);
}
