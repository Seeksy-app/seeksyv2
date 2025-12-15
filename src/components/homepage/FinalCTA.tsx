import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-xl mx-auto bg-gradient-to-br from-amber-900/30 to-orange-900/30 rounded-3xl p-8 border border-amber-700/50">
        <h2 className="text-2xl font-bold mb-4 text-white">Ready to Get Started?</h2>
        <p className="text-slate-400 mb-6">
          Sign up free and unlock the full power of Seeksy's creator toolkit.
        </p>
        <Button
          onClick={() => navigate("/auth?mode=signup")}
          size="lg"
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:opacity-90"
        >
          Start Free Today
        </Button>
      </div>
    </section>
  );
}
