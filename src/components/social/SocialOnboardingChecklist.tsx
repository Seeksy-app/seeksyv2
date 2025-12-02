import { CheckCircle2, Circle, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSocialProfiles, useSocialPosts, useSocialInsights, useSyncSocialData } from "@/hooks/useSocialMediaSync";
import { formatDistanceToNow } from "date-fns";

interface ChecklistItem {
  id: string;
  label: string;
  status: "complete" | "warning" | "incomplete";
  action?: { label: string; onClick: () => void };
}

export function SocialOnboardingChecklist() {
  const navigate = useNavigate();
  const { data: profiles } = useSocialProfiles();
  const instagramProfile = profiles?.find(p => p.platform === 'instagram');
  const { data: posts } = useSocialPosts(instagramProfile?.id || null);
  const { data: insights } = useSocialInsights(instagramProfile?.id || null);
  const { syncData, isSyncing } = useSyncSocialData();

  const isTokenValid = instagramProfile && instagramProfile.sync_status !== 'token_expired';
  const hasProfileData = instagramProfile && (instagramProfile.followers_count > 0 || instagramProfile.media_count > 0);
  const hasPostsData = posts && posts.length >= 10;
  const hasInsightsData = insights && insights.length > 0;
  const hasAudienceData = insights?.some(i => 
    i.reach > 0 || i.impressions > 0 || i.profile_views > 0
  );
  
  const lastSyncAt = instagramProfile?.last_sync_at 
    ? new Date(instagramProfile.last_sync_at) 
    : null;
  const isSyncRecent = lastSyncAt && (Date.now() - lastSyncAt.getTime()) < 48 * 60 * 60 * 1000;

  const checklistItems: ChecklistItem[] = [
    {
      id: "connected",
      label: "Account Connected",
      status: instagramProfile && isTokenValid ? "complete" : instagramProfile ? "warning" : "incomplete",
      action: !instagramProfile || !isTokenValid 
        ? { label: isTokenValid ? "Connect" : "Reconnect", onClick: () => navigate('/integrations') }
        : undefined,
    },
    {
      id: "profile",
      label: "Profile Synced",
      status: hasProfileData ? "complete" : instagramProfile ? "warning" : "incomplete",
      action: instagramProfile && !hasProfileData 
        ? { label: "Sync Now", onClick: () => syncData(instagramProfile.id) }
        : undefined,
    },
    {
      id: "posts",
      label: "Posts & Engagement Imported",
      status: hasPostsData ? "complete" : posts && posts.length > 0 ? "warning" : "incomplete",
      action: instagramProfile && !hasPostsData
        ? { label: "Sync Posts", onClick: () => syncData(instagramProfile.id) }
        : undefined,
    },
    {
      id: "insights",
      label: "Insights Available",
      status: hasInsightsData ? "complete" : "incomplete",
      action: instagramProfile && !hasInsightsData
        ? { label: "Sync Insights", onClick: () => syncData(instagramProfile.id) }
        : undefined,
    },
    {
      id: "audience",
      label: "Audience Data Available",
      status: hasAudienceData ? "complete" : hasInsightsData ? "warning" : "incomplete",
    },
    {
      id: "autosync",
      label: "Daily Auto-Sync Enabled",
      status: isSyncRecent ? "complete" : instagramProfile ? "warning" : "incomplete",
      action: instagramProfile && !isSyncRecent
        ? { label: "Run Sync", onClick: () => syncData(instagramProfile.id) }
        : undefined,
    },
  ];

  const completedCount = checklistItems.filter(i => i.status === "complete").length;
  const totalCount = checklistItems.length;

  const getStatusIcon = (status: ChecklistItem["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Instagram Setup</CardTitle>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{totalCount} complete
          </span>
        </div>
        {lastSyncAt && (
          <p className="text-xs text-muted-foreground">
            Last synced {formatDistanceToNow(lastSyncAt, { addSuffix: true })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {checklistItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {getStatusIcon(item.status)}
              <span className={`text-sm ${item.status === "incomplete" ? "text-muted-foreground" : ""}`}>
                {item.label}
              </span>
            </div>
            {item.action && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={item.action.onClick}
                disabled={isSyncing}
                className="h-7 text-xs"
              >
                {isSyncing && item.action.label.includes("Sync") ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  item.action.label
                )}
              </Button>
            )}
          </div>
        ))}

        {instagramProfile && (
          <div className="pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => syncData(instagramProfile.id)}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync All Data Now
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
