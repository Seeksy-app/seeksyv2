import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { CookieConsent } from "@/components/CookieConsent";
import { TopNavigation } from "@/components/homepage/TopNavigation";
import { AIPromptHero } from "@/components/homepage/AIPromptHero";
import { SlidingFeatureTabs } from "@/components/homepage/SlidingFeatureTabs";
import { BuildWorkspaceSection } from "@/components/homepage/BuildWorkspaceSection";
import { PlatformPillars } from "@/components/homepage/PlatformPillars";
import { VerticalFeatureTabs } from "@/components/homepage/VerticalFeatureTabs";
import { ModuleBuilder, ModuleBuilderHandle } from "@/components/homepage/ModuleBuilder";
import { ModuleHeroShowcase } from "@/components/homepage/ModuleHeroShowcase";
import { CTASection } from "@/components/homepage/CTASection";
import { FooterSection } from "@/components/homepage/FooterSection";
import { LeadMagnetModal, useLeadMagnetPopup } from "@/components/lead-magnet";
import { VisitorChatWidget } from "@/components/homepage/VisitorChatWidget";

const DEFAULT_CREATOR_LANDING = '/my-day';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const moduleBuilderRef = useRef<ModuleBuilderHandle>(null);
  
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
        // Check user role and redirect appropriately
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_role, is_creator, is_advertiser')
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
        
        // Creator users - check for custom default landing route
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('default_landing_route')
          .eq('user_id', session.user.id)
          .maybeSingle();

        // Use user's preferred landing route, or fallback to My Day
        const landingRoute = prefs?.default_landing_route || DEFAULT_CREATOR_LANDING;
        navigate(landingRoute);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <main>
        {/* AI Prompt Hero */}
        <AIPromptHero />
        
        {/* Sliding Feature Tabs - Podcasting, Meetings, Post-Production, etc. */}
        <SlidingFeatureTabs />
        
        {/* Module Hero Showcase - Obvious.ly style */}
        <ModuleHeroShowcase />
        
        {/* Build Your Own Workspace */}
        <BuildWorkspaceSection />
        
        {/* Platform Pillars - Create, Connect, Monetize */}
        <PlatformPillars />
        
        {/* Vertical Feature Tabs */}
        <VerticalFeatureTabs />
        
        {/* Build Your Own Platform - Module Builder */}
        <ModuleBuilder ref={moduleBuilderRef} />
        
        {/* Final CTA */}
        <CTASection onGetFreeReport={openLeadMagnet} />
        
        {/* Footer */}
        <FooterSection />
      </main>
      <CookieConsent />
      
      {/* Visitor AI Chat Widget */}
      <VisitorChatWidget />
      
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
