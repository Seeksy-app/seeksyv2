import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Video, Sparkles, Users, Database } from "lucide-react";

interface IdentityAsset {
  id: string;
  permissions: {
    clip_use: boolean;
    ai_generation: boolean;
    advertiser_access: boolean;
    anonymous_training: boolean;
  };
}

interface IdentityPermissionsPanelProps {
  assets: IdentityAsset[];
}

export function IdentityPermissionsPanel({ assets }: IdentityPermissionsPanelProps) {
  const queryClient = useQueryClient();

  // Get aggregated permissions (if ANY asset has permission enabled, show as enabled)
  const permissions = {
    clip_use: assets.some(a => a.permissions.clip_use),
    ai_generation: assets.some(a => a.permissions.ai_generation),
    advertiser_access: assets.some(a => a.permissions.advertiser_access),
    anonymous_training: assets.some(a => a.permissions.anonymous_training),
  };

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ permission, enabled }: { permission: string; enabled: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update all user's identity assets
      const updates = assets.map(asset => {
        const newPermissions = {
          ...asset.permissions,
          [permission]: enabled,
        };
        return supabase
          .from("identity_assets")
          .update({ permissions: newPermissions })
          .eq("id", asset.id);
      });

      await Promise.all(updates);

      // Log permission change
      await Promise.all(
        assets.map(asset =>
          supabase.from("identity_access_logs").insert({
            identity_asset_id: asset.id,
            action: "permission_changed",
            actor_id: user.id,
            details: {
              permission,
              enabled,
              changed_at: new Date().toISOString(),
            },
          })
        )
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["identity-assets"] });
      toast.success(`${variables.permission.replace('_', ' ')} ${variables.enabled ? 'enabled' : 'disabled'}`);
    },
    onError: (error) => {
      toast.error("Failed to update permissions: " + error.message);
    },
  });

  const handleToggle = (permission: string, currentValue: boolean) => {
    updatePermissionsMutation.mutate({
      permission,
      enabled: !currentValue,
    });
  };

  return (
    <div className="space-y-6">
      {/* Use my clips for Seeksy features */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="clip-use" className="text-base font-medium">
              Use my clips for Seeksy features
            </Label>
            <p className="text-sm text-muted-foreground">
              Allows Seeksy to use certified clips inside the product (thumbnails, discovery, demo pages). 
              OFF = only you + collaborators see clips. ON = we can surface them inside Seeksy, but NOT sell/license to third parties without additional approval.
            </p>
          </div>
        </div>
        <Switch
          id="clip-use"
          checked={permissions.clip_use}
          onCheckedChange={() => handleToggle('clip_use', permissions.clip_use)}
          disabled={updatePermissionsMutation.isPending}
        />
      </div>

      {/* Allow AI versions of me (with approval) */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ai-generation" className="text-base font-medium">
              Allow AI versions of me (with approval)
            </Label>
            <p className="text-sm text-muted-foreground">
              Allows AI-generated content using your face/voice under an explicit approval flow. 
              OFF = no AI content using your face or voice. ON = Seeksy can generate AI content with your likeness only when you approve a specific use.
            </p>
          </div>
        </div>
        <Switch
          id="ai-generation"
          checked={permissions.ai_generation}
          onCheckedChange={() => handleToggle('ai_generation', permissions.ai_generation)}
          disabled={updatePermissionsMutation.isPending}
        />
      </div>

      {/* Let advertisers request my identity */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="advertiser-access" className="text-base font-medium">
              Let advertisers request my identity
            </Label>
            <p className="text-sm text-muted-foreground">
              Controls whether approved brands can send "use your likeness in a campaign" requests. 
              OFF = brands cannot request or use your identity. ON = brands can send requests; you have to explicitly approve each campaign.
            </p>
          </div>
        </div>
        <Switch
          id="advertiser-access"
          checked={permissions.advertiser_access}
          onCheckedChange={() => handleToggle('advertiser_access', permissions.advertiser_access)}
          disabled={updatePermissionsMutation.isPending}
        />
      </div>

      {/* Allow anonymous training & insights */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="anonymous-training" className="text-base font-medium">
              Allow anonymous training & insights
            </Label>
            <p className="text-sm text-muted-foreground">
              Allows us to use de-identified clip data to improve models and analytics. 
              OFF = no data used beyond your own account. ON = data can be used anonymously to improve Seeksy.
            </p>
          </div>
        </div>
        <Switch
          id="anonymous-training"
          checked={permissions.anonymous_training}
          onCheckedChange={() => handleToggle('anonymous_training', permissions.anonymous_training)}
          disabled={updatePermissionsMutation.isPending}
        />
      </div>
    </div>
  );
}