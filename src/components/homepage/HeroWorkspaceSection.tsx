import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HeroWorkspaceBuilder } from "./HeroWorkspaceBuilder";

export function HeroWorkspaceSection() {
  const navigate = useNavigate();

  return (
    <section 
      className="w-full px-4 pt-28 pb-16 md:pt-36 md:pb-24"
      style={{ 
        minHeight: "85vh",
        background: "linear-gradient(180deg, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 100%)",
      }}
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left - Copy */}
          <div className="text-left lg:max-w-none">
            <p 
              className="text-sm font-semibold uppercase tracking-widest mb-6"
              style={{ color: "hsl(var(--primary))" }}
            >
              More than just content creation
            </p>
            <h1
              className="font-black tracking-[-2px] mb-6"
              style={{ 
                fontSize: "clamp(40px, 6vw, 64px)",
                lineHeight: 1.05,
                color: "hsl(var(--foreground))",
              }}
            >
              Build your
              <br />
              creator
              <br />
              <span style={{ color: "hsl(var(--primary))" }}>workspace.</span>
            </h1>
            <p 
              className="text-lg md:text-xl mb-8 max-w-md"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Turn tools on as you need them. Pay only for what you use with credits. No lockouts—your work stays yours.
            </p>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Button
                size="lg"
                className="rounded-full px-8 h-12 text-base font-semibold"
                onClick={() => navigate("/auth")}
              >
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="rounded-full px-6 h-12 text-base font-medium"
                onClick={() => navigate("/auth")}
              >
                <Play className="mr-2 h-4 w-4" />
                Schedule a Demo
              </Button>
            </div>
            <p 
              className="text-sm"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Start free with 100 credits • No credit card required
            </p>
          </div>

          {/* Right - Workspace Builder */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[520px]">
              <HeroWorkspaceBuilder />
              {/* AI-powered workspace badge */}
              <div className="flex justify-center mt-4">
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                  style={{ 
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                >
                  <span className="text-base">✨</span>
                  AI-powered workspace
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
