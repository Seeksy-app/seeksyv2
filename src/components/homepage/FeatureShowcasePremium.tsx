import { motion } from "framer-motion";
import { Mic, Calendar, BarChart3, FileText, Shield, Play } from "lucide-react";

interface Feature {
  title: string;
  description: string;
  icon: React.ElementType;
  mockType: "studio" | "booking" | "analytics" | "mediakit" | "identity";
  gradient: string;
}

const features: Feature[] = [
  {
    title: "Professional Podcast Studio",
    description: "Record, edit, and publish studio-quality podcasts with AI-powered noise reduction and automatic transcription.",
    icon: Mic,
    mockType: "studio",
    gradient: "from-rose-500 to-brand-orange"
  },
  {
    title: "Smart Booking & Scheduling",
    description: "Let brands and collaborators book time with you. Integrated calendar, automatic reminders, and seamless payments.",
    icon: Calendar,
    mockType: "booking",
    gradient: "from-brand-gold to-amber-500"
  },
  {
    title: "Powerful Analytics Dashboard",
    description: "Track your growth across all platforms. Understand your audience, engagement rates, and monetization potential.",
    icon: BarChart3,
    mockType: "analytics",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    title: "Media Kit & Creator Valuation",
    description: "Generate professional media kits instantly. Know your worth with AI-powered creator valuation based on real data.",
    icon: FileText,
    mockType: "mediakit",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    title: "Identity & Rights Protection",
    description: "Blockchain-verified identity. Protect your voice, face, and content with on-chain certification and rights management.",
    icon: Shield,
    mockType: "identity",
    gradient: "from-emerald-500 to-teal-500"
  },
];

function MockUI({ type }: { type: Feature["mockType"] }) {
  const mockContent = {
    studio: (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-500 to-brand-orange flex items-center justify-center">
            <Mic className="h-8 w-8 text-white" />
          </div>
          <div>
            <div className="h-5 w-32 bg-white/20 rounded" />
            <div className="h-3 w-24 bg-white/10 rounded mt-2" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
        </div>
        <div className="h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-1 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i} 
              className="w-1 bg-brand-gold/60 rounded-full animate-pulse"
              style={{ 
                height: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-white/5 rounded-lg" />
          <div className="w-20 h-10 bg-gradient-to-r from-brand-gold to-brand-orange rounded-lg" />
        </div>
      </div>
    ),
    booking: (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-24 bg-white/20 rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-white/10 rounded" />
            <div className="h-8 w-8 bg-white/10 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div 
              key={i} 
              className={`aspect-square rounded-lg flex items-center justify-center text-xs ${
                i === 15 ? 'bg-brand-gold text-slate-900 font-bold' : 
                [8, 12, 22, 28].includes(i) ? 'bg-white/10 text-white/60' : 
                'bg-white/5 text-white/30'
              }`}
            >
              {((i % 31) + 1)}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <div className="flex-1 p-3 bg-brand-gold/20 rounded-lg border border-brand-gold/30">
            <div className="text-xs text-brand-gold">10:00 AM</div>
            <div className="text-sm text-white mt-1">Brand Meeting</div>
          </div>
          <div className="flex-1 p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/40">2:00 PM</div>
            <div className="text-sm text-white/60 mt-1">Podcast Recording</div>
          </div>
        </div>
      </div>
    ),
    analytics: (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Followers', value: '125.4K', change: '+12.3%' },
            { label: 'Reach', value: '1.2M', change: '+8.7%' },
            { label: 'Engagement', value: '4.8%', change: '+2.1%' },
          ].map((stat) => (
            <div key={stat.label} className="p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-xs text-white/40">{stat.label}</div>
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-xs text-emerald-400">{stat.change}</div>
            </div>
          ))}
        </div>
        <div className="h-32 bg-white/5 rounded-xl border border-white/10 p-4 flex items-end gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div 
              key={i} 
              className="flex-1 bg-gradient-to-t from-brand-gold to-brand-orange rounded-t"
              style={{ height: `${30 + Math.random() * 70}%` }}
            />
          ))}
        </div>
      </div>
    ),
    mediakit: (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          <div>
            <div className="h-5 w-28 bg-white/20 rounded" />
            <div className="h-3 w-20 bg-white/10 rounded mt-2" />
            <div className="flex gap-1 mt-2">
              <div className="px-2 py-0.5 bg-purple-500/20 rounded text-xs text-purple-300">Creator</div>
              <div className="px-2 py-0.5 bg-brand-gold/20 rounded text-xs text-brand-gold">Verified</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white/5 rounded-xl">
            <div className="text-xs text-white/40">Estimated Value</div>
            <div className="text-xl font-bold text-white">$2,500</div>
            <div className="text-xs text-white/40">per sponsored post</div>
          </div>
          <div className="p-3 bg-white/5 rounded-xl">
            <div className="text-xs text-white/40">Total Reach</div>
            <div className="text-xl font-bold text-white">450K</div>
            <div className="text-xs text-white/40">across platforms</div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-sm font-medium text-white">
            Download PDF
          </div>
        </div>
      </div>
    ),
    identity: (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <Shield className="h-10 w-10 text-emerald-400" />
          <div>
            <div className="text-white font-medium">Identity Verified</div>
            <div className="text-xs text-emerald-400">Voice & Face certified on-chain</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-sm text-white/60">Voice Fingerprint</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs text-emerald-400">Verified</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-sm text-white/60">Face Recognition</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs text-emerald-400">Verified</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="text-sm text-white/60">Rights Management</span>
            <span className="px-2 py-0.5 bg-brand-gold/20 rounded text-xs text-brand-gold">Active</span>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="rounded-xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 overflow-hidden">
      {/* Browser dots */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
      </div>
      {mockContent[type]}
    </div>
  );
}

export function FeatureShowcasePremium() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-3">
            Everything You Need
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Built for modern creators
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From recording to monetization, we've got every tool you need to succeed.
          </p>
        </motion.div>

        <div className="space-y-24">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isReversed = index % 2 === 1;
            
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12`}
              >
                {/* Content */}
                <div className="flex-1 max-w-xl">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <button className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group">
                    Learn more
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>

                {/* Mock UI */}
                <div className="flex-1 w-full max-w-lg">
                  <div className="relative">
                    {/* Glow effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-20 blur-3xl`} />
                    <MockUI type={feature.mockType} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
