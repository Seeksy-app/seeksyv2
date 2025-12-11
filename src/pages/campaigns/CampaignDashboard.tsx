import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CampaignLayout } from "@/components/campaigns/CampaignLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  PenTool, 
  Calendar, 
  DollarSign, 
  Globe,
  Sparkles,
  Edit,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Candidate {
  id: string;
  display_name: string;
  preferred_name: string | null;
  office: string | null;
  jurisdiction: string | null;
  election_date: string | null;
  party_or_affiliation: string | null;
  campaign_status: string;
  top_issues: string[] | null;
}

const quickActions = [
  { label: "Plan my campaign", icon: Sparkles, path: "/campaigns/ai-manager" },
  { label: "Write a speech", icon: PenTool, path: "/campaigns/studio" },
  { label: "Create social posts", icon: PenTool, path: "/campaigns/studio" },
  { label: "Schedule an event", icon: Calendar, path: "/campaigns/outreach" },
  { label: "Draft fundraising email", icon: DollarSign, path: "/campaigns/studio" },
  { label: "Build campaign website", icon: Globe, path: "/campaigns/site-builder" },
];

const suggestedTasks = [
  "Draft your 2-minute stump speech opening",
  "Schedule your first town hall event",
  "Write a donor outreach email",
  "Create 3 social media posts about your top issue",
  "Set up your campaign website"
];

export default function CampaignDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (!data.user) navigate("/auth");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadCandidate();
  }, [user]);

  const loadCandidate = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("campaign_candidates")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setCandidate(data);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "exploring": return "bg-blue-500/20 text-blue-400";
      case "announced": return "bg-yellow-500/20 text-yellow-400";
      case "active": return "bg-green-500/20 text-green-400";
      case "runoff": return "bg-purple-500/20 text-purple-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  if (loading) {
    return (
      <CampaignLayout>
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 text-[#d4af37] animate-spin" />
        </div>
      </CampaignLayout>
    );
  }

  return (
    <CampaignLayout>
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {candidate?.display_name || "Welcome, Candidate"}
            {candidate?.office && (
              <span className="text-white/60 font-normal text-lg ml-2">
                for {candidate.office}
              </span>
            )}
          </h1>
          {candidate?.election_date && (
            <p className="text-white/60 mt-1">
              Election: {new Date(candidate.election_date).toLocaleDateString()}
            </p>
          )}
        </div>
        <Button asChild className="bg-[#d4af37] hover:bg-[#b8962e] text-[#0a1628]">
          <Link to="/campaigns/ai-manager">
            <MessageSquare className="h-4 w-4 mr-2" />
            Talk to AI Campaign Manager
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Campaign Snapshot */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Campaign Snapshot</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-[#d4af37] hover:text-[#d4af37]/80">
                <Link to="/campaigns/ai-manager">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidate ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Office & Jurisdiction</span>
                    <span className="text-white">
                      {candidate.office || "Not set"} {candidate.jurisdiction ? `— ${candidate.jurisdiction}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Party/Affiliation</span>
                    <span className="text-white">{candidate.party_or_affiliation || "Not set"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">Status</span>
                    <Badge className={getStatusColor(candidate.campaign_status)}>
                      {candidate.campaign_status}
                    </Badge>
                  </div>
                  {candidate.top_issues && candidate.top_issues.length > 0 && (
                    <div>
                      <span className="text-white/60 block mb-2">Top Issues</span>
                      <div className="flex flex-wrap gap-2">
                        {candidate.top_issues.map((issue, i) => (
                          <Badge key={i} variant="outline" className="border-[#d4af37]/50 text-[#d4af37]">
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-white/60 mb-4">No campaign profile yet</p>
                  <Button asChild className="bg-[#d4af37] hover:bg-[#b8962e] text-[#0a1628]">
                    <Link to="/campaigns/ai-manager">Set Up Your Campaign</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Action List */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#d4af37]" />
                Today's Action List
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestedTasks.map((task, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="h-6 w-6 rounded-full bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#d4af37] text-sm font-medium">{index + 1}</span>
                    </div>
                    <p className="text-white/90">{task}</p>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4 border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37]/10"
                asChild
              >
                <Link to="/campaigns/ai-manager">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ask AI to refresh my plan
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.path}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl bg-white/5 hover:bg-[#d4af37]/10 border border-white/10 hover:border-[#d4af37]/30 transition-all text-center group"
                >
                  <div className="h-12 w-12 rounded-lg bg-[#d4af37]/20 flex items-center justify-center group-hover:bg-[#d4af37]/30 transition-colors">
                    <action.icon className="h-6 w-6 text-[#d4af37]" />
                  </div>
                  <span className="text-white/90 font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </CampaignLayout>
  );
}