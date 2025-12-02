import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="h-4 w-4 text-brand-gold" />
            <span className="text-sm text-white/80 font-medium">Start Free Today</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white">
            Ready to Grow Your{" "}
            <span className="bg-gradient-to-r from-brand-gold to-brand-orange bg-clip-text text-transparent">
              Creator Brand
            </span>
            ?
          </h2>

          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Join thousands of creators who use Seeksy to host, grow, collaborate, and monetize their content.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth?mode=signup")}
              className="bg-gradient-to-r from-brand-gold to-brand-orange hover:opacity-90 text-slate-900 text-lg px-10 py-7 h-auto font-bold shadow-lg shadow-brand-gold/25 hover:shadow-xl hover:shadow-brand-gold/30 transition-all hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/pricing")}
              className="bg-white/5 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white hover:text-slate-900 text-lg px-10 py-7 h-auto font-bold transition-all"
            >
              View Pricing
            </Button>
          </div>

          <p className="mt-8 text-white/50 text-sm">
            No credit card required • Free forever plan available
          </p>
        </motion.div>
      </div>
    </section>
  );
}
