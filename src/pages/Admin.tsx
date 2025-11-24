import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, BarChart3, UserCheck, Users, Loader2, DollarSign, MessageSquare, FileText, Plus, Eye, Calculator, Trash2 } from "lucide-react";
import SubscriptionsAdmin from "@/components/admin/SubscriptionsAdmin";
import AdminCRM from "@/components/admin/AdminCRM";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminInternalChat } from "@/components/admin/AdminInternalChat";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  created_at: string | null;
  roles: string[];
}

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showImpersonateDialog, setShowImpersonateDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [demoMode, setDemoMode] = useState(false);
  const [deletingUsers, setDeletingUsers] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, users]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAdminRole = roles?.some(r => 
      r.role === "admin" || 
      r.role === "super_admin" || 
      r.role === "manager" ||
      r.role === "scheduler" ||
      r.role === "sales"
    );
    
    if (!hasAdminRole) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard");
      return;
    }

    const isSuperAdminRole = roles?.some(r => r.role === "super_admin");
    setIsSuperAdmin(isSuperAdminRole || false);
    setHasAdminAccess(true);
    await fetchUsers();
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username, full_name, created_at")
      .order("created_at", { ascending: false });

    if (!profilesData) return;

    const usersWithRoles = await Promise.all(
      profilesData.map(async (profile) => {
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.id);

        return {
          ...profile,
          roles: rolesData?.map(r => r.role) || [],
        };
      })
    );

    setUsers(usersWithRoles);
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.roles.includes(roleFilter));
    }

    setFilteredUsers(filtered);
  };

  const toggleRole = async (userId: string, newRole: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('manage-user-role', {
        body: { targetUserId: userId, newRole },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        toast.error("Failed to update role: " + error.message);
        return;
      }

      toast.success(`Role updated to ${newRole}`);
      await fetchUsers();
    } catch (error: any) {
      toast.error("An error occurred: " + error.message);
    }
  };

  const deleteUser = async (userId: string, username: string) => {
    try {
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });

      if (error) {
        toast.error("Failed to delete user: " + error.message);
        return;
      }

      toast.success(`User ${username} has been deleted`);
      await fetchUsers();
    } catch (error: any) {
      toast.error("An error occurred: " + error.message);
    }
  };

  const handleImpersonate = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user to impersonate");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    localStorage.setItem("original_admin_id", user.id);
    localStorage.setItem("impersonating_user_id", selectedUserId);

    const selectedUser = users.find((u) => u.id === selectedUserId);
    toast.success(`Now impersonating ${selectedUser?.username || selectedUser?.full_name}`);

    navigate("/dashboard");
  };

  const handleDeleteTestUsers = async () => {
    if (!window.confirm("⚠️ WARNING: This will delete ALL users except yourself. This cannot be undone!\n\nAre you absolutely sure?")) {
      return;
    }

    setDeletingUsers(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('delete-test-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast.success(`Deleted ${data.deletedUsers?.length || 0} test users. Your account was kept.`);
      await fetchUsers();
    } catch (error: any) {
      toast.error("Failed to delete users: " + error.message);
    } finally {
      setDeletingUsers(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!hasAdminAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Demo Mode Toggle */}
            <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-card">
              <Switch
                id="demo-mode"
                checked={demoMode}
                onCheckedChange={setDemoMode}
              />
              <Label htmlFor="demo-mode" className="cursor-pointer font-medium">
                Demo Mode
              </Label>
            </div>
            {isSuperAdmin && (
              <Button 
                onClick={handleDeleteTestUsers} 
                disabled={deletingUsers}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deletingUsers ? "Deleting..." : "Delete Test Users"}
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => setShowImpersonateDialog(true)}
              className="gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Impersonate User
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        <Dialog open={showImpersonateDialog} onOpenChange={setShowImpersonateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Impersonate Account Holder</DialogTitle>
              <DialogDescription>
                Select a user to view the platform from their perspective
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.username} ({user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleImpersonate} className="w-full">
                Start Impersonation
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="crm" className="gap-2">
              <Users className="h-4 w-4" />
              CRM
            </TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="cfo" className="gap-2">
              <DollarSign className="h-4 w-4" />
              CFO
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-2">
              <FileText className="h-4 w-4" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-[hsl(var(--brand-gold))] data-[state=active]:text-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-gold))]/10">
              <MessageSquare className="h-4 w-4 text-[hsl(var(--brand-gold))]" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AdminOverview demoMode={demoMode} />
          </TabsContent>

          <TabsContent value="crm" className="space-y-6">
            <AdminCRM
              userManagementProps={{
                users,
                filteredUsers,
                searchQuery,
                roleFilter,
                setSearchQuery,
                setRoleFilter,
                onToggleRole: toggleRole,
                onDeleteUser: deleteUser,
              }}
            />
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Subscriptions</CardTitle>
                <CardDescription>View all user subscription plans and usage</CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionsAdmin demoMode={demoMode} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cfo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  CFO Financial Dashboard
                </CardTitle>
                <CardDescription>
                  Financial analytics, projections, and investor insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Comprehensive financial overview with revenue projections, 
                  cost analysis, unit economics, and auto-generated investor talking points.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={() => navigate("/cfo-dashboard")} className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Open Full CFO Dashboard
                  </Button>
                  <Button onClick={() => navigate("/cfo-calculators")} variant="outline" className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    Revenue Calculators
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sales Dashboard
                </CardTitle>
                <CardDescription>
                  Sales team analytics and campaign management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <Button onClick={() => navigate("/sales-dashboard")} variant="outline" className="justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Open Sales Dashboard
                  </Button>
                  <Button onClick={() => navigate("/sales/create-campaign")} variant="outline" className="justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Campaign
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blog" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Master Blog Management
                </CardTitle>
                <CardDescription>
                  Manage all posts on the Seeksy Master Blog
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <Button onClick={() => navigate("/admin/master-blog")} variant="outline" className="justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Master Blog Posts
                  </Button>
                  <Button onClick={() => navigate("/master-blog")} variant="outline" className="justify-start">
                    <Eye className="h-4 w-4 mr-2" />
                    View Master Blog
                  </Button>
                  <Button onClick={() => navigate("/blog/create")} variant="outline" className="justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Admin Team Chat
                </CardTitle>
                <CardDescription>
                  Internal communication for admin team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminInternalChat />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Legal Pages Management
                </CardTitle>
                <CardDescription>
                  Manage privacy policy, terms & conditions, and cookie policy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/admin/legal")}>
                  Go to Legal Editor
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
