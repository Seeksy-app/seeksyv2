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
      {/* Clip Use */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="clip-use" className="text-base font-medium">
              Clip Use
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow your identity to be used in creating and distributing clips from your content
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

      {/* AI Generation */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ai-generation" className="text-base font-medium">
              AI Generation
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow AI systems to generate content using your identity features (voice, likeness)
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

      {/* Advertiser Access */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="advertiser-access" className="text-base font-medium">
              Advertiser Access
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow advertisers to request access to use your identity in ad campaigns
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

      {/* Anonymous Model Training */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="anonymous-training" className="text-base font-medium">
              Anonymous Model Training
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow your identity data to be used anonymously in training AI models (helps improve accuracy)
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