import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Mic, 
  Calendar, 
  FileText, 
  Sparkles, 
  Shield,
  ArrowRight,
  Play,
  Check
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    id: "analytics",
    icon: BarChart3,
    title: "Social Analytics",
    headline: "Understand Your Audience Like Never Before",
    description: "Connect Instagram, YouTube, Facebook and more. Track followers, engagement, and growth across all platforms in one unified dashboard.",
    benefits: [
      "Real-time follower and engagement tracking",
      "Cross-platform performance comparison",
      "Audience demographics and insights",
      "Growth trends and recommendations",
    ],
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-500/5 to-pink-500/5",
    reverse: false,
  },
  {
    id: "studio",
    icon: Mic,
    title: "Recording Studio",
    headline: "Professional Studio in Your Browser",
    description: "Record high-quality audio and video directly in your browser. AI-powered tools remove filler words, clean audio, and generate clips automatically.",
    benefits: [
      "Browser-based HD recording",
      "AI filler word removal",
      "Automatic transcription",
      "One-click clip generation",
    ],
    gradient: "from-red-500 to-orange-500",
    bgGradient: "from-red-500/5 to-orange-500/5",
    reverse: true,
  },
  {
    id: "booking",
    icon: Calendar,
    title: "Booking & Scheduling",
    headline: "Never Miss a Guest or Opportunity",
    description: "Let guests and collaborators book time with you effortlessly. Manage your availability, send reminders, and keep everything organized.",
    benefits: [
      "Customizable booking pages",
      "Calendar integrations",
      "Automatic reminders",
      "Guest management tools",
    ],
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/5 to-cyan-500/5",
    reverse: false,
  },
  {
    id: "mediakit",
    icon: FileText,
    title: "Media Kit",
    headline: "Know Your Worth. Show Your Value.",
    description: "Generate a professional media kit with your real stats, audience demographics, and suggested rates. Perfect for brand partnerships.",
    benefits: [
      "Auto-generated from your stats",
      "Creator valuation calculator",
      "Shareable PDF export",
      "Brand-ready presentation",
    ],
    gradient: "from-amber-500 to-yellow-500",
    bgGradient: "from-amber-500/5 to-yellow-500/5",
    reverse: true,
  },
  {
    id: "ai",
    icon: Sparkles,
    title: "AI Tools",
    headline: "Let AI Handle the Boring Stuff",
    description: "From auto-transcription to content suggestions, our AI tools save you hours every week. Focus on creating, not editing.",
    benefits: [
      "Auto transcription and captions",
      "AI-generated show notes",
      "Content optimization tips",
      "Smart clip suggestions",
    ],
    gradient: "from-brand-gold to-brand-orange",
    bgGradient: "from-brand-gold/5 to-brand-orange/5",
    reverse: false,
  },
  {
    id: "identity",
    icon: Shield,
    title: "Identity Verification",
    headline: "Protect Your Voice. Verify Your Identity.",
    description: "Blockchain-backed face and voice verification gives you a certified creator badge. Protect against deepfakes and build trust with your audience.",
    benefits: [
      "Voice fingerprint certification",
      "Face verification badge",
      "On-chain proof of identity",
      "Deepfake protection",
    ],
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/5 to-teal-500/5",
    reverse: true,
  },
];

export function FeatureSections() {
  const navigate = useNavigate();

  return (
    <section className="py-16">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div
            key={feature.id}
            className={`py-20 bg-gradient-to-br ${feature.bgGradient}`}
          >
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col ${feature.reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 max-w-6xl mx-auto`}
              >
                {/* Content Side */}
                <div className="flex-1 text-center lg:text-left">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${feature.gradient} text-white text-sm font-semibold mb-6`}>
                    <Icon className="h-4 w-4" />
                    {feature.title}
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-black mb-4">
                    {feature.headline}
                  </h3>
                  
                  <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-3 mb-8 max-w-md mx-auto lg:mx-0">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r ${feature.gradient} text-white`}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => navigate("/auth?mode=signup")}
                    className={`bg-gradient-to-r ${feature.gradient} hover:opacity-90 text-white font-bold px-8 py-6 h-auto`}
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {/* Visual Side */}
                <div className="flex-1">
                  <div className={`relative p-1 rounded-2xl bg-gradient-to-br ${feature.gradient}`}>
                    <div className="bg-background rounded-xl p-8 min-h-[300px] flex items-center justify-center">
                      <div className="text-center">
                        <div className={`inline-flex p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-xl`}>
                          <Icon className="h-16 w-16 text-white" />
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Screenshot / Demo Preview Coming Soon
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
