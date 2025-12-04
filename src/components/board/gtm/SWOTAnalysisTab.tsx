import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Lightbulb, AlertTriangle, Info, MessageSquare, Copy, Bot } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBoardDataMode } from '@/contexts/BoardDataModeContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Types
type SwotCategory = "strength" | "weakness" | "opportunity" | "threat";

interface SwotItem {
  id: string;
  category: SwotCategory;
  title: string;
  summary: string;
  detail: string;
  importance?: "low" | "medium" | "high";
  leveragePoints?: string[];
  riskMitigations?: string[];
}

// Demo data configuration
const DEMO_SWOT_ITEMS: SwotItem[] = [
  // Strengths
  {
    id: "strength-unified-os",
    category: "strength",
    title: "Unified creator OS (studio, hosting, CRM, events, AI)",
    summary: "All-in-one platform eliminates tool fragmentation for creators.",
    detail: "Seeksy is the only platform that combines podcast hosting, video studio, CRM, event management, and AI-powered editing into a single unified system. This eliminates the need for creators to juggle multiple subscriptions and tools, reducing friction and increasing retention.",
    importance: "high",
    leveragePoints: [
      "Use unified experience as primary differentiator in marketing",
      "Highlight cost savings vs. multiple subscriptions",
      "Build migration tools from competitor platforms",
      "Create comparison content showing workflow simplification"
    ]
  },
  {
    id: "strength-identity-rights",
    category: "strength",
    title: "Identity + rights protection",
    summary: "Blockchain-backed voice and face certification for authenticity.",
    detail: "Our blockchain-backed voice and face certification system provides creators with verifiable identity credentials. This protects against deepfakes, enables licensing opportunities, and builds trust with brands seeking authentic creator partnerships.",
    importance: "high",
    leveragePoints: [
      "Partner with brands requiring verified creator identities",
      "Create 'Verified Creator' badge program for marketing",
      "Develop identity licensing marketplace",
      "Position as trust layer for creator economy"
    ]
  },
  {
    id: "strength-ai-native",
    category: "strength",
    title: "AI-native workflows",
    summary: "Every feature built with AI at its core for 10x productivity.",
    detail: "Every feature in Seeksy is built with AI at its core — from automatic transcription and clip generation to smart scheduling and content recommendations. This gives creators 10x productivity gains compared to traditional tools.",
    importance: "high",
    leveragePoints: [
      "Showcase time-saved metrics in case studies",
      "Build AI productivity calculator for prospects",
      "Create 'AI vs Manual' comparison demos",
      "Develop AI-first onboarding that demonstrates value immediately"
    ]
  },
  {
    id: "strength-multi-role",
    category: "strength",
    title: "Multi-role support (creator, podcaster, speaker, community leader)",
    summary: "Platform adapts to different creator types with custom workflows.",
    detail: "Our platform adapts to different creator types with customizable dashboards and workflows. Whether someone is a full-time podcaster, part-time influencer, or industry speaker, Seeksy molds to their specific needs.",
    importance: "medium",
    leveragePoints: [
      "Create role-specific marketing campaigns",
      "Develop vertical-specific case studies",
      "Build templates for each creator archetype",
      "Enable persona switching for multi-hat creators"
    ]
  },
  // Weaknesses
  {
    id: "weakness-brand-awareness",
    category: "weakness",
    title: "Early-stage brand awareness",
    summary: "Lacks recognition of established players like Anchor or Riverside.",
    detail: "As a newer entrant in the creator tools market, Seeksy lacks the brand recognition of established players like Anchor, Riverside, or Kajabi. This requires significant marketing investment and relies heavily on product-led growth and word-of-mouth.",
    importance: "high",
    riskMitigations: [
      "Invest in creator ambassador program",
      "Focus on product-led growth loops",
      "Target underserved niches first to build reputation",
      "Develop viral features that drive organic sharing"
    ]
  },
  {
    id: "weakness-ai-costs",
    category: "weakness",
    title: "AI compute cost dependency",
    summary: "Compute-intensive AI features create margin pressure at scale.",
    detail: "Our AI-powered features depend on compute-intensive models for transcription, editing, and generation. This creates margin pressure and requires careful cost management as we scale, particularly for heavy users.",
    importance: "medium",
    riskMitigations: [
      "Implement usage-based pricing tiers",
      "Optimize model inference with caching",
      "Negotiate volume discounts with AI providers",
      "Develop lighter-weight AI alternatives for basic tasks"
    ]
  },
  {
    id: "weakness-partner-ecosystem",
    category: "weakness",
    title: "Need for larger partner ecosystem",
    summary: "Requires deeper integrations with hardware and distribution partners.",
    detail: "To compete with established platforms, we need deeper integrations with microphone brands, camera companies, distribution platforms, and monetization partners. Building this ecosystem takes time and dedicated partnership resources.",
    importance: "medium",
    riskMitigations: [
      "Prioritize highest-impact integrations first",
      "Create partner onboarding playbook",
      "Offer co-marketing opportunities to attract partners",
      "Build open API for community integrations"
    ]
  },
  // Opportunities
  {
    id: "opportunity-creator-growth",
    category: "opportunity",
    title: "Growth of creators to 10M+ by 2030",
    summary: "Creator economy projected to grow from 4M to 10M+ creators.",
    detail: "The creator economy is projected to grow from 4M to 10M+ creators by 2030. As more people pursue content creation as a career or side hustle, the demand for professional-grade tools will accelerate.",
    importance: "high",
    leveragePoints: [
      "Position for emerging creator segments",
      "Build scalable onboarding for volume growth",
      "Create freemium tier to capture new creators early",
      "Develop educational content for aspiring creators"
    ]
  },
  {
    id: "opportunity-podcast-monetization",
    category: "opportunity",
    title: "Podcasting entering second wave of monetization",
    summary: "Programmatic ads, dynamic sponsorships, and premium models maturing.",
    detail: "Podcast advertising is maturing with programmatic ad insertion, dynamic sponsorships, and premium subscriber models. Seeksy is positioned to capture this wave with built-in monetization tools.",
    importance: "high",
    leveragePoints: [
      "Launch native ad marketplace",
      "Build programmatic ad insertion",
      "Create sponsorship matching platform",
      "Develop premium subscriber features"
    ]
  },
  {
    id: "opportunity-ai-editing",
    category: "opportunity",
    title: "AI replacing 70% of editing workflows",
    summary: "Industry predicts AI will automate most editing tasks by 2027.",
    detail: "Industry analysts predict AI will automate 70% of video and audio editing tasks by 2027. Early adoption of AI-native workflows positions Seeksy as the default choice for efficiency-focused creators.",
    importance: "high",
    leveragePoints: [
      "Double down on AI editing features",
      "Create 'zero-edit' publishing workflow",
      "Build AI editing benchmarks for marketing",
      "Partner with AI research for cutting-edge features"
    ]
  },
  {
    id: "opportunity-community-events",
    category: "opportunity",
    title: "Event + community growth post-TikTok pivot",
    summary: "Creators diversifying to owned platforms and live events.",
    detail: "As TikTok faces regulatory uncertainty, creators are diversifying to owned platforms, live events, and community-based monetization. Seeksy's events and CRM features align perfectly with this shift.",
    importance: "medium",
    leveragePoints: [
      "Enhance event management features",
      "Build community engagement tools",
      "Create TikTok migration guides",
      "Develop owned-audience analytics"
    ]
  },
  // Threats
  {
    id: "threat-incumbents",
    category: "threat",
    title: "Large incumbents adding lightweight AI features",
    summary: "Spotify, YouTube, and Adobe adding AI to existing platforms.",
    detail: "Spotify, YouTube, and Adobe are adding AI features to their existing platforms. While often basic, their distribution advantage means they can capture creators before they discover Seeksy's superior capabilities.",
    importance: "high",
    riskMitigations: [
      "Move faster on feature development",
      "Focus on depth vs. incumbents' breadth",
      "Target creators frustrated with basic AI features",
      "Build switching cost through data portability"
    ]
  },
  {
    id: "threat-cac",
    category: "threat",
    title: "Rising cost of acquisition without creator referrals",
    summary: "Paid acquisition costs rising; CAC could exceed LTV.",
    detail: "Paid acquisition costs for creators continue to rise. Without a strong organic referral engine, CAC could exceed LTV and threaten unit economics at scale.",
    importance: "high",
    riskMitigations: [
      "Build viral referral loops into product",
      "Invest in content marketing and SEO",
      "Create affiliate program for creators",
      "Focus on high-LTV segments first"
    ]
  },
  {
    id: "threat-platform-dependency",
    category: "threat",
    title: "Platform dependency on App Store/YouTube/Spotify changes",
    summary: "Distribution platform policy changes can impact creator success.",
    detail: "Changes to distribution platform policies, algorithms, or monetization rules can impact our creators' success and, indirectly, Seeksy's value proposition. Diversification is essential.",
    importance: "medium",
    riskMitigations: [
      "Build multi-platform distribution",
      "Create owned audience tools (email, SMS)",
      "Develop platform-agnostic revenue streams",
      "Monitor and adapt quickly to policy changes"
    ]
  }
];

// Category configuration
const categoryConfig: Record<SwotCategory, {
  title: string;
  icon: React.ElementType;
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
  pillHover: string;
  badgeColor: string;
}> = {
  strength: {
    title: "Strengths",
    icon: ThumbsUp,
    bgColor: "bg-emerald-50/70",
    iconBgColor: "bg-emerald-100",
    iconColor: "text-emerald-700",
    pillHover: "hover:bg-emerald-50",
    badgeColor: "bg-emerald-100 text-emerald-800"
  },
  weakness: {
    title: "Weaknesses",
    icon: ThumbsDown,
    bgColor: "bg-rose-50/70",
    iconBgColor: "bg-rose-100",
    iconColor: "text-rose-700",
    pillHover: "hover:bg-rose-50",
    badgeColor: "bg-rose-100 text-rose-800"
  },
  opportunity: {
    title: "Opportunities",
    icon: Lightbulb,
    bgColor: "bg-amber-50/70",
    iconBgColor: "bg-amber-100",
    iconColor: "text-amber-700",
    pillHover: "hover:bg-amber-50",
    badgeColor: "bg-amber-100 text-amber-800"
  },
  threat: {
    title: "Threats",
    icon: AlertTriangle,
    bgColor: "bg-slate-50/70",
    iconBgColor: "bg-slate-100",
    iconColor: "text-slate-700",
    pillHover: "hover:bg-slate-50",
    badgeColor: "bg-slate-100 text-slate-800"
  }
};

// Group items by category
function groupByCategory(items: SwotItem[]): Record<SwotCategory, SwotItem[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<SwotCategory, SwotItem[]>);
}

export function SWOTAnalysisTab() {
  const [selectedItem, setSelectedItem] = useState<SwotItem | null>(null);
  const { isDemo } = useBoardDataMode();
  
  // For now, always use demo data; real data can be fetched from Supabase later
  const swotItems = DEMO_SWOT_ITEMS;
  const groupedItems = groupByCategory(swotItems);
  
  const handleAskAI = (item: SwotItem) => {
    const config = categoryConfig[item.category];
    const categoryLabel = config.title.slice(0, -1); // Remove 's' from end
    
    // Build the prompt
    const prompt = `Explain this SWOT item and how it impacts Seeksy's strategy:
Category: ${categoryLabel}
Title: ${item.title}
Detail: ${item.detail}

Give recommendations tailored to our current GTM and 3-year plan.`;

    // Dispatch event to open Board AI Chat with pre-filled prompt
    const event = new CustomEvent('openBoardAIChatWithPrompt', { 
      detail: { 
        prompt,
        context: {
          category: item.category,
          id: item.id,
          title: item.title,
          route: '/board/gtm?tab=swot&item=' + item.id
        }
      } 
    });
    window.dispatchEvent(event);
    
    // Close the modal
    setSelectedItem(null);
  };

  const handleCopySummary = (item: SwotItem) => {
    const config = categoryConfig[item.category];
    const categoryLabel = config.title.slice(0, -1);
    const text = `${categoryLabel}: ${item.title}\n\n${item.detail}`;
    navigator.clipboard.writeText(text);
    toast.success("Summary copied to clipboard");
  };

  const quadrantOrder: SwotCategory[] = ["strength", "weakness", "opportunity", "threat"];

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      {/* Header with data mode badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">SWOT Analysis</h2>
          <p className="text-sm text-slate-500 mt-1">
            Strategic assessment of Seeksy's position in the creator economy
          </p>
        </div>
        {isDemo && (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
            Demo data for illustration
          </Badge>
        )}
      </div>

      {/* 2x2 Quadrant Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {quadrantOrder.map((category) => {
          const config = categoryConfig[category];
          const items = groupedItems[category] || [];
          const IconComponent = config.icon;
          
          return (
            <div
              key={category}
              className={cn(
                "rounded-2xl border border-slate-200 p-4 lg:p-5 shadow-sm",
                config.bgColor
              )}
            >
              {/* Quadrant Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("p-2.5 rounded-xl", config.iconBgColor)}>
                  <IconComponent className={cn("w-5 h-5", config.iconColor)} />
                </div>
                <h3 className="font-semibold text-slate-900">{config.title}</h3>
                <Badge variant="secondary" className="ml-auto text-xs bg-white/80">
                  {items.length}
                </Badge>
              </div>

              {/* Item Pills */}
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      "w-full text-left rounded-xl bg-white/70 shadow-sm px-3 py-2.5",
                      "flex items-center justify-between gap-2 cursor-pointer",
                      "transition-all duration-200",
                      "hover:bg-white hover:shadow-md hover:-translate-y-0.5",
                      config.pillHover
                    )}
                  >
                    <span className="text-sm font-medium text-slate-900 line-clamp-2">
                      {item.title}
                    </span>
                    <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg sm:max-w-xl rounded-2xl bg-white p-0 overflow-hidden">
          {selectedItem && (
            <>
              {/* Modal Header */}
              <DialogHeader className="p-6 pb-4 border-b bg-slate-50/50">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg flex-shrink-0",
                    categoryConfig[selectedItem.category].iconBgColor
                  )}>
                    {(() => {
                      const IconComponent = categoryConfig[selectedItem.category].icon;
                      return <IconComponent className={cn("w-5 h-5", categoryConfig[selectedItem.category].iconColor)} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge className={cn("mb-2 text-xs font-medium", categoryConfig[selectedItem.category].badgeColor)}>
                      {categoryConfig[selectedItem.category].title.slice(0, -1)}
                    </Badge>
                    <DialogTitle className="text-lg font-semibold text-slate-900 leading-tight">
                      {selectedItem.title}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Why this matters */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Why this matters</h4>
                  <DialogDescription className="text-sm text-slate-600 leading-relaxed">
                    {selectedItem.detail}
                  </DialogDescription>
                </div>

                {/* Importance badge */}
                {selectedItem.importance && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Importance:</span>
                    <Badge variant="outline" className={cn(
                      "text-xs capitalize",
                      selectedItem.importance === "high" && "border-red-200 text-red-700 bg-red-50",
                      selectedItem.importance === "medium" && "border-amber-200 text-amber-700 bg-amber-50",
                      selectedItem.importance === "low" && "border-slate-200 text-slate-600 bg-slate-50"
                    )}>
                      {selectedItem.importance}
                    </Badge>
                  </div>
                )}

                {/* Action points */}
                {(selectedItem.leveragePoints || selectedItem.riskMitigations) && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">
                      {selectedItem.category === "strength" || selectedItem.category === "opportunity"
                        ? "How we should leverage this"
                        : "Risks / mitigation ideas"}
                    </h4>
                    <ul className="space-y-1.5">
                      {(selectedItem.leveragePoints || selectedItem.riskMitigations || []).map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <DialogFooter className="p-4 border-t bg-slate-50/50 flex-row gap-2 sm:justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopySummary(selectedItem)}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy summary
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAskAI(selectedItem)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Bot className="w-4 h-4" />
                  Ask Board AI Analyst
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
