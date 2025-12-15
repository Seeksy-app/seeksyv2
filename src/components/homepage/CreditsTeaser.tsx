import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";

const points = [
  "No subscriptions required",
  "No lockouts when credits run out",
  "Graceful limits per tool, upgrade anytime",
  "Transparent usage and estimates before actions",
];

export function CreditsTeaser() {
  const navigate = useNavigate();

  return (
    <section className="w-full px-4 py-16 md:py-24">
      <div className="mx-auto max-w-[1280px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[28px] p-10 md:p-14 lg:p-16"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)/0.08), hsl(var(--secondary)/0.5))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Icon + Text */}
            <div>
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: "hsl(var(--primary)/0.15)" }}
              >
                <Coins className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
              </div>
              
              <h2 
                className="font-extrabold tracking-[-0.5px] mb-4"
                style={{ 
                  fontSize: "clamp(28px, 4vw, 40px)",
                  color: "hsl(var(--foreground))",
                }}
              >
                Pay with credits.
                <br />
                Keep your work forever.
              </h2>
              
              <p 
                className="text-lg mb-8"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                A flexible model designed for creators who want control over their tools and spending.
              </p>

              <Button
                size="lg"
                className="rounded-full px-8 h-12 text-base font-semibold"
                onClick={() => navigate("/pricing")}
              >
                See Credits & Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Right: Points */}
            <div className="space-y-5">
              {points.map((point, index) => (
                <motion.div
                  key={point}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="flex items-start gap-4"
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "hsl(var(--primary))" }}
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p 
                    className="text-lg"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    {point}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
