import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { CookieConsent } from "@/components/CookieConsent";
import { TopNavigation } from "@/components/homepage/TopNavigation";
import { AppLoading } from "@/components/ui/AppLoading";

// Homepage sections
import { HeroWorkspaceSection } from "@/components/homepage/HeroWorkspaceSection";

import { InteractiveDemo } from "@/components/homepage/InteractiveDemo";
import { PlatformPillars } from "@/components/homepage/PlatformPillars";

import { ModuleBuilder } from "@/components/homepage/ModuleBuilder";
import { PersonasSection } from "@/components/homepage/PersonasSection";

import { FinalCTA } from "@/components/homepage/FinalCTA";
import { FooterSection } from "@/components/homepage/FooterSection";

import { LeadMagnetModal, useLeadMagnetPopup } from "@/components/lead-magnet";

const DEFAULT_CREATOR_LANDING = '/my-day';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Lead magnet popup - disabled
  const { isOpen: isLeadMagnetOpen, openModal: openLeadMagnet, closeModal: closeLeadMagnet } = useLeadMagnetPopup({
    scrollThreshold: 60,
    timeDelay: 45,
    enabled: false,
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session) {
        // Check user role and onboarding status
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_role, is_creator, is_advertiser, onboarding_completed')
          .eq('id', session.user.id)
          .single();

        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        // Admin users go to admin
        if (roles?.role === 'admin' || roles?.role === 'super_admin') {
          navigate('/admin');
          return;
        }
        
        // Advertiser users go to advertiser dashboard
        if (profile?.preferred_role === 'advertiser' || (profile?.is_advertiser && !profile?.is_creator)) {
          navigate('/advertiser');
          return;
        }
        
        // CRITICAL: If onboarding is not completed, redirect to onboarding
        if (profile?.onboarding_completed === false) {
          navigate('/onboarding');
          return;
        }
        
        // Creator users with completed onboarding - check for custom default landing route
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('default_landing_route')
          .eq('user_id', session.user.id)
          .maybeSingle();

        // Use user's preferred landing route, or fallback to My Day
        const landingRoute = prefs?.default_landing_route || DEFAULT_CREATOR_LANDING;
        navigate(landingRoute);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Show branded loading while checking auth to prevent flash
  if (isLoading) {
    return <AppLoading message="Welcome to Seeksy..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <main>
        {/* 1. Hero - Workspace Builder (Image 1 style) */}
        <HeroWorkspaceSection />
        
        {/* 2. Interactive Demo - Chat/Prompt box with clickable modules */}
        <InteractiveDemo />
        
        {/* 3. Personas Section - Videos */}
        <PersonasSection />
        
        {/* 4. Value Pillars - Create, Connect, Monetize */}
        <PlatformPillars />
        
        {/* 5. Module Builder - Toggle version */}
        <ModuleBuilder />
        
        {/* Final CTA */}
        <FinalCTA />
        
        {/* Footer */}
        <FooterSection />
      </main>
      <CookieConsent />
      
      {/* Lead Magnet Modal */}
      <LeadMagnetModal
        isOpen={isLeadMagnetOpen}
        onClose={closeLeadMagnet}
        source="homepage"
      />
    </div>
  );
};

export default Index;
