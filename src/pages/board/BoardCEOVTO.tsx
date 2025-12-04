import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Target, 
  Users, 
  DollarSign, 
  Rocket, 
  CheckCircle2,
  Clock,
  TrendingUp,
  Building2,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

export default function BoardCEOVTO() {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Helper function to add text with wrapping
      const addWrappedText = (text: string, x: number, yPos: number, maxWidth: number, fontSize: number = 11) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, yPos);
        return yPos + (lines.length * fontSize * 0.4);
      };

      // Page 1 Header
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text("CONFIDENTIAL — Seeksy Board Material", margin, y);
      doc.text(new Date().toLocaleDateString(), pageWidth - margin - 30, y);
      y += 15;

      // Title
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text("CEO Vision/Traction Organizer", margin, y);
      y += 10;

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("Seeksy — Q1 2025", margin, y);
      y += 20;

      // Section 1: Core Values
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("1. Core Values", margin, y);
      y += 8;
      
      const coreValues = [
        "Creator First — Every decision prioritizes creator success",
        "Authenticity — Real voices, verified identity, trusted content",
        "Simplicity — Complex problems, simple solutions",
        "Innovation — AI-powered tools that feel magical",
        "Community — Building connections, not just audiences"
      ];
      
      doc.setFontSize(10);
      coreValues.forEach(value => {
        doc.text(`• ${value}`, margin + 5, y);
        y += 6;
      });
      y += 10;

      // Section 2: 10-Year Target
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("2. 10-Year Target", margin, y);
      y += 8;
      
      doc.setFontSize(10);
      y = addWrappedText("Become the #1 platform for authenticated creator content, serving 10M+ verified creators with $1B+ in annual creator payouts.", margin + 5, y, pageWidth - margin * 2 - 10);
      y += 15;

      // Section 3: 3-Year Picture
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("3. 3-Year Picture (2027)", margin, y);
      y += 8;
      
      const threeYearGoals = [
        "500K+ active verified creators",
        "$50M ARR from platform fees + advertising",
        "Market leader in voice/identity certification",
        "Integrated studio, monetization, and distribution",
        "Expansion into enterprise content authentication"
      ];
      
      doc.setFontSize(10);
      threeYearGoals.forEach(goal => {
        doc.text(`• ${goal}`, margin + 5, y);
        y += 6;
      });
      y += 10;

      // Section 4: 1-Year Plan
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("4. 1-Year Plan (2025)", margin, y);
      y += 8;
      
      const oneYearGoals = [
        "Launch Voice NFT certification at scale",
        "Reach 50K active creators",
        "Hit $5M ARR milestone",
        "Complete Series A funding",
        "Launch AI Studio 2.0 with multi-modal editing"
      ];
      
      doc.setFontSize(10);
      oneYearGoals.forEach(goal => {
        doc.text(`• ${goal}`, margin + 5, y);
        y += 6;
      });

      // Page 2
      doc.addPage();
      y = 20;

      // Page 2 Header
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text("CONFIDENTIAL — Seeksy Board Material", margin, y);
      doc.text("Page 2", pageWidth - margin - 15, y);
      y += 20;

      // Section 5: Quarterly Rocks
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("5. Q1 2025 Rocks (90-Day Priorities)", margin, y);
      y += 10;
      
      const rocks = [
        { owner: "CEO", rock: "Close Series A term sheet", status: "On Track" },
        { owner: "CTO", rock: "Ship Voice Certification v2.0", status: "On Track" },
        { owner: "VP Product", rock: "Launch AI Clips to 10K users", status: "At Risk" },
        { owner: "VP Marketing", rock: "Achieve 25K creator signups", status: "On Track" },
        { owner: "VP Sales", rock: "Sign 5 enterprise pilot contracts", status: "On Track" }
      ];
      
      doc.setFontSize(10);
      rocks.forEach(rock => {
        doc.text(`${rock.owner}: ${rock.rock} — [${rock.status}]`, margin + 5, y);
        y += 7;
      });
      y += 10;

      // Section 6: Issues List
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("6. Issues List", margin, y);
      y += 8;
      
      const issues = [
        "Scaling infrastructure for voice processing demand",
        "Competitive pressure from Riverside on studio features",
        "Creator acquisition cost trending above target"
      ];
      
      doc.setFontSize(10);
      issues.forEach((issue, i) => {
        doc.text(`${i + 1}. ${issue}`, margin + 5, y);
        y += 6;
      });
      y += 10;

      // Section 7: Marketing Strategy
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("7. Marketing Strategy", margin, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.text("Target Market: Podcasters, content creators, and brands seeking", margin + 5, y);
      y += 5;
      doc.text("authenticated content solutions.", margin + 5, y);
      y += 8;
      doc.text("Unique Guarantee: \"Your voice, verified. Your content, protected.\"", margin + 5, y);
      y += 8;
      doc.text("Proven Process: Verify → Create → Certify → Monetize", margin + 5, y);
      y += 15;

      // Section 8: Scorecard Metrics
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("8. Weekly Scorecard Metrics", margin, y);
      y += 8;
      
      const metrics = [
        "New Creator Signups: Target 1,200/week",
        "Voice Certifications: Target 400/week",
        "Studio Sessions: Target 8,000/week",
        "MRR: Target $420K",
        "NPS Score: Target 65+"
      ];
      
      doc.setFontSize(10);
      metrics.forEach(metric => {
        doc.text(`• ${metric}`, margin + 5, y);
        y += 6;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text("Generated: " + new Date().toLocaleString(), margin, doc.internal.pageSize.getHeight() - 10);

      doc.save("Seeksy-CEO-VTO.pdf");
      toast({ title: "PDF Downloaded", description: "CEO VTO document saved successfully" });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="max-w-4xl mx-auto py-8 px-6 space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CEO Vision/Traction Organizer</h1>
          <p className="text-muted-foreground mt-1">Seeksy — Q1 2025 Executive Summary</p>
        </div>
        <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
          <Download className="w-4 h-4 mr-2" />
          {isGeneratingPDF ? "Generating..." : "Download PDF"}
        </Button>
      </div>

      {/* Page 1 Content */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Page 1: Vision & Long-Term Goals</CardTitle>
            <Badge variant="outline" className="text-xs">EOS Framework</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section 1: Core Values */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">1</span>
              </div>
              <h3 className="font-semibold text-foreground">Core Values</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-9">
              {[
                { icon: Users, text: "Creator First — Every decision prioritizes creator success" },
                { icon: CheckCircle2, text: "Authenticity — Real voices, verified identity, trusted content" },
                { icon: Zap, text: "Simplicity — Complex problems, simple solutions" },
                { icon: Rocket, text: "Innovation — AI-powered tools that feel magical" },
                { icon: Building2, text: "Community — Building connections, not just audiences" }
              ].map((value, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <value.icon className="w-4 h-4 mt-0.5 text-primary/70" />
                  <span>{value.text}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Section 2: 10-Year Target */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">2</span>
              </div>
              <h3 className="font-semibold text-foreground">10-Year Target (BHAG)</h3>
            </div>
            <div className="pl-9 p-4 bg-muted/50 rounded-lg">
              <p className="text-foreground font-medium">
                Become the #1 platform for authenticated creator content, serving <b>10M+ verified creators</b> with <b>$1B+ in annual creator payouts</b>.
              </p>
            </div>
          </div>

          <Separator />

          {/* Section 3: 3-Year Picture */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">3</span>
              </div>
              <h3 className="font-semibold text-foreground">3-Year Picture (2027)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
              {[
                { metric: "500K+", label: "Active verified creators" },
                { metric: "$50M", label: "ARR from platform + ads" },
                { metric: "#1", label: "Voice/identity certification" },
                { metric: "Full Stack", label: "Studio + monetization + distribution" },
                { metric: "Enterprise", label: "Content authentication expansion" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-xl font-bold text-primary">{item.metric}</span>
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Section 4: 1-Year Plan */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">4</span>
              </div>
              <h3 className="font-semibold text-foreground">1-Year Plan (2025)</h3>
            </div>
            <div className="space-y-2 pl-9">
              {[
                "Launch Voice NFT certification at scale",
                "Reach 50K active creators",
                "Hit $5M ARR milestone",
                "Complete Series A funding",
                "Launch AI Studio 2.0 with multi-modal editing"
              ].map((goal, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{goal}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Page Break */}
      <div className="flex items-center gap-4 py-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground font-medium px-3 py-1 bg-muted rounded-full">Page Break</span>
        <Separator className="flex-1" />
      </div>

      {/* Page 2 Content */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Page 2: Quarterly Execution</CardTitle>
            <Badge variant="outline" className="text-xs">Q1 2025</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section 5: Quarterly Rocks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">5</span>
              </div>
              <h3 className="font-semibold text-foreground">Q1 2025 Rocks (90-Day Priorities)</h3>
            </div>
            <div className="space-y-2 pl-9">
              {[
                { owner: "CEO", rock: "Close Series A term sheet", status: "on-track" },
                { owner: "CTO", rock: "Ship Voice Certification v2.0", status: "on-track" },
                { owner: "VP Product", rock: "Launch AI Clips to 10K users", status: "at-risk" },
                { owner: "VP Marketing", rock: "Achieve 25K creator signups", status: "on-track" },
                { owner: "VP Sales", rock: "Sign 5 enterprise pilot contracts", status: "on-track" }
              ].map((rock, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">{rock.owner}</Badge>
                    <span className="text-sm text-foreground">{rock.rock}</span>
                  </div>
                  <Badge 
                    variant={rock.status === "on-track" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {rock.status === "on-track" ? "On Track" : "At Risk"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Section 6: Issues List */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-destructive font-bold text-sm">6</span>
              </div>
              <h3 className="font-semibold text-foreground">Issues List</h3>
            </div>
            <div className="space-y-2 pl-9">
              {[
                "Scaling infrastructure for voice processing demand",
                "Competitive pressure from Riverside on studio features",
                "Creator acquisition cost trending above target"
              ].map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2 border-l-2 border-destructive/50 bg-destructive/5 rounded-r-lg">
                  <span className="font-medium text-destructive">{i + 1}.</span>
                  <span className="text-muted-foreground">{issue}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Section 7: Marketing Strategy */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">7</span>
              </div>
              <h3 className="font-semibold text-foreground">Marketing Strategy</h3>
            </div>
            <div className="pl-9 space-y-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Target Market</p>
                <p className="text-sm text-foreground">Podcasters, content creators, and brands seeking authenticated content solutions.</p>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-primary uppercase tracking-wide mb-1">Unique Guarantee</p>
                <p className="text-sm text-foreground font-medium">"Your voice, verified. Your content, protected."</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Proven Process</p>
                <div className="flex items-center gap-2 mt-2">
                  {["Verify", "Create", "Certify", "Monetize"].map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{step}</span>
                      {i < 3 && <span className="text-muted-foreground">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 8: Scorecard */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">8</span>
              </div>
              <h3 className="font-semibold text-foreground">Weekly Scorecard Metrics</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-9">
              {[
                { metric: "1,200", label: "New Signups/week", icon: Users },
                { metric: "400", label: "Certifications/week", icon: CheckCircle2 },
                { metric: "8,000", label: "Studio Sessions/week", icon: Clock },
                { metric: "$420K", label: "Target MRR", icon: DollarSign },
                { metric: "65+", label: "NPS Score", icon: TrendingUp }
              ].map((item, i) => (
                <div key={i} className="p-3 bg-muted/30 rounded-lg text-center">
                  <item.icon className="w-5 h-5 mx-auto mb-1 text-primary/70" />
                  <p className="text-lg font-bold text-foreground">{item.metric}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-xs text-center text-muted-foreground">
        Confidential — Seeksy Board Material • Generated {new Date().toLocaleDateString()}
      </p>
    </motion.div>
  );
}
