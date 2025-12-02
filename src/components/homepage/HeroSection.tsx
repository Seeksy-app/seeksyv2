import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight, Mic, Calendar, BarChart3, FileText, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const features = [
  { icon: Mic, label: "Recording Studio", color: "from-red-500 to-orange-500" },
  { icon: Calendar, label: "Booking & Scheduling", color: "from-blue-500 to-cyan-500" },
  { icon: BarChart3, label: "Social Analytics", color: "from-purple-500 to-pink-500" },
  { icon: FileText, label: "Creator Page", color: "from-green-500 to-emerald-500" },
  { icon: Sparkles, label: "Media Kit", color: "from-amber-500 to-yellow-500" },
];

export function HeroSection() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-brand-gold/5 to-transparent rounded-full" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold" />
            </span>
            <span className="text-sm text-white/80 font-medium">The All-in-One Platform for Creators</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight"
          >
            <span className="text-white">Your All-In-One</span>
            <br />
            <span className="bg-gradient-to-r from-brand-gold via-amber-400 to-brand-orange bg-clip-text text-transparent">
              Creator Platform
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-white/70 mb-10 max-w-3xl mx-auto font-medium"
          >
            Host, schedule, record, and monetize — all in one place.
            <br className="hidden md:block" />
            Built for podcasters, creators, and brands.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth?mode=signup")}
              className="bg-gradient-to-r from-brand-gold to-brand-orange hover:opacity-90 text-slate-900 text-lg px-8 py-7 h-auto font-bold shadow-lg shadow-brand-gold/25 hover:shadow-xl hover:shadow-brand-gold/30 transition-all hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.open("https://calendly.com/seeksy-demo", "_blank")}
              className="bg-white/5 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white hover:text-slate-900 text-lg px-8 py-7 h-auto font-bold transition-all"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Feature Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative"
          >
            <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.label}
                    onClick={() => setActiveFeature(index)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                      activeFeature === index
                        ? "bg-white/20 border-2 border-white/40 scale-105"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${activeFeature === index ? "text-brand-gold" : "text-white/60"}`} />
                    <span className={`text-sm font-medium ${activeFeature === index ? "text-white" : "text-white/60"}`}>
                      {feature.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feature Preview Card */}
            <div className="max-w-4xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-gradient-to-br ${features[activeFeature].color} p-1 rounded-2xl shadow-2xl`}
                >
                  <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl p-8 min-h-[200px] flex items-center justify-center">
                    <div className="text-center">
                      {(() => {
                        const Icon = features[activeFeature].icon;
                        return <Icon className="h-16 w-16 text-white/80 mx-auto mb-4" />;
                      })()}
                      <h3 className="text-2xl font-bold text-white mb-2">{features[activeFeature].label}</h3>
                      <p className="text-white/60 max-w-md mx-auto">
                        Professional tools designed specifically for creators who want to grow their audience and monetize their content.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
