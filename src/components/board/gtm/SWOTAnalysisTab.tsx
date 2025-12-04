import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ThumbsUp, ThumbsDown, Lightbulb, AlertTriangle } from 'lucide-react';

interface SWOTItem {
  title: string;
  details: string;
}

interface SWOTCategory {
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  items: SWOTItem[];
}

const swotData: SWOTCategory[] = [
  {
    title: 'Strengths',
    icon: ThumbsUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    items: [
      {
        title: 'Unified creator OS (studio, hosting, CRM, events, AI)',
        details: 'Seeksy is the only platform that combines podcast hosting, video studio, CRM, event management, and AI-powered editing into a single unified system. This eliminates the need for creators to juggle multiple subscriptions and tools, reducing friction and increasing retention.',
      },
      {
        title: 'Identity + rights protection',
        details: 'Our blockchain-backed voice and face certification system provides creators with verifiable identity credentials. This protects against deepfakes, enables licensing opportunities, and builds trust with brands seeking authentic creator partnerships.',
      },
      {
        title: 'AI-native workflows',
        details: 'Every feature in Seeksy is built with AI at its core — from automatic transcription and clip generation to smart scheduling and content recommendations. This gives creators 10x productivity gains compared to traditional tools.',
      },
      {
        title: 'Multi-role support (creator, podcaster, speaker, community leader)',
        details: 'Our platform adapts to different creator types with customizable dashboards and workflows. Whether someone is a full-time podcaster, part-time influencer, or industry speaker, Seeksy molds to their specific needs.',
      },
    ],
  },
  {
    title: 'Weaknesses',
    icon: ThumbsDown,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200 hover:bg-red-100',
    items: [
      {
        title: 'Early-stage brand awareness',
        details: 'As a newer entrant in the creator tools market, Seeksy lacks the brand recognition of established players like Anchor, Riverside, or Kajabi. This requires significant marketing investment and relies heavily on product-led growth and word-of-mouth.',
      },
      {
        title: 'AI compute cost dependency',
        details: 'Our AI-powered features depend on compute-intensive models for transcription, editing, and generation. This creates margin pressure and requires careful cost management as we scale, particularly for heavy users.',
      },
      {
        title: 'Need for larger partner ecosystem',
        details: 'To compete with established platforms, we need deeper integrations with microphone brands, camera companies, distribution platforms, and monetization partners. Building this ecosystem takes time and dedicated partnership resources.',
      },
    ],
  },
  {
    title: 'Opportunities',
    icon: Lightbulb,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    items: [
      {
        title: 'Growth of creators to 10M+ by 2030',
        details: 'The creator economy is projected to grow from 4M to 10M+ creators by 2030. As more people pursue content creation as a career or side hustle, the demand for professional-grade tools will accelerate.',
      },
      {
        title: 'Podcasting entering second wave of monetization',
        details: 'Podcast advertising is maturing with programmatic ad insertion, dynamic sponsorships, and premium subscriber models. Seeksy is positioned to capture this wave with built-in monetization tools.',
      },
      {
        title: 'AI replacing 70% of editing workflows',
        details: 'Industry analysts predict AI will automate 70% of video and audio editing tasks by 2027. Early adoption of AI-native workflows positions Seeksy as the default choice for efficiency-focused creators.',
      },
      {
        title: 'Event + community growth post-TikTok pivot',
        details: 'As TikTok faces regulatory uncertainty, creators are diversifying to owned platforms, live events, and community-based monetization. Seeksy\'s events and CRM features align perfectly with this shift.',
      },
    ],
  },
  {
    title: 'Threats',
    icon: AlertTriangle,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 border-slate-200 hover:bg-slate-100',
    items: [
      {
        title: 'Large incumbents adding lightweight AI features',
        details: 'Spotify, YouTube, and Adobe are adding AI features to their existing platforms. While often basic, their distribution advantage means they can capture creators before they discover Seeksy\'s superior capabilities.',
      },
      {
        title: 'Rising cost of acquisition without creator referrals',
        details: 'Paid acquisition costs for creators continue to rise. Without a strong organic referral engine, CAC could exceed LTV and threaten unit economics at scale.',
      },
      {
        title: 'Platform dependency on App Store/YouTube/Spotify changes',
        details: 'Changes to distribution platform policies, algorithms, or monetization rules can impact our creators\' success and, indirectly, Seeksy\'s value proposition. Diversification is essential.',
      },
    ],
  },
];

export function SWOTAnalysisTab() {
  const [selectedItem, setSelectedItem] = useState<{ category: string; item: SWOTItem } | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {swotData.map((category) => (
          <Card key={category.title} className={`border ${category.bgColor.split(' ')[1]} shadow-sm`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${category.bgColor.split(' ')[0]}`}>
                  <category.icon className={`w-5 h-5 ${category.color}`} />
                </div>
                <h3 className="font-semibold text-slate-900">{category.title}</h3>
              </div>
              <div className="space-y-2">
                {category.items.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => setSelectedItem({ category: category.title, item })}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${category.bgColor} cursor-pointer`}
                  >
                    <p className="text-sm text-slate-700 font-medium">{item.title}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="text-slate-900">
              {selectedItem?.category}: {selectedItem?.item.title}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <p className="text-slate-600 leading-relaxed">{selectedItem?.item.details}</p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
