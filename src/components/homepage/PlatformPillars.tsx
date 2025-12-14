import { motion } from "framer-motion";
import { Video, Users, DollarSign, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const pillars = [
  {
    id: "create",
    badge: "Create",
    title: "AI-powered content tools for every creator.",
    description:
      "Record podcasts, generate clips, edit videos, and create content with AI assistance. Our studio handles transcription, captions, and distribution automatically.",
    icon: Video,
    link: "/apps",
    linkText: "Explore Creator Tools",
    gradient: "from-blue-500/10 to-cyan-500/10",
    borderColor: "border-blue-500/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
  },
  {
    id: "connect",
    badge: "Connect",
    title: "Build real relationships with your audience.",
    description:
      "Manage contacts, send emails and SMS, schedule meetings, and host events. Everything you need to grow and engage your community in one place.",
    icon: Users,
    link: "/apps",
    linkText: "See Engagement Tools",
    gradient: "from-emerald-500/10 to-teal-500/10",
    borderColor: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
  {
    id: "monetize",
    badge: "Monetize",
    title: "Turn your influence into income.",
    description:
      "Accept payments, sell tickets, manage sponsorships, and track revenue. Verified voice identity unlocks premium ad opportunities with brands.",
    icon: DollarSign,
    link: "/apps",
    linkText: "Learn About Monetization",
    gradient: "from-amber-500/10 to-orange-500/10",
    borderColor: "border-amber-500/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
];

export function PlatformPillars() {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Grow, connect, and earn on one
            <br />
            <span className="text-primary">trusted platform.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build your creator business, without the complexity.
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl border ${pillar.borderColor} bg-gradient-to-br ${pillar.gradient} p-6 md:p-8 flex flex-col h-full`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${pillar.iconBg} flex items-center justify-center mb-6`}>
                  <Icon className={`h-6 w-6 ${pillar.iconColor}`} />
                </div>

                {/* Badge */}
                <span className="text-xs font-semibold text-primary mb-3 tracking-wide uppercase">
                  {pillar.badge}
                </span>

                {/* Title */}
                <h3 className="text-xl font-bold text-foreground mb-3 leading-snug">
                  {pillar.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">
                  {pillar.description}
                </p>

                {/* Link */}
                <Link
                  to={pillar.link}
                  className="inline-flex items-center text-sm font-semibold text-primary hover:underline group"
                >
                  {pillar.linkText}
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
