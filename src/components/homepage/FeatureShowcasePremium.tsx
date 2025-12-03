import { motion } from "framer-motion";
import { Mic, Calendar, BarChart3, FileText, Shield, Play, TrendingUp, Users, Sparkles } from "lucide-react";
import creatorStudioImg from "@/assets/homepage/creator-podcast-studio.jpg";
import analyticsDashboardImg from "@/assets/homepage/analytics-dashboard.jpg";
import influencerCreatingImg from "@/assets/homepage/influencer-creating.jpg";

interface Feature {
  title: string;
  description: string;
  icon: React.ElementType;
  mockType: "studio" | "booking" | "analytics" | "mediakit" | "identity";
  gradient: string;
  image?: string;
}

const features: Feature[] = [
  {
    title: "Professional Podcast Studio",
    description: "Record, edit, and publish studio-quality podcasts with AI-powered noise reduction and automatic transcription.",
    icon: Mic,
    mockType: "studio",
    gradient: "from-rose-500 to-brand-orange",
    image: creatorStudioImg
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
    gradient: "from-blue-500 to-cyan-500",
    image: analyticsDashboardImg
  },
  {
    title: "Media Kit & Creator Valuation",
    description: "Generate professional media kits instantly. Know your worth with AI-powered creator valuation based on real data.",
    icon: FileText,
    mockType: "mediakit",
    gradient: "from-purple-500 to-pink-500",
    image: influencerCreatingImg
  },
  {
    title: "Identity & Rights Protection",
    description: "Blockchain-verified identity. Protect your voice, face, and content with on-chain certification and rights management.",
    icon: Shield,
    mockType: "identity",
    gradient: "from-emerald-500 to-teal-500"
  },
];

function MockUI({ type, image }: { type: Feature["mockType"]; image?: string }) {
  const mockContent = {
    studio: (
      <div className="relative">
        {image && (
          <div className="absolute inset-0 opacity-20 rounded-xl overflow-hidden">
            <img src={image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-500 to-brand-orange flex items-center justify-center shadow-lg shadow-rose-500/30">
              <Mic className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="h-5 w-32 bg-white/20 rounded" />
              <div className="h-3 w-24 bg-white/10 rounded mt-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          </div>
          <div className="h-28 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-0.5 overflow-hidden backdrop-blur-sm">
            {Array.from({ length: 60 }).map((_, i) => (
              <div 
                key={i} 
                className="w-1 bg-gradient-to-t from-brand-gold to-brand-orange rounded-full animate-pulse"
                style={{ 
                  height: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.02}s`
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 flex items-center px-3">
              <span className="text-xs text-white/40">00:03:24</span>
            </div>
            <div className="w-28 h-10 bg-gradient-to-r from-brand-gold to-brand-orange rounded-lg flex items-center justify-center text-sm font-medium text-slate-900 shadow-lg shadow-brand-gold/30">
              <Sparkles className="w-4 h-4 mr-1" /> AI Edit
            </div>
          </div>
        </div>
      </div>
    ),
    booking: (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white font-semibold">December 2025</div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-white/10 rounded flex items-center justify-center text-white/60">‹</div>
            <div className="h-8 w-8 bg-white/10 rounded flex items-center justify-center text-white/60">›</div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs text-white/40 py-1">{day}</div>
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.1 }}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all ${
                i === 15 ? 'bg-brand-gold text-slate-900 font-bold shadow-lg shadow-brand-gold/30' : 
                [8, 12, 22, 28].includes(i) ? 'bg-white/10 text-white/80 hover:bg-white/20' : 
                'bg-white/5 text-white/30 hover:bg-white/10'
              }`}
            >
              {((i % 31) + 1)}
            </motion.div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex-1 p-3 bg-brand-gold/20 rounded-lg border border-brand-gold/30 cursor-pointer"
          >
            <div className="text-xs text-brand-gold font-medium">10:00 AM</div>
            <div className="text-sm text-white mt-1">Brand Meeting</div>
            <div className="flex items-center gap-1 mt-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
              <span className="text-xs text-white/60">Nike Partnership</span>
            </div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex-1 p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer"
          >
            <div className="text-xs text-white/40">2:00 PM</div>
            <div className="text-sm text-white/80 mt-1">Podcast Recording</div>
            <div className="flex items-center gap-1 mt-2">
              <Mic className="w-4 h-4 text-brand-orange" />
              <span className="text-xs text-white/60">Guest: @sarah</span>
            </div>
          </motion.div>
        </div>
      </div>
    ),
    analytics: (
      <div className="relative">
        {image && (
          <div className="absolute inset-0 opacity-30 rounded-xl overflow-hidden">
            <img src={image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative p-6 space-y-4 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Followers', value: '125.4K', change: '+12.3%', icon: Users },
              { label: 'Reach', value: '1.2M', change: '+8.7%', icon: TrendingUp },
              { label: 'Engagement', value: '4.8%', change: '+2.1%', icon: Sparkles },
            ].map((stat) => (
              <motion.div 
                key={stat.label} 
                whileHover={{ scale: 1.05 }}
                className="p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm cursor-pointer"
              >
                <stat.icon className="w-4 h-4 text-white/60 mb-1" />
                <div className="text-xs text-white/50">{stat.label}</div>
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-emerald-400 font-medium">{stat.change}</div>
              </motion.div>
            ))}
          </div>
          <div className="h-36 bg-white/10 rounded-xl border border-white/20 p-4 flex items-end gap-1 backdrop-blur-sm">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${30 + Math.random() * 70}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t cursor-pointer hover:from-blue-400 hover:to-cyan-300 transition-colors"
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>Jan</span>
            <span>Mar</span>
            <span>Jun</span>
            <span>Sep</span>
            <span>Dec</span>
          </div>
        </div>
      </div>
    ),
    mediakit: (
      <div className="relative">
        {image && (
          <div className="absolute inset-0 opacity-20 rounded-xl overflow-hidden">
            <img src={image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 ring-4 ring-white/10" />
            <div>
              <div className="text-white font-semibold">@CreatorName</div>
              <div className="text-sm text-white/60">Content Creator</div>
              <div className="flex gap-1 mt-2">
                <span className="px-2 py-0.5 bg-purple-500/20 rounded text-xs text-purple-300">Creator</span>
                <span className="px-2 py-0.5 bg-brand-gold/20 rounded text-xs text-brand-gold flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Verified
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-3 bg-white/10 rounded-xl border border-white/20 cursor-pointer"
            >
              <div className="text-xs text-white/40">Estimated Value</div>
              <div className="text-2xl font-bold text-white">$2,500</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> per sponsored post
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-3 bg-white/10 rounded-xl border border-white/20 cursor-pointer"
            >
              <div className="text-xs text-white/40">Total Reach</div>
              <div className="text-2xl font-bold text-white">450K</div>
              <div className="text-xs text-white/40">across platforms</div>
            </motion.div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-sm font-medium text-white shadow-lg shadow-purple-500/30"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Media Kit
          </motion.button>
        </div>
      </div>
    ),
    identity: (
      <div className="p-6 space-y-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center gap-4 p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/30 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/30 flex items-center justify-center">
            <Shield className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-white font-semibold">Identity Verified</div>
            <div className="text-xs text-emerald-400">Voice & Face certified on-chain</div>
          </div>
          <div className="ml-auto">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
          </div>
        </motion.div>
        <div className="space-y-2">
          {[
            { label: 'Voice Fingerprint', status: 'Verified', color: 'emerald' },
            { label: 'Face Recognition', status: 'Verified', color: 'emerald' },
            { label: 'Rights Management', status: 'Active', color: 'brand-gold' },
          ].map((item) => (
            <motion.div 
              key={item.label}
              whileHover={{ scale: 1.01, x: 4 }}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer"
            >
              <span className="text-sm text-white/70">{item.label}</span>
              <span className={`px-3 py-1 bg-${item.color}-500/20 rounded-full text-xs text-${item.color === 'brand-gold' ? 'brand-gold' : 'emerald-400'} font-medium`}>
                {item.status}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
          <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center">
            <span className="text-xs text-blue-400">◆</span>
          </div>
          <span className="text-xs text-white/50">Secured on Polygon Network</span>
        </div>
      </div>
    ),
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 overflow-hidden shadow-2xl">
      {/* Browser dots */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <div className="ml-4 flex-1 h-6 bg-white/5 rounded-full max-w-xs" />
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
            Built for modern creators & influencers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From recording to monetization, we've got every tool you need to succeed.
          </p>
        </motion.div>

        <div className="space-y-32">
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
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16`}
              >
                {/* Content */}
                <div className="flex-1 max-w-xl">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6 shadow-lg`}
                    style={{ boxShadow: `0 20px 40px -15px ${feature.gradient.includes('rose') ? 'rgba(244, 63, 94, 0.4)' : feature.gradient.includes('gold') ? 'rgba(245, 158, 11, 0.4)' : feature.gradient.includes('blue') ? 'rgba(59, 130, 246, 0.4)' : feature.gradient.includes('purple') ? 'rgba(168, 85, 247, 0.4)' : 'rgba(16, 185, 129, 0.4)'}` }}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </motion.div>
                  <h3 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    {feature.description}
                  </p>
                  <motion.button 
                    whileHover={{ x: 5 }}
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors group text-lg"
                  >
                    Learn more
                    <span className="group-hover:translate-x-1 transition-transform text-xl">→</span>
                  </motion.button>
                </div>

                {/* Mock UI with optional image */}
                <div className="flex-1 w-full max-w-xl">
                  <div className="relative">
                    {/* Glow effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-20 blur-3xl scale-110`} />
                    
                    {/* Human image overlay */}
                    {feature.image && (
                      <motion.div 
                        initial={{ opacity: 0, x: isReversed ? -20 : 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className={`absolute ${isReversed ? '-left-8' : '-right-8'} -top-8 w-32 h-32 rounded-2xl overflow-hidden shadow-2xl border-4 border-background z-10`}
                      >
                        <img src={feature.image} alt="" className="w-full h-full object-cover" />
                      </motion.div>
                    )}
                    
                    <MockUI type={feature.mockType} image={feature.image} />
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
