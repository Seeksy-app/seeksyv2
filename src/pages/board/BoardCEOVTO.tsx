import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Download, 
  ChevronDown,
  Target,
  DollarSign,
  Users,
  AlertTriangle,
  Calendar,
  Rocket,
  Building2,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

export default function BoardCEOVTO() {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [page1Open, setPage1Open] = useState(true);
  const [page2Open, setPage2Open] = useState(true);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let y = 25;

      // Helper for wrapped text
      const addWrappedText = (text: string, x: number, yPos: number, maxWidth: number, fontSize: number = 10) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, yPos);
        return yPos + (lines.length * fontSize * 0.45);
      };

      // Header
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Seeksy", margin, 15);
      doc.text("CEO VTO", pageWidth - margin - 25, 15);
      
      // Page 1 Title
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("CEO VTO — Page 1", margin, y);
      y += 8;
      doc.setFontSize(14);
      doc.text("Seeksy: Vision & Traction Plan (2025–2027)", margin, y);
      y += 12;

      // Section 1: Vision Summary
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("1. Vision Summary", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      y = addWrappedText(
        "Seeksy is building the unified system for how people work, share, and monetize online. Our platform connects identity, meetings, events, hosting, podcasting, advertising, and AI into one operating system. Our near-term GTM focus is the U.S. military and veteran community, where we have a unique trust advantage and monetization potential.",
        margin, y, pageWidth - margin * 2
      );
      y += 8;

      // Section 2: 3-Year Targets
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("2. 3-Year Targets", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const targets = [
        "250,000 verified military/veteran users",
        "$25M annual recurring revenue",
        "VPA + Event Platform sale for $3–$7M",
        "50M monthly listens/views hosted",
        "70% automation of operations using AI"
      ];
      targets.forEach(t => {
        doc.text(`• ${t}`, margin + 5, y);
        y += 5;
      });
      y += 6;

      // Section 3: Revenue Strategy
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("3. Revenue Strategy by Vertical", margin, y);
      y += 8;

      // A. Subscriptions
      doc.setFontSize(11);
      doc.text("A. Subscriptions", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Goal: 80,000 paid subscribers | Pricing: $12–$29/mo creators, $49–$299/mo business", margin + 5, y);
      y += 5;
      doc.text("Execution: Unified billing + AI onboarding, Military Creator Program, On-base activation", margin + 5, y);
      y += 5;
      doc.text("Cost: ~$150k to fully execute", margin + 5, y);
      y += 8;

      // B. VPA + Event Platform Sale
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("B. VPA + Event Platform Sale", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Goal: $3–$7M IP sale | Cost: ~$25k (legal + prep)", margin + 5, y);
      y += 5;
      doc.text("Execution: Package IP + demos, Deliver buyer-ready docs, Build 3-buyer pipeline", margin + 5, y);
      y += 8;

      // C. Advertising Revenue
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("C. Advertising Revenue", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Military CPMs: $22–$100+ | Cost: ~$100k engineering + sales", margin + 5, y);
      y += 5;
      doc.text("Execution: Onboard 10,000 military podcasters, Dynamic Ad Insertion engine", margin + 5, y);
      y += 5;
      doc.text("Target Advertisers: USAA, Navy Fed, Boeing, Lockheed, BAH", margin + 5, y);
      y += 10;

      // Section 4: Risks
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("4. Risks & Mitigation", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const risks = [
        ["Slow adoption outside creators", "Veteran-first expansion into events & educators"],
        ["High AI compute cost", "Hybrid local + optimized model routing"],
        ["Ad demand fluctuations", "Hybrid sponsorship + CPM packages"],
        ["Buyer dependency", "Maintain 3+ strategic buyers"]
      ];
      risks.forEach(([risk, mitigation]) => {
        doc.text(`• ${risk} → ${mitigation}`, margin + 5, y);
        y += 5;
      });

      // Footer Page 1
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text("Seeksy Board Portal — Confidential & Internal Use Only", margin, pageHeight - 10);

      // Page 2
      doc.addPage();
      y = 25;

      // Header
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Seeksy", margin, 15);
      doc.text("CEO VTO", pageWidth - margin - 25, 15);

      // Page 2 Title
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("CEO VTO — Page 2", margin, y);
      y += 8;
      doc.setFontSize(14);
      doc.text("Traction Plan: What Leadership Will Execute", margin, y);
      y += 12;

      // Quarterly sections
      const quarters = [
        {
          title: "Q1 Priorities",
          items: ["Unified billing + subscription plans", "Deliver VPA sale package", "Military Creator Program launch", "Sponsorship catalog (USAA, Lockheed, Boeing)"],
          cost: "~$90k",
          output: "3,500 creators, $50k MRR"
        },
        {
          title: "Q2 Priorities",
          items: ["AI Onboarding Assistant", "Ad Engine (beta)", "Base partnerships", "3 sponsorship deals"],
          cost: "~$110k",
          output: "10k creators, $1–1.5M pipeline"
        },
        {
          title: "Q3 Priorities",
          items: ["Full Ad Engine", "Veteran Podcaster Network", "15–20 advertisers", "Begin acquisition talks"],
          cost: "~$140k",
          output: "$5M pipeline, 25k creators"
        },
        {
          title: "Q4 Priorities",
          items: ["Deliver buyer-ready IP package", "Premium dashboards", "Event & education vertical expansions"],
          cost: "~$125k",
          output: "VPA sale opportunity, 50k creators, 10M+ monthly impressions"
        }
      ];

      quarters.forEach((q, i) => {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(q.title, margin, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        q.items.forEach(item => {
          doc.text(`• ${item}`, margin + 5, y);
          y += 5;
        });
        doc.setFontSize(9);
        doc.text(`Cost: ${q.cost} | Expected Output: ${q.output}`, margin + 5, y);
        y += 10;
      });

      // Footer Page 2
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text("Seeksy Board Portal — Confidential & Internal Use Only", margin, pageHeight - 10);

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
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="max-w-4xl mx-auto py-8 px-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CEO VTO: Vision & Traction Plan</h1>
          <p className="text-muted-foreground text-sm mt-1">Prepared by Seeksy Leadership • Updated Quarterly</p>
        </div>
        <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="shrink-0">
          <Download className="w-4 h-4 mr-2" />
          {isGeneratingPDF ? "Generating..." : "Download as PDF"}
        </Button>
      </div>

      {/* Page 1 - Vision & Revenue Strategy */}
      <Collapsible open={page1Open} onOpenChange={setPage1Open}>
        <Card className="border-border shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Page 1 — Vision & Revenue Strategy</CardTitle>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${page1Open ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <AnimatePresence>
            {page1Open && (
              <CollapsibleContent forceMount>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0 space-y-6">
                    {/* VTO Header */}
                    <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/10">
                      <p className="text-sm font-semibold text-foreground"><b>CEO VTO — Page 1</b></p>
                      <p className="text-base font-bold text-foreground mt-1"><b>Seeksy: Vision & Traction Plan (2025–2027)</b></p>
                    </div>

                    {/* Section 1: Vision Summary */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">1</span>
                        <b>Vision Summary</b>
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed pl-8">
                        Seeksy is building the unified system for how people work, share, and monetize online. Our platform connects identity, meetings, events, hosting, podcasting, advertising, and AI into one operating system. Our near-term GTM focus is the U.S. military and veteran community, where we have a unique trust advantage and monetization potential.
                      </p>
                    </div>

                    {/* Section 2: 3-Year Targets */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">2</span>
                        <b>3-Year Targets</b>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                        {[
                          { icon: Users, text: "250,000 verified military/veteran users" },
                          { icon: DollarSign, text: "$25M annual recurring revenue" },
                          { icon: Building2, text: "VPA + Event Platform sale for $3–$7M" },
                          { icon: TrendingUp, text: "50M monthly listens/views hosted" },
                          { icon: Rocket, text: "70% automation of operations using AI" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted/30 rounded-lg">
                            <item.icon className="w-4 h-4 text-primary/70 shrink-0" />
                            <span>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 3: Revenue Strategy */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">3</span>
                        <b>Revenue Strategy by Vertical</b>
                      </h3>
                      
                      {/* A. Subscriptions */}
                      <div className="pl-8 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                        <p className="text-sm font-bold text-foreground mb-2"><b>A. Subscriptions</b></p>
                        <p className="text-sm text-muted-foreground"><b>Goal:</b> 80,000 paid subscribers</p>
                        <p className="text-sm text-muted-foreground"><b>Pricing:</b> $12–$29/mo creators, $49–$299/mo business</p>
                        <p className="text-sm text-muted-foreground mt-2"><b>Execution:</b></p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                          <li>Unified billing + AI onboarding</li>
                          <li>Military Creator Program</li>
                          <li>On-base activation strategy</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-2"><b>Cost:</b> ~$150k to fully execute</p>
                      </div>

                      {/* B. VPA + Event Platform Sale */}
                      <div className="pl-8 p-4 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 rounded-xl border border-green-200/50 dark:border-green-800/30">
                        <p className="text-sm font-bold text-foreground mb-2"><b>B. VPA + Event Platform Sale</b></p>
                        <p className="text-sm text-muted-foreground"><b>Goal:</b> $3–$7M IP sale</p>
                        <p className="text-sm text-muted-foreground mt-2"><b>Execution:</b></p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                          <li>Package IP + demos</li>
                          <li>Deliver buyer-ready docs</li>
                          <li>Build 3-buyer pipeline</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-2"><b>Cost:</b> ~$25k (legal + prep)</p>
                      </div>

                      {/* C. Advertising Revenue */}
                      <div className="pl-8 p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 rounded-xl border border-purple-200/50 dark:border-purple-800/30">
                        <p className="text-sm font-bold text-foreground mb-2"><b>C. Advertising Revenue</b></p>
                        <p className="text-sm text-muted-foreground"><b>Military CPMs:</b> $22–$100+</p>
                        <p className="text-sm text-muted-foreground mt-2"><b>Execution:</b></p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside ml-2">
                          <li>Onboard 10,000 military podcasters</li>
                          <li>Dynamic Ad Insertion engine</li>
                          <li>Sell to USAA, Navy Fed, Boeing, Lockheed, BAH</li>
                        </ul>
                        <p className="text-sm text-muted-foreground mt-2"><b>Cost:</b> ~$100k engineering + sales</p>
                      </div>
                    </div>

                    {/* Section 4: Risks */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-xs text-destructive font-bold">4</span>
                        <b>Risks & Mitigation</b>
                      </h3>
                      <div className="pl-8 overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 pr-4 font-semibold text-foreground">Risk</th>
                              <th className="text-left py-2 font-semibold text-foreground">Mitigation</th>
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            <tr className="border-b border-border/50">
                              <td className="py-2 pr-4">Slow adoption outside creators</td>
                              <td className="py-2">Veteran-first expansion into events & educators</td>
                            </tr>
                            <tr className="border-b border-border/50">
                              <td className="py-2 pr-4">High AI compute cost</td>
                              <td className="py-2">Hybrid local + optimized model routing</td>
                            </tr>
                            <tr className="border-b border-border/50">
                              <td className="py-2 pr-4">Ad demand fluctuations</td>
                              <td className="py-2">Hybrid sponsorship + CPM packages</td>
                            </tr>
                            <tr>
                              <td className="py-2 pr-4">Buyer dependency</td>
                              <td className="py-2">Maintain 3+ strategic buyers</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Card>
      </Collapsible>

      {/* Page 2 - Traction Plan */}
      <Collapsible open={page2Open} onOpenChange={setPage2Open}>
        <Card className="border-border shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Page 2 — Traction Plan & Financial Overview</CardTitle>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${page2Open ? 'rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <AnimatePresence>
            {page2Open && (
              <CollapsibleContent forceMount>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0 space-y-6">
                    {/* VTO Header */}
                    <div className="p-4 bg-gradient-to-r from-green-500/5 to-green-500/10 rounded-xl border border-green-500/10">
                      <p className="text-sm font-semibold text-foreground"><b>CEO VTO — Page 2</b></p>
                      <p className="text-base font-bold text-foreground mt-1"><b>Traction Plan: What Leadership Will Execute</b></p>
                    </div>

                    {/* Quarterly Priorities */}
                    {[
                      {
                        quarter: "Q1",
                        color: "blue",
                        priorities: [
                          "Unified billing + subscription plans",
                          "Deliver VPA sale package",
                          "Military Creator Program launch",
                          "Sponsorship catalog (USAA, Lockheed, Boeing)"
                        ],
                        cost: "~$90k",
                        output: "3,500 creators, $50k MRR"
                      },
                      {
                        quarter: "Q2",
                        color: "green",
                        priorities: [
                          "AI Onboarding Assistant",
                          "Ad Engine (beta)",
                          "Base partnerships",
                          "3 sponsorship deals"
                        ],
                        cost: "~$110k",
                        output: "10k creators, $1–1.5M pipeline"
                      },
                      {
                        quarter: "Q3",
                        color: "purple",
                        priorities: [
                          "Full Ad Engine",
                          "Veteran Podcaster Network",
                          "15–20 advertisers",
                          "Begin acquisition talks"
                        ],
                        cost: "~$140k",
                        output: "$5M pipeline, 25k creators"
                      },
                      {
                        quarter: "Q4",
                        color: "orange",
                        priorities: [
                          "Deliver buyer-ready IP package",
                          "Premium dashboards",
                          "Event & education vertical expansions"
                        ],
                        cost: "~$125k",
                        output: "VPA sale opportunity, 50k creators, 10M+ monthly impressions"
                      }
                    ].map((q, idx) => (
                      <div key={idx} className="space-y-3">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs px-2 py-0.5 ${
                            q.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            q.color === 'green' ? 'bg-green-100 text-green-700 border-green-200' :
                            q.color === 'purple' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            'bg-orange-100 text-orange-700 border-orange-200'
                          }`}>
                            {q.quarter}
                          </Badge>
                          <b>{q.quarter} Priorities</b>
                        </h3>
                        <div className="ml-0 p-4 bg-muted/30 rounded-xl space-y-3">
                          <ul className="space-y-1">
                            {q.priorities.map((p, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-wrap gap-4 pt-2 border-t border-border/50">
                            <div className="text-sm">
                              <span className="font-semibold text-foreground">Cost:</span>{" "}
                              <span className="text-muted-foreground">{q.cost}</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-semibold text-foreground">Expected Output:</span>{" "}
                              <span className="text-muted-foreground">{q.output}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </motion.div>
              </CollapsibleContent>
            )}
          </AnimatePresence>
        </Card>
      </Collapsible>
    </motion.div>
  );
}
