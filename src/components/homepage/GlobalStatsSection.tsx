import { motion } from "framer-motion";
import { Users, Podcast, DollarSign, TrendingUp } from "lucide-react";

const globalStats = [
  { 
    value: "200M+", 
    label: "Active Creators Worldwide", 
    icon: Users,
    gradient: "from-brand-gold to-amber-500"
  },
  { 
    value: "5M+", 
    label: "Podcasts Published Globally", 
    icon: Podcast,
    gradient: "from-amber-500 to-brand-orange"
  },
  { 
    value: "$250B+", 
    label: "Creator Economy Value", 
    icon: DollarSign,
    gradient: "from-brand-orange to-rose-500"
  },
  { 
    value: "89%", 
    label: "Brands using creators in marketing", 
    icon: TrendingUp,
    gradient: "from-rose-500 to-purple-500"
  },
];

export function GlobalStatsSection() {
  return (
    <section className="relative py-24 bg-[#0A0F1A] overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[150px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-medium text-white/40 uppercase tracking-widest mb-3">
            The Creator Economy is Booming
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Join the fastest-growing industry
          </h2>
        </motion.div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {globalStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="relative group">
                  {/* Card */}
                  <div className="relative p-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 overflow-hidden transition-all duration-300 hover:bg-white/[0.06] hover:border-white/20 hover:shadow-lg hover:shadow-brand-gold/10">
                    {/* Glossy effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Icon */}
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${stat.gradient} mb-4 shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    
                    {/* Value */}
                    <div className="text-3xl md:text-4xl font-black text-white mb-1">
                      {stat.value}
                    </div>
                    
                    {/* Label */}
                    <div className="text-sm text-white/50 leading-tight">
                      {stat.label}
                    </div>
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
