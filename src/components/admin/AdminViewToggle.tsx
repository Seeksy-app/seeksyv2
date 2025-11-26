import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserCog, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate, useLocation } from "react-router-dom";

interface AdminViewToggleProps {
  adminViewMode: boolean;
  onToggle: (enabled: boolean) => void;
}

interface AdminProfile {
  admin_full_name: string | null;
  admin_avatar_url: string | null;
  account_full_name: string | null;
  account_avatar_url: string | null;
  use_separate_admin_profile: boolean | null;
}

export const AdminViewToggle = ({ adminViewMode, onToggle }: AdminViewToggleProps) => {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("admin_full_name, admin_avatar_url, account_full_name, account_avatar_url, use_separate_admin_profile")
        .eq("id", user.id)
        .single();

      if (data) setProfile(data);
    };

    fetchProfile();
  }, [adminViewMode]);

  const handleToggleChange = (enabled: boolean) => {
    onToggle(enabled);
    
    // Navigate based on the new mode
    if (enabled) {
      // Switched to Admin View - go to admin dashboard
      if (location.pathname !== '/admin') {
        navigate('/admin');
      }
    } else {
      // Switched to Personal View - go to creator dashboard
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
      }
    }
  };

  const displayName = adminViewMode && profile?.use_separate_admin_profile && profile?.admin_full_name
    ? profile.admin_full_name
    : profile?.account_full_name || "Admin";

  const displayAvatar = adminViewMode && profile?.use_separate_admin_profile && profile?.admin_avatar_url
    ? profile.admin_avatar_url
    : profile?.account_avatar_url;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={displayAvatar || undefined} />
          <AvatarFallback>
            {adminViewMode ? (
              <UserCog className="h-4 w-4 text-primary" />
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <Label htmlFor="admin-toggle" className="text-sm font-medium cursor-pointer leading-none">
            {adminViewMode ? "Admin View" : "Personal View"}
          </Label>
          <span className="text-xs text-muted-foreground">{displayName}</span>
        </div>
        {adminViewMode && (
          <Link to="/admin/profile-settings" className="ml-auto">
            <Settings className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </Link>
        )}
      </div>
      <Switch
        id="admin-toggle"
        checked={adminViewMode}
        onCheckedChange={handleToggleChange}
      />
    </div>
  );
};
