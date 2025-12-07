import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { CookieConsent } from "@/components/CookieConsent";
import { TopNavigation } from "@/components/homepage/TopNavigation";
import { HeroSectionNew } from "@/components/homepage/HeroSectionNew";
import { PersonaSelector } from "@/components/homepage/PersonaSelector";
import { ModuleBuilder, ModuleBuilderHandle } from "@/components/homepage/ModuleBuilder";
import { GlobalStatsSection } from "@/components/homepage/GlobalStatsSection";
import { FeatureShowcasePremium } from "@/components/homepage/FeatureShowcasePremium";
import { TestimonialsSection } from "@/components/homepage/TestimonialsSection";
import { FAQSection } from "@/components/homepage/FAQSection";
import { CTASection } from "@/components/homepage/CTASection";
import { FooterSection } from "@/components/homepage/FooterSection";
import { LeadMagnetModal, useLeadMagnetPopup } from "@/components/lead-magnet";
import { VisitorChatWidget } from "@/components/homepage/VisitorChatWidget";

// Map persona IDs to module IDs in ModuleBuilder
const personaModuleMapping: Record<string, string[]> = {
  creator: ["studio", "clips", "mypage", "monetize", "email"],
  podcaster: ["studio", "podcast", "rss", "clips", "mypage"],
  speaker: ["meetings", "events", "studio", "mypage", "email"],
  business: ["crm", "meetings", "email", "sms", "events"],
  community: ["crm", "email", "events", "mypage", "sms"],
  agency: ["crm", "email", "events", "sms", "monetize"],
};

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

  const handlePersonaSelect = (personaId: string) => {
    const modules = personaModuleMapping[personaId] || ["studio", "clips", "mypage"];
    
    // Scroll to module builder
    moduleBuilderRef.current?.scrollIntoView();
    
    // Set the preset modules
    moduleBuilderRef.current?.setModules(modules);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation />
      <main>
        {/* New Hero - Connection focused */}
        <HeroSectionNew />
        
        {/* Who Are You? Persona Selector */}
        <PersonaSelector onSelect={handlePersonaSelect} />
        
        {/* Build Your Own Platform - Module Builder */}
        <ModuleBuilder ref={moduleBuilderRef} />
        
        {/* Stats & Social Proof */}
        <GlobalStatsSection />
        
        {/* Feature Showcase */}
        <FeatureShowcasePremium />
        
        {/* Testimonials */}
        <TestimonialsSection />
        
        {/* FAQ */}
        <FAQSection />
        
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
