/**
 * Seeksy Platform One-Pager
 * A comprehensive overview for investors, lawyers, and potential licensees
 */

import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SparkAvatar } from "@/components/spark/SparkAvatar";
import { 
  Download, 
  Layers, 
  User, 
  Grid3X3, 
  Palette,
  Mic,
  Video,
  Radio,
  Sparkles,
  Phone,
  Mail,
  Calendar,
  Users,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  BarChart3,
  PieChart,
  FileText,
  Building2,
  Globe,
  Briefcase,
  Truck,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  Puzzle,
  Target
} from "lucide-react";

const PlatformOnePager = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Helmet>
        <title>Seeksy Platform Overview | A Modular Identity & Interaction Platform</title>
        <meta name="description" content="Seeksy is a modular, app-driven platform that allows individuals, creators, and businesses to activate digital capabilities through a single identity layer." />
      </Helmet>

      {/* Print Button - Hidden in print */}
      <div className="fixed top-4 right-4 z-50 print:hidden">
        <Button onClick={handlePrint} variant="outline" className="gap-2 bg-background/80 backdrop-blur-sm">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 print:bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12 print:py-6 print:px-8">
          
          {/* Header */}
          <header className="text-center mb-12 print:mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <SparkAvatar size={48} pose="idle" />
              <h1 className="text-4xl font-bold tracking-tight print:text-3xl">
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent print:text-foreground">
                  Seeksy
                </span>
              </h1>
            </div>
            <p className="text-xl text-muted-foreground font-medium print:text-lg">
              A Modular Identity & Interaction Platform
            </p>
          </header>

          {/* What Seeksy Is */}
          <section className="mb-10 print:mb-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 print:text-xl">
              <Zap className="h-5 w-5 text-primary" />
              What Seeksy Is
            </h2>
            <Card className="border-primary/20 bg-primary/5 print:bg-transparent print:border-muted">
              <CardContent className="pt-6">
                <p className="text-foreground/90 leading-relaxed">
                  Seeksy is a <strong>modular, app-driven platform</strong> that allows individuals, creators, and businesses 
                  to activate digital capabilities through a single identity layer. Users enable apps as needed — 
                  communications, media, monetization, scheduling, commerce, and analytics — without rebuilding 
                  infrastructure or managing multiple tools.
                </p>
                <Separator className="my-4" />
                <p className="text-muted-foreground text-sm italic">
                  Seeksy is designed to be licensed, white-labeled, or acquired as IP, supporting a wide range of 
                  verticals including creator economy, media, events, commerce, logistics, and enterprise communications.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Platform Architecture */}
          <section className="mb-10 print:mb-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 print:text-xl">
              <Layers className="h-5 w-5 text-primary" />
              Platform Architecture
            </h2>
            <div className="grid md:grid-cols-3 gap-4 print:gap-3">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold">Core Identity Layer</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                      One profile, many use cases
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                      Persistent identity across apps
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                      Public-facing and private modules
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Grid3X3 className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">Modular App System</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                      Apps activated independently
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                      No lockout when apps inactive
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                      Usage-based credit monetization
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold">Composable UI</h3>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-purple-500 shrink-0" />
                      Collections, modules, pages
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-purple-500 shrink-0" />
                      Drag-and-drop configuration
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-purple-500 shrink-0" />
                      Shareable & embeddable
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* App Categories */}
          <section className="mb-10 print:mb-6 print:break-before-page">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 print:text-xl">
              <Puzzle className="h-5 w-5 text-primary" />
              Example App Categories
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 print:gap-3 print:grid-cols-3">
              
              {/* Creator & Media */}
              <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/5 border-orange-500/20">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-orange-500/20">
                      <Mic className="h-4 w-4 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-sm">Creator & Media</h3>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Shareable creator profiles</li>
                    <li>• Podcast hosting & RSS</li>
                    <li>• Video & live studio tools</li>
                    <li>• Ad insertion & sponsorship</li>
                    <li>• Voice cloning & AI avatars</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Communications */}
              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-blue-500/20">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-sm">Communications</h3>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• AI voice agents</li>
                    <li>• Call routing & lead qual</li>
                    <li>• Email, SMS, messaging hubs</li>
                    <li>• Scheduling & meetings</li>
                    <li>• CRM-style lead capture</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Commerce & Monetization */}
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-green-500/20">
                      <ShoppingCart className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-sm">Commerce & Monetization</h3>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Digital product sales</li>
                    <li>• Subscription & usage billing</li>
                    <li>• Affiliate & influencer tracking</li>
                    <li>• Ad inventory & analytics</li>
                    <li>• Payments & payout routing</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Data & Analytics */}
              <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-500/20">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-violet-500/20">
                      <BarChart3 className="h-4 w-4 text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-sm">Data & Analytics</h3>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Engagement tracking</li>
                    <li>• Sentiment analysis</li>
                    <li>• Conversion & funnel metrics</li>
                    <li>• Performance scoring</li>
                    <li>• Exportable reporting</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Enterprise & Vertical */}
              <Card className="bg-gradient-to-br from-slate-500/10 to-zinc-500/5 border-slate-500/20 md:col-span-2 lg:col-span-2 print:col-span-2">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-slate-500/20">
                      <Building2 className="h-4 w-4 text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-sm">Enterprise & Vertical Apps</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 text-xs text-muted-foreground">
                    <ul className="space-y-1">
                      <li>• White-label creator networks</li>
                      <li>• Event & conference platforms</li>
                      <li>• Talent marketplaces</li>
                    </ul>
                    <ul className="space-y-1">
                      <li>• Call-center augmentation</li>
                      <li>• Industry workflows (logistics, real estate, media)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Business Model & Value */}
          <section className="mb-10 print:mb-6">
            <div className="grid md:grid-cols-2 gap-6 print:gap-4">
              {/* Business Model */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 print:text-xl">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Business Model
                </h2>
                <Card>
                  <CardContent className="pt-5">
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-3">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">App-based activation</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Usage-based credit system</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Platform fees + revenue share</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Licensing / white-label / IP sale</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Why Valuable */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 print:text-xl">
                  <Shield className="h-5 w-5 text-primary" />
                  Why Seeksy Is Valuable IP
                </h2>
                <Card className="bg-primary/5 border-primary/20 print:bg-transparent">
                  <CardContent className="pt-5">
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Modular, extensible architecture</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Multiple vertical entry points</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Not tied to a single market or persona</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Designed for integration & acquisition</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">Strong AI-driven identity alignment</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="mb-10 print:mb-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 print:text-xl">
              <Target className="h-5 w-5 text-primary" />
              Use Cases for Buyers or Licensees
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 print:gap-2">
              {[
                { icon: Radio, label: "Media companies launching creator networks" },
                { icon: Users, label: "Agencies managing talent or influencers" },
                { icon: Building2, label: "Enterprises modernizing communications" },
                { icon: Globe, label: "Platforms seeking identity + monetization" },
                { icon: TrendingUp, label: "Investors assembling ecosystem strategies" },
              ].map((item, i) => (
                <Card key={i} className="text-center hover:border-primary/40 transition-colors">
                  <CardContent className="pt-4 pb-3">
                    <item.icon className="h-6 w-6 mx-auto mb-2 text-primary/70" />
                    <p className="text-xs text-muted-foreground leading-snug">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Summary */}
          <section className="mb-8">
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30 print:bg-muted/20">
              <CardContent className="pt-6 pb-6">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Summary
                </h2>
                <p className="text-foreground/90 leading-relaxed">
                  <strong>Seeksy is not a single product</strong> — it is an app ecosystem built around identity, 
                  interaction, and monetization. Its modular design allows it to scale across industries, adapt to 
                  new use cases, and be licensed or acquired as a standalone technology platform.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Footer */}
          <footer className="text-center text-xs text-muted-foreground pt-4 border-t print:mt-4">
            <p>© {new Date().getFullYear()} Seeksy. Confidential — For Investor & Licensing Discussions.</p>
          </footer>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:break-before-page {
            break-before: page;
          }
        }
      `}</style>
    </>
  );
};

export default PlatformOnePager;
