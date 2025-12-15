import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="w-full px-4 py-16 md:py-24">
      <div className="mx-auto max-w-[1280px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[28px] p-10 md:p-16 lg:p-20 text-center"
          style={{
            background: "linear-gradient(135deg, #0B0F1A, #1A1F2E)",
          }}
        >
          <h2 
            className="font-extrabold tracking-[-0.5px] mb-4 text-white"
            style={{ 
              fontSize: "clamp(28px, 4vw, 48px)",
            }}
          >
            Ready to transform your
            <br />
            creator journey?
          </h2>
          
          <p 
            className="text-lg mb-10 max-w-xl mx-auto"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Start free, pick your tools, and build a workspace that grows with you.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full px-10 h-14 text-base font-semibold bg-white text-black hover:bg-white/90"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-10 h-14 text-base font-semibold border-white/30 text-white hover:bg-white/10"
              onClick={() => navigate("/schedule-demo")}
            >
              <Play className="mr-2 h-4 w-4" />
              Book a Demo
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
