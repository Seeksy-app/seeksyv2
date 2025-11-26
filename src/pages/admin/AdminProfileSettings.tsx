import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserCog, Upload } from "lucide-react";

export default function AdminProfileSettings() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [useSeparateProfile, setUseSeparateProfile] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    admin_full_name: "",
    admin_email: "",
    admin_phone: "",
    admin_avatar_url: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("admin_full_name, admin_email, admin_phone, admin_avatar_url, use_separate_admin_profile")
      .eq("id", user.id)
      .single();

    if (data) {
      setAdminProfile({
        admin_full_name: data.admin_full_name || "",
        admin_email: data.admin_email || "",
        admin_phone: data.admin_phone || "",
        admin_avatar_url: data.admin_avatar_url || "",
      });
      setUseSeparateProfile(data.use_separate_admin_profile || false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/admin-avatar-${Math.random()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload avatar");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    setAdminProfile(prev => ({ ...prev, admin_avatar_url: publicUrl }));
    setUploading(false);
    toast.success("Avatar uploaded");
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        admin_full_name: adminProfile.admin_full_name,
        admin_email: adminProfile.admin_email,
        admin_phone: adminProfile.admin_phone,
        admin_avatar_url: adminProfile.admin_avatar_url,
        use_separate_admin_profile: useSeparateProfile,
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      toast.error("Failed to update admin profile");
      return;
    }

    toast.success("Admin profile updated");
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCog className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Admin Profile Settings</CardTitle>
              <CardDescription>
                Configure your admin identity separate from your personal contact information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="use-separate">Use Separate Admin Profile</Label>
              <p className="text-sm text-muted-foreground">
                Display different information when in admin view
              </p>
            </div>
            <Switch
              id="use-separate"
              checked={useSeparateProfile}
              onCheckedChange={setUseSeparateProfile}
            />
          </div>

          {useSeparateProfile && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={adminProfile.admin_avatar_url} />
                    <AvatarFallback>
                      <UserCog className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Upload className="h-4 w-4" />
                        {uploading ? "Uploading..." : "Upload Admin Avatar"}
                      </div>
                    </Label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-name">Admin Full Name</Label>
                  <Input
                    id="admin-name"
                    value={adminProfile.admin_full_name}
                    onChange={(e) => setAdminProfile(prev => ({ ...prev, admin_full_name: e.target.value }))}
                    placeholder="Enter your admin display name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminProfile.admin_email}
                    onChange={(e) => setAdminProfile(prev => ({ ...prev, admin_email: e.target.value }))}
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-phone">Admin Phone</Label>
                  <Input
                    id="admin-phone"
                    type="tel"
                    value={adminProfile.admin_phone}
                    onChange={(e) => setAdminProfile(prev => ({ ...prev, admin_phone: e.target.value }))}
                    placeholder="(123) 456-7890"
                  />
                </div>
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Admin Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}