import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Sparkles, Users2 } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSectionPremium() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0A0F1A]">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0F1A] via-[#111827] to-[#0A0F1A]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-gold/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="container relative z-10 mx-auto px-4 py-20 pt-32">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8"
          >
            <Sparkles className="w-4 h-4 text-brand-gold" />
            <span className="text-sm text-white/80 font-medium">AI-powered creator tools</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1] tracking-tight"
          >
            <span className="text-white">The All-in-One Platform for</span>
            <br />
            <span className="bg-gradient-to-r from-brand-gold via-amber-400 to-brand-orange bg-clip-text text-transparent">
              Modern Creators
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Host your podcast, grow your audience, collaborate with brands, and monetize your content — all from one powerful platform.
          </motion.p>

          {/* Dual CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth?mode=signup")}
              className="bg-gradient-to-r from-brand-gold to-brand-orange hover:from-brand-orange hover:to-brand-gold text-slate-900 text-lg px-8 py-7 h-auto font-bold shadow-lg shadow-brand-gold/20 hover:shadow-brand-gold/40 hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-100 group"
            >
              <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Get Started (Creators)
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/for-brands")}
              className="bg-white/5 backdrop-blur-sm border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 text-lg px-8 py-7 h-auto font-bold transition-all duration-300 hover:scale-105 active:scale-100 group"
            >
              <Users2 className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Book Creators / For Brands
            </Button>
          </motion.div>

          {/* Watch Demo Link */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onClick={() => window.open("https://calendly.com/seeksy-demo", "_blank")}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Play className="h-3 w-3 text-white ml-0.5" />
            </div>
            Watch a 2-minute demo
          </motion.button>
        </div>

        {/* Animated Product Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 relative max-w-5xl mx-auto"
        >
          {/* Browser Frame */}
          <div className="relative rounded-xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] backdrop-blur-sm shadow-2xl shadow-black/50">
            {/* Browser Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 mx-4">
                <div className="max-w-md mx-auto px-4 py-1.5 rounded-lg bg-white/10 text-white/40 text-sm text-center">
                  app.seeksy.io/studio
                </div>
              </div>
            </div>
            
            {/* Mock Dashboard Content */}
            <div className="aspect-[16/9] bg-gradient-to-br from-slate-900 to-slate-950 p-6 flex items-center justify-center">
              <div className="w-full max-w-4xl grid grid-cols-3 gap-4">
                {/* Sidebar Mock */}
                <div className="col-span-1 space-y-3">
                  <div className="h-8 bg-white/10 rounded-lg animate-pulse" />
                  <div className="h-6 bg-white/5 rounded-lg w-3/4" />
                  <div className="h-6 bg-white/5 rounded-lg w-4/5" />
                  <div className="h-6 bg-white/5 rounded-lg w-2/3" />
                  <div className="h-6 bg-brand-gold/20 rounded-lg w-full" />
                  <div className="h-6 bg-white/5 rounded-lg w-3/4" />
                </div>
                
                {/* Main Content Mock */}
                <div className="col-span-2 space-y-4">
                  <div className="h-10 bg-white/10 rounded-lg w-1/2 animate-pulse" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-24 bg-gradient-to-br from-brand-gold/20 to-brand-orange/20 rounded-xl border border-brand-gold/20 animate-pulse" />
                    <div className="h-24 bg-white/5 rounded-xl border border-white/10" />
                    <div className="h-24 bg-white/5 rounded-xl border border-white/10" />
                    <div className="h-24 bg-white/5 rounded-xl border border-white/10" />
                  </div>
                  <div className="h-32 bg-white/5 rounded-xl border border-white/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Floating feature pills */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="absolute -left-4 top-1/4 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white text-sm font-medium shadow-xl"
          >
            🎙️ Podcast Studio
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="absolute -right-4 top-1/3 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white text-sm font-medium shadow-xl"
          >
            📊 Analytics
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="absolute left-1/4 -bottom-4 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white text-sm font-medium shadow-xl"
          >
            🎬 AI Clips
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="absolute right-1/4 -bottom-4 px-3 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-white text-sm font-medium shadow-xl"
          >
            📅 Booking
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
