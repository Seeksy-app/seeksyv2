import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic2, Video, Presentation, Building2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const audiences = [
  {
    icon: Mic2,
    title: "Podcasters",
    description: "Host, record, and grow your show",
    benefits: [
      "Professional recording studio with AI editing",
      "RSS hosting and distribution to all platforms",
      "Guest booking and scheduling tools",
    ],
    cta: "Start Podcasting",
    gradient: "from-red-500 to-orange-500",
    bgGradient: "from-red-500/10 to-orange-500/10",
  },
  {
    icon: Video,
    title: "Creators & Influencers",
    description: "Grow and monetize your audience",
    benefits: [
      "Social analytics across all platforms",
      "Know your worth with creator valuation",
      "Professional media kit generation",
    ],
    cta: "Grow Your Brand",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/10 to-pink-500/10",
  },
  {
    icon: Presentation,
    title: "Speakers & Experts",
    description: "Book more gigs and build authority",
    benefits: [
      "Professional speaker profile page",
      "Easy booking and availability management",
      "Track speaking engagements and revenue",
    ],
    cta: "Build Your Profile",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    icon: Building2,
    title: "Brands & Agencies",
    description: "Find and book the perfect creators",
    benefits: [
      "Discovery tools to find verified creators",
      "Campaign management and tracking",
      "Direct booking and communication",
    ],
    cta: "Find Creators",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 to-teal-500/10",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export function AudienceCards() {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gradient-to-b from-background via-secondary/30 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Built for{" "}
            <span className="bg-gradient-to-r from-brand-gold to-brand-orange bg-clip-text text-transparent">
              Every Creator
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you are just starting out or already have millions of followers
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
        >
          {audiences.map((audience) => {
            const Icon = audience.icon;
            return (
              <motion.div key={audience.title} variants={itemVariants}>
                <Card className={`relative overflow-hidden p-8 h-full bg-gradient-to-br ${audience.bgGradient} border-2 border-border/50 hover:border-border transition-all duration-300 hover:shadow-2xl group`}>
                  <div className="relative z-10">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${audience.gradient} mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2">{audience.title}</h3>
                    <p className="text-muted-foreground text-lg mb-6">{audience.description}</p>
                    
                    <ul className="space-y-3 mb-8">
                      {audience.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${audience.gradient} text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                            ✓
                          </span>
                          <span className="text-foreground/80">{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => navigate("/auth?mode=signup")}
                      className={`w-full bg-gradient-to-r ${audience.gradient} hover:opacity-90 text-white font-bold py-6 h-auto group-hover:shadow-lg transition-all`}
                    >
                      {audience.cta}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
