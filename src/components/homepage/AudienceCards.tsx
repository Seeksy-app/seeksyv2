import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, BarChart3, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const audiences = [
  {
    id: "podcasters",
    title: "Podcasters",
    description: "Everything you need to record, edit, and grow your podcast — all in one place.",
    icon: Mic,
    features: ["HD Recording Studio", "RSS Hosting & Distribution", "AI Editing Tools", "Guest Booking"],
    gradient: "from-rose-500 to-orange-500",
    bgGradient: "from-rose-500/20 to-orange-500/20",
  },
  {
    id: "creators",
    title: "Creators & Influencers",
    description: "Understand your audience, showcase your value, and land more brand deals.",
    icon: BarChart3,
    features: ["Social Analytics", "Media Kit Generator", "Creator Valuation", "Identity Verification"],
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500/20 to-purple-500/20",
  },
];

export function AudienceCards() {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Built for Every Creator</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            One Platform, Endless Possibilities
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're a podcaster building your show or an influencer growing your brand, Seeksy has the tools you need.
          </p>
        </motion.div>

        {/* Audience Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {audiences.map((audience, index) => {
            const Icon = audience.icon;
            return (
              <motion.div
                key={audience.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                {/* Glow effect */}
                <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${audience.bgGradient} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />
                
                {/* Card */}
                <div className="relative bg-card border border-border/50 rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 h-full">
                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${audience.gradient} mb-6 shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-3">{audience.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {audience.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {audience.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${audience.gradient}`} />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    onClick={() => navigate("/auth?mode=signup")}
                    className={`w-full bg-gradient-to-r ${audience.gradient} text-white font-semibold hover:opacity-90 transition-all`}
                  >
                    I'm a {audience.title.split(' ')[0]}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
