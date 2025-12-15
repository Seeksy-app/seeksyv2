import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Mail, Check, ArrowRight, Coins } from "lucide-react";
import { useState } from "react";
import { useNewsletterSubscribe } from "@/hooks/useNewsletterSubscribe";

export function FinalCTA() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const { subscribe, isLoading } = useNewsletterSubscribe();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      await subscribe({ email, source: "homepage-footer" });
      setEmail("");
    }
  };

  const creditFeatures = [
    "No subscriptions required",
    "No lockouts when credits run out",
    "Graceful limits per tool",
    "Transparent usage estimates",
  ];

  return (
    <section className="bg-slate-950">
      {/* CTA Card */}
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-xl mx-auto bg-gradient-to-br from-amber-900/60 to-amber-950/80 rounded-3xl p-10 border border-amber-800/30">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Ready to Get Started?</h2>
          <p className="text-slate-300 mb-6">
            Sign up free and unlock the full power of Seeksy's creator toolkit.
          </p>
          <Button
            onClick={() => navigate("/auth?mode=signup")}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:opacity-90 px-8"
          >
            Start Free Today
          </Button>
        </div>
      </div>

      {/* Newsletter + Credits Section */}
      <div className="bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Newsletter */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Stay in the loop</h3>
              <p className="text-slate-400">
                Get the latest updates, tips, and exclusive content delivered to your inbox.
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Subscribe
                </Button>
              </form>
            </div>

            {/* Credits Card */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Pay with credits</h4>
                  <p className="text-sm text-slate-400">Keep your work forever</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 mb-4">
                {creditFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/pricing")}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium inline-flex items-center gap-1 mt-2"
              >
                See Pricing
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
