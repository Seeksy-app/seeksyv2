import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SubscriberListManager } from "@/components/email/SubscriberListManager";
import { EmailAccountManager } from "@/components/email/EmailAccountManager";
import { useToast } from "@/hooks/use-toast";
import { Mail, List, Settings, TrendingUp, Link2, Unlink, RefreshCw, Shield, Bell, ArrowLeft, CheckCircle } from "lucide-react";
import { GoogleVerifiedBadge } from "@/components/ui/google-verified-badge";
import { useNavigate } from "react-router-dom";

export default function EmailSettings() {
  const [activeTab, setActiveTab] = useState("accounts");
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check Gmail connection status
  const { data: gmailConnection, isLoading: loadingGmail } = useQuery({
    queryKey: ["gmail-connection"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from("gmail_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      return data;
    },
  });

  // Fetch email signatures for default selection
  const { data: signatures = [] } = useQuery({
    queryKey: ["email-signatures-list"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from("email_signatures")
        .select("id, name, is_active")
        .eq("user_id", user.id)
        .order("name");
      
      return data || [];
    },
  });

  const connectGmail = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("gmail-auth", {
        body: { redirectUrl: `${window.location.origin}/email/settings` },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Could not initiate Gmail connection",
        variant: "destructive",
      });
    }
  };

  const disconnectGmail = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("gmail_connections")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail-connection"] });
      toast({
        title: "Disconnected",
        description: "Gmail has been disconnected from your account",
      });
    },
  });

  const syncGmail = async () => {
    toast({
      title: "Syncing...",
      description: "Fetching latest emails from Gmail",
    });
    
    try {
      // Sync both inbox and replies
      const [inboxResult, repliesResult] = await Promise.all([
        supabase.functions.invoke("sync-gmail-inbox"),
        supabase.functions.invoke("sync-gmail-replies"),
      ]);
      
      queryClient.invalidateQueries({ queryKey: ["email-events"] });
      
      const newEmails = inboxResult.data?.newEmails || 0;
      toast({
        title: "Sync complete",
        description: newEmails > 0 
          ? `Synced ${newEmails} new emails` 
          : "Your emails are up to date",
      });
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Sync failed",
        description: "Could not sync emails",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Email Settings | Seeksy</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#F7F7FA] to-[#E0ECF9]">
        <div className="max-w-[1600px] mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-[28px] font-semibold text-foreground">Email Settings</h1>
              <p className="text-[15px] text-muted-foreground mt-1">
                Manage your email accounts, subscriber lists, and preferences
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/email")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inbox
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white p-1 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] h-auto">
              <TabsTrigger 
                value="accounts" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-6 py-2.5 rounded-lg"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Accounts
              </TabsTrigger>
              <TabsTrigger 
                value="lists"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-6 py-2.5 rounded-lg"
              >
                <List className="h-4 w-4 mr-2" />
                Subscriber Lists
              </TabsTrigger>
              <TabsTrigger 
                value="preferences"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-6 py-2.5 rounded-lg"
              >
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
              <TabsTrigger 
                value="deliverability"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1e3a8a] data-[state=active]:to-[#1e40af] data-[state=active]:text-white px-6 py-2.5 rounded-lg"
                disabled
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Deliverability
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">Coming Soon</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="accounts" className="mt-6 space-y-6">
              {/* Gmail Connection Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-red-500" />
                      <CardTitle>Gmail Connection</CardTitle>
                    </div>
                    <GoogleVerifiedBadge variant="pill" />
                  </div>
                  <CardDescription>
                    Securely connect your Gmail account to send and receive emails directly from Seeksy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loadingGmail ? (
                    <div className="text-sm text-muted-foreground">Loading...</div>
                  ) : gmailConnection ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">{gmailConnection.email}</p>
                            <p className="text-sm text-muted-foreground">Connected</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={syncGmail}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync Now
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => disconnectGmail.mutate()}
                          disabled={disconnectGmail.isPending}
                        >
                          <Unlink className="h-4 w-4 mr-2" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ul className="text-sm text-muted-foreground space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Send emails from your own address
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Receive replies in your Seeksy inbox
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Track email opens and clicks
                        </li>
                      </ul>
                      <Button onClick={connectGmail} className="gap-2">
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Connect Gmail
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Existing Email Account Manager */}
              <EmailAccountManager />
            </TabsContent>

            <TabsContent value="lists" className="mt-6">
              <SubscriberListManager />
            </TabsContent>

            <TabsContent value="preferences" className="mt-6 space-y-6">
              {/* Default Signature */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    <CardTitle>Email Defaults</CardTitle>
                  </div>
                  <CardDescription>
                    Configure default settings for your emails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Signature</Label>
                    <Select defaultValue={signatures.find(s => s.is_active)?.id || "none"}>
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Select a signature" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No signature</SelectItem>
                        {signatures.map((sig) => (
                          <SelectItem key={sig.id} value={sig.id}>
                            {sig.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This signature will be added to all outgoing emails
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Email Tracking</Label>
                      <p className="text-xs text-muted-foreground">
                        Track opens and clicks on all outgoing emails
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-sync Gmail</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically sync new emails every 5 minutes
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Preferences */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    <CardTitle>Email Notifications</CardTitle>
                  </div>
                  <CardDescription>
                    Choose when to receive notifications about your emails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Opens</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified when someone opens your email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Link Clicks</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified when someone clicks a link in your email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Replies</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified when you receive a reply
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Bounces</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified when an email bounces
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <CardTitle>Security</CardTitle>
                  </div>
                  <CardDescription>
                    Manage email security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-factor for Sensitive Actions</Label>
                      <p className="text-xs text-muted-foreground">
                        Require 2FA when deleting emails or changing settings
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
