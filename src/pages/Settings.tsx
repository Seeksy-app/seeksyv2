import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, User as UserIcon, Phone, Lock, Bell, FileText, Puzzle, Shield, Palette, Check, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfileCompletionCard } from "@/components/ProfileCompletionCard";
import ImageUpload from "@/components/ImageUpload";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
  });
  const [profileData, setProfileData] = useState({
    avatar_url: null as string | null,
    bio: null as string | null,
    username: null as string | null,
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    task_reminder_enabled: false,
    task_reminder_frequency: "start_of_day",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadUserData();
  }, []);

  // Handle scroll to field on hash navigation
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }, 100);
    }
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate("/auth");
        return;
      }

      setUser(authUser);

      // Load profile data (account-level, not public profile)
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_full_name, account_avatar_url, bio, account_phone, username")
        .eq("id", authUser.id)
        .single();

      setFormData({
        full_name: profile?.account_full_name || "",
        phone: profile?.account_phone || "",
        email: authUser.email || "",
      });

      setProfileData({
        avatar_url: profile?.account_avatar_url || null,
        bio: profile?.bio || null,
        username: profile?.username || null,
      });

      // Load notification preferences
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      if (prefs) {
        setNotificationPrefs({
          task_reminder_enabled: prefs.task_reminder_enabled || false,
          task_reminder_frequency: prefs.task_reminder_frequency || "start_of_day",
        });
        
        // Load theme preference but don't override it immediately
        // The ThemeToggle component will handle the initial theme setting
      }

      // Check admin status
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id);

      setIsAdmin(roles?.some(r => r.role === "admin" || r.role === "super_admin") || false);
    } catch (error: any) {
      toast({
        title: "Error loading settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (showToast = false) => {
    if (!user) return;

    setSaving(true);
    try {
      // Generate username from email if not set
      let usernameToUse = profileData.username;
      if (!usernameToUse && user.email) {
        const baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        usernameToUse = baseUsername;
        
        // Check if username exists and make it unique
        let counter = 0;
        let isUnique = false;
        while (!isUnique && counter < 100) {
          const testUsername = counter === 0 ? usernameToUse : `${usernameToUse}${counter}`;
          const { data } = await supabase
            .from("profiles")
            .select("username")
            .eq("username", testUsername)
            .single();
          
          if (!data) {
            usernameToUse = testUsername;
            isUnique = true;
          } else {
            counter++;
          }
        }
      }

      // Update or insert account profile (not public profile)
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ 
          id: user.id,
          username: usernameToUse,
          account_full_name: formData.full_name,
          account_avatar_url: profileData.avatar_url,
          account_phone: formData.phone
        } as any, {
          onConflict: 'id'
        });

      if (profileError) throw profileError;

      // Update or insert notification preferences
      const { error: prefsError } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          task_reminder_enabled: notificationPrefs.task_reminder_enabled,
          task_reminder_frequency: notificationPrefs.task_reminder_frequency,
        }, {
          onConflict: 'user_id'
        });

      if (prefsError) throw prefsError;

      // Request notification permission if enabling reminders
      if (notificationPrefs.task_reminder_enabled && Notification.permission === "default") {
        await Notification.requestPermission();
      }

      // Show brief "saved" indicator
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);

      if (showToast) {
        const encouragingMessages = [
          { title: "Settings saved! ✨", description: "Looking good! Your profile is getting better." },
          { title: "Nice work! 🎯", description: "Your settings have been updated successfully." },
          { title: "All set! 🚀", description: "Changes saved and ready to go." },
          { title: "Perfect! 💫", description: "Your account is now updated." },
          { title: "Great! 🌟", description: "Settings saved successfully." },
        ];
        const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
        toast({
          title: randomMessage.title,
          description: randomMessage.description,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Auto-save with debounce
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(false);
    }, 1000); // Save 1 second after user stops typing/changing
  }, [formData, profileData, notificationPrefs]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handlePasswordReset = async () => {
    if (!formData.email) return;

    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      });
    } catch (error: any) {
      toast({
        title: "Error sending reset email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingReset(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

          <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
              <p className="text-muted-foreground">Manage your account information and security</p>
            </div>
            <div className="flex items-center gap-3">
              {(saving || justSaved) && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-muted/50 border border-border animate-in fade-in slide-in-from-right-5 duration-300">
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm font-medium text-foreground">Saving changes...</span>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-500 animate-in zoom-in duration-200" />
                        <div className="absolute inset-0 animate-ping opacity-75">
                          <Check className="h-5 w-5 text-green-600 dark:text-green-500" />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-500">Saved successfully ✓</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* My Page Preview Link */}
          {profileData.username && profileData.bio && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Your My Page is ready!</p>
                    <p className="text-sm text-muted-foreground">
                      View your public profile at /{profileData.username}
                    </p>
                  </div>
                  <Button asChild>
                    <a href={`/${profileData.username}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="mr-2 h-4 w-4" />
                      View My Page
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Completion */}
          <ProfileCompletionCard
            fullName={formData.full_name}
            phone={formData.phone}
            avatarUrl={profileData.avatar_url}
            bio={profileData.bio}
          />

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                label="Profile Photo"
                currentImage={profileData.avatar_url || ""}
                onImageUploaded={async (url) => {
                  setProfileData(prev => ({ ...prev, avatar_url: url }));
                  // Save immediately after image upload
                  if (user) {
                    try {
                      // Get current username or generate one
                      let usernameToUse = profileData.username;
                      if (!usernameToUse && user.email) {
                        usernameToUse = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                      }
                      
                      const { error } = await supabase
                        .from("profiles")
                        .upsert({ 
                          id: user.id,
                          username: usernameToUse,
                          account_avatar_url: url 
                        } as any, {
                          onConflict: 'id'
                        });
                      
                      if (error) throw error;
                      
                      setJustSaved(true);
                      setTimeout(() => setJustSaved(false), 2500);
                      
                      toast({
                        title: "Profile photo updated! 📸",
                        description: "Your new photo looks great!",
                      });
                    } catch (error: any) {
                      toast({
                        title: "Error saving photo",
                        description: error.message,
                        variant: "destructive",
                      });
                    }
                  }
                }}
                bucket="avatars"
              />
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => {
                      setFormData({ ...formData, full_name: e.target.value });
                      debouncedSave();
                    }}
                    className="pl-10"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="pl-10 bg-muted cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      debouncedSave();
                    }}
                    className="pl-10"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                Changes are saved automatically. Your theme preference is instantly synced.
              </p>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize your display theme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Theme</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose between Light, Dark, or Auto (follows system)
                  </p>
                </div>
                <ThemeToggle />
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Changes are saved automatically
              </p>
            </CardContent>
          </Card>

          {/* Task Reminders */}
          <Card>
            <CardHeader>
              <CardTitle>Task Reminders</CardTitle>
              <CardDescription>Get notified about your outstanding tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Enable Reminders</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about tasks from your Task Manager
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.task_reminder_enabled}
                  onCheckedChange={(checked) => {
                    setNotificationPrefs({ ...notificationPrefs, task_reminder_enabled: checked });
                    debouncedSave();
                  }}
                />
              </div>

              {notificationPrefs.task_reminder_enabled && (
                <div className="space-y-2 pt-4">
                  <Label htmlFor="frequency">Reminder Frequency</Label>
                  <Select
                    value={notificationPrefs.task_reminder_frequency}
                    onValueChange={(value) => {
                      setNotificationPrefs({ ...notificationPrefs, task_reminder_frequency: value });
                      debouncedSave();
                    }}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="start_of_day">Start of Day (9 AM)</SelectItem>
                      <SelectItem value="end_of_day">End of Day (5 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    You'll be notified about tasks in backlog, todo, or in progress status
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">Password</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Reset your password via email
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">Reset Password</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset your password?</AlertDialogTitle>
                      <AlertDialogDescription>
                        We'll send a password reset link to <strong>{formData.email}</strong>. 
                        Click the link in the email to set a new password.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePasswordReset} disabled={sendingReset}>
                        {sendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Reset Link
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions & Billing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subscriptions & Billing</CardTitle>
                  <CardDescription>Manage your subscription and payment methods</CardDescription>
                </div>
                <Button onClick={() => navigate("/subscription")}>
                  Manage Subscription
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Modules & Add-ons */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Modules & Add-ons</CardTitle>
                  <CardDescription>Extend Seeksy with premium modules</CardDescription>
                </div>
                <Button onClick={() => navigate("/modules")}>
                  <Puzzle className="h-4 w-4 mr-2" />
                  Browse Modules
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Legal Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Legal & Compliance</CardTitle>
              <CardDescription>View and manage legal pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/security")}
              >
                <Shield className="h-4 w-4 mr-2" />
                Security & Data Protection
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/privacy")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Privacy Policy
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/terms")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Terms of Service
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/cookies")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Cookie Policy
              </Button>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate("/admin/legal")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Edit Legal Pages
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Account ID (for support) */}
          <Card>
            <CardHeader>
              <CardTitle>Account ID</CardTitle>
              <CardDescription>Use this when contacting support</CardDescription>
            </CardHeader>
            <CardContent>
              <code className="text-xs bg-muted px-3 py-2 rounded block font-mono">
                {user.id}
              </code>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
