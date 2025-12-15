import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Palette, Building2, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const personas = [
  {
    key: "creator",
    title: "Creator",
    icon: Palette,
    bullets: ["Build your page", "Publish content", "Grow your audience"],
    cta: "Start as a Creator",
    gradient: "from-purple-500/10 to-pink-500/10",
    iconColor: "#9333EA",
  },
  {
    key: "agency",
    title: "Agency",
    icon: Building2,
    bullets: ["Manage clients", "Run campaigns", "Track deliverables"],
    cta: "Start as an Agency",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "#0EA5E9",
  },
  {
    key: "brand",
    title: "Brand",
    icon: Megaphone,
    bullets: ["Find creators", "Launch activations", "Measure ROI"],
    cta: "Start as a Brand",
    gradient: "from-amber-500/10 to-orange-500/10",
    iconColor: "#F59E0B",
  },
];

export function PersonasSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full px-4 py-16 md:py-24">
      <div className="mx-auto max-w-[1280px]">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 
            className="font-extrabold tracking-[-0.5px] mb-4"
            style={{ 
              fontSize: "clamp(28px, 4vw, 42px)",
              color: "hsl(var(--foreground))",
            }}
          >
            Built for every role in the creator economy
          </h2>
          <p 
            className="text-lg"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Pick your path. Your workspace adapts.
          </p>
        </div>

        {/* Persona Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {personas.map((persona, index) => (
            <motion.div
              key={persona.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="rounded-[28px] p-8 flex flex-col h-full"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 10px 40px -10px hsl(var(--foreground)/0.06)",
              }}
            >
              {/* Icon */}
              <div 
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${persona.gradient}`}
              >
                <persona.icon 
                  className="w-7 h-7" 
                  style={{ color: persona.iconColor }} 
                />
              </div>

              {/* Title */}
              <h3 
                className="text-2xl font-bold mb-4"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {persona.title}
              </h3>

              {/* Bullets */}
              <ul className="flex-1 space-y-3 mb-6">
                {persona.bullets.map((bullet) => (
                  <li 
                    key={bullet}
                    className="flex items-center gap-3 text-base"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    <div 
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: persona.iconColor }}
                    />
                    {bullet}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant="outline"
                className="rounded-full w-full h-12 text-base font-medium"
                onClick={() => navigate("/auth")}
              >
                {persona.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
