import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Search, FileCheck, Bell } from "lucide-react";
import { MyProofsTab } from "@/components/content-protection/MyProofsTab";
import { MatchesAlertsTab } from "@/components/content-protection/MatchesAlertsTab";
import { CertificatesTab } from "@/components/content-protection/CertificatesTab";
import { supabase } from "@/integrations/supabase/client";

const ContentProtectionDashboard = () => {
  const [activeTab, setActiveTab] = useState("proofs");

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["content-protection-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return { protected: 0, scans: 0, matches: 0, certificates: 0 };

      // Fetch protected content count
      const { count: protectedCount } = await supabase
        .from("protected_content")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch active scans count
      const { count: scansCount } = await supabase
        .from("content_scan_jobs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "running");

      // Fetch matches count (pending review)
      const { count: matchesCount } = await supabase
        .from("content_matches")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      // Fetch certificates count (content with blockchain proof)
      const { count: certificatesCount } = await supabase
        .from("protected_content")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .not("blockchain_tx_hash", "is", null);

      return {
        protected: protectedCount || 0,
        scans: scansCount || 0,
        matches: matchesCount || 0,
        certificates: certificatesCount || 0,
      };
    },
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Content Protection
              </h1>
            </div>
            <p className="text-muted-foreground">
              Protect your content, detect unauthorized use, and manage your proof certificates.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            icon={FileCheck}
            label="Protected Content"
            value={String(stats?.protected || 0)}
            description="Registered items"
          />
          <StatsCard
            icon={Search}
            label="Active Scans"
            value={String(stats?.scans || 0)}
            description="Monitoring platforms"
          />
          <StatsCard
            icon={Bell}
            label="Matches Found"
            value={String(stats?.matches || 0)}
            description="Pending review"
          />
          <StatsCard
            icon={Shield}
            label="Certificates"
            value={String(stats?.certificates || 0)}
            description="Issued proofs"
          />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="proofs" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              My Proofs
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Matches & Alerts
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Certificates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proofs">
            <MyProofsTab />
          </TabsContent>

          <TabsContent value="matches">
            <MatchesAlertsTab />
          </TabsContent>

          <TabsContent value="certificates">
            <CertificatesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface StatsCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description: string;
}

const StatsCard = ({ icon: Icon, label, value, description }: StatsCardProps) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

export default ContentProtectionDashboard;
