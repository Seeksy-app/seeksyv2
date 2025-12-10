import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { ScheduleDemoDialog } from "./ScheduleDemoDialog";

// Netflix-style grid images - real people
import grid1 from "@/assets/homepage/grid-1.jpg";
import grid2 from "@/assets/homepage/grid-2.jpg";
import grid3 from "@/assets/homepage/grid-3.jpg";
import grid4 from "@/assets/homepage/grid-4.jpg";
import grid5 from "@/assets/homepage/grid-5.jpg";
import grid6 from "@/assets/homepage/grid-6.jpg";
import grid7 from "@/assets/homepage/grid-7.jpg";
import grid8 from "@/assets/homepage/grid-8.jpg";
import grid9 from "@/assets/homepage/grid-9.jpg";
import grid10 from "@/assets/homepage/grid-10.jpg";
import grid11 from "@/assets/homepage/grid-11.jpg";
import grid12 from "@/assets/homepage/grid-12.jpg";
import grid13 from "@/assets/homepage/grid-13.jpg";
import grid14 from "@/assets/homepage/grid-14.jpg";
import grid15 from "@/assets/homepage/grid-15.jpg";

const gridImages = [
  grid1, grid2, grid3, grid4, grid5,
  grid6, grid7, grid8, grid9, grid10,
  grid11, grid12, grid13, grid14, grid15,
];

export function HeroSectionNew() {
  const navigate = useNavigate();
  const [showDemoDialog, setShowDemoDialog] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-black">
      {/* Netflix-style background grid */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid of tilted images */}
        <div 
          className="absolute inset-0 grid grid-cols-5 gap-2 p-2"
          style={{ 
            transform: 'rotate(-12deg) scale(1.4)',
            transformOrigin: 'center center'
          }}
        >
          {gridImages.map((img, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.05,
                ease: "easeOut"
              }}
              className="relative aspect-[2/3] rounded-lg overflow-hidden"
            >
              <img 
                src={img} 
                alt=""
                className="w-full h-full object-cover"
                loading={index < 10 ? "eager" : "lazy"}
              />
            </motion.div>
          ))}
        </div>

        {/* Heavy dark overlay with radial gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black" />
        <div 
          className="absolute inset-0" 
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.8) 70%)'
          }}
        />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20 pt-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Main Headline - Netflix style */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-[1.1] tracking-tight text-white"
          >
            Unlimited podcasts, meetings, and content creation
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-white/80 mb-3"
          >
            Free to start. Upgrade anytime.
          </motion.p>

          {/* Secondary text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-base md:text-lg text-white/70 mb-8"
          >
            Ready to grow? Create your workspace and start connecting.
          </motion.p>

          {/* CTAs - Netflix style inline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth?mode=signup")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-7 h-auto font-bold shadow-lg transition-all duration-300 hover:scale-105 group min-w-[200px]"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowDemoDialog(true)}
              className="bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white text-lg px-8 py-7 h-auto font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-105 group min-w-[200px]"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Schedule Demo
            </Button>
          </motion.div>

          <ScheduleDemoDialog open={showDemoDialog} onOpenChange={setShowDemoDialog} />
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
