import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play, Link2, Calendar, Mic, Video } from "lucide-react";
import { motion } from "framer-motion";

// Hero card images - original human photos
import heroPeopleImg from "@/assets/homepage/hero-people.jpg";
import heroConversationsImg from "@/assets/homepage/hero-conversations.jpg";
import heroContentImg from "@/assets/homepage/hero-content.jpg";
import heroCommunityImg from "@/assets/homepage/hero-community.jpg";

const connectionTypes = [
  { icon: Link2, label: "Social" },
  { icon: Calendar, label: "Meetings" },
  { icon: Mic, label: "Podcasts" },
  { icon: Video, label: "Content" },
];

const heroCards = [
  { label: "People", desc: "Connect & collaborate", image: heroPeopleImg },
  { label: "Conversations", desc: "Meetings & podcasts", image: heroConversationsImg },
  { label: "Content", desc: "Create & share", image: heroContentImg },
  { label: "Community", desc: "Grow together", image: heroCommunityImg },
];

export function HeroSectionNew() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      {/* Static gradient orbs - no infinite animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-30" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20 pt-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">More than just content creation</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tight"
          >
            <span className="text-foreground">Powering How People</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-purple-500 bg-clip-text text-transparent">
              Work and Share
            </span>
            <span className="text-foreground"> Online.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Your workspace for meetings, media creation, social influence, 
            and community-driven growth. All in one unified platform.
          </motion.p>

          {/* Connection type pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {connectionTypes.map((type, index) => (
              <div
                key={type.label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 text-sm"
              >
                <type.icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{type.label}</span>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth?mode=signup")}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground text-lg px-8 py-7 h-auto font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:shadow-xl transition-all duration-300 hover:scale-105 group"
            >
              <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.open("https://calendly.com/seeksy-demo", "_blank")}
              className="text-lg px-8 py-7 h-auto font-semibold transition-all duration-300 hover:scale-105 group"
            >
              <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm text-muted-foreground"
          >
            No credit card required • Free plan available • Cancel anytime
          </motion.p>
        </div>

        {/* Visual Elements - Feature cards with lazy loaded images */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 relative max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {heroCards.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative rounded-2xl overflow-hidden border border-border/50 bg-card shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Image background */}
                <div className="relative h-52 md:h-56 overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.label} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                </div>
                {/* Content */}
                <div className="relative p-5 -mt-10">
                  <h3 className="font-bold text-xl mb-1">{item.label}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-muted/50 to-transparent" />
    </section>
  );
}
