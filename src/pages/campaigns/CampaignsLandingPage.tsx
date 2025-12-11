import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Mic2, 
  Globe, 
  DollarSign, 
  Calendar,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ChevronLeft
} from "lucide-react";

const problems = [
  "No money for big consultants or full-time staff.",
  "Confusing rules, deadlines, and paperwork.",
  "Hard to stay consistent with messaging and content.",
  "Very little time to plan, write, and execute."
];

const features = [
  {
    icon: MessageSquare,
    title: "AI Campaign Manager",
    description: "Plans your race and daily priorities with personalized strategy."
  },
  {
    icon: Mic2,
    title: "AI Speechwriter",
    description: "Drafts speeches, emails, and social posts in your voice."
  },
  {
    icon: Globe,
    title: "AI Digital Director",
    description: "Builds your website and online presence automatically."
  },
  {
    icon: DollarSign,
    title: "AI Field & Fundraising",
    description: "Manages events, outreach, and donor communications."
  }
];

export default function CampaignsLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#1e3a5f] to-[#0a1628]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a1628]/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-sm">Back to Seeksy</span>
            </Link>
            <Link to="/campaigns" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#b8962e] flex items-center justify-center">
                <span className="text-[#0a1628] font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-white">
                Campaign<span className="text-[#d4af37]">Staff</span>.ai
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="text-white/80 hover:text-white hover:bg-white/10">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button asChild className="bg-[#d4af37] hover:bg-[#b8962e] text-[#0a1628] font-medium">
                <Link to="/campaigns/dashboard">Start Your Campaign</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-sm font-medium mb-6">
            <Users className="h-4 w-4" />
            Powered by Seeksy
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Campaign<span className="text-[#d4af37]">Staff</span>.ai
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
            Your AI-powered campaign team for local, state, and federal races.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              asChild
              className="bg-[#d4af37] hover:bg-[#b8962e] text-[#0a1628] font-semibold text-lg px-8"
            >
              <Link to="/campaigns/dashboard">
                Start Your Campaign
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              asChild
              className="border-white/30 text-white hover:bg-white/10"
            >
              <Link to="/campaigns/ai-manager">See How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-16 bg-[#0a1628]/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              Campaigns are hard. Most candidates are on their own.
            </h2>
            <div className="grid gap-4">
              {problems.map((problem, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-400 font-bold">{index + 1}</span>
                  </div>
                  <p className="text-white/90 text-left">{problem}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              An AI campaign team in your pocket.
            </h2>
            <p className="text-lg text-white/70">
              Everything you need to run a winning campaign, powered by AI.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-[#d4af37]/20 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-[#d4af37]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#d4af37]/20 to-[#b8962e]/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Launch your campaign in minutes, not months.
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            Join thousands of candidates who are winning their races with AI-powered campaign tools.
          </p>
          <Button 
            size="lg" 
            asChild
            className="bg-[#d4af37] hover:bg-[#b8962e] text-[#0a1628] font-semibold text-lg px-8"
          >
            <Link to="/campaigns/dashboard">
              Create Free Campaign Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-4 text-center text-white/50 text-sm">
          <p>© {new Date().getFullYear()} CampaignStaff.ai — A Seeksy Product</p>
        </div>
      </footer>
    </div>
  );
}