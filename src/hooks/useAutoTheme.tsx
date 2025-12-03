import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Studio recording pages that should have dark theme
const DARK_STUDIO_ROUTES = ['/studio/video', '/studio/audio', '/studio/record'];

export function useAutoTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const location = useLocation();
  
  // Only force dark mode for actual recording studio pages
  const isStudioRecording = DARK_STUDIO_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(route + '/')
  );
  
  const previousTheme = useRef<string | null>(null);
  const wasInStudioRecording = useRef(false);
  const hasSetStudioTheme = useRef(false);

  // Ensure light mode is default for all non-studio pages
  useEffect(() => {
    if (isStudioRecording) return; // Let studio effect handle it
    
    // Force light mode if currently dark and not a user preference
    const loadUserTheme = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If no user, default to light mode
      if (!user) {
        if (resolvedTheme === 'dark' || resolvedTheme === 'midnight') {
          setTheme('light');
        }
        return;
      }

      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("theme_preference")
        .eq("user_id", user.id)
        .maybeSingle();

      // Use user preference or default to light
      const preferredTheme = prefs?.theme_preference || 'light';
      if (theme !== preferredTheme) {
        setTheme(preferredTheme);
      }
    };

    loadUserTheme();
  }, [location.pathname, setTheme, isStudioRecording, resolvedTheme]);

  // Handle Studio recording theme switching
  useEffect(() => {
    if (isStudioRecording) {
      if (!wasInStudioRecording.current) {
        // Entering Studio recording - save current theme and switch to dark
        previousTheme.current = theme;
        wasInStudioRecording.current = true;
        hasSetStudioTheme.current = false;
      }
      
      // Force dark mode for studio recording
      if (!hasSetStudioTheme.current && resolvedTheme !== 'dark') {
        setTheme('dark');
        hasSetStudioTheme.current = true;
      }
      return;
    }

    // Leaving Studio recording - restore light theme
    if (wasInStudioRecording.current && !isStudioRecording) {
      wasInStudioRecording.current = false;
      hasSetStudioTheme.current = false;
      
      const restoreTheme = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setTheme('light');
          return;
        }

        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("theme_preference")
          .eq("user_id", user.id)
          .maybeSingle();

        // Restore saved preference or default to light
        const savedTheme = prefs?.theme_preference || 'light';
        setTheme(savedTheme);
      };
      
      restoreTheme();
      return;
    }
  }, [resolvedTheme, setTheme, isStudioRecording, location.pathname]);
}
