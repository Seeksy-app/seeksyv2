import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { CookieConsent } from "@/components/CookieConsent";
import { TopNavigation } from "@/components/homepage/TopNavigation";
import { HeroSection } from "@/components/homepage/HeroSection";
import { AudienceCards } from "@/components/homepage/AudienceCards";
import { FeatureSections } from "@/components/homepage/FeatureSections";
import { TestimonialsSection } from "@/components/homepage/TestimonialsSection";
import { CreatorShowcase } from "@/components/homepage/CreatorShowcase";
import { TrustMetrics } from "@/components/homepage/TrustMetrics";
import { FAQSection } from "@/components/homepage/FAQSection";
import { CTASection } from "@/components/homepage/CTASection";
import { FooterSection } from "@/components/homepage/FooterSection";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

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
        }
        // Advertiser users go to advertiser dashboard
        else if (profile?.preferred_role === 'advertiser' || (profile?.is_advertiser && !profile?.is_creator)) {
          navigate('/advertiser');
        }
        // Creator users go to creator dashboard
        else {
          navigate('/dashboard');
        }
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
        <HeroSection />
        <AudienceCards />
        <FeatureSections />
        <TrustMetrics />
        <TestimonialsSection />
        <CreatorShowcase />
        <FAQSection />
        <CTASection />
        <FooterSection />
      </main>
      <CookieConsent />
    </div>
  );
};

export default Index;
