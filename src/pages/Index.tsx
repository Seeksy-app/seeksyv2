import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users, ClipboardList, BarChart3, Sparkles, ChevronDown, Award, QrCode, Radio } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CookieConsent } from "@/components/CookieConsent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import heroVirtualStudio from "@/assets/hero-virtual-studio.jpg";
import creatorsCommunity from "@/assets/creators-community.jpg";
import creatorPortrait from "@/assets/creator-portrait.jpg";
import videoBeforeAI from "@/assets/video-before-ai.jpg";
import videoAfterAI from "@/assets/video-after-ai.jpg";
import { PersonaGrid } from "@/components/personas/PersonaGrid";
import { HolidayPromoStrip } from "@/components/homepage/HolidayPromoStrip";
import { HolidayHeroSection } from "@/components/homepage/HolidayHeroSection";
import { useHolidaySettings } from "@/hooks/useHolidaySettings";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { data: holidaySettings } = useHolidaySettings();
  
  // Check if we should show holiday UI (either holidayMode enabled OR naturally in December)
  const showHolidayUI = holidaySettings?.holidayMode || (new Date().getMonth() === 11);

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
      <main>
        {/* Holiday Promo Strip - only show during holiday season */}
        {showHolidayUI && <HolidayPromoStrip />}
        
        {/* Hero Section - holiday variant or regular */}
        {showHolidayUI ? (
          <HolidayHeroSection />
        ) : (
          <section className="relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={heroVirtualStudio} 
              alt="Virtual Studio" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-black/95" />
          </div>
          
          <div className="container relative z-10 mx-auto px-4 py-32 md:py-40">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
                <span className="text-white">Seeksy — </span>
                <span className="bg-gradient-to-r from-brand-gold to-brand-orange bg-clip-text text-transparent">Discover, Create & Connect</span>
              </h1>
              <p className="text-xl md:text-2xl mb-12 text-white/80 max-w-3xl mx-auto font-medium">
                Stream Bold Content • Host Events • Sell Products
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth?mode=signup")} 
                className="bg-gradient-to-r from-brand-gold to-brand-orange hover:opacity-90 text-black text-lg px-10 py-7 h-auto font-black shadow-glow hover:scale-105 transition-all"
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                onClick={() => navigate("/comparison")}
                variant="outline"
                className="bg-black/40 backdrop-blur-sm border-2 border-white/50 text-white hover:bg-white hover:text-black text-lg px-10 py-7 h-auto font-black transition-all"
              >
                Compare Tools
              </Button>
              </div>
              
              <div className="flex items-center justify-center gap-8 mt-12 flex-wrap">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <span className="h-2 w-2 rounded-full bg-brand-gold" />
                  <span className="text-white font-semibold text-sm">100% Creator-Owned</span>
                </div>
                <div 
                  className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 cursor-pointer hover:bg-white/10 transition-all"
                  onClick={() => navigate("/voice-certification")}
                >
                  <span className="h-2 w-2 rounded-full bg-brand-orange" />
                  <span className="text-white font-semibold text-sm">Voice Certified ✓</span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <span className="h-2 w-2 rounded-full bg-brand-gold" />
                  <span className="text-white font-semibold text-sm">Supporting Local Talent</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Who is Seeksy For - AI Personas */}
        <section className="py-24 bg-gradient-to-b from-background via-secondary/20 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black mb-4">
                <span className="bg-gradient-to-r from-brand-blue to-brand-navy bg-clip-text text-transparent">
                  Meet Your Guide
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Hover over each persona to see how Seeksy transforms your workflow
              </p>
            </div>
            
            <PersonaGrid />

            <div className="text-center mt-12">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-gradient-to-r from-brand-blue to-brand-navy hover:opacity-90 text-white text-lg px-10 py-7 h-auto font-bold"
              >
                Start Your Journey
              </Button>
            </div>
          </div>
        </section>

        {/* Live Streaming Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Radio className="h-12 w-12 text-brand-red animate-pulse" />
                <h2 className="text-5xl font-black bg-gradient-to-r from-brand-gold to-brand-orange bg-clip-text text-transparent">
                  Go Live on Your Page
                </h2>
              </div>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
                Stream directly from our virtual studio to your Seeksy page. Engage with your audience in real-time.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Demo Studio View */}
              <Card className="overflow-hidden border-2 border-brand-red/30 hover:border-brand-red/60 transition-all duration-300 group">
                <div className="aspect-video bg-gradient-to-br from-brand-navy to-black relative">
                  <img 
                    src={heroVirtualStudio} 
                    alt="Studio streaming" 
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-brand-red/90 text-white px-4 py-2 rounded-full backdrop-blur-sm">
                    <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
                    <span className="font-bold">LIVE</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg mb-1">Your Virtual Studio</h3>
                    <p className="text-white/80 text-sm">Stream with professional overlays, markers, and branding</p>
                  </div>
                </div>
              </Card>

              {/* Demo Profile View */}
              <Card className="overflow-hidden border-2 border-brand-gold/30 hover:border-brand-gold/60 transition-all duration-300 group">
                <div className="aspect-video bg-gradient-to-br from-brand-gold/20 to-background relative">
                  <img 
                    src={creatorPortrait} 
                    alt="Profile streaming" 
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage src={creatorPortrait} />
                      <AvatarFallback>CR</AvatarFallback>
                    </Avatar>
                    <Badge variant="secondary" className="bg-brand-red text-white border-0">
                      <span className="h-1.5 w-1.5 bg-white rounded-full animate-pulse mr-1.5" />
                      LIVE
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg mb-1">Your Seeksy Page</h3>
                    <p className="text-white/80 text-sm">Viewers watch live directly on your profile</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-brand-red hover:bg-brand-red/90 text-white font-bold text-lg px-8 py-6 h-auto hover:scale-105 transition-transform"
              >
                <Radio className="h-5 w-5 mr-2" />
                Start Streaming Now
              </Button>
            </div>
          </div>
        </section>

        {/* AI Enhancement Section */}
        <section className="py-20 bg-gradient-to-br from-black/50 via-background to-black/50">
          <div className="container mx-auto px-4">
              <Card className="max-w-6xl mx-auto p-12 bg-gradient-to-br from-brand-gold/20 to-brand-orange/20 border-2 border-brand-gold/30 shadow-2xl overflow-hidden relative backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="text-center mb-12">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <Sparkles className="h-12 w-12 text-brand-gold animate-pulse" />
                    <h2 className="text-5xl font-black bg-gradient-to-r from-brand-gold to-brand-orange bg-clip-text text-transparent">AI-Powered Enhancement</h2>
                  </div>
                  <p className="text-2xl mb-4 max-w-3xl mx-auto text-foreground font-bold">
                    Transform raw recordings into polished, professional content
                  </p>
                  <p className="text-lg max-w-2xl mx-auto text-muted-foreground font-medium">
                    Our AI automatically removes filler words, cleans audio, and creates engaging clips—saving you hours of editing time
                  </p>
                </div>

                {/* Before/After Comparison */}
                <div className="grid md:grid-cols-2 gap-6 mb-10">
                  <div className="relative group">
                    <div className="absolute -top-3 left-4 z-10 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      Before AI
                    </div>
                    <img 
                      src={videoBeforeAI} 
                      alt="Before AI Enhancement" 
                      className="rounded-xl shadow-xl border-2 border-red-500/50 w-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-white/70 flex items-center gap-2">
                        <span className="text-red-400">✗</span> Filler words & awkward pauses
                      </p>
                      <p className="text-sm text-white/70 flex items-center gap-2">
                        <span className="text-red-400">✗</span> Background noise & poor audio
                      </p>
                      <p className="text-sm text-white/70 flex items-center gap-2">
                        <span className="text-red-400">✗</span> Time-consuming manual editing
                      </p>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute -top-3 left-4 z-10 bg-brand-gold text-brand-navy px-4 py-1 rounded-full text-sm font-bold">
                      After AI Enhancement
                    </div>
                    <img 
                      src={videoAfterAI} 
                      alt="After AI Enhancement" 
                      className="rounded-xl shadow-xl border-2 border-brand-gold w-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-white/90 flex items-center gap-2">
                        <span className="text-brand-gold">✓</span> Crystal clear, professional delivery
                      </p>
                      <p className="text-sm text-white/90 flex items-center gap-2">
                        <span className="text-brand-gold">✓</span> Clean audio & perfect flow
                      </p>
                      <p className="text-sm text-white/90 flex items-center gap-2">
                        <span className="text-brand-gold">✓</span> Ready to publish in minutes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhancement Stats */}
                <div className="grid grid-cols-3 gap-6 mb-10 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-4xl font-black text-brand-gold mb-2">90%</div>
                    <p className="text-sm text-white/80">Faster Editing</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-brand-gold mb-2">100%</div>
                    <p className="text-sm text-white/80">Filler Words Removed</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-brand-gold mb-2">Pro</div>
                    <p className="text-sm text-white/80">Quality Output</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    onClick={() => navigate("/auth?mode=signup")}
                    className="gap-2 bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold text-lg px-8 py-6 h-auto hover:scale-105 transition-transform"
                  >
                    <Sparkles className="h-5 w-5" />
                    Start Enhancing Free
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => {
                      const demoMessage = "Show me how AI can enhance my videos";
                      localStorage.setItem("aiDemo", demoMessage);
                      navigate("/auth?mode=signup");
                    }}
                    className="border-2 border-white text-white hover:bg-white hover:text-brand-navy font-bold text-lg px-8 py-6 h-auto"
                  >
                    See AI in Action
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 bg-background scroll-mt-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black mb-4 bg-gradient-to-r from-brand-blue to-brand-navy bg-clip-text text-transparent">
                Everything You Need to Connect
              </h2>
              <p className="text-xl text-muted-foreground">
                Powerful tools to engage your audience
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-4 max-w-7xl mx-auto">
              <Card 
                className="p-8 text-center hover:shadow-2xl hover:border-brand-gold hover:-translate-y-2 transition-all duration-300 cursor-pointer group bg-gradient-to-br from-background to-brand-gold/5"
                onClick={() => {
                  localStorage.setItem("signupIntent", "/create-event");
                  navigate("/auth?mode=signup");
                }}
              >
                <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-brand-gold to-brand-gold/60 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Calendar className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Events</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Host workshops, gatherings, and experiences with easy registration management.
                </p>
              </Card>

              <Card 
                className="p-8 text-center hover:shadow-2xl hover:border-brand-blue hover:-translate-y-2 transition-all duration-300 cursor-pointer group bg-gradient-to-br from-background to-brand-blue/5"
                onClick={() => {
                  localStorage.setItem("signupIntent", "/create-meeting-type");
                  navigate("/auth?mode=signup");
                }}
              >
                <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-brand-blue to-brand-blue/60 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Meetings</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Schedule one-on-one or group meetings with seamless calendar integration.
                </p>
              </Card>

              <Card 
                className="p-8 text-center hover:shadow-2xl hover:border-brand-navy hover:-translate-y-2 transition-all duration-300 cursor-pointer group bg-gradient-to-br from-background to-brand-navy/5"
                onClick={() => {
                  localStorage.setItem("signupIntent", "/create-signup-sheet");
                  navigate("/auth?mode=signup");
                }}
              >
                <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-brand-navy to-brand-navy/60 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Sign-up Sheets</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Organize volunteer slots and time-based commitments with ease.
                </p>
              </Card>

              <Card 
                className="p-8 text-center hover:shadow-2xl hover:border-brand-red hover:-translate-y-2 transition-all duration-300 cursor-pointer group bg-gradient-to-br from-background to-brand-red/5"
                onClick={() => {
                  localStorage.setItem("signupIntent", "/create-poll");
                  navigate("/auth?mode=signup");
                }}
              >
                <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-brand-red to-brand-darkRed rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Polls</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Let your community vote on meeting dates and times that work best.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Creator Community Section */}
        <section className="py-20 bg-gradient-to-br from-background to-brand-gold/5">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
              <div className="order-2 md:order-1">
                <img 
                  src={creatorsCommunity} 
                  alt="Creators Community" 
                  className="rounded-2xl shadow-2xl border-4 border-brand-gold/20 hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-brand-blue to-brand-navy bg-clip-text text-transparent">
                  Join the Creator Community
                </h2>
                <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                  Get a beautiful, customizable landing page that brings all your connection tools together. 
                  Showcase your podcasts, events, meetings, and more—all in one place.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-brand-gold flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <span className="text-lg">Professional creator profile</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <span className="text-lg">Integrated event & meeting booking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-brand-navy flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <span className="text-lg">Built-in monetization tools</span>
                  </li>
                </ul>
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth?mode=signup")}
                  className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold text-lg px-8 py-6 h-auto hover:scale-105 transition-transform"
                >
                  Create Your Page Free
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Advertiser Section */}
        <section className="py-20 bg-gradient-to-br from-brand-red/5 via-background to-brand-darkRed/5">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
              <div>
                <img 
                  src={creatorPortrait} 
                  alt="Content Creator" 
                  className="rounded-2xl shadow-2xl border-4 border-brand-red/20 hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-brand-red to-brand-darkRed bg-clip-text text-transparent">
                  Advertise on Podcasts
                </h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Reach engaged podcast audiences with targeted advertising. Pay only for delivered impressions with our transparent CPM-based platform.
                </p>
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-4 rounded-xl bg-brand-red/10">
                    <div className="text-4xl font-black text-brand-red mb-2">70%</div>
                    <p className="text-sm font-medium">Revenue Share to Creators</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-brand-gold/10">
                    <div className="text-4xl font-black text-brand-gold mb-2">Real-time</div>
                    <p className="text-sm font-medium">Impression Tracking</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-brand-blue/10">
                    <div className="text-4xl font-black text-brand-blue mb-2">Targeted</div>
                    <p className="text-sm font-medium">Campaign Options</p>
                  </div>
                </div>
              <Button 
                size="lg" 
                onClick={() => navigate("/advertiser")}
                className="bg-brand-red hover:bg-brand-darkRed text-white font-bold text-lg px-8 py-6 h-auto hover:scale-105 transition-transform"
              >
                Learn More & Apply
              </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Partners Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-muted-foreground mb-2">Powered By Industry Leaders</h3>
              <p className="text-muted-foreground">Built with cutting-edge technology from trusted partners</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-12 max-w-5xl mx-auto opacity-60 hover:opacity-100 transition-opacity">
              {/* Lovable */}
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                <div className="h-12 flex items-center justify-center px-6">
                  <span className="text-2xl font-bold text-foreground">Lovable</span>
                </div>
              </div>

              {/* ElevenLabs */}
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                <img 
                  src="/partners/elevenlabs-logo.svg" 
                  alt="ElevenLabs" 
                  className="h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className="text-xl font-bold text-foreground hidden">ElevenLabs</span>
              </div>

              {/* Cloudflare */}
              <div className="grayscale hover:grayscale-0 transition-all">
                <img 
                  src="/partners/cloudflare-logo.svg" 
                  alt="Cloudflare" 
                  className="h-8 object-contain"
                />
              </div>

              {/* AWS */}
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                <img 
                  src="/partners/aws-logo.svg" 
                  alt="Amazon Web Services" 
                  className="h-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className="text-xl font-bold text-foreground hidden">AWS</span>
              </div>

              {/* Supabase */}
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                <div className="h-10 flex items-center justify-center px-6">
                  <span className="text-xl font-bold text-foreground">Supabase</span>
                </div>
              </div>

              {/* Stripe */}
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                <div className="h-10 flex items-center justify-center px-6">
                  <span className="text-xl font-bold text-foreground">Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-32 bg-gradient-to-br from-brand-gold/10 via-brand-navy to-brand-gold/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEzIDAgNiAyLjY4NyA2IDZzLTIuNjg3IDYtNiA2LTYtMi42ODctNi02IDIuNjg3LTYgNi02ek0yMCA0MGMzLjMxMyAwIDYgMi42ODcgNiA2cy0yLjY4NyA2LTYgNi02LTIuNjg3LTYtNiAyLjY4Ny02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          
          <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-white">
              Ready to <span className="text-brand-gold">Connect?</span>
            </h2>
            <p className="text-2xl text-white/90 mb-10 leading-relaxed">
              Join creators, organizers, and community builders who are making meaningful connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth?mode=signup")} 
                className="bg-brand-gold hover:bg-brand-gold/90 text-brand-navy font-bold text-xl px-10 py-8 h-auto hover:scale-105 transition-transform shadow-2xl"
              >
                Create Your Free Account
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/pricing")}
                className="border-2 border-white text-white hover:bg-white hover:text-brand-navy font-bold text-xl px-10 py-8 h-auto"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-6 flex-wrap">
            <a href="/pricing" className="text-lg hover:text-brand-gold transition-colors font-medium">Pricing</a>
            <span className="hidden md:inline text-brand-gold">•</span>
            <a href="/personas" className="text-lg hover:text-brand-gold transition-colors font-medium">AI Personas</a>
            <span className="hidden md:inline text-brand-gold">•</span>
            <a href="/voice-certification" className="text-lg hover:text-brand-gold transition-colors font-medium">Voice Certification</a>
            <span className="hidden md:inline text-brand-gold">•</span>
            <a href="/security" className="text-lg hover:text-brand-gold transition-colors font-medium">Security</a>
            <span className="hidden md:inline text-brand-gold">•</span>
            <a href="/system-status" className="text-lg hover:text-brand-gold transition-colors font-medium">System Status</a>
            <span className="hidden md:inline text-brand-gold">•</span>
            <a href="/privacy" className="text-lg hover:text-brand-gold transition-colors font-medium">Privacy Policy</a>
            <span className="hidden md:inline text-brand-gold">•</span>
            <a href="/terms" className="text-lg hover:text-brand-gold transition-colors font-medium">Terms & Conditions</a>
            <span className="hidden md:inline text-brand-gold">•</span>
            <a href="/cookies" className="text-lg hover:text-brand-gold transition-colors font-medium">Cookie Policy</a>
          </div>
          <p className="text-center text-muted-foreground text-lg">© 2024 Seeksy. Connecting Your Way.</p>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
};

export default Index;
