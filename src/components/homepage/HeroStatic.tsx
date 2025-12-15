import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HeroStatic() {
  const navigate = useNavigate();

  return (
    <section 
      className="w-full px-4 pt-28 pb-16 md:pt-36 md:pb-24"
      style={{ minHeight: "75vh" }}
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            {/* Eyebrow */}
            <span 
              className="text-sm font-medium tracking-wide uppercase"
              style={{ color: "hsl(var(--primary))" }}
            >
              More than just content creation
            </span>

            {/* Headline */}
            <h1 
              className="font-extrabold tracking-[-0.5px]"
              style={{ 
                fontSize: "clamp(40px, 5vw, 64px)",
                lineHeight: 1.05,
                color: "hsl(var(--foreground))",
              }}
            >
              Build your creator
              <br />
              <span style={{ color: "hsl(var(--primary))" }}>workspace.</span>
            </h1>

            {/* Subheadline */}
            <p 
              className="text-lg leading-relaxed max-w-md"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Turn tools on as you need them. Pay only for what you use with credits. 
              No lockouts—your work stays yours.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mt-2">
              <Button 
                size="lg" 
                className="rounded-full px-8 h-12 text-base font-semibold"
                onClick={() => navigate("/auth")}
              >
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="rounded-full px-8 h-12 text-base font-semibold"
                onClick={() => navigate("/schedule-demo")}
              >
                <Play className="mr-2 h-4 w-4" />
                Schedule a Demo
              </Button>
            </div>

            {/* Microcopy */}
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Start free with 100 credits • No credit card required
            </p>
          </motion.div>

          {/* Right: Visual Mock */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div 
              className="rounded-[28px] overflow-hidden shadow-2xl"
              style={{ 
                background: "linear-gradient(135deg, hsl(var(--primary)/0.1), hsl(var(--secondary)/0.3))",
                aspectRatio: "4/3",
              }}
            >
              <img 
                src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&h=900&fit=crop"
                alt="Creator workspace dashboard"
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(to top, hsl(var(--background)/0.3), transparent 50%)",
                }}
              />
            </div>
            
            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-4 left-8 px-5 py-2.5 rounded-full shadow-lg"
              style={{ 
                background: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <span className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>
                ✨ AI-powered workspace
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
